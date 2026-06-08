'use strict';

/**
 * catalog.repository.js — Acceso a datos para todos los catálogos del módulo
 * de Órdenes de Trabajo.
 *
 * Entidades: brands, models, fuelTypes, sparePartCategories, spareParts,
 *            serviceTypes, laborRates, employeeSpecialties, taxRates,
 *            orderNumberConfig, employeeSpecialtyAssignments.
 */

const BaseRepository = require('../../shared/base-repository');
const { generateId } = require('../../shared/id-generator');
const { DB_TABLES } = require('../../config/constants');

class CatalogRepository extends BaseRepository {
  constructor(db) {
    super(db, DB_TABLES.CATALOG_BRANDS);
  }

  // ----------------------------------------------------------------
  // Brands
  // ----------------------------------------------------------------

  async findAllBrands(includeInactive = false) {
    const where = includeInactive ? '' : 'WHERE is_active = true';
    const { rows } = await this._db.query(
      `SELECT * FROM ${DB_TABLES.CATALOG_BRANDS} ${where} ORDER BY name ASC`
    );
    return rows.map(this._brandToEntity);
  }

  async findBrandById(id) {
    const { rows } = await this._db.query(
      `SELECT * FROM ${DB_TABLES.CATALOG_BRANDS} WHERE id = $1`,
      [id]
    );
    return this._brandToEntity(rows[0]);
  }

  async createBrand(data) {
    const id = generateId('brd');
    const { rows } = await this._db.query(
      `INSERT INTO ${DB_TABLES.CATALOG_BRANDS} (id, name, is_active)
       VALUES ($1, $2, $3) RETURNING *`,
      [id, data.name, data.isActive ?? true]
    );
    return this._brandToEntity(rows[0]);
  }

  async updateBrand(id, data) {
    const fields = [];
    const values = [];
    let i = 1;
    if (data.name      !== undefined) { fields.push(`name = $${i++}`);       values.push(data.name); }
    if (data.isActive  !== undefined) { fields.push(`is_active = $${i++}`);  values.push(data.isActive); }
    if (fields.length === 0) return this.findBrandById(id);
    values.push(id);
    const { rows } = await this._db.query(
      `UPDATE ${DB_TABLES.CATALOG_BRANDS} SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${i} RETURNING *`,
      values
    );
    return this._brandToEntity(rows[0]);
  }

  async deleteBrand(id) {
    const { rows } = await this._db.query(
      `UPDATE ${DB_TABLES.CATALOG_BRANDS} SET is_active = false, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return this._brandToEntity(rows[0]);
  }

  _brandToEntity(row) {
    if (!row) return null;
    return { id: row.id, name: row.name, isActive: row.is_active,
             createdAt: row.created_at, updatedAt: row.updated_at };
  }

  // ----------------------------------------------------------------
  // Models
  // ----------------------------------------------------------------

  async findAllModels(includeInactive = false) {
    const where = includeInactive ? '' : 'WHERE is_active = true';
    const { rows } = await this._db.query(
      `SELECT * FROM ${DB_TABLES.CATALOG_MODELS} ${where} ORDER BY name ASC`
    );
    return rows.map(this._modelToEntity);
  }

  async findModelsByBrand(brandId, includeInactive = false) {
    const activeClause = includeInactive ? '' : 'AND is_active = true';
    const { rows } = await this._db.query(
      `SELECT * FROM ${DB_TABLES.CATALOG_MODELS}
       WHERE brand_id = $1 ${activeClause} ORDER BY name ASC`,
      [brandId]
    );
    return rows.map(this._modelToEntity);
  }

  async findModelById(id) {
    const { rows } = await this._db.query(
      `SELECT * FROM ${DB_TABLES.CATALOG_MODELS} WHERE id = $1`,
      [id]
    );
    return this._modelToEntity(rows[0]);
  }

  async createModel(data) {
    const id = generateId('mdl');
    const { rows } = await this._db.query(
      `INSERT INTO ${DB_TABLES.CATALOG_MODELS}
         (id, brand_id, name, year_from, year_to, is_active)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, data.brandId, data.name, data.yearFrom ?? null,
       data.yearTo ?? null, data.isActive ?? true]
    );
    return this._modelToEntity(rows[0]);
  }

  async updateModel(id, data) {
    const fields = [];
    const values = [];
    let i = 1;
    if (data.brandId   !== undefined) { fields.push(`brand_id = $${i++}`);   values.push(data.brandId); }
    if (data.name      !== undefined) { fields.push(`name = $${i++}`);        values.push(data.name); }
    if (data.yearFrom  !== undefined) { fields.push(`year_from = $${i++}`);   values.push(data.yearFrom); }
    if (data.yearTo    !== undefined) { fields.push(`year_to = $${i++}`);     values.push(data.yearTo); }
    if (data.isActive  !== undefined) { fields.push(`is_active = $${i++}`);   values.push(data.isActive); }
    if (fields.length === 0) return this.findModelById(id);
    values.push(id);
    const { rows } = await this._db.query(
      `UPDATE ${DB_TABLES.CATALOG_MODELS} SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${i} RETURNING *`,
      values
    );
    return this._modelToEntity(rows[0]);
  }

  async deleteModel(id) {
    const { rows } = await this._db.query(
      `UPDATE ${DB_TABLES.CATALOG_MODELS} SET is_active = false, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return this._modelToEntity(rows[0]);
  }

  _modelToEntity(row) {
    if (!row) return null;
    return { id: row.id, brandId: row.brand_id, name: row.name,
             yearFrom: row.year_from, yearTo: row.year_to,
             isActive: row.is_active, createdAt: row.created_at, updatedAt: row.updated_at };
  }

  // ----------------------------------------------------------------
  // Fuel Types
  // ----------------------------------------------------------------

  async findAllFuelTypes(includeInactive = false) {
    const where = includeInactive ? '' : 'WHERE is_active = true';
    const { rows } = await this._db.query(
      `SELECT * FROM ${DB_TABLES.CATALOG_FUEL_TYPES} ${where} ORDER BY name ASC`
    );
    return rows.map(this._fuelTypeToEntity);
  }

  async findFuelTypeById(id) {
    const { rows } = await this._db.query(
      `SELECT * FROM ${DB_TABLES.CATALOG_FUEL_TYPES} WHERE id = $1`,
      [id]
    );
    return this._fuelTypeToEntity(rows[0]);
  }

  async createFuelType(data) {
    const id = generateId('flt');
    const { rows } = await this._db.query(
      `INSERT INTO ${DB_TABLES.CATALOG_FUEL_TYPES} (id, name, is_active)
       VALUES ($1, $2, $3) RETURNING *`,
      [id, data.name, data.isActive ?? true]
    );
    return this._fuelTypeToEntity(rows[0]);
  }

  async updateFuelType(id, data) {
    const fields = [];
    const values = [];
    let i = 1;
    if (data.name      !== undefined) { fields.push(`name = $${i++}`);       values.push(data.name); }
    if (data.isActive  !== undefined) { fields.push(`is_active = $${i++}`);  values.push(data.isActive); }
    if (fields.length === 0) return this.findFuelTypeById(id);
    values.push(id);
    const { rows } = await this._db.query(
      `UPDATE ${DB_TABLES.CATALOG_FUEL_TYPES} SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${i} RETURNING *`,
      values
    );
    return this._fuelTypeToEntity(rows[0]);
  }

  async deleteFuelType(id) {
    const { rows } = await this._db.query(
      `UPDATE ${DB_TABLES.CATALOG_FUEL_TYPES} SET is_active = false, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return this._fuelTypeToEntity(rows[0]);
  }

  _fuelTypeToEntity(row) {
    if (!row) return null;
    return { id: row.id, name: row.name, isActive: row.is_active,
             createdAt: row.created_at, updatedAt: row.updated_at };
  }

  // ----------------------------------------------------------------
  // Spare Part Categories
  // ----------------------------------------------------------------

  async findAllSparePartCategories(includeInactive = false) {
    const where = includeInactive ? '' : 'WHERE is_active = true';
    const { rows } = await this._db.query(
      `SELECT * FROM ${DB_TABLES.CATALOG_SPARE_PART_CATEGORIES} ${where} ORDER BY name ASC`
    );
    return rows.map(this._sparePartCategoryToEntity);
  }

  async findSparePartCategoryById(id) {
    const { rows } = await this._db.query(
      `SELECT * FROM ${DB_TABLES.CATALOG_SPARE_PART_CATEGORIES} WHERE id = $1`,
      [id]
    );
    return this._sparePartCategoryToEntity(rows[0]);
  }

  async createSparePartCategory(data) {
    const id = generateId('spc');
    const { rows } = await this._db.query(
      `INSERT INTO ${DB_TABLES.CATALOG_SPARE_PART_CATEGORIES} (id, name, is_active)
       VALUES ($1, $2, $3) RETURNING *`,
      [id, data.name, data.isActive ?? true]
    );
    return this._sparePartCategoryToEntity(rows[0]);
  }

  async updateSparePartCategory(id, data) {
    const fields = [];
    const values = [];
    let i = 1;
    if (data.name      !== undefined) { fields.push(`name = $${i++}`);       values.push(data.name); }
    if (data.isActive  !== undefined) { fields.push(`is_active = $${i++}`);  values.push(data.isActive); }
    if (fields.length === 0) return this.findSparePartCategoryById(id);
    values.push(id);
    const { rows } = await this._db.query(
      `UPDATE ${DB_TABLES.CATALOG_SPARE_PART_CATEGORIES} SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${i} RETURNING *`,
      values
    );
    return this._sparePartCategoryToEntity(rows[0]);
  }

  async deleteSparePartCategory(id) {
    const { rows } = await this._db.query(
      `UPDATE ${DB_TABLES.CATALOG_SPARE_PART_CATEGORIES} SET is_active = false, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return this._sparePartCategoryToEntity(rows[0]);
  }

  _sparePartCategoryToEntity(row) {
    if (!row) return null;
    return { id: row.id, name: row.name, isActive: row.is_active,
             createdAt: row.created_at, updatedAt: row.updated_at };
  }

  // ----------------------------------------------------------------
  // Spare Parts
  // ----------------------------------------------------------------

  async findAllSpareParts(includeInactive = false) {
    const where = includeInactive ? '' : 'WHERE is_active = true';
    const { rows } = await this._db.query(
      `SELECT * FROM ${DB_TABLES.CATALOG_SPARE_PARTS} ${where} ORDER BY name ASC`
    );
    return rows.map(this._sparePartToEntity);
  }

  async findSparePartsByCategory(categoryId, includeInactive = false) {
    const activeClause = includeInactive ? '' : 'AND is_active = true';
    const { rows } = await this._db.query(
      `SELECT * FROM ${DB_TABLES.CATALOG_SPARE_PARTS}
       WHERE category_id = $1 ${activeClause} ORDER BY name ASC`,
      [categoryId]
    );
    return rows.map(this._sparePartToEntity);
  }

  async findSparePartById(id) {
    const { rows } = await this._db.query(
      `SELECT * FROM ${DB_TABLES.CATALOG_SPARE_PARTS} WHERE id = $1`,
      [id]
    );
    return this._sparePartToEntity(rows[0]);
  }

  async createSparePart(data) {
    const id = generateId('spp');
    const { rows } = await this._db.query(
      `INSERT INTO ${DB_TABLES.CATALOG_SPARE_PARTS}
         (id, category_id, name, part_number, unit, unit_price, stock_quantity, min_stock, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        id,
        data.categoryId   ?? null,
        data.name,
        data.partNumber   ?? null,
        data.unit         ?? 'unidad',
        data.unitPrice    ?? 0,
        data.stockQuantity ?? 0,
        data.minStock     ?? 0,
        data.isActive     ?? true,
      ]
    );
    return this._sparePartToEntity(rows[0]);
  }

  async updateSparePart(id, data) {
    const fields = [];
    const values = [];
    let i = 1;
    if (data.categoryId    !== undefined) { fields.push(`category_id = $${i++}`);     values.push(data.categoryId); }
    if (data.name          !== undefined) { fields.push(`name = $${i++}`);             values.push(data.name); }
    if (data.partNumber    !== undefined) { fields.push(`part_number = $${i++}`);      values.push(data.partNumber); }
    if (data.unit          !== undefined) { fields.push(`unit = $${i++}`);             values.push(data.unit); }
    if (data.unitPrice     !== undefined) { fields.push(`unit_price = $${i++}`);       values.push(data.unitPrice); }
    if (data.stockQuantity !== undefined) { fields.push(`stock_quantity = $${i++}`);   values.push(data.stockQuantity); }
    if (data.minStock      !== undefined) { fields.push(`min_stock = $${i++}`);        values.push(data.minStock); }
    if (data.isActive      !== undefined) { fields.push(`is_active = $${i++}`);        values.push(data.isActive); }
    if (fields.length === 0) return this.findSparePartById(id);
    values.push(id);
    const { rows } = await this._db.query(
      `UPDATE ${DB_TABLES.CATALOG_SPARE_PARTS} SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${i} RETURNING *`,
      values
    );
    return this._sparePartToEntity(rows[0]);
  }

  async deleteSparePart(id) {
    const { rows } = await this._db.query(
      `UPDATE ${DB_TABLES.CATALOG_SPARE_PARTS} SET is_active = false, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return this._sparePartToEntity(rows[0]);
  }

  _sparePartToEntity(row) {
    if (!row) return null;
    return {
      id: row.id, categoryId: row.category_id, name: row.name,
      partNumber: row.part_number, unit: row.unit,
      unitPrice: parseFloat(row.unit_price),
      stockQuantity: row.stock_quantity, minStock: row.min_stock,
      isActive: row.is_active, createdAt: row.created_at, updatedAt: row.updated_at,
    };
  }

  // ----------------------------------------------------------------
  // Service Types
  // ----------------------------------------------------------------

  async findAllServiceTypes(includeInactive = false) {
    const where = includeInactive ? '' : 'WHERE is_active = true';
    const { rows } = await this._db.query(
      `SELECT * FROM ${DB_TABLES.CATALOG_SERVICE_TYPES} ${where} ORDER BY name ASC`
    );
    return rows.map(this._serviceTypeToEntity);
  }

  async findServiceTypeById(id) {
    const { rows } = await this._db.query(
      `SELECT * FROM ${DB_TABLES.CATALOG_SERVICE_TYPES} WHERE id = $1`,
      [id]
    );
    return this._serviceTypeToEntity(rows[0]);
  }

  async createServiceType(data) {
    const id = generateId('srt');
    const { rows } = await this._db.query(
      `INSERT INTO ${DB_TABLES.CATALOG_SERVICE_TYPES} (id, name, description, is_active)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, data.name, data.description ?? null, data.isActive ?? true]
    );
    return this._serviceTypeToEntity(rows[0]);
  }

  async updateServiceType(id, data) {
    const fields = [];
    const values = [];
    let i = 1;
    if (data.name        !== undefined) { fields.push(`name = $${i++}`);         values.push(data.name); }
    if (data.description !== undefined) { fields.push(`description = $${i++}`);  values.push(data.description); }
    if (data.isActive    !== undefined) { fields.push(`is_active = $${i++}`);    values.push(data.isActive); }
    if (fields.length === 0) return this.findServiceTypeById(id);
    values.push(id);
    const { rows } = await this._db.query(
      `UPDATE ${DB_TABLES.CATALOG_SERVICE_TYPES} SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${i} RETURNING *`,
      values
    );
    return this._serviceTypeToEntity(rows[0]);
  }

  async deleteServiceType(id) {
    const { rows } = await this._db.query(
      `UPDATE ${DB_TABLES.CATALOG_SERVICE_TYPES} SET is_active = false, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return this._serviceTypeToEntity(rows[0]);
  }

  _serviceTypeToEntity(row) {
    if (!row) return null;
    return { id: row.id, name: row.name, description: row.description,
             isActive: row.is_active, createdAt: row.created_at, updatedAt: row.updated_at };
  }

  // ----------------------------------------------------------------
  // Labor Rates
  // ----------------------------------------------------------------

  async findAllLaborRates(includeInactive = false) {
    const where = includeInactive ? '' : 'WHERE is_active = true';
    const { rows } = await this._db.query(
      `SELECT * FROM ${DB_TABLES.CATALOG_LABOR_RATES} ${where} ORDER BY name ASC`
    );
    return rows.map(this._laborRateToEntity);
  }

  async findLaborRateById(id) {
    const { rows } = await this._db.query(
      `SELECT * FROM ${DB_TABLES.CATALOG_LABOR_RATES} WHERE id = $1`,
      [id]
    );
    return this._laborRateToEntity(rows[0]);
  }

  async createLaborRate(data) {
    const id = generateId('lbr');
    const { rows } = await this._db.query(
      `INSERT INTO ${DB_TABLES.CATALOG_LABOR_RATES} (id, name, description, rate_per_hour, is_active)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, data.name, data.description ?? null, data.ratePerHour ?? 0, data.isActive ?? true]
    );
    return this._laborRateToEntity(rows[0]);
  }

  async updateLaborRate(id, data) {
    const fields = [];
    const values = [];
    let i = 1;
    if (data.name         !== undefined) { fields.push(`name = $${i++}`);           values.push(data.name); }
    if (data.description  !== undefined) { fields.push(`description = $${i++}`);    values.push(data.description); }
    if (data.ratePerHour  !== undefined) { fields.push(`rate_per_hour = $${i++}`);  values.push(data.ratePerHour); }
    if (data.isActive     !== undefined) { fields.push(`is_active = $${i++}`);      values.push(data.isActive); }
    if (fields.length === 0) return this.findLaborRateById(id);
    values.push(id);
    const { rows } = await this._db.query(
      `UPDATE ${DB_TABLES.CATALOG_LABOR_RATES} SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${i} RETURNING *`,
      values
    );
    return this._laborRateToEntity(rows[0]);
  }

  async deleteLaborRate(id) {
    const { rows } = await this._db.query(
      `UPDATE ${DB_TABLES.CATALOG_LABOR_RATES} SET is_active = false, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return this._laborRateToEntity(rows[0]);
  }

  _laborRateToEntity(row) {
    if (!row) return null;
    return { id: row.id, name: row.name, description: row.description,
             ratePerHour: parseFloat(row.rate_per_hour), isActive: row.is_active,
             createdAt: row.created_at, updatedAt: row.updated_at };
  }

  // ----------------------------------------------------------------
  // Employee Specialties
  // ----------------------------------------------------------------

  async findAllEmployeeSpecialties(includeInactive = false) {
    const where = includeInactive ? '' : 'WHERE is_active = true';
    const { rows } = await this._db.query(
      `SELECT * FROM ${DB_TABLES.CATALOG_EMPLOYEE_SPECIALTIES} ${where} ORDER BY name ASC`
    );
    return rows.map(this._employeeSpecialtyToEntity);
  }

  async findEmployeeSpecialtyById(id) {
    const { rows } = await this._db.query(
      `SELECT * FROM ${DB_TABLES.CATALOG_EMPLOYEE_SPECIALTIES} WHERE id = $1`,
      [id]
    );
    return this._employeeSpecialtyToEntity(rows[0]);
  }

  async createEmployeeSpecialty(data) {
    const id = generateId('esp');
    const { rows } = await this._db.query(
      `INSERT INTO ${DB_TABLES.CATALOG_EMPLOYEE_SPECIALTIES} (id, name, is_active)
       VALUES ($1, $2, $3) RETURNING *`,
      [id, data.name, data.isActive ?? true]
    );
    return this._employeeSpecialtyToEntity(rows[0]);
  }

  async updateEmployeeSpecialty(id, data) {
    const fields = [];
    const values = [];
    let i = 1;
    if (data.name      !== undefined) { fields.push(`name = $${i++}`);       values.push(data.name); }
    if (data.isActive  !== undefined) { fields.push(`is_active = $${i++}`);  values.push(data.isActive); }
    if (fields.length === 0) return this.findEmployeeSpecialtyById(id);
    values.push(id);
    const { rows } = await this._db.query(
      `UPDATE ${DB_TABLES.CATALOG_EMPLOYEE_SPECIALTIES} SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${i} RETURNING *`,
      values
    );
    return this._employeeSpecialtyToEntity(rows[0]);
  }

  async deleteEmployeeSpecialty(id) {
    const { rows } = await this._db.query(
      `UPDATE ${DB_TABLES.CATALOG_EMPLOYEE_SPECIALTIES} SET is_active = false, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return this._employeeSpecialtyToEntity(rows[0]);
  }

  _employeeSpecialtyToEntity(row) {
    if (!row) return null;
    return { id: row.id, name: row.name, isActive: row.is_active,
             createdAt: row.created_at, updatedAt: row.updated_at };
  }

  // ----------------------------------------------------------------
  // Tax Rates
  // ----------------------------------------------------------------

  async findAllTaxRates(includeInactive = false) {
    const where = includeInactive ? '' : 'WHERE is_active = true';
    const { rows } = await this._db.query(
      `SELECT * FROM ${DB_TABLES.CATALOG_TAX_RATES} ${where} ORDER BY name ASC`
    );
    return rows.map(this._taxRateToEntity);
  }

  async findTaxRateById(id) {
    const { rows } = await this._db.query(
      `SELECT * FROM ${DB_TABLES.CATALOG_TAX_RATES} WHERE id = $1`,
      [id]
    );
    return this._taxRateToEntity(rows[0]);
  }

  async createTaxRate(data) {
    const id = generateId('txr');
    const { rows } = await this._db.query(
      `INSERT INTO ${DB_TABLES.CATALOG_TAX_RATES} (id, name, percentage, is_active)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, data.name, data.percentage ?? 0, data.isActive ?? true]
    );
    return this._taxRateToEntity(rows[0]);
  }

  async updateTaxRate(id, data) {
    const fields = [];
    const values = [];
    let i = 1;
    if (data.name       !== undefined) { fields.push(`name = $${i++}`);        values.push(data.name); }
    if (data.percentage !== undefined) { fields.push(`percentage = $${i++}`);  values.push(data.percentage); }
    if (data.isActive   !== undefined) { fields.push(`is_active = $${i++}`);   values.push(data.isActive); }
    if (fields.length === 0) return this.findTaxRateById(id);
    values.push(id);
    const { rows } = await this._db.query(
      `UPDATE ${DB_TABLES.CATALOG_TAX_RATES} SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${i} RETURNING *`,
      values
    );
    return this._taxRateToEntity(rows[0]);
  }

  async deleteTaxRate(id) {
    const { rows } = await this._db.query(
      `UPDATE ${DB_TABLES.CATALOG_TAX_RATES} SET is_active = false, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return this._taxRateToEntity(rows[0]);
  }

  _taxRateToEntity(row) {
    if (!row) return null;
    return { id: row.id, name: row.name, percentage: parseFloat(row.percentage),
             isActive: row.is_active, createdAt: row.created_at, updatedAt: row.updated_at };
  }

  // ----------------------------------------------------------------
  // Order Number Config
  // ----------------------------------------------------------------

  async getOrderNumberConfig() {
    const { rows } = await this._db.query(
      `SELECT * FROM ${DB_TABLES.CATALOG_ORDER_NUMBER_CONFIG} WHERE id = 'onc_default'`
    );
    return this._orderNumberConfigToEntity(rows[0]);
  }

  async updateOrderNumberConfig(data) {
    const fields = [];
    const values = [];
    let i = 1;
    if (data.prefix  !== undefined) { fields.push(`prefix = $${i++}`);   values.push(data.prefix); }
    if (data.padding !== undefined) { fields.push(`padding = $${i++}`);  values.push(data.padding); }
    if (fields.length === 0) return this.getOrderNumberConfig();
    values.push('onc_default');
    const { rows } = await this._db.query(
      `UPDATE ${DB_TABLES.CATALOG_ORDER_NUMBER_CONFIG}
       SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${i} RETURNING *`,
      values
    );
    return this._orderNumberConfigToEntity(rows[0]);
  }

  async getAndIncrementOrderNumber() {
    const { rows } = await this._db.query(
      `UPDATE ${DB_TABLES.CATALOG_ORDER_NUMBER_CONFIG}
       SET next_number = next_number + 1, updated_at = NOW()
       WHERE id = 'onc_default'
       RETURNING next_number - 1 AS issued_number`
    );
    return rows[0] ? rows[0].issued_number : null;
  }

  _orderNumberConfigToEntity(row) {
    if (!row) return null;
    return { id: row.id, prefix: row.prefix, nextNumber: row.next_number,
             padding: row.padding, createdAt: row.created_at, updatedAt: row.updated_at };
  }

  // ----------------------------------------------------------------
  // Employee Specialty Assignments
  // ----------------------------------------------------------------

  async getEmployeeSpecialties(employeeId) {
    const { rows } = await this._db.query(
      `SELECT es.*
       FROM ${DB_TABLES.CATALOG_EMPLOYEE_SPECIALTIES} es
       INNER JOIN ${DB_TABLES.CATALOG_EMPLOYEE_SPECIALTY_ASSIGNMENTS} esa
         ON esa.specialty_id = es.id
       WHERE esa.employee_id = $1
       ORDER BY es.name ASC`,
      [employeeId]
    );
    return rows.map(this._employeeSpecialtyToEntity);
  }

  async setEmployeeSpecialties(employeeId, specialtyIds) {
    await this._db.transaction(async (client) => {
      await client.query(
        `DELETE FROM ${DB_TABLES.CATALOG_EMPLOYEE_SPECIALTY_ASSIGNMENTS}
         WHERE employee_id = $1`,
        [employeeId]
      );
      if (specialtyIds.length === 0) return;
      const placeholders = specialtyIds.map((_, idx) => `($1, $${idx + 2})`).join(', ');
      await client.query(
        `INSERT INTO ${DB_TABLES.CATALOG_EMPLOYEE_SPECIALTY_ASSIGNMENTS}
           (employee_id, specialty_id)
         VALUES ${placeholders}`,
        [employeeId, ...specialtyIds]
      );
    });
    return this.getEmployeeSpecialties(employeeId);
  }

  // ----------------------------------------------------------------
  // Service Templates
  // ----------------------------------------------------------------

  async getServiceTemplate(serviceTypeId) {
    const { rows: stRows } = await this._db.query(
      `SELECT * FROM ${DB_TABLES.CATALOG_SERVICE_TYPES} WHERE id = $1`,
      [serviceTypeId]
    );
    if (!stRows[0]) return null;

    const { rows: laborRows } = await this._db.query(
      `SELECT * FROM ${DB_TABLES.CATALOG_SERVICE_LABOR_TEMPLATES}
       WHERE service_type_id = $1 ORDER BY sort_order ASC, created_at ASC`,
      [serviceTypeId]
    );

    const { rows: partRows } = await this._db.query(
      `SELECT pt.*, sp.name AS spare_part_name, sp.unit_price AS spare_part_price
       FROM ${DB_TABLES.CATALOG_SERVICE_PART_TEMPLATES} pt
       LEFT JOIN ${DB_TABLES.CATALOG_SPARE_PARTS} sp ON sp.id = pt.spare_part_id
       WHERE pt.service_type_id = $1 ORDER BY pt.sort_order ASC, pt.created_at ASC`,
      [serviceTypeId]
    );

    return {
      serviceType: {
        id:          stRows[0].id,
        name:        stRows[0].name,
        description: stRows[0].description,
      },
      laborTemplates: laborRows.map((r) => ({
        id:           r.id,
        description:  r.description,
        defaultHours: parseFloat(r.default_hours),
        sortOrder:    r.sort_order,
      })),
      partTemplates: partRows.map((r) => ({
        id:              r.id,
        sparePartId:     r.spare_part_id,
        sparePartName:   r.spare_part_name   ?? null,
        sparePartPrice:  r.spare_part_price  != null ? parseFloat(r.spare_part_price) : null,
        description:     r.description,
        defaultQuantity: parseFloat(r.default_quantity),
        sortOrder:       r.sort_order,
      })),
    };
  }

  async createServiceLaborTemplate(data) {
    const id = generateId('slt');
    const { rows } = await this._db.query(
      `INSERT INTO ${DB_TABLES.CATALOG_SERVICE_LABOR_TEMPLATES}
         (id, service_type_id, description, default_hours, sort_order)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [id, data.serviceTypeId, data.description, data.defaultHours ?? 1, data.sortOrder ?? 0]
    );
    return this._serviceLaborTemplateToEntity(rows[0]);
  }

  async updateServiceLaborTemplate(id, data) {
    const fields = [];
    const values = [];
    let i = 1;
    if (data.description  !== undefined) { fields.push(`description = $${i++}`);   values.push(data.description); }
    if (data.defaultHours !== undefined) { fields.push(`default_hours = $${i++}`); values.push(data.defaultHours); }
    if (data.sortOrder    !== undefined) { fields.push(`sort_order = $${i++}`);     values.push(data.sortOrder); }
    if (fields.length === 0) {
      const { rows } = await this._db.query(
        `SELECT * FROM ${DB_TABLES.CATALOG_SERVICE_LABOR_TEMPLATES} WHERE id = $1`, [id]
      );
      return this._serviceLaborTemplateToEntity(rows[0]);
    }
    values.push(id);
    const { rows } = await this._db.query(
      `UPDATE ${DB_TABLES.CATALOG_SERVICE_LABOR_TEMPLATES}
       SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${i} RETURNING *`,
      values
    );
    return this._serviceLaborTemplateToEntity(rows[0]);
  }

  async deleteServiceLaborTemplate(id) {
    const { rows } = await this._db.query(
      `DELETE FROM ${DB_TABLES.CATALOG_SERVICE_LABOR_TEMPLATES} WHERE id = $1 RETURNING *`,
      [id]
    );
    return this._serviceLaborTemplateToEntity(rows[0]);
  }

  async createServicePartTemplate(data) {
    const id = generateId('spt');
    const { rows } = await this._db.query(
      `INSERT INTO ${DB_TABLES.CATALOG_SERVICE_PART_TEMPLATES}
         (id, service_type_id, spare_part_id, description, default_quantity, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [
        id,
        data.serviceTypeId,
        data.sparePartId     ?? null,
        data.description,
        data.defaultQuantity ?? 1,
        data.sortOrder       ?? 0,
      ]
    );
    return this._servicePartTemplateToEntity(rows[0]);
  }

  async updateServicePartTemplate(id, data) {
    const fields = [];
    const values = [];
    let i = 1;
    if (data.sparePartId     !== undefined) { fields.push(`spare_part_id = $${i++}`);     values.push(data.sparePartId); }
    if (data.description     !== undefined) { fields.push(`description = $${i++}`);        values.push(data.description); }
    if (data.defaultQuantity !== undefined) { fields.push(`default_quantity = $${i++}`);  values.push(data.defaultQuantity); }
    if (data.sortOrder       !== undefined) { fields.push(`sort_order = $${i++}`);         values.push(data.sortOrder); }
    if (fields.length === 0) {
      const { rows } = await this._db.query(
        `SELECT * FROM ${DB_TABLES.CATALOG_SERVICE_PART_TEMPLATES} WHERE id = $1`, [id]
      );
      return this._servicePartTemplateToEntity(rows[0]);
    }
    values.push(id);
    const { rows } = await this._db.query(
      `UPDATE ${DB_TABLES.CATALOG_SERVICE_PART_TEMPLATES}
       SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${i} RETURNING *`,
      values
    );
    return this._servicePartTemplateToEntity(rows[0]);
  }

  async deleteServicePartTemplate(id) {
    const { rows } = await this._db.query(
      `DELETE FROM ${DB_TABLES.CATALOG_SERVICE_PART_TEMPLATES} WHERE id = $1 RETURNING *`,
      [id]
    );
    return this._servicePartTemplateToEntity(rows[0]);
  }

  _serviceLaborTemplateToEntity(row) {
    if (!row) return null;
    return {
      id:            row.id,
      serviceTypeId: row.service_type_id,
      description:   row.description,
      defaultHours:  parseFloat(row.default_hours),
      sortOrder:     row.sort_order,
      createdAt:     row.created_at,
      updatedAt:     row.updated_at,
    };
  }

  _servicePartTemplateToEntity(row) {
    if (!row) return null;
    return {
      id:              row.id,
      serviceTypeId:   row.service_type_id,
      sparePartId:     row.spare_part_id,
      description:     row.description,
      defaultQuantity: parseFloat(row.default_quantity),
      sortOrder:       row.sort_order,
      createdAt:       row.created_at,
      updatedAt:       row.updated_at,
    };
  }
}

module.exports = CatalogRepository;
