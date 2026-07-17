/**
 * API 客户端 - 封装所有后端接口调用
 */
const API = {
  baseUrl: '',  // 同源，不需要配置
  token: null,

  init() {
    this.token = localStorage.getItem('scmp_token');
  },

  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem('scmp_token', token);
    else localStorage.removeItem('scmp_token');
  },

  async request(method, url, body) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
    };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(this.baseUrl + url, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '请求失败');
    return data;
  },

  // ===== 认证 =====
  login(phone, password) {
    return this.request('POST', '/api/auth/login', { phone, password });
  },
  verify() {
    return this.request('GET', '/api/auth/verify');
  },
  hasAdmin() {
    return this.request('GET', '/api/auth/has-admin');
  },
  // 提交注册申请
  applyForAdmin(enterpriseName, name, phone, password) {
    return this.request('POST', '/api/auth/apply', { enterpriseName, name, phone, password });
  },
  // 查看申请列表（开发者）
  listApplications() {
    return this.request('GET', '/api/auth/applications');
  },
  // 审批通过
  approveApplication(id) {
    return this.request('POST', `/api/auth/applications/${id}/approve`);
  },
  // 审批拒绝
  rejectApplication(id, reason) {
    return this.request('POST', `/api/auth/applications/${id}/reject`, { reason });
  },

  // ===== 账号管理 =====
  listAccounts() { return this.request('GET', '/api/accounts'); },
  createAccount(data) { return this.request('POST', '/api/accounts', data); },
  updateAccount(id, data) { return this.request('PUT', `/api/accounts/${id}`, data); },
  deleteAccount(id) { return this.request('DELETE', `/api/accounts/${id}`); },

  // ===== 门店管理 =====
  listStores() { return this.request('GET', '/api/stores'); },
  createStore(data) { return this.request('POST', '/api/stores', data); },
  updateStore(id, data) { return this.request('PUT', `/api/stores/${id}`, data); },
  deleteStore(id) { return this.request('DELETE', `/api/stores/${id}`); },

  // ===== 食材品项 =====
  listIngredients() { return this.request('GET', '/api/ingredients'); },
  createIngredient(data) { return this.request('POST', '/api/ingredients', data); },
  updateIngredient(id, data) { return this.request('PUT', `/api/ingredients/${id}`, data); },
  deleteIngredient(id) { return this.request('DELETE', `/api/ingredients/${id}`); },

  // ===== 仓库管理（V2.3 分仓） =====
  listWarehouses() { return this.request('GET', '/api/warehouses'); },
  createWarehouse(data) { return this.request('POST', '/api/warehouses', data); },
  updateWarehouse(id, data) { return this.request('PUT', `/api/warehouses/${id}`, data); },
  deleteWarehouse(id) { return this.request('DELETE', `/api/warehouses/${id}`); },

  // ===== 仓库 =====
  getWarehouseStats() { return this.request('GET', '/api/warehouse/stats'); },
  getWarehouseInventory() { return this.request('GET', '/api/warehouse/inventory'); },
  getInboundOrders() { return this.request('GET', '/api/warehouse/inbound'); },
  createInboundOrder(data) { return this.request('POST', '/api/warehouse/inbound', data); },
  getOutboundOrders() { return this.request('GET', '/api/warehouse/outbound'); },
  createOutboundOrder(data) { return this.request('POST', '/api/warehouse/outbound', data); },
  getWarehouseChecks() { return this.request('GET', '/api/warehouse/checks'); },
  createWarehouseCheck(data) { return this.request('POST', '/api/warehouse/checks', data); },

  // ===== 门店订单 =====
  getStoreOrders() { return this.request('GET', '/api/store/orders'); },
  createStoreOrder(data) { return this.request('POST', '/api/store/orders', data); },
  fulfillOrder(id, data) { return this.request('POST', `/api/store/orders/${id}/fulfill`, data); },

  // ===== 配送 =====
  getDeliveries() { return this.request('GET', '/api/deliveries'); },
  getDelivery(id) { return this.request('GET', `/api/deliveries/${id}`); },
  updateDeliveryStatus(id, status) { return this.request('PUT', `/api/deliveries/${id}/status`, { status }); },
  updateDeliveryLocation(id, location) { return this.request('POST', `/api/deliveries/${id}/location`, location); },
  autoReportLocation(id, location) { return this.request('POST', `/api/deliveries/${id}/auto-location`, location); },
  getDeliveryTracks(id) { return this.request('GET', `/api/deliveries/${id}/tracks`); },

  // ===== 门店库存/验货/盘存/耗用 =====
  getStoreInventory(storeId) { return this.request('GET', `/api/store/inventory${storeId ? '?storeId=' + storeId : ''}`); },
  getStoreStats(storeId) { return this.request('GET', `/api/store/stats${storeId ? '?storeId=' + storeId : ''}`); },
  getReceivingOrders() { return this.request('GET', '/api/store/receiving'); },
  createReceivingOrder(data) { return this.request('POST', '/api/store/receiving', data); },
  getPendingReviewReceiving() { return this.request('GET', '/api/store/receiving/pending-review'); },
  approveReceivingException(id) { return this.request('POST', `/api/store/receiving/${id}/approve`); },
  rejectReceivingException(id) { return this.request('POST', `/api/store/receiving/${id}/reject`); },
  getOrderStatus(orderId) { return this.request('GET', `/api/store/orders/${orderId}/status`); },
  getStoreChecks(storeId) { return this.request('GET', `/api/store/checks${storeId ? '?storeId=' + storeId : ''}`); },
  createStoreCheck(data) { return this.request('POST', '/api/store/checks', data); },
  getConsumptionRecords(storeId) { return this.request('GET', `/api/store/consumption${storeId ? '?storeId=' + storeId : ''}`); },
  createConsumptionRecord(data) { return this.request('POST', '/api/store/consumption', data); },

  // ===== 后台 =====
  getAdminStats() { return this.request('GET', '/api/admin/stats'); },
  exportData() { return this.request('GET', '/api/admin/export'); },
  resetData() { return this.request('POST', '/api/admin/reset'); },

  // ===== 设置 =====
  getSettings() { return this.request('GET', '/api/settings'); },
  updateSettings(data) { return this.request('PUT', '/api/settings', data); },

  // ===== 数据导出 =====
  exportWarehouseChecks(startDate, endDate) {
    const q = new URLSearchParams();
    if (startDate) q.set('startDate', startDate);
    if (endDate) q.set('endDate', endDate);
    return this.request('GET', `/api/export/warehouse-checks?${q.toString()}`);
  },
  exportWarehouseInbound(startDate, endDate) {
    const q = new URLSearchParams();
    if (startDate) q.set('startDate', startDate);
    if (endDate) q.set('endDate', endDate);
    return this.request('GET', `/api/export/warehouse-inbound?${q.toString()}`);
  },
  exportWarehouseOutbound(startDate, endDate) {
    const q = new URLSearchParams();
    if (startDate) q.set('startDate', startDate);
    if (endDate) q.set('endDate', endDate);
    return this.request('GET', `/api/export/warehouse-outbound?${q.toString()}`);
  },
  exportStoreChecks(storeId, startDate, endDate) {
    const q = new URLSearchParams();
    if (storeId) q.set('storeId', storeId);
    if (startDate) q.set('startDate', startDate);
    if (endDate) q.set('endDate', endDate);
    return this.request('GET', `/api/export/store-checks?${q.toString()}`);
  },
  exportStoreInbound(storeId, startDate, endDate) {
    const q = new URLSearchParams();
    if (storeId) q.set('storeId', storeId);
    if (startDate) q.set('startDate', startDate);
    if (endDate) q.set('endDate', endDate);
    return this.request('GET', `/api/export/store-inbound?${q.toString()}`);
  },
};
