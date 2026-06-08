'use strict';

/**
 * catalog.routes.js — Gestión de catálogos del módulo de Órdenes de Trabajo.
 *
 * GET|POST|PUT|DELETE  /api/catalog/brands
 * GET|POST|PUT|DELETE  /api/catalog/models
 * GET|POST|PUT|DELETE  /api/catalog/fuel-types
 * GET|POST|PUT|DELETE  /api/catalog/spare-part-categories
 * GET|POST|PUT|DELETE  /api/catalog/spare-parts
 * GET|POST|PUT|DELETE  /api/catalog/service-types
 * GET|POST|PUT|DELETE  /api/catalog/labor-rates
 * GET|POST|PUT|DELETE  /api/catalog/employee-specialties
 * GET|POST|PUT|DELETE  /api/catalog/tax-rates
 * GET|PUT              /api/catalog/order-number-config
 * GET|PUT              /api/catalog/employees/:employeeId/specialties
 */

const express = require('express');

const CatalogRepository = require('./catalog.repository');
const { authMiddleware, roleMiddleware } = require('../../middleware/auth');
const { AppError } = require('../../middleware/error-handler');
const { USER_ROLES } = require('../../config/constants');

const router = express.Router();

// ================================================================
// BRANDS
// ================================================================

/**
 * @swagger
 * /api/catalog/brands:
 *   get:
 *     tags: [Catalog]
 *     summary: Lista las marcas activas
 *     responses:
 *       200:
 *         description: Lista de marcas
 */
router.get('/brands', authMiddleware, async (req, res, next) => {
  try {
    const repo = new CatalogRepository(req.db);
    const data = await repo.findAllBrands();
    res.json({ data, message: 'Marcas obtenidas correctamente.' });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/catalog/brands/{id}:
 *   get:
 *     tags: [Catalog]
 *     summary: Obtiene una marca por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Marca encontrada
 *       404:
 *         description: Marca no encontrada
 */
router.get('/brands/:id', authMiddleware, async (req, res, next) => {
  try {
    const repo = new CatalogRepository(req.db);
    const data = await repo.findBrandById(req.params.id);
    if (!data) throw new AppError('Marca no encontrada.', 404);
    res.json({ data, message: 'Marca obtenida correctamente.' });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/catalog/brands:
 *   post:
 *     tags: [Catalog]
 *     summary: Crea una nueva marca (solo ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *     responses:
 *       201:
 *         description: Marca creada
 *       400:
 *         description: Campos requeridos faltantes
 */
router.post('/brands',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const { name } = req.body;
      if (!name) throw new AppError('name es requerido.', 400);
      const repo = new CatalogRepository(req.db);
      const data = await repo.createBrand({ name });
      res.status(201).json({ data, message: 'Marca creada correctamente.' });
    } catch (err) { next(err); }
  }
);

/**
 * @swagger
 * /api/catalog/brands/{id}:
 *   put:
 *     tags: [Catalog]
 *     summary: Actualiza una marca (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Marca actualizada
 *       404:
 *         description: Marca no encontrada
 */
router.put('/brands/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo = new CatalogRepository(req.db);
      const existing = await repo.findBrandById(req.params.id);
      if (!existing) throw new AppError('Marca no encontrada.', 404);
      const { name, isActive } = req.body;
      const data = await repo.updateBrand(req.params.id, { name, isActive });
      res.json({ data, message: 'Marca actualizada correctamente.' });
    } catch (err) { next(err); }
  }
);

/**
 * @swagger
 * /api/catalog/brands/{id}:
 *   delete:
 *     tags: [Catalog]
 *     summary: Desactiva una marca (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Marca desactivada
 *       404:
 *         description: Marca no encontrada
 */
router.delete('/brands/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo = new CatalogRepository(req.db);
      const existing = await repo.findBrandById(req.params.id);
      if (!existing) throw new AppError('Marca no encontrada.', 404);
      const data = await repo.deleteBrand(req.params.id);
      res.json({ data, message: 'Marca desactivada correctamente.' });
    } catch (err) { next(err); }
  }
);

// ================================================================
// MODELS
// ================================================================

/**
 * @swagger
 * /api/catalog/models:
 *   get:
 *     tags: [Catalog]
 *     summary: Lista los modelos activos; soporta ?brandId= para filtrar
 *     parameters:
 *       - in: query
 *         name: brandId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de modelos
 */
router.get('/models', authMiddleware, async (req, res, next) => {
  try {
    const repo = new CatalogRepository(req.db);
    const data = req.query.brandId
      ? await repo.findModelsByBrand(req.query.brandId)
      : await repo.findAllModels();
    res.json({ data, message: 'Modelos obtenidos correctamente.' });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/catalog/models/{id}:
 *   get:
 *     tags: [Catalog]
 *     summary: Obtiene un modelo por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Modelo encontrado
 *       404:
 *         description: Modelo no encontrado
 */
router.get('/models/:id', authMiddleware, async (req, res, next) => {
  try {
    const repo = new CatalogRepository(req.db);
    const data = await repo.findModelById(req.params.id);
    if (!data) throw new AppError('Modelo no encontrado.', 404);
    res.json({ data, message: 'Modelo obtenido correctamente.' });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/catalog/models:
 *   post:
 *     tags: [Catalog]
 *     summary: Crea un nuevo modelo (solo ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [brandId, name]
 *             properties:
 *               brandId:  { type: string }
 *               name:     { type: string }
 *               yearFrom: { type: integer }
 *               yearTo:   { type: integer }
 *     responses:
 *       201:
 *         description: Modelo creado
 */
router.post('/models',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const { brandId, name, yearFrom, yearTo } = req.body;
      if (!brandId || !name) throw new AppError('brandId y name son requeridos.', 400);
      const repo = new CatalogRepository(req.db);
      const data = await repo.createModel({ brandId, name, yearFrom, yearTo });
      res.status(201).json({ data, message: 'Modelo creado correctamente.' });
    } catch (err) { next(err); }
  }
);

/**
 * @swagger
 * /api/catalog/models/{id}:
 *   put:
 *     tags: [Catalog]
 *     summary: Actualiza un modelo (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Modelo actualizado
 *       404:
 *         description: Modelo no encontrado
 */
router.put('/models/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo = new CatalogRepository(req.db);
      const existing = await repo.findModelById(req.params.id);
      if (!existing) throw new AppError('Modelo no encontrado.', 404);
      const { brandId, name, yearFrom, yearTo, isActive } = req.body;
      const data = await repo.updateModel(req.params.id, { brandId, name, yearFrom, yearTo, isActive });
      res.json({ data, message: 'Modelo actualizado correctamente.' });
    } catch (err) { next(err); }
  }
);

/**
 * @swagger
 * /api/catalog/models/{id}:
 *   delete:
 *     tags: [Catalog]
 *     summary: Desactiva un modelo (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Modelo desactivado
 *       404:
 *         description: Modelo no encontrado
 */
router.delete('/models/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo = new CatalogRepository(req.db);
      const existing = await repo.findModelById(req.params.id);
      if (!existing) throw new AppError('Modelo no encontrado.', 404);
      const data = await repo.deleteModel(req.params.id);
      res.json({ data, message: 'Modelo desactivado correctamente.' });
    } catch (err) { next(err); }
  }
);

// ================================================================
// FUEL TYPES
// ================================================================

/**
 * @swagger
 * /api/catalog/fuel-types:
 *   get:
 *     tags: [Catalog]
 *     summary: Lista los tipos de combustible activos
 *     responses:
 *       200:
 *         description: Lista de tipos de combustible
 */
router.get('/fuel-types', authMiddleware, async (req, res, next) => {
  try {
    const repo = new CatalogRepository(req.db);
    const data = await repo.findAllFuelTypes();
    res.json({ data, message: 'Tipos de combustible obtenidos correctamente.' });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/catalog/fuel-types/{id}:
 *   get:
 *     tags: [Catalog]
 *     summary: Obtiene un tipo de combustible por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tipo de combustible encontrado
 *       404:
 *         description: Tipo de combustible no encontrado
 */
router.get('/fuel-types/:id', authMiddleware, async (req, res, next) => {
  try {
    const repo = new CatalogRepository(req.db);
    const data = await repo.findFuelTypeById(req.params.id);
    if (!data) throw new AppError('Tipo de combustible no encontrado.', 404);
    res.json({ data, message: 'Tipo de combustible obtenido correctamente.' });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/catalog/fuel-types:
 *   post:
 *     tags: [Catalog]
 *     summary: Crea un tipo de combustible (solo ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *     responses:
 *       201:
 *         description: Tipo de combustible creado
 */
router.post('/fuel-types',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const { name } = req.body;
      if (!name) throw new AppError('name es requerido.', 400);
      const repo = new CatalogRepository(req.db);
      const data = await repo.createFuelType({ name });
      res.status(201).json({ data, message: 'Tipo de combustible creado correctamente.' });
    } catch (err) { next(err); }
  }
);

/**
 * @swagger
 * /api/catalog/fuel-types/{id}:
 *   put:
 *     tags: [Catalog]
 *     summary: Actualiza un tipo de combustible (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tipo de combustible actualizado
 *       404:
 *         description: Tipo de combustible no encontrado
 */
router.put('/fuel-types/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo = new CatalogRepository(req.db);
      const existing = await repo.findFuelTypeById(req.params.id);
      if (!existing) throw new AppError('Tipo de combustible no encontrado.', 404);
      const { name, isActive } = req.body;
      const data = await repo.updateFuelType(req.params.id, { name, isActive });
      res.json({ data, message: 'Tipo de combustible actualizado correctamente.' });
    } catch (err) { next(err); }
  }
);

/**
 * @swagger
 * /api/catalog/fuel-types/{id}:
 *   delete:
 *     tags: [Catalog]
 *     summary: Desactiva un tipo de combustible (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tipo de combustible desactivado
 *       404:
 *         description: Tipo de combustible no encontrado
 */
router.delete('/fuel-types/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo = new CatalogRepository(req.db);
      const existing = await repo.findFuelTypeById(req.params.id);
      if (!existing) throw new AppError('Tipo de combustible no encontrado.', 404);
      const data = await repo.deleteFuelType(req.params.id);
      res.json({ data, message: 'Tipo de combustible desactivado correctamente.' });
    } catch (err) { next(err); }
  }
);

// ================================================================
// SPARE PART CATEGORIES
// ================================================================

/**
 * @swagger
 * /api/catalog/spare-part-categories:
 *   get:
 *     tags: [Catalog]
 *     summary: Lista las categorías de repuestos activas
 *     responses:
 *       200:
 *         description: Lista de categorías
 */
router.get('/spare-part-categories', authMiddleware, async (req, res, next) => {
  try {
    const repo = new CatalogRepository(req.db);
    const data = await repo.findAllSparePartCategories();
    res.json({ data, message: 'Categorías de repuestos obtenidas correctamente.' });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/catalog/spare-part-categories/{id}:
 *   get:
 *     tags: [Catalog]
 *     summary: Obtiene una categoría de repuesto por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Categoría encontrada
 *       404:
 *         description: Categoría no encontrada
 */
router.get('/spare-part-categories/:id', authMiddleware, async (req, res, next) => {
  try {
    const repo = new CatalogRepository(req.db);
    const data = await repo.findSparePartCategoryById(req.params.id);
    if (!data) throw new AppError('Categoría de repuesto no encontrada.', 404);
    res.json({ data, message: 'Categoría de repuesto obtenida correctamente.' });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/catalog/spare-part-categories:
 *   post:
 *     tags: [Catalog]
 *     summary: Crea una categoría de repuesto (solo ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *     responses:
 *       201:
 *         description: Categoría creada
 */
router.post('/spare-part-categories',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const { name } = req.body;
      if (!name) throw new AppError('name es requerido.', 400);
      const repo = new CatalogRepository(req.db);
      const data = await repo.createSparePartCategory({ name });
      res.status(201).json({ data, message: 'Categoría de repuesto creada correctamente.' });
    } catch (err) { next(err); }
  }
);

/**
 * @swagger
 * /api/catalog/spare-part-categories/{id}:
 *   put:
 *     tags: [Catalog]
 *     summary: Actualiza una categoría de repuesto (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Categoría actualizada
 *       404:
 *         description: Categoría no encontrada
 */
router.put('/spare-part-categories/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo = new CatalogRepository(req.db);
      const existing = await repo.findSparePartCategoryById(req.params.id);
      if (!existing) throw new AppError('Categoría de repuesto no encontrada.', 404);
      const { name, isActive } = req.body;
      const data = await repo.updateSparePartCategory(req.params.id, { name, isActive });
      res.json({ data, message: 'Categoría de repuesto actualizada correctamente.' });
    } catch (err) { next(err); }
  }
);

/**
 * @swagger
 * /api/catalog/spare-part-categories/{id}:
 *   delete:
 *     tags: [Catalog]
 *     summary: Desactiva una categoría de repuesto (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Categoría desactivada
 *       404:
 *         description: Categoría no encontrada
 */
router.delete('/spare-part-categories/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo = new CatalogRepository(req.db);
      const existing = await repo.findSparePartCategoryById(req.params.id);
      if (!existing) throw new AppError('Categoría de repuesto no encontrada.', 404);
      const data = await repo.deleteSparePartCategory(req.params.id);
      res.json({ data, message: 'Categoría de repuesto desactivada correctamente.' });
    } catch (err) { next(err); }
  }
);

// ================================================================
// SPARE PARTS
// ================================================================

/**
 * @swagger
 * /api/catalog/spare-parts:
 *   get:
 *     tags: [Catalog]
 *     summary: Lista los repuestos activos; soporta ?categoryId= para filtrar
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de repuestos
 */
router.get('/spare-parts', authMiddleware, async (req, res, next) => {
  try {
    const repo = new CatalogRepository(req.db);
    const data = req.query.categoryId
      ? await repo.findSparePartsByCategory(req.query.categoryId)
      : await repo.findAllSpareParts();
    res.json({ data, message: 'Repuestos obtenidos correctamente.' });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/catalog/spare-parts/{id}:
 *   get:
 *     tags: [Catalog]
 *     summary: Obtiene un repuesto por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Repuesto encontrado
 *       404:
 *         description: Repuesto no encontrado
 */
router.get('/spare-parts/:id', authMiddleware, async (req, res, next) => {
  try {
    const repo = new CatalogRepository(req.db);
    const data = await repo.findSparePartById(req.params.id);
    if (!data) throw new AppError('Repuesto no encontrado.', 404);
    res.json({ data, message: 'Repuesto obtenido correctamente.' });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/catalog/spare-parts:
 *   post:
 *     tags: [Catalog]
 *     summary: Crea un repuesto (solo ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:          { type: string }
 *               categoryId:    { type: string }
 *               partNumber:    { type: string }
 *               unit:          { type: string }
 *               unitPrice:     { type: number }
 *               stockQuantity: { type: integer }
 *               minStock:      { type: integer }
 *     responses:
 *       201:
 *         description: Repuesto creado
 */
router.post('/spare-parts',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const { name, categoryId, partNumber, unit, unitPrice, stockQuantity, minStock } = req.body;
      if (!name) throw new AppError('name es requerido.', 400);
      const repo = new CatalogRepository(req.db);
      const data = await repo.createSparePart({ name, categoryId, partNumber, unit, unitPrice, stockQuantity, minStock });
      res.status(201).json({ data, message: 'Repuesto creado correctamente.' });
    } catch (err) { next(err); }
  }
);

/**
 * @swagger
 * /api/catalog/spare-parts/{id}:
 *   put:
 *     tags: [Catalog]
 *     summary: Actualiza un repuesto (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Repuesto actualizado
 *       404:
 *         description: Repuesto no encontrado
 */
router.put('/spare-parts/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo = new CatalogRepository(req.db);
      const existing = await repo.findSparePartById(req.params.id);
      if (!existing) throw new AppError('Repuesto no encontrado.', 404);
      const { name, categoryId, partNumber, unit, unitPrice, stockQuantity, minStock, isActive } = req.body;
      const data = await repo.updateSparePart(req.params.id, {
        name, categoryId, partNumber, unit, unitPrice, stockQuantity, minStock, isActive,
      });
      res.json({ data, message: 'Repuesto actualizado correctamente.' });
    } catch (err) { next(err); }
  }
);

/**
 * @swagger
 * /api/catalog/spare-parts/{id}:
 *   delete:
 *     tags: [Catalog]
 *     summary: Desactiva un repuesto (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Repuesto desactivado
 *       404:
 *         description: Repuesto no encontrado
 */
router.delete('/spare-parts/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo = new CatalogRepository(req.db);
      const existing = await repo.findSparePartById(req.params.id);
      if (!existing) throw new AppError('Repuesto no encontrado.', 404);
      const data = await repo.deleteSparePart(req.params.id);
      res.json({ data, message: 'Repuesto desactivado correctamente.' });
    } catch (err) { next(err); }
  }
);

// ================================================================
// SERVICE TYPES
// ================================================================

/**
 * @swagger
 * /api/catalog/service-types:
 *   get:
 *     tags: [Catalog]
 *     summary: Lista los tipos de servicio activos
 *     responses:
 *       200:
 *         description: Lista de tipos de servicio
 */
router.get('/service-types', authMiddleware, async (req, res, next) => {
  try {
    const repo = new CatalogRepository(req.db);
    const data = await repo.findAllServiceTypes();
    res.json({ data, message: 'Tipos de servicio obtenidos correctamente.' });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/catalog/service-types/{id}:
 *   get:
 *     tags: [Catalog]
 *     summary: Obtiene un tipo de servicio por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tipo de servicio encontrado
 *       404:
 *         description: Tipo de servicio no encontrado
 */
router.get('/service-types/:id', authMiddleware, async (req, res, next) => {
  try {
    const repo = new CatalogRepository(req.db);
    const data = await repo.findServiceTypeById(req.params.id);
    if (!data) throw new AppError('Tipo de servicio no encontrado.', 404);
    res.json({ data, message: 'Tipo de servicio obtenido correctamente.' });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/catalog/service-types:
 *   post:
 *     tags: [Catalog]
 *     summary: Crea un tipo de servicio (solo ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:        { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Tipo de servicio creado
 */
router.post('/service-types',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const { name, description } = req.body;
      if (!name) throw new AppError('name es requerido.', 400);
      const repo = new CatalogRepository(req.db);
      const data = await repo.createServiceType({ name, description });
      res.status(201).json({ data, message: 'Tipo de servicio creado correctamente.' });
    } catch (err) { next(err); }
  }
);

/**
 * @swagger
 * /api/catalog/service-types/{id}:
 *   put:
 *     tags: [Catalog]
 *     summary: Actualiza un tipo de servicio (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tipo de servicio actualizado
 *       404:
 *         description: Tipo de servicio no encontrado
 */
router.put('/service-types/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo = new CatalogRepository(req.db);
      const existing = await repo.findServiceTypeById(req.params.id);
      if (!existing) throw new AppError('Tipo de servicio no encontrado.', 404);
      const { name, description, isActive } = req.body;
      const data = await repo.updateServiceType(req.params.id, { name, description, isActive });
      res.json({ data, message: 'Tipo de servicio actualizado correctamente.' });
    } catch (err) { next(err); }
  }
);

/**
 * @swagger
 * /api/catalog/service-types/{id}:
 *   delete:
 *     tags: [Catalog]
 *     summary: Desactiva un tipo de servicio (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tipo de servicio desactivado
 *       404:
 *         description: Tipo de servicio no encontrado
 */
router.delete('/service-types/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo = new CatalogRepository(req.db);
      const existing = await repo.findServiceTypeById(req.params.id);
      if (!existing) throw new AppError('Tipo de servicio no encontrado.', 404);
      const data = await repo.deleteServiceType(req.params.id);
      res.json({ data, message: 'Tipo de servicio desactivado correctamente.' });
    } catch (err) { next(err); }
  }
);

// ================================================================
// LABOR RATES
// ================================================================

/**
 * @swagger
 * /api/catalog/labor-rates:
 *   get:
 *     tags: [Catalog]
 *     summary: Lista las tarifas de mano de obra activas
 *     responses:
 *       200:
 *         description: Lista de tarifas
 */
router.get('/labor-rates', authMiddleware, async (req, res, next) => {
  try {
    const repo = new CatalogRepository(req.db);
    const data = await repo.findAllLaborRates();
    res.json({ data, message: 'Tarifas de mano de obra obtenidas correctamente.' });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/catalog/labor-rates/{id}:
 *   get:
 *     tags: [Catalog]
 *     summary: Obtiene una tarifa de mano de obra por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tarifa encontrada
 *       404:
 *         description: Tarifa no encontrada
 */
router.get('/labor-rates/:id', authMiddleware, async (req, res, next) => {
  try {
    const repo = new CatalogRepository(req.db);
    const data = await repo.findLaborRateById(req.params.id);
    if (!data) throw new AppError('Tarifa de mano de obra no encontrada.', 404);
    res.json({ data, message: 'Tarifa de mano de obra obtenida correctamente.' });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/catalog/labor-rates:
 *   post:
 *     tags: [Catalog]
 *     summary: Crea una tarifa de mano de obra (solo ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:        { type: string }
 *               description: { type: string }
 *               ratePerHour: { type: number }
 *     responses:
 *       201:
 *         description: Tarifa creada
 */
router.post('/labor-rates',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const { name, description, ratePerHour } = req.body;
      if (!name) throw new AppError('name es requerido.', 400);
      const repo = new CatalogRepository(req.db);
      const data = await repo.createLaborRate({ name, description, ratePerHour });
      res.status(201).json({ data, message: 'Tarifa de mano de obra creada correctamente.' });
    } catch (err) { next(err); }
  }
);

/**
 * @swagger
 * /api/catalog/labor-rates/{id}:
 *   put:
 *     tags: [Catalog]
 *     summary: Actualiza una tarifa de mano de obra (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tarifa actualizada
 *       404:
 *         description: Tarifa no encontrada
 */
router.put('/labor-rates/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo = new CatalogRepository(req.db);
      const existing = await repo.findLaborRateById(req.params.id);
      if (!existing) throw new AppError('Tarifa de mano de obra no encontrada.', 404);
      const { name, description, ratePerHour, isActive } = req.body;
      const data = await repo.updateLaborRate(req.params.id, { name, description, ratePerHour, isActive });
      res.json({ data, message: 'Tarifa de mano de obra actualizada correctamente.' });
    } catch (err) { next(err); }
  }
);

/**
 * @swagger
 * /api/catalog/labor-rates/{id}:
 *   delete:
 *     tags: [Catalog]
 *     summary: Desactiva una tarifa de mano de obra (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tarifa desactivada
 *       404:
 *         description: Tarifa no encontrada
 */
router.delete('/labor-rates/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo = new CatalogRepository(req.db);
      const existing = await repo.findLaborRateById(req.params.id);
      if (!existing) throw new AppError('Tarifa de mano de obra no encontrada.', 404);
      const data = await repo.deleteLaborRate(req.params.id);
      res.json({ data, message: 'Tarifa de mano de obra desactivada correctamente.' });
    } catch (err) { next(err); }
  }
);

// ================================================================
// EMPLOYEE SPECIALTIES
// ================================================================

/**
 * @swagger
 * /api/catalog/employee-specialties:
 *   get:
 *     tags: [Catalog]
 *     summary: Lista las especialidades de empleados activas
 *     responses:
 *       200:
 *         description: Lista de especialidades
 */
router.get('/employee-specialties', authMiddleware, async (req, res, next) => {
  try {
    const repo = new CatalogRepository(req.db);
    const data = await repo.findAllEmployeeSpecialties();
    res.json({ data, message: 'Especialidades obtenidas correctamente.' });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/catalog/employee-specialties/{id}:
 *   get:
 *     tags: [Catalog]
 *     summary: Obtiene una especialidad por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Especialidad encontrada
 *       404:
 *         description: Especialidad no encontrada
 */
router.get('/employee-specialties/:id', authMiddleware, async (req, res, next) => {
  try {
    const repo = new CatalogRepository(req.db);
    const data = await repo.findEmployeeSpecialtyById(req.params.id);
    if (!data) throw new AppError('Especialidad no encontrada.', 404);
    res.json({ data, message: 'Especialidad obtenida correctamente.' });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/catalog/employee-specialties:
 *   post:
 *     tags: [Catalog]
 *     summary: Crea una especialidad (solo ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *     responses:
 *       201:
 *         description: Especialidad creada
 */
router.post('/employee-specialties',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const { name } = req.body;
      if (!name) throw new AppError('name es requerido.', 400);
      const repo = new CatalogRepository(req.db);
      const data = await repo.createEmployeeSpecialty({ name });
      res.status(201).json({ data, message: 'Especialidad creada correctamente.' });
    } catch (err) { next(err); }
  }
);

/**
 * @swagger
 * /api/catalog/employee-specialties/{id}:
 *   put:
 *     tags: [Catalog]
 *     summary: Actualiza una especialidad (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Especialidad actualizada
 *       404:
 *         description: Especialidad no encontrada
 */
router.put('/employee-specialties/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo = new CatalogRepository(req.db);
      const existing = await repo.findEmployeeSpecialtyById(req.params.id);
      if (!existing) throw new AppError('Especialidad no encontrada.', 404);
      const { name, isActive } = req.body;
      const data = await repo.updateEmployeeSpecialty(req.params.id, { name, isActive });
      res.json({ data, message: 'Especialidad actualizada correctamente.' });
    } catch (err) { next(err); }
  }
);

/**
 * @swagger
 * /api/catalog/employee-specialties/{id}:
 *   delete:
 *     tags: [Catalog]
 *     summary: Desactiva una especialidad (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Especialidad desactivada
 *       404:
 *         description: Especialidad no encontrada
 */
router.delete('/employee-specialties/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo = new CatalogRepository(req.db);
      const existing = await repo.findEmployeeSpecialtyById(req.params.id);
      if (!existing) throw new AppError('Especialidad no encontrada.', 404);
      const data = await repo.deleteEmployeeSpecialty(req.params.id);
      res.json({ data, message: 'Especialidad desactivada correctamente.' });
    } catch (err) { next(err); }
  }
);

// ================================================================
// TAX RATES
// ================================================================

/**
 * @swagger
 * /api/catalog/tax-rates:
 *   get:
 *     tags: [Catalog]
 *     summary: Lista las tasas de impuesto activas
 *     responses:
 *       200:
 *         description: Lista de tasas de impuesto
 */
router.get('/tax-rates', authMiddleware, async (req, res, next) => {
  try {
    const repo = new CatalogRepository(req.db);
    const data = await repo.findAllTaxRates();
    res.json({ data, message: 'Tasas de impuesto obtenidas correctamente.' });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/catalog/tax-rates/{id}:
 *   get:
 *     tags: [Catalog]
 *     summary: Obtiene una tasa de impuesto por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tasa encontrada
 *       404:
 *         description: Tasa no encontrada
 */
router.get('/tax-rates/:id', authMiddleware, async (req, res, next) => {
  try {
    const repo = new CatalogRepository(req.db);
    const data = await repo.findTaxRateById(req.params.id);
    if (!data) throw new AppError('Tasa de impuesto no encontrada.', 404);
    res.json({ data, message: 'Tasa de impuesto obtenida correctamente.' });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/catalog/tax-rates:
 *   post:
 *     tags: [Catalog]
 *     summary: Crea una tasa de impuesto (solo ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, percentage]
 *             properties:
 *               name:       { type: string }
 *               percentage: { type: number }
 *     responses:
 *       201:
 *         description: Tasa de impuesto creada
 */
router.post('/tax-rates',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const { name, percentage } = req.body;
      if (!name || percentage === undefined) {
        throw new AppError('name y percentage son requeridos.', 400);
      }
      const repo = new CatalogRepository(req.db);
      const data = await repo.createTaxRate({ name, percentage });
      res.status(201).json({ data, message: 'Tasa de impuesto creada correctamente.' });
    } catch (err) { next(err); }
  }
);

/**
 * @swagger
 * /api/catalog/tax-rates/{id}:
 *   put:
 *     tags: [Catalog]
 *     summary: Actualiza una tasa de impuesto (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tasa actualizada
 *       404:
 *         description: Tasa no encontrada
 */
router.put('/tax-rates/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo = new CatalogRepository(req.db);
      const existing = await repo.findTaxRateById(req.params.id);
      if (!existing) throw new AppError('Tasa de impuesto no encontrada.', 404);
      const { name, percentage, isActive } = req.body;
      const data = await repo.updateTaxRate(req.params.id, { name, percentage, isActive });
      res.json({ data, message: 'Tasa de impuesto actualizada correctamente.' });
    } catch (err) { next(err); }
  }
);

/**
 * @swagger
 * /api/catalog/tax-rates/{id}:
 *   delete:
 *     tags: [Catalog]
 *     summary: Desactiva una tasa de impuesto (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tasa desactivada
 *       404:
 *         description: Tasa no encontrada
 */
router.delete('/tax-rates/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo = new CatalogRepository(req.db);
      const existing = await repo.findTaxRateById(req.params.id);
      if (!existing) throw new AppError('Tasa de impuesto no encontrada.', 404);
      const data = await repo.deleteTaxRate(req.params.id);
      res.json({ data, message: 'Tasa de impuesto desactivada correctamente.' });
    } catch (err) { next(err); }
  }
);

// ================================================================
// ORDER NUMBER CONFIG
// ================================================================

/**
 * @swagger
 * /api/catalog/order-number-config:
 *   get:
 *     tags: [Catalog]
 *     summary: Obtiene la configuración de numeración de órdenes (solo ADMIN)
 *     responses:
 *       200:
 *         description: Configuración de numeración
 */
router.get('/order-number-config',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const repo = new CatalogRepository(req.db);
      const data = await repo.getOrderNumberConfig();
      res.json({ data, message: 'Configuración obtenida correctamente.' });
    } catch (err) { next(err); }
  }
);

/**
 * @swagger
 * /api/catalog/order-number-config:
 *   put:
 *     tags: [Catalog]
 *     summary: Actualiza prefix y padding de numeración (solo ADMIN)
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prefix:  { type: string }
 *               padding: { type: integer }
 *     responses:
 *       200:
 *         description: Configuración actualizada
 */
router.put('/order-number-config',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const { prefix, padding } = req.body;
      const repo = new CatalogRepository(req.db);
      const data = await repo.updateOrderNumberConfig({ prefix, padding });
      res.json({ data, message: 'Configuración actualizada correctamente.' });
    } catch (err) { next(err); }
  }
);

// ================================================================
// EMPLOYEE SPECIALTY ASSIGNMENTS
// ================================================================

/**
 * @swagger
 * /api/catalog/employees/{employeeId}/specialties:
 *   get:
 *     tags: [Catalog]
 *     summary: Obtiene las especialidades asignadas a un empleado
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Especialidades del empleado
 */
router.get('/employees/:employeeId/specialties', authMiddleware, async (req, res, next) => {
  try {
    const repo = new CatalogRepository(req.db);
    const data = await repo.getEmployeeSpecialties(req.params.employeeId);
    res.json({ data, message: 'Especialidades del empleado obtenidas correctamente.' });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/catalog/employees/{employeeId}/specialties:
 *   put:
 *     tags: [Catalog]
 *     summary: Reemplaza todas las especialidades de un empleado (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [specialtyIds]
 *             properties:
 *               specialtyIds:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       200:
 *         description: Especialidades actualizadas
 *       400:
 *         description: specialtyIds debe ser un array
 */
router.put('/employees/:employeeId/specialties',
  authMiddleware,
  roleMiddleware(USER_ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const { specialtyIds } = req.body;
      if (!Array.isArray(specialtyIds)) {
        throw new AppError('specialtyIds debe ser un array.', 400);
      }
      const repo = new CatalogRepository(req.db);
      const data = await repo.setEmployeeSpecialties(req.params.employeeId, specialtyIds);
      res.json({ data, message: 'Especialidades del empleado actualizadas correctamente.' });
    } catch (err) { next(err); }
  }
);

// ================================================================
// SERVICE TYPE TEMPLATES
// ================================================================

router.get('/service-types/:id/template', authMiddleware, async (req, res, next) => {
  try {
    const repo = new CatalogRepository(req.db);
    const data = await repo.getServiceTemplate(req.params.id);
    if (!data) throw new AppError('Tipo de servicio no encontrado.', 404);
    res.json({ data, message: 'Plantilla obtenida correctamente.' });
  } catch (err) { next(err); }
});

router.post('/service-types/:id/labor-templates', authMiddleware, async (req, res, next) => {
  try {
    const { description, defaultHours, sortOrder } = req.body;
    if (!description) throw new AppError('description es requerido.', 400);
    const repo = new CatalogRepository(req.db);
    const data = await repo.createServiceLaborTemplate({
      serviceTypeId: req.params.id,
      description,
      defaultHours,
      sortOrder,
    });
    res.status(201).json({ data, message: 'Plantilla de mano de obra creada correctamente.' });
  } catch (err) { next(err); }
});

router.put('/service-types/:id/labor-templates/:tid', authMiddleware, async (req, res, next) => {
  try {
    const { description, defaultHours, sortOrder } = req.body;
    const repo = new CatalogRepository(req.db);
    const data = await repo.updateServiceLaborTemplate(req.params.tid, { description, defaultHours, sortOrder });
    if (!data) throw new AppError('Plantilla de mano de obra no encontrada.', 404);
    res.json({ data, message: 'Plantilla de mano de obra actualizada correctamente.' });
  } catch (err) { next(err); }
});

router.delete('/service-types/:id/labor-templates/:tid', authMiddleware, async (req, res, next) => {
  try {
    const repo = new CatalogRepository(req.db);
    const data = await repo.deleteServiceLaborTemplate(req.params.tid);
    if (!data) throw new AppError('Plantilla de mano de obra no encontrada.', 404);
    res.json({ data, message: 'Plantilla de mano de obra eliminada correctamente.' });
  } catch (err) { next(err); }
});

router.post('/service-types/:id/part-templates', authMiddleware, async (req, res, next) => {
  try {
    const { sparePartId, description, defaultQuantity, sortOrder } = req.body;
    if (!description) throw new AppError('description es requerido.', 400);
    const repo = new CatalogRepository(req.db);
    const data = await repo.createServicePartTemplate({
      serviceTypeId: req.params.id,
      sparePartId,
      description,
      defaultQuantity,
      sortOrder,
    });
    res.status(201).json({ data, message: 'Plantilla de repuesto creada correctamente.' });
  } catch (err) { next(err); }
});

router.put('/service-types/:id/part-templates/:tid', authMiddleware, async (req, res, next) => {
  try {
    const { sparePartId, description, defaultQuantity, sortOrder } = req.body;
    const repo = new CatalogRepository(req.db);
    const data = await repo.updateServicePartTemplate(req.params.tid, { sparePartId, description, defaultQuantity, sortOrder });
    if (!data) throw new AppError('Plantilla de repuesto no encontrada.', 404);
    res.json({ data, message: 'Plantilla de repuesto actualizada correctamente.' });
  } catch (err) { next(err); }
});

router.delete('/service-types/:id/part-templates/:tid', authMiddleware, async (req, res, next) => {
  try {
    const repo = new CatalogRepository(req.db);
    const data = await repo.deleteServicePartTemplate(req.params.tid);
    if (!data) throw new AppError('Plantilla de repuesto no encontrada.', 404);
    res.json({ data, message: 'Plantilla de repuesto eliminada correctamente.' });
  } catch (err) { next(err); }
});

module.exports = router;
