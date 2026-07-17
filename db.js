/**
 * 餐饮供应链系统 - 后端数据库层（JSON 文件存储）V2.3 分仓版
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, 'data', 'db.json');

const DB = {
  data: null,

  init() {
    if (fs.existsSync(DB_FILE)) {
      this.data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      this.migrate();
      return;
    }
    this.data = this.seed();
    this.save();
  },

  migrate() {
    const arrays = ['accounts', 'stores', 'ingredients', 'warehouseInventory', 'storeInventory',
      'inboundOrders', 'outboundOrders', 'storeOrders', 'deliveries', 'receivingOrders',
      'warehouseChecks', 'storeChecks', 'consumptionRecords', 'deliveryTracks', 'applications',
      'warehouses'];
    arrays.forEach(a => {
      if (!this.data[a]) this.data[a] = [];
    });
    if (!this.data.settings) this.data.settings = { warehouseName: '灰鲸餐创·中央仓库', enterpriseName: '' };
    if (!this.data.settings.enterpriseName) this.data.settings.enterpriseName = '';

    // V2.3 分仓迁移：如果没有仓库数据，创建默认仓库
    if (this.data.warehouses.length === 0) {
      this.data.warehouses = [
        { id: 'WH001', name: '默认仓库', type: 'general', description: '系统默认仓库', createdAt: this.formatDate() },
      ];
    }

    // 给所有食材分配 warehouseId
    this.data.ingredients.forEach(ing => {
      if (!ing.warehouseId) ing.warehouseId = 'WH001';
    });

    // 给仓库库存分配 warehouseId
    this.data.warehouseInventory.forEach(inv => {
      if (!inv.warehouseId) {
        const ing = this.getIngredient(inv.ingredientId);
        inv.warehouseId = (ing && ing.warehouseId) || 'WH001';
      }
    });

    // 给仓库账号分配 warehouseId
    this.data.accounts.forEach(a => {
      if (a.role === 'warehouse' && !a.warehouseId) a.warehouseId = 'WH001';
      if (a.enterpriseName === undefined) a.enterpriseName = '';
    });

    // 给订单、入库、出库、盘存、配送、验货分配 warehouseId
    this.data.storeOrders.forEach(o => { if (!o.warehouseId) o.warehouseId = 'WH001'; if (!o.warehouseName) { const wh = this.getWarehouse(o.warehouseId); o.warehouseName = wh ? wh.name : '默认仓库'; } });
    this.data.inboundOrders.forEach(o => { if (!o.warehouseId) o.warehouseId = 'WH001'; });
    this.data.outboundOrders.forEach(o => { if (!o.warehouseId) o.warehouseId = 'WH001'; });
    this.data.warehouseChecks.forEach(c => { if (!c.warehouseId) c.warehouseId = 'WH001'; });
    this.data.deliveries.forEach(d => { if (!d.warehouseId) d.warehouseId = 'WH001'; if (!d.warehouseName) { const wh = this.getWarehouse(d.warehouseId); d.warehouseName = wh ? wh.name : '默认仓库'; } });
    this.data.receivingOrders.forEach(r => { if (!r.warehouseId) r.warehouseId = 'WH001'; });

    // 迁移：将已有的 13826406713 admin 账号转为 developer 角色
    const existingDev = this.data.accounts.find(a => a.phone === '13826406713' && a.role === 'admin');
    if (existingDev && !this.data.accounts.some(a => a.role === 'developer')) {
      existingDev.role = 'developer';
    }
  },

  save() {
    fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
  },

  reset() {
    this.data = this.seed();
    this.save();
  },

  genId(prefix) {
    return prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
  },

  formatDate(d) {
    const dt = d ? new Date(d) : new Date();
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    const h = String(dt.getHours()).padStart(2, '0');
    const min = String(dt.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${h}:${min}`;
  },

  today() {
    return this.formatDate().substring(0, 10);
  },

  // ===== 超级管理员注册 =====
  hasAdmin() {
    return this.data.accounts.some(a => a.role === 'admin');
  },

  // ===== 仓库管理（V2.3 分仓） =====
  listWarehouses() {
    return this.data.warehouses;
  },

  getWarehouse(id) {
    return this.data.warehouses.find(w => w.id === id);
  },

  addWarehouse(wh) {
    wh.id = wh.id || this.genId('WH');
    wh.createdAt = this.formatDate();
    this.data.warehouses.push(wh);
    this.save();
    return wh;
  },

  updateWarehouse(id, updates) {
    const wh = this.getWarehouse(id);
    if (wh) { Object.assign(wh, updates); this.save(); }
    return wh;
  },

  deleteWarehouse(id) {
    // 不允许删除有食材关联的仓库
    const hasIngredients = this.data.ingredients.some(i => i.warehouseId === id);
    if (hasIngredients) return false;
    // 不允许删除有仓库账号的仓库
    const hasAccounts = this.data.accounts.some(a => a.role === 'warehouse' && a.warehouseId === id);
    if (hasAccounts) return false;
    this.data.warehouses = this.data.warehouses.filter(w => w.id !== id);
    this.save();
    return true;
  },

  // ===== 账号 =====
  findAccountByPhone(phone) {
    return this.data.accounts.find(a => a.phone === phone);
  },

  findAccountById(id) {
    return this.data.accounts.find(a => a.id === id);
  },

  createAccount(account) {
    account.id = this.genId('ACC');
    account.createdAt = this.formatDate();
    account.password = bcrypt.hashSync(account.password, 8);
    this.data.accounts.push(account);
    this.save();
    return { ...account, password: undefined };
  },

  updateAccount(id, updates) {
    const acc = this.findAccountById(id);
    if (!acc) return null;
    if (updates.password) {
      updates.password = bcrypt.hashSync(updates.password, 8);
    }
    Object.assign(acc, updates);
    this.save();
    return { ...acc, password: undefined };
  },

  deleteAccount(id) {
    this.data.accounts = this.data.accounts.filter(a => a.id !== id);
    this.save();
  },

  listAccounts() {
    return this.data.accounts.map(a => ({ ...a, password: undefined }));
  },

  verifyPassword(account, password) {
    return bcrypt.compareSync(password, account.password);
  },

  // ===== 开发者账号 =====
  hasDeveloper() {
    return this.data.accounts.some(a => a.role === 'developer');
  },

  findDeveloper() {
    return this.data.accounts.find(a => a.role === 'developer');
  },

  // ===== 注册申请 =====
  createApplication(app) {
    app.id = this.genId('APP');
    app.createdAt = this.formatDate();
    app.status = 'pending';
    this.data.applications.push(app);
    this.save();
    return app;
  },

  listApplications() {
    return [...this.data.applications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  findApplicationById(id) {
    return this.data.applications.find(a => a.id === id);
  },

  updateApplicationStatus(id, status, reason) {
    const app = this.findApplicationById(id);
    if (app) {
      app.status = status;
      app.processedAt = this.formatDate();
      if (reason) app.rejectReason = reason;
      this.save();
    }
    return app;
  },

  // ===== 全局设置 =====
  getSettings() {
    return this.data.settings;
  },

  updateSettings(updates) {
    Object.assign(this.data.settings, updates);
    this.save();
    return this.data.settings;
  },

  // ===== 门店 =====
  listStores() {
    return this.data.stores;
  },

  getStore(id) {
    return this.data.stores.find(s => s.id === id);
  },

  addStore(store) {
    store.id = store.id || this.genId('ST');
    store.createdAt = this.formatDate();
    this.data.stores.push(store);
    this.save();
    return store;
  },

  updateStore(id, updates) {
    const store = this.getStore(id);
    if (store) { Object.assign(store, updates); this.save(); }
    return store;
  },

  deleteStore(id) {
    this.data.stores = this.data.stores.filter(s => s.id !== id);
    this.data.storeInventory = this.data.storeInventory.filter(i => i.storeId !== id);
    this.save();
  },

  // ===== 食材品项 =====
  listIngredients() {
    return this.data.ingredients;
  },

  getIngredient(id) {
    return this.data.ingredients.find(i => i.id === id);
  },

  addIngredient(item) {
    item.id = this.genId('ING');
    item.createdAt = this.formatDate();
    if (!item.warehouseId) item.warehouseId = 'WH001';
    this.data.ingredients.push(item);
    // 创建仓库库存记录（带 warehouseId）
    this.data.warehouseInventory.push({
      ingredientId: item.id, quantity: 0, unit: item.unit,
      warehouseId: item.warehouseId, updatedAt: this.formatDate()
    });
    this.save();
    return item;
  },

  updateIngredient(id, updates) {
    const ing = this.getIngredient(id);
    if (ing) {
      // 如果 warehouseId 变更，同步更新库存记录
      if (updates.warehouseId && updates.warehouseId !== ing.warehouseId) {
        const inv = this.data.warehouseInventory.find(i => i.ingredientId === id);
        if (inv) inv.warehouseId = updates.warehouseId;
      }
      Object.assign(ing, updates);
      this.save();
    }
    return ing;
  },

  deleteIngredient(id) {
    this.data.ingredients = this.data.ingredients.filter(i => i.id !== id);
    this.data.warehouseInventory = this.data.warehouseInventory.filter(i => i.ingredientId !== id);
    this.data.storeInventory = this.data.storeInventory.filter(i => i.ingredientId !== id);
    this.save();
  },

  // ===== 仓库库存（支持 warehouseId 过滤） =====
  getWarehouseInventory(warehouseId) {
    return this.data.warehouseInventory
      .filter(inv => !warehouseId || inv.warehouseId === warehouseId)
      .map(inv => ({ ...inv, ingredient: this.getIngredient(inv.ingredientId) }));
  },

  adjustWarehouseStock(ingredientId, delta) {
    const ing = this.getIngredient(ingredientId);
    const whId = (ing && ing.warehouseId) || 'WH001';
    let inv = this.data.warehouseInventory.find(i => i.ingredientId === ingredientId);
    if (inv) {
      inv.quantity = Math.round((inv.quantity + delta) * 100) / 100;
      inv.updatedAt = this.formatDate();
    } else {
      this.data.warehouseInventory.push({
        ingredientId, quantity: delta, unit: ing ? ing.unit : 'kg',
        warehouseId: whId, updatedAt: this.formatDate()
      });
    }
  },

  // ===== 门店库存 =====
  getStoreInventory(storeId) {
    return this.data.storeInventory
      .filter(i => i.storeId === storeId)
      .map(inv => ({ ...inv, ingredient: this.getIngredient(inv.ingredientId) }));
  },

  adjustStoreStock(storeId, ingredientId, delta) {
    const inv = this.data.storeInventory.find(i => i.storeId === storeId && i.ingredientId === ingredientId);
    if (inv) {
      inv.quantity = Math.round((inv.quantity + delta) * 100) / 100;
      inv.updatedAt = this.formatDate();
    } else {
      const ing = this.getIngredient(ingredientId);
      this.data.storeInventory.push({
        storeId, ingredientId, quantity: delta, unit: ing ? ing.unit : 'kg', updatedAt: this.formatDate()
      });
    }
  },

  // ===== 入库（支持 warehouseId） =====
  getInboundOrders(warehouseId) {
    return [...this.data.inboundOrders]
      .filter(o => !warehouseId || o.warehouseId === warehouseId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  createInboundOrder(order) {
    order.id = this.genId('IN');
    order.createdAt = this.formatDate();
    order.status = order.status || 'completed';
    if (!order.warehouseId) {
      // 推断 warehouseId：取第一个食材的仓库
      const firstIng = order.items[0] ? this.getIngredient(order.items[0].ingredientId) : null;
      order.warehouseId = (firstIng && firstIng.warehouseId) || 'WH001';
    }
    order.items.forEach(item => this.adjustWarehouseStock(item.ingredientId, item.quantity));
    this.data.inboundOrders.push(order);
    this.save();
    return order;
  },

  // ===== 出库（支持 warehouseId） =====
  getOutboundOrders(warehouseId) {
    return [...this.data.outboundOrders]
      .filter(o => !warehouseId || o.warehouseId === warehouseId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  createOutboundOrder(order) {
    order.id = this.genId('OUT');
    order.createdAt = this.formatDate();
    order.status = order.status || 'completed';
    if (!order.warehouseId) {
      const firstIng = order.items[0] ? this.getIngredient(order.items[0].ingredientId) : null;
      order.warehouseId = (firstIng && firstIng.warehouseId) || 'WH001';
    }
    order.items.forEach(item => this.adjustWarehouseStock(item.ingredientId, -item.quantity));
    this.data.outboundOrders.push(order);
    this.save();
    return order;
  },

  // ===== 门店订单（支持按仓库过滤 + 自动分仓拆单） =====
  getStoreOrders(storeId, warehouseId) {
    let list = this.data.storeOrders;
    if (storeId) list = list.filter(o => o.storeId === storeId);
    if (warehouseId) list = list.filter(o => o.warehouseId === warehouseId);
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getStoreOrder(id) {
    return this.data.storeOrders.find(o => o.id === id);
  },

  /**
   * V2.3 分仓下单：自动按食材所属仓库拆分订单
   * 返回创建的订单数组（可能多个）
   */
  createStoreOrdersByWarehouse(orderData) {
    const { storeId, storeName, expectedDate, items, remark } = orderData;
    // 按仓库分组
    const groups = {};
    items.forEach(item => {
      const ing = this.getIngredient(item.ingredientId);
      const whId = (ing && ing.warehouseId) || 'WH001';
      if (!groups[whId]) groups[whId] = [];
      groups[whId].push(item);
    });

    const createdOrders = [];
    Object.keys(groups).forEach(whId => {
      const wh = this.getWarehouse(whId);
      const groupItems = groups[whId];
      const totalAmount = groupItems.reduce((sum, i) => sum + (i.quantity * (i.unitPrice || 0)), 0);
      const order = {
        id: this.genId('ORD'),
        createdAt: this.formatDate(),
        status: 'pending',
        storeId,
        storeName,
        warehouseId: whId,
        warehouseName: wh ? wh.name : '默认仓库',
        expectedDate,
        items: groupItems,
        totalAmount: Math.round(totalAmount * 100) / 100,
        remark: remark || '',
      };
      this.data.storeOrders.push(order);
      createdOrders.push(order);
    });

    this.save();
    return createdOrders;
  },

  updateStoreOrderStatus(orderId, status) {
    const order = this.getStoreOrder(orderId);
    if (order) {
      order.status = status;
      order.updatedAt = this.formatDate();
      this.save();
    }
    return order;
  },

  // ===== 配送（支持 warehouseId 过滤） =====
  getDeliveries(storeId, warehouseId) {
    let list = this.data.deliveries;
    if (storeId) list = list.filter(d => d.storeId === storeId);
    if (warehouseId) list = list.filter(d => d.warehouseId === warehouseId);
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getDelivery(id) {
    return this.data.deliveries.find(d => d.id === id);
  },

  createDelivery(delivery) {
    delivery.id = this.genId('DEL');
    delivery.createdAt = this.formatDate();
    delivery.status = delivery.status || 'in-transit';
    // 继承订单的 warehouseId
    if (!delivery.warehouseId && delivery.orderId) {
      const order = this.getStoreOrder(delivery.orderId);
      if (order) {
        delivery.warehouseId = order.warehouseId;
        delivery.warehouseName = order.warehouseName;
      }
    }
    if (!delivery.warehouseId) delivery.warehouseId = 'WH001';
    if (!delivery.warehouseName) {
      const wh = this.getWarehouse(delivery.warehouseId);
      delivery.warehouseName = wh ? wh.name : '默认仓库';
    }
    this.data.deliveries.push(delivery);
    this.save();
    return delivery;
  },

  updateDeliveryStatus(deliveryId, status) {
    const del = this.getDelivery(deliveryId);
    if (del) {
      del.status = status;
      del.updatedAt = this.formatDate();
      this.save();
    }
    return del;
  },

  // ===== 配送位置追踪 =====
  updateDeliveryLocation(deliveryId, location) {
    const track = {
      deliveryId,
      lat: location.lat,
      lng: location.lng,
      timestamp: this.formatDate(),
      speed: location.speed || 0,
    };
    this.data.deliveryTracks.push(track);
    const del = this.getDelivery(deliveryId);
    if (del) {
      del.currentLocation = { lat: location.lat, lng: location.lng, updatedAt: this.formatDate() };
      this.save();
    }
    return track;
  },

  getDeliveryTracks(deliveryId) {
    return this.data.deliveryTracks.filter(t => t.deliveryId === deliveryId);
  },

  // ===== 验货 =====
  getReceivingOrders(storeId) {
    let list = this.data.receivingOrders;
    if (storeId) list = list.filter(r => r.storeId === storeId);
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getReceivingOrderById(id) {
    return this.data.receivingOrders.find(r => r.id === id);
  },

  getPendingReviewReceivingOrders(warehouseId) {
    return this.data.receivingOrders
      .filter(r => r.status === 'pending_review')
      .filter(r => !warehouseId || r.warehouseId === warehouseId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  createReceivingOrder(receiving) {
    receiving.id = this.genId('REC');
    receiving.createdAt = this.formatDate();

    // 继承配送单的 warehouseId
    if (!receiving.warehouseId && receiving.deliveryId) {
      const del = this.getDelivery(receiving.deliveryId);
      if (del) {
        receiving.warehouseId = del.warehouseId;
        receiving.warehouseName = del.warehouseName;
      }
    }

    const hasException = receiving.items.some(item =>
      Math.abs((item.acceptedQty || 0) - (item.orderedQty || 0)) > 0.001
    );

    if (hasException) {
      receiving.status = 'pending_review';
      receiving.exceptionFlag = true;
    } else {
      receiving.status = 'completed';
      receiving.items.forEach(item => this.adjustStoreStock(receiving.storeId, item.ingredientId, item.acceptedQty));
    }

    this.data.receivingOrders.push(receiving);
    this.save();
    return receiving;
  },

  approveReceivingException(receivingId, reviewerName) {
    const receiving = this.data.receivingOrders.find(r => r.id === receivingId);
    if (!receiving || receiving.status !== 'pending_review') return null;

    const delivery = this.getDelivery(receiving.deliveryId);
    if (delivery) {
      const outbound = this.data.outboundOrders.find(o => o.orderId === delivery.orderId);
      if (outbound) {
        receiving.items.forEach(item => {
          const outItem = outbound.items.find(oi => oi.ingredientId === item.ingredientId);
          if (outItem) {
            const diff = (item.orderedQty || 0) - (item.acceptedQty || 0);
            if (diff > 0) {
              this.adjustWarehouseStock(item.ingredientId, diff);
            }
            outItem.quantity = item.acceptedQty;
            outItem.amount = Math.round(outItem.quantity * (outItem.unitPrice || 0) * 100) / 100;
          }
        });
        outbound.totalAmount = outbound.items.reduce((sum, i) => sum + (i.amount || 0), 0);
        outbound.totalAmount = Math.round(outbound.totalAmount * 100) / 100;
        outbound.exceptionAdjusted = true;
        outbound.adjustedAt = this.formatDate();
      }
    }

    receiving.items.forEach(item => {
      this.adjustStoreStock(receiving.storeId, item.ingredientId, item.acceptedQty);
    });

    receiving.status = 'completed';
    receiving.reviewedBy = reviewerName || 'warehouse';
    receiving.reviewedAt = this.formatDate();
    receiving.reviewResult = 'approved';
    this.save();
    return receiving;
  },

  rejectReceivingException(receivingId, reviewerName) {
    const receiving = this.data.receivingOrders.find(r => r.id === receivingId);
    if (!receiving || receiving.status !== 'pending_review') return null;

    receiving.items.forEach(item => {
      this.adjustStoreStock(receiving.storeId, item.ingredientId, item.orderedQty);
    });

    receiving.status = 'completed';
    receiving.reviewedBy = reviewerName || 'warehouse';
    receiving.reviewedAt = this.formatDate();
    receiving.reviewResult = 'rejected';
    this.save();
    return receiving;
  },

  // ===== 盘存（支持 warehouseId） =====
  getWarehouseChecks(warehouseId) {
    return [...this.data.warehouseChecks]
      .filter(c => !warehouseId || c.warehouseId === warehouseId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  createWarehouseCheck(check) {
    check.id = this.genId('WCK');
    check.createdAt = this.formatDate();
    check.status = 'completed';
    if (!check.warehouseId) check.warehouseId = 'WH001';
    check.items.forEach(item => {
      const inv = this.data.warehouseInventory.find(i => i.ingredientId === item.ingredientId);
      if (inv) {
        item.systemQty = inv.quantity;
        item.difference = Math.round((item.actualQty - inv.quantity) * 100) / 100;
        inv.quantity = item.actualQty;
        inv.updatedAt = this.formatDate();
      }
    });
    this.data.warehouseChecks.push(check);
    this.save();
    return check;
  },

  getStoreChecks(storeId) {
    return this.data.storeChecks
      .filter(c => !storeId || c.storeId === storeId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  createStoreCheck(check) {
    check.id = this.genId('SCK');
    check.createdAt = this.formatDate();
    check.status = 'completed';
    check.items.forEach(item => {
      const inv = this.data.storeInventory.find(i => i.storeId === check.storeId && i.ingredientId === item.ingredientId);
      if (inv) {
        item.systemQty = inv.quantity;
        item.difference = Math.round((item.actualQty - inv.quantity) * 100) / 100;
        inv.quantity = item.actualQty;
        inv.updatedAt = this.formatDate();
      }
    });
    this.data.storeChecks.push(check);
    this.save();
    return check;
  },

  // ===== 耗用核算 =====
  getConsumptionRecords(storeId) {
    return this.data.consumptionRecords
      .filter(c => !storeId || c.storeId === storeId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  createConsumptionRecord(record) {
    record.id = this.genId('CON');
    record.createdAt = this.formatDate();
    record.items.forEach(item => {
      item.consumedQty = Math.round((item.beginningQty + item.receivedQty - item.endingQty) * 100) / 100;
      item.totalCost = Math.round(item.consumedQty * item.unitCost * 100) / 100;
    });
    record.totalCost = record.items.reduce((sum, i) => sum + (i.totalCost || 0), 0);
    this.data.consumptionRecords.push(record);
    this.save();
    return record;
  },

  // ===== 统计（支持 warehouseId） =====
  getWarehouseStats(warehouseId) {
    let inv = this.data.warehouseInventory;
    if (warehouseId) inv = inv.filter(i => i.warehouseId === warehouseId);
    const lowStock = inv.filter(i => {
      const ing = this.getIngredient(i.ingredientId);
      return ing && i.quantity <= (ing.warningThreshold || 0);
    });
    const totalValue = inv.reduce((sum, i) => {
      const ing = this.getIngredient(i.ingredientId);
      return sum + (i.quantity * (ing ? ing.outboundPrice || ing.referencePrice || 0 : 0));
    }, 0);
    let pendingOrders = this.data.storeOrders.filter(o => o.status === 'pending');
    let inTransit = this.data.deliveries.filter(d => d.status === 'in-transit');
    if (warehouseId) {
      pendingOrders = pendingOrders.filter(o => o.warehouseId === warehouseId);
      inTransit = inTransit.filter(d => d.warehouseId === warehouseId);
    }
    return {
      totalItems: inv.length,
      lowStockCount: lowStock.length,
      lowStockItems: lowStock.map(i => ({ ...i, ingredient: this.getIngredient(i.ingredientId) })),
      totalValue: Math.round(totalValue),
      pendingOrders: pendingOrders.length,
      inTransit: inTransit.length,
    };
  },

  getStoreStats(storeId) {
    const inv = this.data.storeInventory.filter(i => i.storeId === storeId);
    const lowStock = inv.filter(i => {
      const ing = this.getIngredient(i.ingredientId);
      return ing && i.quantity <= (ing.warningThreshold || 0);
    });
    const totalValue = inv.reduce((sum, i) => {
      const ing = this.getIngredient(i.ingredientId);
      return sum + (i.quantity * (ing ? ing.outboundPrice || ing.referencePrice || 0 : 0));
    }, 0);
    const myOrders = this.data.storeOrders.filter(o => o.storeId === storeId);
    return {
      totalItems: inv.length,
      lowStockCount: lowStock.length,
      lowStockItems: lowStock.map(i => ({ ...i, ingredient: this.getIngredient(i.ingredientId) })),
      totalValue: Math.round(totalValue),
      pendingOrders: myOrders.filter(o => o.status === 'pending').length,
      pendingDelivery: this.data.deliveries.filter(d => d.storeId === storeId && d.status === 'in-transit').length,
    };
  },

  getAdminStats() {
    return {
      accounts: this.data.accounts.length,
      stores: this.data.stores.length,
      ingredients: this.data.ingredients.length,
      warehouses: this.data.warehouses.length,
      inbound: this.data.inboundOrders.length,
      outbound: this.data.outboundOrders.length,
      orders: this.data.storeOrders.length,
      pendingOrders: this.data.storeOrders.filter(o => o.status === 'pending').length,
      deliveries: this.data.deliveries.length,
      inTransit: this.data.deliveries.filter(d => d.status === 'in-transit').length,
      receiving: this.data.receivingOrders.length,
      consumption: this.data.consumptionRecords.length,
    };
  },

  // ===== 种子数据 =====
  seed() {
    const now = this.formatDate();
    const today = this.today();

    // V2.3 分仓：三个默认仓库
    const warehouses = [
      { id: 'WH001', name: '冻货仓', type: 'frozen', description: '冷冻海鲜、肉类食材', createdAt: now },
      { id: 'WH002', name: '蔬菜生鲜仓', type: 'fresh', description: '生鲜蔬果、蛋类、豆腐', createdAt: now },
      { id: 'WH003', name: '物料仓', type: 'materials', description: '主食、调味品、辅料、包装物料', createdAt: now },
    ];

    const stores = [
      { id: 'ST001', name: '御前十七·天河店', type: '日料', address: '广州市天河区体育西路', phone: '020-88880001', createdAt: now },
      { id: 'ST002', name: '御前十七·番禺店', type: '日料', address: '广州市番禺区市桥', phone: '020-88880002', createdAt: now },
      { id: 'ST003', name: '御小灶·中华热寿司', type: '热寿司', address: '广州市海珠区江南西', phone: '020-88880003', createdAt: now },
      { id: 'ST004', name: '八肚幺·台湾卤肉饭', type: '卤肉饭', address: '广州市越秀区北京路', phone: '020-88880004', createdAt: now },
      { id: 'ST005', name: '兰屿阿嫲·烤肉饭', type: '烤肉饭', address: '佛山市禅城区祖庙', phone: '0757-88880005', createdAt: now },
    ];

    // 食材分配到对应仓库
    const ingredients = [
      // 冻货仓 WH001：海鲜、肉类
      { id: 'ING001', name: '三文鱼', category: '海鲜', unit: 'kg', spec: '冰鲜整条', supplier: '挪威海产', referencePrice: 85, outboundPrice: 95, warningThreshold: 5, warehouseId: 'WH001', createdAt: now },
      { id: 'ING002', name: '金枪鱼', category: '海鲜', unit: 'kg', spec: '超低温', supplier: '远洋渔业', referencePrice: 120, outboundPrice: 132, warningThreshold: 3, warehouseId: 'WH001', createdAt: now },
      { id: 'ING003', name: '北极贝', category: '海鲜', unit: 'kg', spec: '冷冻', supplier: '大连海产', referencePrice: 65, outboundPrice: 72, warningThreshold: 2, warehouseId: 'WH001', createdAt: now },
      { id: 'ING004', name: '甜虾', category: '海鲜', unit: 'kg', spec: '冷冻', supplier: '北海道直采', referencePrice: 90, outboundPrice: 99, warningThreshold: 2, warehouseId: 'WH001', createdAt: now },
      { id: 'ING005', name: '鳗鱼', category: '海鲜', unit: 'kg', spec: '活鳗', supplier: '顺德养殖', referencePrice: 55, outboundPrice: 62, warningThreshold: 3, warehouseId: 'WH001', createdAt: now },
      { id: 'ING017', name: '五花肉', category: '肉类', unit: 'kg', spec: '冷鲜', supplier: '双汇', referencePrice: 32, outboundPrice: 38, warningThreshold: 5, warehouseId: 'WH001', createdAt: now },
      { id: 'ING018', name: '鸡腿肉', category: '肉类', unit: 'kg', spec: '冷鲜去骨', supplier: '温氏', referencePrice: 18, outboundPrice: 23, warningThreshold: 5, warehouseId: 'WH001', createdAt: now },
      // 蔬菜生鲜仓 WH002：蔬菜、蛋类、豆腐
      { id: 'ING014', name: '鸡蛋', category: '食材', unit: '盒', spec: '30枚/盒', supplier: '温氏蛋业', referencePrice: 18, outboundPrice: 22, warningThreshold: 3, warehouseId: 'WH002', createdAt: now },
      { id: 'ING015', name: '黄瓜', category: '蔬菜', unit: 'kg', spec: '新鲜', supplier: '本地菜场', referencePrice: 5, outboundPrice: 7, warningThreshold: 3, warehouseId: 'WH002', createdAt: now },
      { id: 'ING016', name: '牛油果', category: '蔬菜', unit: 'kg', spec: '墨西哥进口', supplier: '佳沛', referencePrice: 28, outboundPrice: 35, warningThreshold: 2, warehouseId: 'WH002', createdAt: now },
      { id: 'ING019', name: '豆腐', category: '食材', unit: '盒', spec: '300g', supplier: '白玉豆腐', referencePrice: 4, outboundPrice: 6, warningThreshold: 5, warehouseId: 'WH002', createdAt: now },
      // 物料仓 WH003：主食、辅料、调味品
      { id: 'ING006', name: '越光米', category: '主食', unit: 'kg', spec: '日本进口', supplier: '中粮粮油', referencePrice: 12, outboundPrice: 15, warningThreshold: 20, warehouseId: 'WH003', createdAt: now },
      { id: 'ING007', name: '糯米', category: '主食', unit: 'kg', spec: '东北圆粒', supplier: '中粮粮油', referencePrice: 8, outboundPrice: 11, warningThreshold: 15, warehouseId: 'WH003', createdAt: now },
      { id: 'ING008', name: '海苔', category: '辅料', unit: '包', spec: '50片/包', supplier: '连云港海味', referencePrice: 25, outboundPrice: 30, warningThreshold: 5, warehouseId: 'WH003', createdAt: now },
      { id: 'ING009', name: '酱油', category: '调味品', unit: '瓶', spec: '1.8L', supplier: '龟甲万', referencePrice: 35, outboundPrice: 40, warningThreshold: 3, warehouseId: 'WH003', createdAt: now },
      { id: 'ING010', name: '芥末', category: '调味品', unit: '支', spec: '43g', supplier: '爱思必', referencePrice: 28, outboundPrice: 33, warningThreshold: 5, warehouseId: 'WH003', createdAt: now },
      { id: 'ING011', name: '味淋', category: '调味品', unit: '瓶', spec: '500ml', supplier: '宝酒造', referencePrice: 22, outboundPrice: 27, warningThreshold: 3, warehouseId: 'WH003', createdAt: now },
      { id: 'ING012', name: '清酒', category: '调味品', unit: '瓶', spec: '720ml', supplier: '菊正宗', referencePrice: 45, outboundPrice: 52, warningThreshold: 2, warehouseId: 'WH003', createdAt: now },
      { id: 'ING013', name: '食用油', category: '调味品', unit: '桶', spec: '5L', supplier: '金龙鱼', referencePrice: 65, outboundPrice: 72, warningThreshold: 2, warehouseId: 'WH003', createdAt: now },
      { id: 'ING020', name: '天妇罗粉', category: '辅料', unit: '袋', spec: '1kg', supplier: '日清', referencePrice: 15, outboundPrice: 19, warningThreshold: 3, warehouseId: 'WH003', createdAt: now },
    ];

    const warehouseInventory = [
      { ingredientId: 'ING001', quantity: 30, unit: 'kg', warehouseId: 'WH001', updatedAt: now },
      { ingredientId: 'ING002', quantity: 15, unit: 'kg', warehouseId: 'WH001', updatedAt: now },
      { ingredientId: 'ING003', quantity: 8, unit: 'kg', warehouseId: 'WH001', updatedAt: now },
      { ingredientId: 'ING004', quantity: 12, unit: 'kg', warehouseId: 'WH001', updatedAt: now },
      { ingredientId: 'ING005', quantity: 20, unit: 'kg', warehouseId: 'WH001', updatedAt: now },
      { ingredientId: 'ING017', quantity: 25, unit: 'kg', warehouseId: 'WH001', updatedAt: now },
      { ingredientId: 'ING018', quantity: 30, unit: 'kg', warehouseId: 'WH001', updatedAt: now },
      { ingredientId: 'ING014', quantity: 25, unit: '盒', warehouseId: 'WH002', updatedAt: now },
      { ingredientId: 'ING015', quantity: 15, unit: 'kg', warehouseId: 'WH002', updatedAt: now },
      { ingredientId: 'ING016', quantity: 10, unit: 'kg', warehouseId: 'WH002', updatedAt: now },
      { ingredientId: 'ING019', quantity: 20, unit: '盒', warehouseId: 'WH002', updatedAt: now },
      { ingredientId: 'ING006', quantity: 80, unit: 'kg', warehouseId: 'WH003', updatedAt: now },
      { ingredientId: 'ING007', quantity: 50, unit: 'kg', warehouseId: 'WH003', updatedAt: now },
      { ingredientId: 'ING008', quantity: 30, unit: '包', warehouseId: 'WH003', updatedAt: now },
      { ingredientId: 'ING009', quantity: 15, unit: '瓶', warehouseId: 'WH003', updatedAt: now },
      { ingredientId: 'ING010', quantity: 20, unit: '支', warehouseId: 'WH003', updatedAt: now },
      { ingredientId: 'ING011', quantity: 10, unit: '瓶', warehouseId: 'WH003', updatedAt: now },
      { ingredientId: 'ING012', quantity: 5, unit: '瓶', warehouseId: 'WH003', updatedAt: now },
      { ingredientId: 'ING013', quantity: 8, unit: '桶', warehouseId: 'WH003', updatedAt: now },
      { ingredientId: 'ING020', quantity: 15, unit: '袋', warehouseId: 'WH003', updatedAt: now },
    ];

    const storeInventory = [
      { storeId: 'ST001', ingredientId: 'ING001', quantity: 3, unit: 'kg', updatedAt: now },
      { storeId: 'ST001', ingredientId: 'ING006', quantity: 15, unit: 'kg', updatedAt: now },
      { storeId: 'ST001', ingredientId: 'ING009', quantity: 2, unit: '瓶', updatedAt: now },
      { storeId: 'ST001', ingredientId: 'ING014', quantity: 2, unit: '盒', updatedAt: now },
      { storeId: 'ST001', ingredientId: 'ING015', quantity: 2, unit: 'kg', updatedAt: now },
      { storeId: 'ST002', ingredientId: 'ING001', quantity: 4, unit: 'kg', updatedAt: now },
      { storeId: 'ST002', ingredientId: 'ING006', quantity: 12, unit: 'kg', updatedAt: now },
      { storeId: 'ST002', ingredientId: 'ING009', quantity: 3, unit: '瓶', updatedAt: now },
    ];

    const accounts = [
      { id: 'ACCDEV', phone: '13826406713', password: bcrypt.hashSync('hjcc2026', 8), role: 'developer', name: '东方先生', storeId: null, warehouseId: null, enterpriseName: '灰鲸餐创', createdAt: now },
    ];

    const storeOrders = [
      {
        id: 'ORD' + today.replace(/-/g, '') + '001', storeId: 'ST001', storeName: '御前十七·天河店',
        warehouseId: 'WH001', warehouseName: '冻货仓',
        createdAt: today + ' 07:00', expectedDate: today, status: 'dispatched',
        items: [
          { ingredientId: 'ING001', name: '三文鱼', quantity: 5, unit: 'kg', unitPrice: 95, amount: 475, remark: '' },
        ],
        totalAmount: 475, remark: '冻货仓订单',
      },
      {
        id: 'ORD' + today.replace(/-/g, '') + '002', storeId: 'ST001', storeName: '御前十七·天河店',
        warehouseId: 'WH003', warehouseName: '物料仓',
        createdAt: today + ' 07:00', expectedDate: today, status: 'pending',
        items: [
          { ingredientId: 'ING006', name: '越光米', quantity: 10, unit: 'kg', unitPrice: 15, amount: 150, remark: '' },
        ],
        totalAmount: 150, remark: '物料仓订单',
      },
      {
        id: 'ORD' + today.replace(/-/g, '') + '003', storeId: 'ST002', storeName: '御前十七·番禺店',
        warehouseId: 'WH001', warehouseName: '冻货仓',
        createdAt: today + ' 07:30', expectedDate: today, status: 'pending',
        items: [
          { ingredientId: 'ING002', name: '金枪鱼', quantity: 3, unit: 'kg', unitPrice: 132, amount: 396, remark: '' },
        ],
        totalAmount: 396, remark: '',
      },
    ];

    const deliveries = [
      {
        id: 'DEL' + today.replace(/-/g, '') + '001', storeId: 'ST001', storeName: '御前十七·天河店',
        orderId: 'ORD' + today.replace(/-/g, '') + '001',
        warehouseId: 'WH001', warehouseName: '冻货仓',
        createdAt: today + ' 09:30', status: 'delivered',
        driver: '李师傅', vehicle: '粤A·88923', phone: '13800001111',
        items: [
          { ingredientId: 'ING001', name: '三文鱼', quantity: 5, unit: 'kg' },
        ],
        currentLocation: null, remark: '',
      },
    ];

    const inboundOrders = [
      {
        id: 'IN' + today.replace(/-/g, '') + '001', createdAt: today + ' 08:30',
        supplier: '挪威海产', operator: '仓库管理员', status: 'completed',
        warehouseId: 'WH001',
        items: [
          { ingredientId: 'ING001', name: '三文鱼', quantity: 20, unit: 'kg', price: 85, amount: 1700 },
          { ingredientId: 'ING004', name: '甜虾', quantity: 10, unit: 'kg', price: 90, amount: 900 },
        ],
        totalAmount: 2600, remark: '冻货仓常规补货',
      },
    ];

    const outboundOrders = [
      {
        id: 'OUT' + today.replace(/-/g, '') + '001', createdAt: today + ' 10:00',
        storeId: 'ST001', storeName: '御前十七·天河店', operator: '仓库管理员', status: 'completed',
        warehouseId: 'WH001', orderId: 'ORD' + today.replace(/-/g, '') + '001',
        items: [
          { ingredientId: 'ING001', name: '三文鱼', quantity: 5, unit: 'kg', unitPrice: 95, amount: 475 },
        ],
        totalAmount: 475, remark: '天河店冻货补货',
      },
    ];

    const receivingOrders = [
      {
        id: 'REC' + today.replace(/-/g, '') + '001', storeId: 'ST001', storeName: '御前十七·天河店',
        deliveryId: 'DEL' + today.replace(/-/g, '') + '001',
        warehouseId: 'WH001', warehouseName: '冻货仓',
        createdAt: today + ' 10:30',
        receiver: '天河店店长', status: 'completed',
        items: [
          { ingredientId: 'ING001', name: '三文鱼', orderedQty: 5, deliveredQty: 5, acceptedQty: 5, rejectedQty: 0, rejectReason: '', unit: 'kg' },
        ],
        remark: '验收合格',
      },
    ];

    return {
      settings: { warehouseName: '灰鲸餐创·中央仓库', enterpriseName: '' },
      warehouses,
      accounts,
      applications: [],
      stores,
      ingredients,
      warehouseInventory,
      storeInventory,
      inboundOrders,
      outboundOrders,
      storeOrders,
      deliveries,
      receivingOrders,
      warehouseChecks: [],
      storeChecks: [],
      consumptionRecords: [],
      deliveryTracks: [],
    };
  },
};

module.exports = { DB };
