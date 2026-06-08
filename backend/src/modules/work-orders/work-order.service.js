'use strict';

/**
 * work-order.service.js — Lógica de negocio para Órdenes de Trabajo.
 *
 * Responsabilidades:
 *  - Validar transiciones de estado
 *  - Formatear el número de orden (OT-00001)
 *  - Coordinar repo + recálculo de totales
 */

const WorkOrderRepository = require('./work-order.repository');
const CatalogRepository   = require('../catalog/catalog.repository');
const { AppError }        = require('../../middleware/error-handler');
const { WORK_ORDER_STATUS } = require('../../config/constants');

/** Transiciones de estado permitidas */
const VALID_TRANSITIONS = Object.freeze({
  [WORK_ORDER_STATUS.DRAFT]:            [WORK_ORDER_STATUS.OPEN,      WORK_ORDER_STATUS.CANCELLED],
  [WORK_ORDER_STATUS.OPEN]:             [WORK_ORDER_STATUS.DIAGNOSING, WORK_ORDER_STATUS.CANCELLED],
  [WORK_ORDER_STATUS.DIAGNOSING]:       [WORK_ORDER_STATUS.PENDING_APPROVAL, WORK_ORDER_STATUS.IN_REPAIR, WORK_ORDER_STATUS.CANCELLED],
  [WORK_ORDER_STATUS.PENDING_APPROVAL]: [WORK_ORDER_STATUS.IN_REPAIR, WORK_ORDER_STATUS.CANCELLED],
  [WORK_ORDER_STATUS.IN_REPAIR]:        [WORK_ORDER_STATUS.COMPLETED, WORK_ORDER_STATUS.CANCELLED],
  [WORK_ORDER_STATUS.COMPLETED]:        [WORK_ORDER_STATUS.INVOICED],
  [WORK_ORDER_STATUS.INVOICED]:         [WORK_ORDER_STATUS.DELIVERED],
  [WORK_ORDER_STATUS.CANCELLED]:        [],
  [WORK_ORDER_STATUS.DELIVERED]:        [],
});

class WorkOrderService {
  constructor(db) {
    this._repo        = new WorkOrderRepository(db);
    this._catalogRepo = new CatalogRepository(db);
  }

  // ----------------------------------------------------------------
  // Work Orders
  // ----------------------------------------------------------------

  async createWorkOrder(data, createdById) {
    const issuedNumber = await this._catalogRepo.getAndIncrementOrderNumber();
    if (issuedNumber === null) {
      throw new AppError('No se pudo generar el número de orden. Verifique la configuración.', 500);
    }

    const config = await this._catalogRepo.getOrderNumberConfig();
    const prefix  = config ? config.prefix  : 'OT';
    const padding = config ? config.padding : 5;
    const orderNumber = `${prefix}-${String(issuedNumber).padStart(padding, '0')}`;

    const workOrder = await this._repo.create({
      ...data,
      orderNumber,
      status: WORK_ORDER_STATUS.DRAFT,
    });

    await this._repo.updateStatus(workOrder.id, WORK_ORDER_STATUS.DRAFT, createdById, 'Orden creada');

    return workOrder;
  }

  async changeStatus(workOrderId, toStatus, changedById, notes) {
    const wo = await this._repo.findById(workOrderId);
    if (!wo) throw new AppError('Orden de trabajo no encontrada.', 404);

    const allowed = VALID_TRANSITIONS[wo.status] ?? [];
    if (!allowed.includes(toStatus)) {
      throw new AppError(
        `Transición inválida: ${wo.status} → ${toStatus}. ` +
        `Transiciones permitidas: ${allowed.join(', ') || 'ninguna'}.`,
        422
      );
    }

    const updated = await this._repo.updateStatus(workOrderId, toStatus, changedById, notes);

    if (toStatus === WORK_ORDER_STATUS.INVOICED) {
      const existing = await this._repo.findInvoiceByWorkOrder(workOrderId);
      if (!existing) {
        // Caller is responsible for creating the invoice via POST /invoices
        // We just note it was transitioned; the invoice endpoint does the rest.
      }
    }

    return updated;
  }

  // ----------------------------------------------------------------
  // Labor
  // ----------------------------------------------------------------

  async addLaborLine(workOrderId, data) {
    await this._assertWorkOrderExists(workOrderId);
    const line = await this._repo.addLaborLine(workOrderId, data);
    await this._repo.recalculateTotals(workOrderId);
    return line;
  }

  async updateLaborLine(lineId, workOrderId, data) {
    await this._assertWorkOrderExists(workOrderId);
    const line = await this._repo.updateLaborLine(lineId, data);
    await this._repo.recalculateTotals(workOrderId);
    return line;
  }

  async deleteLaborLine(lineId, workOrderId) {
    await this._assertWorkOrderExists(workOrderId);
    const line = await this._repo.deleteLaborLine(lineId);
    await this._repo.recalculateTotals(workOrderId);
    return line;
  }

  // ----------------------------------------------------------------
  // Parts
  // ----------------------------------------------------------------

  async addPartLine(workOrderId, data) {
    await this._assertWorkOrderExists(workOrderId);
    const line = await this._repo.addPartLine(workOrderId, data);
    await this._repo.recalculateTotals(workOrderId);
    return line;
  }

  async updatePartLine(lineId, workOrderId, data) {
    await this._assertWorkOrderExists(workOrderId);
    const line = await this._repo.updatePartLine(lineId, data);
    await this._repo.recalculateTotals(workOrderId);
    return line;
  }

  async deletePartLine(lineId, workOrderId) {
    await this._assertWorkOrderExists(workOrderId);
    const line = await this._repo.deletePartLine(lineId);
    await this._repo.recalculateTotals(workOrderId);
    return line;
  }

  // ----------------------------------------------------------------
  // Work Order Services
  // ----------------------------------------------------------------

  async addService(workOrderId, serviceData) {
    await this._assertWorkOrderExists(workOrderId);

    let template = null;
    if (serviceData.serviceTypeId) {
      template = await this._catalogRepo.getServiceTemplate(serviceData.serviceTypeId);
    }

    const service = await this._repo.addService(workOrderId, {
      serviceTypeId: serviceData.serviceTypeId ?? null,
      name:          serviceData.name || template?.serviceType?.name || 'Servicio',
      description:   serviceData.description ?? null,
      basePrice:     serviceData.basePrice ?? 0,
    });

    if (template?.laborTemplates?.length) {
      for (const lt of template.laborTemplates) {
        await this._repo.addLaborLine(workOrderId, {
          description:       lt.description,
          hours:             lt.defaultHours,
          ratePerHour:       0,
          workOrderServiceId: service.id,
        });
      }
    }

    if (template?.partTemplates?.length) {
      for (const pt of template.partTemplates) {
        await this._repo.addPartLine(workOrderId, {
          sparePartId:        pt.sparePartId ?? null,
          description:        pt.description,
          quantity:           pt.defaultQuantity,
          unitPrice:          pt.sparePartPrice ?? 0,
          workOrderServiceId: service.id,
        });
      }
    }

    await this._repo.recalculateTotals(workOrderId);
    return service;
  }

  async removeService(serviceId, workOrderId) {
    await this._assertWorkOrderExists(workOrderId);
    const removed = await this._repo.removeService(serviceId);
    await this._repo.recalculateTotals(workOrderId);
    return removed;
  }

  // ----------------------------------------------------------------
  // Private helpers
  // ----------------------------------------------------------------

  async _assertWorkOrderExists(workOrderId) {
    const exists = await this._repo.exists(workOrderId);
    if (!exists) throw new AppError('Orden de trabajo no encontrada.', 404);
  }
}

module.exports = WorkOrderService;
