/**
 * 餐饮供应链系统 - API 服务器 V2.3 分仓版
 */
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const compression = require('compression');
const { DB } = require('./db.js');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'hjcc-scmp-secret-2026';

app.use(cors());
app.use(compression());
app.use(express.json());

DB.init();
app.use(express.static(path.join(__dirname, 'public')));

// ===== 认证中间件 =====
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '未登录' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '无权限' });
    }
    next();
  };
}

// 获取仓库用户的 warehouseId
function getWarehouseId(req) {
  return req.user.role === 'warehouse' ? (req.user.warehouseId || 'WH001') : null;
}

// ===== 认证 =====
app.get('/api/auth/has-admin', (req, res) => {
  res.json({ hasAdmin: DB.hasAdmin() });
});

app.post('/api/auth/apply', (req, res) => {
  const { enterpriseName, name, phone, password } = req.body;
  if (!enterpriseName || !name || !phone || !password) {
    return res.status(400).json({ error: '请填写企业名称、姓名、手机号和密码' });
  }
  if (!/^1\d{10}$/.test(phone)) return res.status(400).json({ error: '手机号格式不正确' });
  if (password.length < 6) return res.status(400).json({ error: '密码至少6位' });
  if (DB.findAccountByPhone(phone)) return res.status(400).json({ error: '该手机号已注册' });
  const existingApp = DB.data.applications.find(a => a.phone === phone && a.status === 'pending');
  if (existingApp) return res.status(400).json({ error: '该手机号已有待审核的申请' });
  const app = DB.createApplication({ enterpriseName, name, phone, password });
  res.json({ success: true, applicationId: app.id, message: '申请已提交，等待开发者审核' });
});

app.get('/api/auth/applications', auth, requireRole('developer'), (req, res) => {
  res.json(DB.listApplications());
});

app.post('/api/auth/applications/:id/approve', auth, requireRole('developer'), (req, res) => {
  const application = DB.findApplicationById(req.params.id);
  if (!application) return res.status(404).json({ error: '申请不存在' });
  if (application.status !== 'pending') return res.status(400).json({ error: '该申请已处理' });
  if (DB.findAccountByPhone(application.phone)) return res.status(400).json({ error: '该手机号已注册' });
  const account = DB.createAccount({
    phone: application.phone, password: application.password,
    role: 'admin', name: application.name, storeId: null, warehouseId: null,
    enterpriseName: application.enterpriseName,
  });
  DB.updateSettings({ enterpriseName: application.enterpriseName });
  DB.updateApplicationStatus(req.params.id, 'approved');
  res.json({ success: true, account: { ...account, password: undefined } });
});

app.post('/api/auth/applications/:id/reject', auth, requireRole('developer'), (req, res) => {
  const application = DB.findApplicationById(req.params.id);
  if (!application) return res.status(404).json({ error: '申请不存在' });
  if (application.status !== 'pending') return res.status(400).json({ error: '该申请已处理' });
  const { reason } = req.body;
  DB.updateApplicationStatus(req.params.id, 'rejected', reason || '');
  res.json({ success: true });
});

app.post('/api/auth/login', (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ error: '请输入手机号和密码' });
  const account = DB.findAccountByPhone(phone);
  if (!account) return res.status(401).json({ error: '账号不存在' });
  if (!DB.verifyPassword(account, password)) return res.status(401).json({ error: '密码错误' });

  let enterpriseName = account.enterpriseName || '';
  if (!enterpriseName && (account.role === 'admin' || account.role === 'developer')) {
    enterpriseName = DB.getSettings().enterpriseName || '';
  }

  const token = jwt.sign(
    { id: account.id, phone: account.phone, role: account.role, name: account.name,
      storeId: account.storeId, warehouseId: account.warehouseId, enterpriseName },
    JWT_SECRET, { expiresIn: '7d' }
  );

  res.json({
    token,
    account: { id: account.id, phone: account.phone, role: account.role, name: account.name,
      storeId: account.storeId, warehouseId: account.warehouseId, enterpriseName },
  });
});

app.get('/api/auth/verify', auth, (req, res) => {
  const account = DB.findAccountById(req.user.id);
  if (!account) return res.status(401).json({ error: '账号不存在' });
  let enterpriseName = account.enterpriseName || '';
  if (!enterpriseName && (account.role === 'admin' || account.role === 'developer')) {
    enterpriseName = DB.getSettings().enterpriseName || '';
  }
  res.json({
    account: { id: account.id, phone: account.phone, role: account.role, name: account.name,
      storeId: account.storeId, warehouseId: account.warehouseId, enterpriseName },
  });
});

// ===== 仓库管理（V2.3 分仓） =====
app.get('/api/warehouses', auth, (req, res) => {
  res.json(DB.listWarehouses());
});

app.post('/api/warehouses', auth, requireRole('admin', 'developer'), (req, res) => {
  const { name, type, description, id } = req.body;
  if (!name) return res.status(400).json({ error: '仓库名称不能为空' });
  const wh = DB.addWarehouse({ id, name, type: type || 'general', description: description || '' });
  res.json(wh);
});

app.put('/api/warehouses/:id', auth, requireRole('admin', 'developer'), (req, res) => {
  const wh = DB.updateWarehouse(req.params.id, req.body);
  if (!wh) return res.status(404).json({ error: '仓库不存在' });
  res.json(wh);
});

app.delete('/api/warehouses/:id', auth, requireRole('admin', 'developer'), (req, res) => {
  const ok = DB.deleteWarehouse(req.params.id);
  if (!ok) return res.status(400).json({ error: '该仓库下有食材或仓库账号，无法删除' });
  res.json({ success: true });
});

// ===== 账号管理 =====
app.get('/api/accounts', auth, requireRole('admin', 'developer'), (req, res) => {
  res.json(DB.listAccounts());
});

app.post('/api/accounts', auth, requireRole('admin', 'developer'), (req, res) => {
  const { phone, password, role, name, storeId, warehouseId } = req.body;
  if (!phone || !password || !role || !name) return res.status(400).json({ error: '缺少必填字段' });
  if (!['admin', 'warehouse', 'store'].includes(role)) return res.status(400).json({ error: '角色无效' });
  if (DB.findAccountByPhone(phone)) return res.status(400).json({ error: '该手机号已注册' });
  if (role === 'store' && !storeId) return res.status(400).json({ error: '门店账号需指定门店' });
  if (role === 'warehouse' && !warehouseId) return res.status(400).json({ error: '仓库账号需指定仓库' });
  const enterpriseName = req.user.enterpriseName || DB.getSettings().enterpriseName || '';
  const account = DB.createAccount({
    phone, password, role, name,
    storeId: storeId || null, warehouseId: warehouseId || null, enterpriseName,
  });
  res.json(account);
});

app.put('/api/accounts/:id', auth, requireRole('admin', 'developer'), (req, res) => {
  const { password, name, storeId, warehouseId } = req.body;
  const updates = {};
  if (password) updates.password = password;
  if (name) updates.name = name;
  if (storeId !== undefined) updates.storeId = storeId;
  if (warehouseId !== undefined) updates.warehouseId = warehouseId;
  const account = DB.updateAccount(req.params.id, updates);
  if (!account) return res.status(404).json({ error: '账号不存在' });
  res.json(account);
});

app.delete('/api/accounts/:id', auth, requireRole('admin', 'developer'), (req, res) => {
  const acc = DB.findAccountById(req.params.id);
  if (!acc) return res.status(404).json({ error: '账号不存在' });
  if (acc.id === req.user.id) return res.status(400).json({ error: '不能删除当前登录账号' });
  if (acc.role === 'developer') return res.status(400).json({ error: '不能删除开发者账号' });
  if (acc.role === 'admin') {
    const adminCount = DB.data.accounts.filter(a => a.role === 'admin').length;
    if (adminCount <= 1) return res.status(400).json({ error: '不能删除最后一个超级管理员账号' });
  }
  DB.deleteAccount(req.params.id);
  res.json({ success: true });
});

// ===== 门店管理 =====
app.get('/api/stores', auth, (req, res) => { res.json(DB.listStores()); });

app.post('/api/stores', auth, requireRole('admin', 'developer'), (req, res) => {
  const { name, type, address, phone, id } = req.body;
  if (!name) return res.status(400).json({ error: '门店名称不能为空' });
  const store = DB.addStore({ id, name, type: type || '', address: address || '', phone: phone || '' });
  res.json(store);
});

app.put('/api/stores/:id', auth, requireRole('admin', 'developer'), (req, res) => {
  const store = DB.updateStore(req.params.id, req.body);
  if (!store) return res.status(404).json({ error: '门店不存在' });
  res.json(store);
});

app.delete('/api/stores/:id', auth, requireRole('admin', 'developer'), (req, res) => {
  DB.deleteStore(req.params.id);
  res.json({ success: true });
});

// ===== 食材品项 =====
app.get('/api/ingredients', auth, (req, res) => { res.json(DB.listIngredients()); });

app.post('/api/ingredients', auth, requireRole('admin', 'developer', 'warehouse'), (req, res) => {
  const { name, category, unit, spec, supplier, referencePrice, outboundPrice, warningThreshold, warehouseId } = req.body;
  if (!name || !unit) return res.status(400).json({ error: '品名和单位不能为空' });
  const item = DB.addIngredient({
    name, category: category || '食材', unit, spec: spec || '', supplier: supplier || '',
    referencePrice: referencePrice || 0, outboundPrice: outboundPrice || 0,
    warningThreshold: warningThreshold || 0, warehouseId: warehouseId || 'WH001',
  });
  res.json(item);
});

app.put('/api/ingredients/:id', auth, requireRole('admin', 'developer', 'warehouse'), (req, res) => {
  const ing = DB.updateIngredient(req.params.id, req.body);
  if (!ing) return res.status(404).json({ error: '品项不存在' });
  res.json(ing);
});

app.delete('/api/ingredients/:id', auth, requireRole('admin', 'developer', 'warehouse'), (req, res) => {
  DB.deleteIngredient(req.params.id);
  res.json({ success: true });
});

// ===== 仓库库存（按 warehouseId 过滤） =====
app.get('/api/warehouse/inventory', auth, requireRole('admin', 'developer', 'warehouse'), (req, res) => {
  res.json(DB.getWarehouseInventory(getWarehouseId(req)));
});

app.get('/api/warehouse/stats', auth, requireRole('admin', 'developer', 'warehouse'), (req, res) => {
  res.json(DB.getWarehouseStats(getWarehouseId(req)));
});

// ===== 入库 =====
app.get('/api/warehouse/inbound', auth, requireRole('admin', 'developer', 'warehouse'), (req, res) => {
  res.json(DB.getInboundOrders(getWarehouseId(req)));
});

app.post('/api/warehouse/inbound', auth, requireRole('admin', 'developer', 'warehouse'), (req, res) => {
  const { supplier, operator, items, remark, warehouseId } = req.body;
  if (!supplier || !items?.length) return res.status(400).json({ error: '供应商和明细不能为空' });
  let total = 0;
  items.forEach(i => { i.amount = Math.round((i.quantity * i.price) * 100) / 100; total += i.amount; });
  const order = DB.createInboundOrder({
    supplier, operator: operator || '仓库管理员', items,
    totalAmount: Math.round(total * 100) / 100, remark: remark || '',
    warehouseId: warehouseId || getWarehouseId(req) || 'WH001',
  });
  res.json(order);
});

// ===== 出库 =====
app.get('/api/warehouse/outbound', auth, requireRole('admin', 'developer', 'warehouse'), (req, res) => {
  res.json(DB.getOutboundOrders(getWarehouseId(req)));
});

app.post('/api/warehouse/outbound', auth, requireRole('admin', 'developer', 'warehouse'), (req, res) => {
  const { storeId, storeName, operator, items, remark } = req.body;
  if (!storeId || !items?.length) return res.status(400).json({ error: '门店和明细不能为空' });
  let total = 0;
  items.forEach(i => { i.amount = Math.round((i.quantity * (i.unitPrice || 0)) * 100) / 100; total += i.amount; });
  const order = DB.createOutboundOrder({
    storeId, storeName, operator: operator || '仓库管理员', items,
    totalAmount: Math.round(total * 100) / 100, remark: remark || '',
  });
  res.json(order);
});

// ===== 仓库盘存 =====
app.get('/api/warehouse/checks', auth, requireRole('admin', 'developer', 'warehouse'), (req, res) => {
  res.json(DB.getWarehouseChecks(getWarehouseId(req)));
});

app.post('/api/warehouse/checks', auth, requireRole('admin', 'developer', 'warehouse'), (req, res) => {
  const { operator, items, remark } = req.body;
  if (!items?.length) return res.status(400).json({ error: '盘存明细不能为空' });
  const check = DB.createWarehouseCheck({
    operator: operator || '仓库管理员', items, remark: remark || '',
    warehouseId: getWarehouseId(req) || 'WH001',
  });
  res.json(check);
});

// ===== 门店订单（V2.3 自动分仓拆单） =====
app.get('/api/store/orders', auth, (req, res) => {
  const storeId = req.user.role === 'store' ? req.user.storeId : null;
  const warehouseId = getWarehouseId(req);
  res.json(DB.getStoreOrders(storeId, warehouseId));
});

app.get('/api/store/orders/:id', auth, (req, res) => {
  const order = DB.getStoreOrder(req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  if (req.user.role === 'store' && order.storeId !== req.user.storeId) return res.status(403).json({ error: '无权限' });
  res.json(order);
});

app.post('/api/store/orders', auth, requireRole('store', 'admin', 'developer'), (req, res) => {
  const { storeId, storeName, expectedDate, items, remark } = req.body;
  const finalStoreId = req.user.role === 'store' ? req.user.storeId : storeId;
  const store = DB.getStore(finalStoreId);
  if (!store) return res.status(400).json({ error: '门店不存在' });
  if (!items?.length) return res.status(400).json({ error: '订单明细不能为空' });

  // 填充出库价格
  items.forEach(i => {
    const ing = DB.getIngredient(i.ingredientId);
    i.unitPrice = ing ? (ing.outboundPrice || ing.referencePrice || 0) : 0;
    i.amount = Math.round((i.quantity * i.unitPrice) * 100) / 100;
    i.name = ing ? ing.name : i.name;
    i.unit = ing ? ing.unit : i.unit;
  });

  // V2.3 自动按仓库拆分订单
  const orders = DB.createStoreOrdersByWarehouse({
    storeId: finalStoreId, storeName: store.name, expectedDate, items, remark: remark || '',
  });

  res.json({ success: true, orders, count: orders.length,
    message: orders.length > 1 ? '订单已按仓库自动拆分为 ' + orders.length + ' 个子订单' : '下单成功' });
});

app.put('/api/store/orders/:id/status', auth, requireRole('warehouse', 'admin', 'developer'), (req, res) => {
  const order = DB.updateStoreOrderStatus(req.params.id, req.body.status);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  res.json(order);
});

// 基于订单出库（仓库端操作）
app.post('/api/store/orders/:id/fulfill', auth, requireRole('warehouse', 'admin', 'developer'), (req, res) => {
  const order = DB.getStoreOrder(req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  if (order.status !== 'pending') return res.status(400).json({ error: '订单状态不允许出库' });

  const { driver, vehicle, driverPhone } = req.body;
  if (!driverPhone || !/^1\d{10}$/.test(driverPhone)) return res.status(400).json({ error: '请填写正确的司机手机号' });
  if (!driver) return res.status(400).json({ error: '请填写司机姓名' });

  // 检查库存
  for (const item of order.items) {
    const inv = DB.data.warehouseInventory.find(w => w.ingredientId === item.ingredientId);
    const stock = inv ? inv.quantity : 0;
    if (stock < item.quantity) {
      return res.status(400).json({ error: `${item.name}库存不足（当前${stock}${item.unit}）` });
    }
  }

  // 创建出库单
  DB.createOutboundOrder({
    storeId: order.storeId, storeName: order.storeName,
    operator: req.user.name, orderId: order.id,
    warehouseId: order.warehouseId,
    items: order.items.map(i => ({
      ingredientId: i.ingredientId, name: i.name, quantity: i.quantity,
      unit: i.unit, unitPrice: i.unitPrice, amount: i.amount,
    })),
    remark: `基于订单 ${order.id}`,
  });

  DB.updateStoreOrderStatus(order.id, 'dispatched');

  const delivery = DB.createDelivery({
    storeId: order.storeId, storeName: order.storeName, orderId: order.id,
    warehouseId: order.warehouseId, warehouseName: order.warehouseName,
    driver: driver || '', vehicle: vehicle || '', phone: driverPhone || '',
    status: 'in-transit',
    items: order.items.map(i => ({
      ingredientId: i.ingredientId, name: i.name, quantity: i.quantity, unit: i.unit,
    })),
    currentLocation: null, remark: '',
  });

  res.json({ order: DB.getStoreOrder(order.id), delivery });
});

// ===== 配送（按 warehouseId 过滤） =====
app.get('/api/deliveries', auth, (req, res) => {
  const storeId = req.user.role === 'store' ? req.user.storeId : null;
  const warehouseId = getWarehouseId(req);
  res.json(DB.getDeliveries(storeId, warehouseId));
});

app.get('/api/deliveries/:id', auth, (req, res) => {
  const del = DB.getDelivery(req.params.id);
  if (!del) return res.status(404).json({ error: '配送单不存在' });
  if (req.user.role === 'store' && del.storeId !== req.user.storeId) return res.status(403).json({ error: '无权限' });
  res.json(del);
});

app.put('/api/deliveries/:id/status', auth, requireRole('warehouse', 'admin', 'developer'), (req, res) => {
  const del = DB.updateDeliveryStatus(req.params.id, req.body.status);
  if (!del) return res.status(404).json({ error: '配送单不存在' });
  res.json(del);
});

app.post('/api/deliveries/:id/location', auth, requireRole('warehouse', 'admin', 'developer'), (req, res) => {
  const { lat, lng, speed } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: '缺少坐标' });
  const track = DB.updateDeliveryLocation(req.params.id, { lat, lng, speed });
  res.json(track);
});

app.post('/api/deliveries/:id/auto-location', auth, requireRole('warehouse', 'admin', 'developer'), (req, res) => {
  const { lat, lng, speed } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: '缺少坐标' });
  const track = DB.updateDeliveryLocation(req.params.id, { lat, lng, speed });
  track.autoReport = true;
  DB.save();
  res.json({ success: true, track, message: '位置已自动上报' });
});

app.get('/api/store/orders/:id/status', auth, (req, res) => {
  const order = DB.getStoreOrder(req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  if (req.user.role === 'store' && order.storeId !== req.user.storeId) return res.status(403).json({ error: '无权限' });

  const delivery = DB.data.deliveries.find(d => d.orderId === order.id);
  let deliveryInfo = null;
  if (delivery) {
    let tracks = [];
    try { tracks = DB.getDeliveryTracks(delivery.id); } catch (e) {}
    deliveryInfo = {
      id: delivery.id, status: delivery.status, driver: delivery.driver,
      vehicle: delivery.vehicle, phone: delivery.phone || '',
      currentLocation: delivery.currentLocation,
      warehouseName: delivery.warehouseName || '',
      createdAt: delivery.createdAt, updatedAt: delivery.updatedAt,
      tracks: tracks.slice(-10),
    };
  }

  res.json({
    orderId: order.id, orderStatus: order.status, storeName: order.storeName,
    warehouseName: order.warehouseName || '', items: order.items,
    createdAt: order.createdAt, expectedDate: order.expectedDate, delivery: deliveryInfo,
  });
});

app.get('/api/deliveries/:id/tracks', auth, (req, res) => {
  const del = DB.getDelivery(req.params.id);
  if (!del) return res.status(404).json({ error: '配送单不存在' });
  if (req.user.role === 'store' && del.storeId !== req.user.storeId) return res.status(403).json({ error: '无权限' });
  res.json(DB.getDeliveryTracks(req.params.id));
});

// ===== 门店库存 =====
app.get('/api/store/inventory', auth, requireRole('store', 'admin', 'developer'), (req, res) => {
  const storeId = req.user.role === 'store' ? req.user.storeId : req.query.storeId;
  if (!storeId) return res.json([]);
  res.json(DB.getStoreInventory(storeId));
});

app.get('/api/store/stats', auth, requireRole('store', 'admin', 'developer'), (req, res) => {
  const storeId = req.user.role === 'store' ? req.user.storeId : req.query.storeId;
  if (!storeId) return res.json({});
  res.json(DB.getStoreStats(storeId));
});

// ===== 验货 =====
app.get('/api/store/receiving', auth, (req, res) => {
  const storeId = req.user.role === 'store' ? req.user.storeId : null;
  res.json(DB.getReceivingOrders(storeId));
});

app.post('/api/store/receiving', auth, requireRole('store', 'admin', 'developer'), (req, res) => {
  const { deliveryId, items, remark, photos } = req.body;
  const del = DB.getDelivery(deliveryId);
  if (!del) return res.status(404).json({ error: '配送单不存在' });
  const storeId = req.user.role === 'store' ? req.user.storeId : del.storeId;
  const store = DB.getStore(storeId);

  const hasException = items.some(item =>
    Math.abs((item.acceptedQty || 0) - (item.orderedQty || 0)) > 0.001
  );
  if (hasException && (!photos || !photos.length)) {
    return res.status(400).json({ error: '验货数量有修改，请拍照上传凭证' });
  }

  const receiving = DB.createReceivingOrder({
    storeId, storeName: store ? store.name : '', deliveryId,
    receiver: req.user.name, items, remark: remark || '', photos: photos || [],
  });

  DB.updateDeliveryStatus(deliveryId, 'delivered');
  res.json({ ...receiving, message: hasException ? '验货已提交，存在数量异常，等待仓库端审核' : '验收入库成功' });
});

app.get('/api/store/receiving/pending-review', auth, requireRole('warehouse', 'admin', 'developer'), (req, res) => {
  res.json(DB.getPendingReviewReceivingOrders(getWarehouseId(req)));
});

app.post('/api/store/receiving/:id/approve', auth, requireRole('warehouse', 'admin', 'developer'), (req, res) => {
  const receiving = DB.approveReceivingException(req.params.id, req.user.name);
  if (!receiving) return res.status(400).json({ error: '验货单不存在或状态不允许审核' });
  res.json({ success: true, receiving, message: '已同意异常修改，出库单和门店库存已同步' });
});

app.post('/api/store/receiving/:id/reject', auth, requireRole('warehouse', 'admin', 'developer'), (req, res) => {
  const receiving = DB.rejectReceivingException(req.params.id, req.user.name);
  if (!receiving) return res.status(400).json({ error: '验货单不存在或状态不允许审核' });
  res.json({ success: true, receiving, message: '已拒绝异常修改，门店按原订单数量入库' });
});

// ===== 门店盘存 =====
app.get('/api/store/checks', auth, (req, res) => {
  const storeId = req.user.role === 'store' ? req.user.storeId : req.query.storeId;
  res.json(DB.getStoreChecks(storeId));
});

app.post('/api/store/checks', auth, requireRole('store', 'admin', 'developer'), (req, res) => {
  const storeId = req.user.role === 'store' ? req.user.storeId : req.body.storeId;
  const { items, remark } = req.body;
  if (!items?.length) return res.status(400).json({ error: '盘存明细不能为空' });
  const check = DB.createStoreCheck({ storeId, operator: req.user.name, items, remark: remark || '' });
  res.json(check);
});

// ===== 耗用核算 =====
app.get('/api/store/consumption', auth, (req, res) => {
  const storeId = req.user.role === 'store' ? req.user.storeId : req.query.storeId;
  res.json(DB.getConsumptionRecords(storeId));
});

app.post('/api/store/consumption', auth, requireRole('store', 'admin', 'developer'), (req, res) => {
  const storeId = req.user.role === 'store' ? req.user.storeId : req.body.storeId;
  const { items, period, remark } = req.body;
  if (!items?.length) return res.status(400).json({ error: '核算明细不能为空' });
  const record = DB.createConsumptionRecord({ storeId, period, items, remark: remark || '' });
  res.json(record);
});

// ===== 全局设置 =====
app.get('/api/settings', auth, (req, res) => { res.json(DB.getSettings()); });

app.put('/api/settings', auth, requireRole('admin', 'developer'), (req, res) => {
  const { enterpriseName, warehouseName } = req.body;
  const updates = {};
  if (enterpriseName !== undefined) updates.enterpriseName = enterpriseName;
  if (warehouseName !== undefined) updates.warehouseName = warehouseName;
  DB.updateSettings(updates);
  if (enterpriseName !== undefined) {
    DB.data.accounts.forEach(a => { a.enterpriseName = enterpriseName; });
    DB.save();
  }
  res.json(DB.getSettings());
});

// ===== 后台统计 =====
app.get('/api/admin/stats', auth, requireRole('admin', 'developer'), (req, res) => {
  res.json(DB.getAdminStats());
});

app.get('/api/admin/export', auth, requireRole('admin', 'developer'), (req, res) => {
  res.json(DB.data);
});

app.post('/api/admin/reset', auth, requireRole('admin', 'developer'), (req, res) => {
  DB.reset();
  res.json({ success: true });
});

// ===== 数据导出 =====
app.get('/api/export/warehouse-checks', auth, requireRole('admin', 'developer', 'warehouse'), (req, res) => {
  res.json(DB.getWarehouseChecks(getWarehouseId(req)));
});

app.get('/api/export/warehouse-inbound', auth, requireRole('admin', 'developer', 'warehouse'), (req, res) => {
  res.json(DB.getInboundOrders(getWarehouseId(req)));
});

app.get('/api/export/warehouse-outbound', auth, requireRole('admin', 'developer', 'warehouse'), (req, res) => {
  res.json(DB.getOutboundOrders(getWarehouseId(req)));
});

app.get('/api/export/store-checks', auth, requireRole('admin', 'developer', 'store'), (req, res) => {
  const sid = req.user.role === 'store' ? req.user.storeId : req.query.storeId;
  res.json(DB.getStoreChecks(sid));
});

app.get('/api/export/store-inbound', auth, requireRole('admin', 'developer', 'store'), (req, res) => {
  const sid = req.user.role === 'store' ? req.user.storeId : req.query.storeId;
  res.json(DB.getReceivingOrders(sid));
});

// ===== 启动服务器 =====
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n========================================`);
  console.log(`  灰鲸餐创·供应链系统 V2.3 分仓版 已启动`);
  console.log(`  地址: http://localhost:${PORT}`);
  console.log(`  仓库数: ${DB.listWarehouses().length}`);
  console.log(`========================================\n`);
});
