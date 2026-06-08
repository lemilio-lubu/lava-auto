'use strict';

/**
 * work-order.repository.js — Acceso a datos para el módulo de Órdenes de Trabajo.
 *
 * Entidades: work_orders, work_order_labor, work_order_parts,
 *            work_order_photos, work_order_status_history, invoices.
 */

const BaseRepository = require('../../shared/base-repository');
const { generateId } = require('../../shared/id-generator');
const { DB_TABLES } = require('../../config/constants');

class WorkOrderRepository extends BaseRepository {
  constructor(db) {
    super(db, DB_TABLES.WORK_ORDERS);
  }

  // ----------------------------------------------------------------
  // Work Orders — list / detail
  // ----------------------------------------------------------------

  async findAll({ status, clientId, technicianId, vehicleId, limit = 20, offset = 0 } = {}) {
    const conditions = [];
    const values = [];
    let i = 1;

    if (status)       { conditions.push(`wo.status = $${i++}`);        values.push(status); }
    if (clientId)     { conditions.push(`wo.client_id = $${i++}`);     values.push(clientId); }
    if (technicianId) { conditions.push(`wo.technician_id = $${i++}`); values.push(technicianId); }
    if (vehicleId)    { conditions.push(`wo.vehicle_id = $${i++}`);    values.push(vehicleId); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const safeLimit  = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);

    values.push(safeLimit, safeOffset);

    const { rows } = await this._db.query(
      `SELECT
         wo.id, wo.order_number, wo.status, wo.priority, wo.mileage,
         wo.problem_description, wo.estimated_cost, wo.final_cost,
         wo.discount_amount, wo.tax_amount, wo.total_amount,
         wo.approved_at, wo.invoiced_at, wo.delivered_at,
         wo.created_at, wo.updated_at,
         c.id   AS client_id,   c.name   AS client_name,
         v.id   AS vehicle_id,  v.plate  AS vehicle_plate,
         COALESCE(cb.name, v.brand) AS vehicle_brand,
         COALESCE(cm.name, v.model) AS vehicle_model,
         t.id   AS technician_id, t.name  AS technician_name
       FROM ${DB_TABLES.WORK_ORDERS} wo
       LEFT JOIN auth.users       c  ON c.id  = wo.client_id
       LEFT JOIN vehicles.vehicles v  ON v.id  = wo.vehicle_id
       LEFT JOIN catalog.brands   cb ON cb.id = v.brand_id
       LEFT JOIN catalog.models   cm ON cm.id = v.model_id
       LEFT JOIN auth.users       t  ON t.id  = wo.technician_id
       ${where}
       ORDER BY wo.created_at DESC
       LIMIT $${i++} OFFSET $${i}`,
      values
    );
    return rows.map(this._rowToListEntity);
  }

  async findById(id) {
    const { rows: woRows } = await this._db.query(
      `SELECT
         wo.*,
         c.name  AS client_name,  c.email AS client_email, c.phone AS client_phone,
         v.plate AS vehicle_plate,
         COALESCE(cb.name, v.brand) AS vehicle_brand,
         COALESCE(cm.name, v.model) AS vehicle_model,
         v.year  AS vehicle_year,  v.color AS vehicle_color,
         t.name  AS technician_name, t.email AS technician_email
       FROM ${DB_TABLES.WORK_ORDERS} wo
       LEFT JOIN auth.users       c  ON c.id  = wo.client_id
       LEFT JOIN vehicles.vehicles v  ON v.id  = wo.vehicle_id
       LEFT JOIN catalog.brands   cb ON cb.id = v.brand_id
       LEFT JOIN catalog.models   cm ON cm.id = v.model_id
       LEFT JOIN auth.users       t  ON t.id  = wo.technician_id
       WHERE wo.id = $1`,
      [id]
    );
    if (!woRows[0]) return null;

    const [laborRows, partsRows, photoRows, historyRows, serviceRows] = await Promise.all([
      this.findLaborByWorkOrder(id),
      this.findPartsByWorkOrder(id),
      this.findPhotosByWorkOrder(id),
      this._findStatusHistory(id),
      this.findServicesByWorkOrder(id),
    ]);

    return this._rowToDetailEntity(woRows[0], laborRows, partsRows, photoRows, historyRows, serviceRows);
  }

  async create(data) {
    const id = generateId('wo');
    const { rows } = await this._db.query(
      `INSERT INTO ${DB_TABLES.WORK_ORDERS}
         (id, order_number, client_id, vehicle_id, technician_id, status, priority,
          mileage, problem_description, estimated_cost)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        id,
        data.orderNumber,
        data.clientId,
        data.vehicleId,
        data.technicianId    ?? null,
        data.status          ?? 'DRAFT',
        data.priority        ?? 'NORMAL',
        data.mileage         ?? null,
        data.problemDescription ?? null,
        data.estimatedCost   ?? 0,
      ]
    );
    return this._rowToEntity(rows[0]);
  }

  async update(id, data) {
    const ALLOWED = [
      'technicianId', 'priority', 'mileage', 'problemDescription',
      'diagnosis', 'recommendations', 'internalNotes',
      'estimatedCost', 'finalCost', 'discountAmount', 'taxAmount', 'totalAmount',
      'approvedBy', 'approvedAt', 'invoicedAt', 'deliveredAt',
    ];
    const COL_MAP = {
      technicianId:       'technician_id',
      priority:           'priority',
      mileage:            'mileage',
      problemDescription: 'problem_description',
      diagnosis:          'diagnosis',
      recommendations:    'recommendations',
      internalNotes:      'internal_notes',
      estimatedCost:      'estimated_cost',
      finalCost:          'final_cost',
      discountAmount:     'discount_amount',
      taxAmount:          'tax_amount',
      totalAmount:        'total_amount',
      approvedBy:         'approved_by',
      approvedAt:         'approved_at',
      invoicedAt:         'invoiced_at',
      deliveredAt:        'delivered_at',
    };

    const fields = [];
    const values = [];
    let i = 1;
    for (const key of ALLOWED) {
      if (data[key] !== undefined) {
        fields.push(`${COL_MAP[key]} = $${i++}`);
        values.push(data[key]);
      }
    }
    if (fields.length === 0) return this.findById(id);
    values.push(id);
    const { rows } = await this._db.query(
      `UPDATE ${DB_TABLES.WORK_ORDERS}
       SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${i} RETURNING *`,
      values
    );
    return this._rowToEntity(rows[0]);
  }

  async updateStatus(id, toStatus, changedById, notes) {
    let updatedWo;
    await this._db.transaction(async (client) => {
      const { rows: current } = await client.query(
        `SELECT status FROM ${DB_TABLES.WORK_ORDERS} WHERE id = $1`,
        [id]
      );
      const fromStatus = current[0] ? current[0].status : null;

      const { rows: woRows } = await client.query(
        `UPDATE ${DB_TABLES.WORK_ORDERS}
         SET status = $1, updated_at = NOW()
         WHERE id = $2 RETURNING *`,
        [toStatus, id]
      );
      updatedWo = woRows[0];

      const histId = generateId('wosh');
      await client.query(
        `INSERT INTO ${DB_TABLES.WORK_ORDER_STATUS_HISTORY}
           (id, work_order_id, from_status, to_status, changed_by, notes)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [histId, id, fromStatus, toStatus, changedById, notes ?? null]
      );
    });
    return this._rowToEntity(updatedWo);
  }

  async countByStatus() {
    const { rows } = await this._db.query(
      `SELECT status, COUNT(*) AS count
       FROM ${DB_TABLES.WORK_ORDERS}
       GROUP BY status`
    );
    const result = {};
    for (const row of rows) {
      result[row.status] = parseInt(row.count, 10);
    }
    return result;
  }

  async findByVehicle(vehicleId) {
    const { rows } = await this._db.query(
      `SELECT wo.*, c.name AS client_name, t.name AS technician_name
       FROM ${DB_TABLES.WORK_ORDERS} wo
       LEFT JOIN auth.users c ON c.id = wo.client_id
       LEFT JOIN auth.users t ON t.id = wo.technician_id
       WHERE wo.vehicle_id = $1
       ORDER BY wo.created_at DESC`,
      [vehicleId]
    );
    return rows.map(this._rowToEntity);
  }

  async findByClient(clientId) {
    const { rows } = await this._db.query(
      `SELECT wo.*,
         v.plate AS vehicle_plate, v.brand AS vehicle_brand, v.model AS vehicle_model,
         t.name  AS technician_name
       FROM ${DB_TABLES.WORK_ORDERS} wo
       LEFT JOIN vehicles.vehicles v ON v.id = wo.vehicle_id
       LEFT JOIN auth.users        t ON t.id = wo.technician_id
       WHERE wo.client_id = $1
       ORDER BY wo.created_at DESC`,
      [clientId]
    );
    return rows.map(this._rowToEntity);
  }

  // ----------------------------------------------------------------
  // Labor
  // ----------------------------------------------------------------

  async addLaborLine(workOrderId, data) {
    const id = generateId('wol');
    const subtotal = parseFloat(data.hours || 0) * parseFloat(data.ratePerHour || 0);
    const { rows } = await this._db.query(
      `INSERT INTO ${DB_TABLES.WORK_ORDER_LABOR}
         (id, work_order_id, technician_id, labor_rate_id, description, hours, rate_per_hour, subtotal,
          work_order_service_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        id, workOrderId,
        data.technicianId        ?? null,
        data.laborRateId         ?? null,
        data.description,
        data.hours               ?? 0,
        data.ratePerHour         ?? 0,
        subtotal,
        data.workOrderServiceId  ?? null,
      ]
    );
    return this._laborToEntity(rows[0]);
  }

  async updateLaborLine(id, data) {
    const fields = [];
    const values = [];
    let i = 1;
    if (data.technicianId  !== undefined) { fields.push(`technician_id = $${i++}`);  values.push(data.technicianId); }
    if (data.laborRateId   !== undefined) { fields.push(`labor_rate_id = $${i++}`);  values.push(data.laborRateId); }
    if (data.description   !== undefined) { fields.push(`description = $${i++}`);    values.push(data.description); }
    if (data.hours         !== undefined) { fields.push(`hours = $${i++}`);           values.push(data.hours); }
    if (data.ratePerHour   !== undefined) { fields.push(`rate_per_hour = $${i++}`);  values.push(data.ratePerHour); }

    if (fields.length === 0) {
      const { rows } = await this._db.query(
        `SELECT * FROM ${DB_TABLES.WORK_ORDER_LABOR} WHERE id = $1`, [id]
      );
      return this._laborToEntity(rows[0]);
    }

    // Recalculate subtotal from the values that will end up in the row
    const hoursIdx   = fields.findIndex((f) => f.startsWith('hours'));
    const rateIdx    = fields.findIndex((f) => f.startsWith('rate_per_hour'));
    const subtotalExpr = _buildSubtotalExpr(hoursIdx, rateIdx, values, i);
    fields.push(`subtotal = ${subtotalExpr.expr}`);
    if (subtotalExpr.params) values.push(...subtotalExpr.params);

    values.push(id);
    const { rows } = await this._db.query(
      `UPDATE ${DB_TABLES.WORK_ORDER_LABOR}
       SET ${fields.join(', ')}
       WHERE id = $${values.length} RETURNING *`,
      values
    );
    return this._laborToEntity(rows[0]);
  }

  async deleteLaborLine(id) {
    const { rows } = await this._db.query(
      `DELETE FROM ${DB_TABLES.WORK_ORDER_LABOR} WHERE id = $1 RETURNING *`,
      [id]
    );
    return this._laborToEntity(rows[0]);
  }

  async findLaborByWorkOrder(workOrderId) {
    const { rows } = await this._db.query(
      `SELECT * FROM ${DB_TABLES.WORK_ORDER_LABOR}
       WHERE work_order_id = $1 ORDER BY created_at ASC`,
      [workOrderId]
    );
    return rows.map(this._laborToEntity);
  }

  // ----------------------------------------------------------------
  // Parts
  // ----------------------------------------------------------------

  async addPartLine(workOrderId, data) {
    const id = generateId('wop');
    const subtotal = parseFloat(data.quantity || 1) * parseFloat(data.unitPrice || 0);
    const { rows } = await this._db.query(
      `INSERT INTO ${DB_TABLES.WORK_ORDER_PARTS}
         (id, work_order_id, spare_part_id, description, quantity, unit_price, subtotal,
          work_order_service_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        id, workOrderId,
        data.sparePartId          ?? null,
        data.description,
        data.quantity             ?? 1,
        data.unitPrice            ?? 0,
        subtotal,
        data.workOrderServiceId   ?? null,
      ]
    );
    return this._partToEntity(rows[0]);
  }

  async updatePartLine(id, data) {
    const fields = [];
    const values = [];
    let i = 1;
    if (data.sparePartId  !== undefined) { fields.push(`spare_part_id = $${i++}`); values.push(data.sparePartId); }
    if (data.description  !== undefined) { fields.push(`description = $${i++}`);   values.push(data.description); }
    if (data.quantity     !== undefined) { fields.push(`quantity = $${i++}`);       values.push(data.quantity); }
    if (data.unitPrice    !== undefined) { fields.push(`unit_price = $${i++}`);     values.push(data.unitPrice); }

    if (fields.length === 0) {
      const { rows } = await this._db.query(
        `SELECT * FROM ${DB_TABLES.WORK_ORDER_PARTS} WHERE id = $1`, [id]
      );
      return this._partToEntity(rows[0]);
    }

    const qtyIdx   = fields.findIndex((f) => f.startsWith('quantity'));
    const priceIdx = fields.findIndex((f) => f.startsWith('unit_price'));
    const subtotalExpr = _buildSubtotalExpr(qtyIdx, priceIdx, values, i);
    fields.push(`subtotal = ${subtotalExpr.expr}`);
    if (subtotalExpr.params) values.push(...subtotalExpr.params);

    values.push(id);
    const { rows } = await this._db.query(
      `UPDATE ${DB_TABLES.WORK_ORDER_PARTS}
       SET ${fields.join(', ')}
       WHERE id = $${values.length} RETURNING *`,
      values
    );
    return this._partToEntity(rows[0]);
  }

  async deletePartLine(id) {
    const { rows } = await this._db.query(
      `DELETE FROM ${DB_TABLES.WORK_ORDER_PARTS} WHERE id = $1 RETURNING *`,
      [id]
    );
    return this._partToEntity(rows[0]);
  }

  async findPartsByWorkOrder(workOrderId) {
    const { rows } = await this._db.query(
      `SELECT * FROM ${DB_TABLES.WORK_ORDER_PARTS}
       WHERE work_order_id = $1 ORDER BY created_at ASC`,
      [workOrderId]
    );
    return rows.map(this._partToEntity);
  }

  // ----------------------------------------------------------------
  // Photos
  // ----------------------------------------------------------------

  async addPhoto(workOrderId, data) {
    const id = generateId('woph');
    const { rows } = await this._db.query(
      `INSERT INTO ${DB_TABLES.WORK_ORDER_PHOTOS}
         (id, work_order_id, photo_url, photo_type, description)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [id, workOrderId, data.photoUrl, data.photoType ?? 'BEFORE', data.description ?? null]
    );
    return this._photoToEntity(rows[0]);
  }

  async deletePhoto(id) {
    const { rows } = await this._db.query(
      `DELETE FROM ${DB_TABLES.WORK_ORDER_PHOTOS} WHERE id = $1 RETURNING *`,
      [id]
    );
    return this._photoToEntity(rows[0]);
  }

  async findPhotosByWorkOrder(workOrderId) {
    const { rows } = await this._db.query(
      `SELECT * FROM ${DB_TABLES.WORK_ORDER_PHOTOS}
       WHERE work_order_id = $1 ORDER BY created_at ASC`,
      [workOrderId]
    );
    return rows.map(this._photoToEntity);
  }

  // ----------------------------------------------------------------
  // Invoices
  // ----------------------------------------------------------------

  async createInvoice(workOrderId, data) {
    const id = generateId('inv');
    const { rows } = await this._db.query(
      `INSERT INTO ${DB_TABLES.WORK_ORDER_INVOICES}
         (id, work_order_id, invoice_number, issued_at, due_at,
          subtotal, discount_amount, tax_amount, total)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        id, workOrderId,
        data.invoiceNumber,
        data.issuedAt      ?? new Date(),
        data.dueAt         ?? null,
        data.subtotal      ?? 0,
        data.discountAmount ?? 0,
        data.taxAmount     ?? 0,
        data.total         ?? 0,
      ]
    );
    return this._invoiceToEntity(rows[0]);
  }

  async findInvoiceByWorkOrder(workOrderId) {
    const { rows } = await this._db.query(
      `SELECT * FROM ${DB_TABLES.WORK_ORDER_INVOICES} WHERE work_order_id = $1`,
      [workOrderId]
    );
    return this._invoiceToEntity(rows[0]);
  }

  async updateInvoicePdfUrl(id, pdfUrl) {
    const { rows } = await this._db.query(
      `UPDATE ${DB_TABLES.WORK_ORDER_INVOICES}
       SET pdf_url = $1 WHERE id = $2 RETURNING *`,
      [pdfUrl, id]
    );
    return this._invoiceToEntity(rows[0]);
  }

  // ----------------------------------------------------------------
  // Recalculation
  // ----------------------------------------------------------------

  async recalculateTotals(workOrderId) {
    await this._db.transaction(async (client) => {
      const { rows: laborRows } = await client.query(
        `SELECT COALESCE(SUM(subtotal), 0) AS total
         FROM ${DB_TABLES.WORK_ORDER_LABOR} WHERE work_order_id = $1`,
        [workOrderId]
      );
      const { rows: partsRows } = await client.query(
        `SELECT COALESCE(SUM(subtotal), 0) AS total
         FROM ${DB_TABLES.WORK_ORDER_PARTS} WHERE work_order_id = $1`,
        [workOrderId]
      );
      const { rows: svcRows } = await client.query(
        `SELECT COALESCE(SUM(base_price), 0) AS total
         FROM ${DB_TABLES.WORK_ORDER_SERVICES} WHERE work_order_id = $1`,
        [workOrderId]
      );

      const laborSum    = parseFloat(laborRows[0].total);
      const partsSum    = parseFloat(partsRows[0].total);
      const servicesSum = parseFloat(svcRows[0].total);
      const finalCost   = laborSum + partsSum;

      await client.query(
        `UPDATE ${DB_TABLES.WORK_ORDERS}
         SET final_cost      = $1,
             services_amount = $2,
             total_amount    = $1 + $2 - discount_amount + tax_amount,
             updated_at      = NOW()
         WHERE id = $3`,
        [finalCost, servicesSum, workOrderId]
      );
    });
  }

  // ----------------------------------------------------------------
  // Work Order Services
  // ----------------------------------------------------------------

  async findServicesByWorkOrder(workOrderId) {
    const { rows } = await this._db.query(
      `SELECT * FROM ${DB_TABLES.WORK_ORDER_SERVICES}
       WHERE work_order_id = $1 ORDER BY sort_order ASC, created_at ASC`,
      [workOrderId]
    );
    return rows.map((r) => this._serviceToEntity(r));
  }

  async addService(workOrderId, data) {
    const id = generateId('wos');
    const { rows } = await this._db.query(
      `INSERT INTO ${DB_TABLES.WORK_ORDER_SERVICES}
         (id, work_order_id, service_type_id, name, description, base_price, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        id, workOrderId,
        data.serviceTypeId ?? null,
        data.name,
        data.description   ?? null,
        data.basePrice     ?? 0,
        data.sortOrder     ?? 0,
      ]
    );
    return this._serviceToEntity(rows[0]);
  }

  async removeService(serviceId) {
    const { rows } = await this._db.query(
      `DELETE FROM ${DB_TABLES.WORK_ORDER_SERVICES} WHERE id = $1 RETURNING *`,
      [serviceId]
    );
    return this._serviceToEntity(rows[0]);
  }

  // ----------------------------------------------------------------
  // Private helpers
  // ----------------------------------------------------------------

  _findStatusHistory(workOrderId) {
    return this._db.query(
      `SELECT * FROM ${DB_TABLES.WORK_ORDER_STATUS_HISTORY}
       WHERE work_order_id = $1 ORDER BY created_at ASC`,
      [workOrderId]
    ).then(({ rows }) => rows.map(this._historyToEntity));
  }

  _rowToEntity(row) {
    if (!row) return null;
    return {
      id:                 row.id,
      orderNumber:        row.order_number,
      clientId:           row.client_id,
      vehicleId:          row.vehicle_id,
      technicianId:       row.technician_id,
      status:             row.status,
      priority:           row.priority,
      mileage:            row.mileage,
      problemDescription: row.problem_description,
      diagnosis:          row.diagnosis,
      recommendations:    row.recommendations,
      internalNotes:      row.internal_notes,
      estimatedCost:      parseFloat(row.estimated_cost),
      finalCost:          parseFloat(row.final_cost),
      discountAmount:     parseFloat(row.discount_amount),
      taxAmount:          parseFloat(row.tax_amount),
      totalAmount:        parseFloat(row.total_amount),
      approvedBy:         row.approved_by,
      approvedAt:         row.approved_at,
      invoicedAt:         row.invoiced_at,
      deliveredAt:        row.delivered_at,
      servicesAmount:     parseFloat(row.services_amount ?? 0),
      createdAt:          row.created_at,
      updatedAt:          row.updated_at,
      // optional join fields (populated when the query includes JOINs)
      clientName:         row.client_name     ?? undefined,
      technicianName:     row.technician_name ?? undefined,
      vehiclePlate:       row.vehicle_plate   ?? undefined,
      vehicleBrand:       row.vehicle_brand   ?? undefined,
      vehicleModel:       row.vehicle_model   ?? undefined,
    };
  }

  _rowToListEntity(row) {
    if (!row) return null;
    return {
      id:           row.id,
      orderNumber:  row.order_number,
      status:       row.status,
      priority:     row.priority,
      mileage:      row.mileage,
      estimatedCost: parseFloat(row.estimated_cost),
      finalCost:    parseFloat(row.final_cost),
      totalAmount:  parseFloat(row.total_amount),
      createdAt:    row.created_at,
      updatedAt:    row.updated_at,
      clientName:   row.client_name    ?? undefined,
      vehiclePlate: row.vehicle_plate  ?? undefined,
      vehicleBrand: row.vehicle_brand  ?? undefined,
      vehicleModel: row.vehicle_model  ?? undefined,
      technicianName: row.technician_name ?? undefined,
      client:       { id: row.client_id, name: row.client_name },
      vehicle:      { id: row.vehicle_id, plate: row.vehicle_plate,
                      brand: row.vehicle_brand, model: row.vehicle_model },
      technician:   row.technician_id
        ? { id: row.technician_id, name: row.technician_name }
        : null,
    };
  }

  _rowToDetailEntity(row, labor, parts, photos, history, services = []) {
    const base = this._rowToEntity(row);
    const servicesWithItems = services.map((svc) => ({
      ...svc,
      labor: labor.filter((l) => l.workOrderServiceId === svc.id),
      parts: parts.filter((p) => p.workOrderServiceId === svc.id),
    }));
    return {
      ...base,
      client:     { id: row.client_id,   name: row.client_name,
                    email: row.client_email, phone: row.client_phone },
      vehicle:    { id: row.vehicle_id,  plate: row.vehicle_plate,
                    brand: row.vehicle_brand, model: row.vehicle_model,
                    year: row.vehicle_year, color: row.vehicle_color },
      technician: row.technician_id
        ? { id: row.technician_id, name: row.technician_name, email: row.technician_email }
        : null,
      services: servicesWithItems,
      labor,
      parts,
      photos,
      statusHistory: history,
    };
  }

  _serviceToEntity(row) {
    if (!row) return null;
    return {
      id:            row.id,
      workOrderId:   row.work_order_id,
      serviceTypeId: row.service_type_id ?? null,
      name:          row.name,
      description:   row.description ?? null,
      basePrice:     parseFloat(row.base_price ?? 0),
      sortOrder:     row.sort_order ?? 0,
      createdAt:     row.created_at,
      updatedAt:     row.updated_at,
    };
  }

  _laborToEntity(row) {
    if (!row) return null;
    return {
      id:                   row.id,
      workOrderId:          row.work_order_id,
      workOrderServiceId:   row.work_order_service_id ?? null,
      technicianId:         row.technician_id,
      laborRateId:          row.labor_rate_id,
      description:          row.description,
      hours:                parseFloat(row.hours),
      ratePerHour:          parseFloat(row.rate_per_hour),
      subtotal:             parseFloat(row.subtotal),
      createdAt:            row.created_at,
    };
  }

  _partToEntity(row) {
    if (!row) return null;
    return {
      id:                   row.id,
      workOrderId:          row.work_order_id,
      workOrderServiceId:   row.work_order_service_id ?? null,
      sparePartId:          row.spare_part_id,
      description:          row.description,
      quantity:             parseFloat(row.quantity),
      unitPrice:            parseFloat(row.unit_price),
      subtotal:             parseFloat(row.subtotal),
      createdAt:            row.created_at,
    };
  }

  _photoToEntity(row) {
    if (!row) return null;
    return {
      id:          row.id,
      workOrderId: row.work_order_id,
      photoUrl:    row.photo_url,
      photoType:   row.photo_type,
      description: row.description,
      createdAt:   row.created_at,
    };
  }

  _historyToEntity(row) {
    if (!row) return null;
    return {
      id:          row.id,
      workOrderId: row.work_order_id,
      fromStatus:  row.from_status,
      toStatus:    row.to_status,
      changedBy:   row.changed_by,
      notes:       row.notes,
      createdAt:   row.created_at,
    };
  }

  _invoiceToEntity(row) {
    if (!row) return null;
    return {
      id:             row.id,
      workOrderId:    row.work_order_id,
      invoiceNumber:  row.invoice_number,
      issuedAt:       row.issued_at,
      dueAt:          row.due_at,
      subtotal:       parseFloat(row.subtotal),
      discountAmount: parseFloat(row.discount_amount),
      taxAmount:      parseFloat(row.tax_amount),
      total:          parseFloat(row.total),
      pdfUrl:         row.pdf_url,
      createdAt:      row.created_at,
    };
  }
}

/**
 * Builds a subtotal SQL expression for UPDATE statements.
 * When both factors are being updated they are in `values` already.
 * When only one is being updated, fall back to the stored column for the other.
 *
 * @param {number} idx1 - 0-based index of factor1 in fields array (-1 if not updating)
 * @param {number} idx2 - 0-based index of factor2 in fields array (-1 if not updating)
 * @param {Array}  values - current values array (factor values are already pushed)
 * @param {number} nextParam - next $N index
 * @param {string} [col1='hours'] - DB column name for factor1
 * @param {string} [col2='rate_per_hour'] - DB column name for factor2
 */
function _buildSubtotalExpr(idx1, idx2, values, nextParam, col1 = 'hours', col2 = 'rate_per_hour') {
  // idx1 and idx2 are field-array indices (0-based); param positions are idx+1 (1-based)
  const p1 = idx1 >= 0 ? `$${idx1 + 1}` : col1;
  const p2 = idx2 >= 0 ? `$${idx2 + 1}` : col2;
  return { expr: `${p1} * ${p2}`, params: null };
}

module.exports = WorkOrderRepository;
