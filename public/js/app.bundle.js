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
/**
 * 应用控制器 - 路由、认证、通用 UI
 */
const App = {
  state: {
    account: null,  // { id, phone, role, name, storeId }
    portal: null,   // 'admin' | 'warehouse' | 'store'
    route: '',
  },

  // 当前 Tab（各端独立维护）
  tabState: { admin: 0, warehouse: 0, store: 0 },

  init() {
    API.init();
    const savedAccount = localStorage.getItem('scmp_account');
    if (savedAccount) {
      this.state.account = JSON.parse(savedAccount);
      // 验证 token 是否仍然有效
      API.verify().then(res => {
        this.state.account = res.account;
        localStorage.setItem('scmp_account', JSON.stringify(res.account));
        this.enterApp();
      }).catch(() => {
        this.logout();
      });
    } else {
      this.showLogin();
    }
  },

  // ===== 登录 / 申请 =====
  async showLogin() {
    this.state.account = null;
    this.state.portal = null;
    localStorage.removeItem('scmp_account');
    API.setToken(null);
    this.renderLogin();
  },

  // 注册申请表单（向开发者发起申请）
  showApply() {
    document.getElementById('app').innerHTML = `
      <div class="login-page">
        <div class="login-logo">🐋</div>
        <div class="login-title">灰鲸餐创</div>
        <div class="login-subtitle">供应链管理系统 · 注册申请</div>
        <div class="login-card">
          <div style="margin-bottom:16px;padding:12px;background:rgba(255,180,0,0.1);border-radius:8px;font-size:13px;color:#f5a623;text-align:center;">
            ⚠️ 系统尚未有超级管理员<br>请填写以下信息向开发者提交申请<br>经开发者审核通过后方可使用
          </div>
          <div class="form-group">
            <label class="form-label">企业名称</label>
            <input class="form-input" id="applyEnterprise" type="text" placeholder="如：灰鲸餐创" />
          </div>
          <div class="form-group">
            <label class="form-label">姓名</label>
            <input class="form-input" id="applyName" type="text" placeholder="请输入您的姓名" />
          </div>
          <div class="form-group">
            <label class="form-label">手机号</label>
            <input class="form-input" id="applyPhone" type="tel" placeholder="请输入手机号" maxlength="11" />
          </div>
          <div class="form-group">
            <label class="form-label">密码</label>
            <input class="form-input" id="applyPassword" type="password" placeholder="设置密码（至少6位）" />
          </div>
          <div class="form-group">
            <label class="form-label">确认密码</label>
            <input class="form-input" id="applyPassword2" type="password" placeholder="请再次输入密码" />
          </div>
          <button class="btn btn-primary btn-block" onclick="App.doApply()">提交申请</button>
          <div style="text-align:center;margin-top:12px">
            <span class="text-sm text-info" onclick="App.renderLogin()">已有账号？返回登录</span>
          </div>
        </div>
      </div>
    `;
  },

  async doApply() {
    const enterpriseName = document.getElementById('applyEnterprise').value.trim();
    const name = document.getElementById('applyName').value.trim();
    const phone = document.getElementById('applyPhone').value.trim();
    const password = document.getElementById('applyPassword').value.trim();
    const password2 = document.getElementById('applyPassword2').value.trim();

    if (!enterpriseName) return this.toast('请输入企业名称');
    if (!name) return this.toast('请输入姓名');
    if (!phone) return this.toast('请输入手机号');
    if (!/^1\d{10}$/.test(phone)) return this.toast('手机号格式不正确');
    if (!password || password.length < 6) return this.toast('密码至少6位');
    if (password !== password2) return this.toast('两次密码不一致');

    try {
      await API.applyForAdmin(enterpriseName, name, phone, password);
      this.toast('申请已提交，等待开发者审核');
      setTimeout(() => this.renderLogin(), 1500);
    } catch (e) {
      this.toast(e.message);
    }
  },

  // 普通登录页面
  renderLogin() {
    document.getElementById('app').innerHTML = `
      <div class="login-page">
        <div class="login-logo">🐋</div>
        <div class="login-title">灰鲸餐创</div>
        <div class="login-subtitle">供应链管理系统</div>
        <div class="login-card">
          <div class="form-group">
            <label class="form-label">手机号</label>
            <input class="form-input" id="loginPhone" type="tel" placeholder="请输入手机号" maxlength="11" />
          </div>
          <div class="form-group">
            <label class="form-label">密码</label>
            <input class="form-input" id="loginPassword" type="password" placeholder="请输入密码" />
          </div>
          <button class="btn btn-primary btn-block" onclick="App.doLogin()">登 录</button>
          <div style="text-align:center;margin-top:12px">
            <span class="text-sm text-info" onclick="App.showApply()">没有账号？提交注册申请</span>
          </div>
        </div>
      </div>
    `;
    document.getElementById('loginPassword').addEventListener('keydown', e => {
      if (e.key === 'Enter') this.doLogin();
    });
  },

  async doLogin() {
    const phone = document.getElementById('loginPhone').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    if (!phone || !password) return this.toast('请输入手机号和密码');

    try {
      const res = await API.login(phone, password);
      API.setToken(res.token);
      this.state.account = res.account;
      localStorage.setItem('scmp_account', JSON.stringify(res.account));
      this.enterApp();
    } catch (e) {
      this.toast(e.message);
    }
  },

  logout() {
    this.showLogin();
  },

  enterApp() {
    const role = this.state.account.role;
    // 总部/开发者账号可以选择进入哪个端，默认进后台
    if (role === 'admin' || role === 'developer') {
      this.state.portal = 'admin';
    } else if (role === 'warehouse') {
      this.state.portal = 'warehouse';
    } else {
      this.state.portal = 'store';
    }
    this.render();
  },

  // ===== 角色切换（仅总部/开发者） =====
  switchPortal(portal) {
    if (this.state.account.role !== 'admin' && this.state.account.role !== 'developer') return;
    this.state.portal = portal;
    this.render();
  },

  // ===== 渲染 =====
  render() {
    const portal = this.state.portal;
    if (portal === 'admin') Admin.render();
    else if (portal === 'warehouse') Warehouse.render();
    else if (portal === 'store') Store.render();
  },

  // ===== 顶部栏 =====
  topBar(title, sub) {
    const acc = this.state.account;
    const enterpriseName = acc.enterpriseName || '';
    let switcher = '';
    if (acc.role === 'admin' || acc.role === 'developer') {
      const portals = [
        { key: 'admin', label: '后台', icon: '⚙️' },
        { key: 'warehouse', label: '仓库', icon: '📦' },
        { key: 'store', label: '门店', icon: '🏪' },
      ];
      switcher = `<div class="role-switcher" onclick="App.showPortalSwitcher()">
        <span>${portals.find(p => p.key === this.state.portal)?.icon || ''}</span>
        <span>${portals.find(p => p.key === this.state.portal)?.label || ''}</span>
        <span>▼</span>
      </div>`;
    }
    return `<div class="top-bar">
      <div>
        ${enterpriseName ? `<div class="tb-enterprise">${enterpriseName}</div>` : ''}
        <div class="tb-title">${title}</div>
        ${sub ? `<div class="tb-sub">${sub}</div>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:12px">
        ${switcher}
        <div class="tb-action" onclick="App.logout()">退出</div>
      </div>
    </div>`;
  },

  showPortalSwitcher() {
    const portals = [
      { key: 'admin', label: '⚙️ 后台管控端', desc: '管理门店、账号、食材、数据' },
      { key: 'warehouse', label: '📦 仓库管理端', desc: '入库、出库、发货、配送' },
      { key: 'store', label: '🏪 门店管理端', desc: '下单、验货、盘存、耗用' },
    ];
    const html = `
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet">
        <div class="sheet-header"><span class="title">切换端口</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
        <div class="sheet-body">
          ${portals.map(p => `
          <div class="list-item" onclick="App.doSwitchPortal('${p.key}')">
            <div class="li-main"><div class="li-title">${p.label}</div><div class="li-sub">${p.desc}</div></div>
            ${this.state.portal === p.key ? '<span class="text-success">✓</span>' : '<span class="text-gray">→</span>'}
          </div>
          `).join('')}
        </div>
      </div>
    `;
    this.showModal(html);
  },

  doSwitchPortal(portal) {
    this.closeModal();
    this.switchPortal(portal);
  },

  // ===== 通用 UI =====
  toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add('show'), 10);
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 2000);
  },

  showModal(html) {
    const wrapper = document.createElement('div');
    wrapper.id = 'modal-wrapper';
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);
  },

  closeModal() {
    const w = document.getElementById('modal-wrapper');
    if (w) w.remove();
  },

  async confirm(msg) {
    return new Promise(resolve => {
      const html = `
        <div class="overlay-mask" onclick="App._confirmResolve(false)"></div>
        <div class="sheet" style="max-height:40vh">
          <div class="sheet-body" style="text-align:center;padding:32px 24px">
            <div style="font-size:16px;margin-bottom:24px">${msg}</div>
            <div style="display:flex;gap:12px">
              <button class="btn btn-outline btn-block" onclick="App._confirmResolve(false)">取消</button>
              <button class="btn btn-primary btn-block" onclick="App._confirmResolve(true)">确认</button>
            </div>
          </div>
        </div>
      `;
      this.showModal(html);
      this._confirmResolve = (val) => { this.closeModal(); resolve(val); };
    });
  },

  // ===== Tab 配置 =====
  getTabs(portal) {
    if (portal === 'warehouse') {
      return [
        { icon: '🏠', label: '首页' },
        { icon: '📥', label: '入库' },
        { icon: '📤', label: '出库' },
        { icon: '📋', label: '盘存' },
        { icon: '⚙️', label: '更多' },
      ];
    }
    if (portal === 'store') {
      return [
        { icon: '🏠', label: '首页' },
        { icon: '📝', label: '下单' },
        { icon: '✅', label: '验货' },
        { icon: '📋', label: '盘存' },
        { icon: '⚙️', label: '更多' },
      ];
    }
    return [];
  },

  renderTabBar(portal) {
    const tabs = this.getTabs(portal);
    const active = this.tabState[portal] || 0;
    return `<div class="tab-bar">
      ${tabs.map((t, i) => `
        <div class="tab-item ${i === active ? 'active' : ''}" onclick="App.switchTab('${portal}', ${i})">
          <div class="ti-icon">${t.icon}</div>
          <div class="ti-label">${t.label}</div>
        </div>
      `).join('')}
    </div>`;
  },

  switchTab(portal, index) {
    this.tabState[portal] = index;
    this.render();
  },

  // ===== 状态文字 =====
  statusText(status) {
    const map = {
      pending: '待处理', approved: '已审核', dispatched: '已出库',
      delivered: '已送达', 'in-transit': '配送中', completed: '已完成',
    };
    return map[status] || status;
  },

  // ===== CSV 导出工具 =====
  exportCSV(filename, headers, rows) {
    const BOM = '\uFEFF'; // UTF-8 BOM for Excel
    const csv = BOM + [headers, ...rows].map(r =>
      r.map(cell => {
        const s = String(cell ?? '');
        return s.includes(',') || s.includes('"') || s.includes('\n') ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(',')
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    this.toast('已导出 ' + filename);
  },
};

// 启动
document.addEventListener('DOMContentLoaded', () => App.init());
/**
 * 后台管控端
 */
const Admin = {
  data: {
    stats: {}, stores: [], accounts: [], ingredients: [],
    orders: [], deliveries: [], warehouses: [],
  },

  async render() {
    const tab = App.tabState.admin || 0;
    const acc = App.state.account;
    const sub = `${acc.name} · ${acc.role === 'developer' ? '开发者' : '总部账号'}`;
    const html = App.topBar('后台管控端', sub) + '<div class="container" id="admin-container">加载中...</div>';
    document.getElementById('app').innerHTML = html;

    try {
      await this.loadData();
    } catch (e) {
      document.getElementById('admin-container').innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-text">${e.message}</div></div>`;
      return;
    }

    const pages = [this.pageDashboard, this.pageStores, this.pageAccounts, this.pageIngredients, this.pageMore];
    document.getElementById('admin-container').innerHTML = pages[tab].call(this);
    // 后台端不需要 tab bar，但为了移动端友好，加上导航
    if (!document.querySelector('.tab-bar')) {
      document.getElementById('app').innerHTML += this.renderTabBar();
    }
  },

  renderTabBar() {
    const tabs = [
      { icon: '📊', label: '看板' },
      { icon: '🏪', label: '门店' },
      { icon: '👤', label: '账号' },
      { icon: '🥬', label: '食材' },
      { icon: '⚙️', label: '更多' },
    ];
    const active = App.tabState.admin || 0;
    return `<div class="tab-bar">
      ${tabs.map((t, i) => `
        <div class="tab-item ${i === active ? 'active' : ''}" onclick="App.switchTab('admin', ${i})">
          <div class="ti-icon">${t.icon}</div>
          <div class="ti-label">${t.label}</div>
        </div>
      `).join('')}
    </div>`;
  },

  async loadData() {
    const [stats, stores, accounts, ingredients, orders, deliveries, warehouses] = await Promise.all([
      API.getAdminStats(),
      API.listStores(),
      API.listAccounts(),
      API.listIngredients(),
      API.getStoreOrders(),
      API.getDeliveries(),
      API.listWarehouses(),
    ]);
    this.data = { stats, stores, accounts, ingredients, orders, deliveries, warehouses };
  },

  // ===== Tab 0: 看板 =====
  pageDashboard() {
    const s = this.data.stats;
    return `
      <div class="stats-grid cols-4">
        <div class="stat-item"><div class="stat-value">${s.stores}</div><div class="stat-label">门店</div></div>
        <div class="stat-item info"><div class="stat-value">${(this.data.warehouses || []).length}</div><div class="stat-label">分仓</div></div>
        <div class="stat-item success"><div class="stat-value">${s.ingredients}</div><div class="stat-label">食材</div></div>
        <div class="stat-item warning"><div class="stat-value">${s.pendingOrders}</div><div class="stat-label">待处理</div></div>
      </div>
      ${this.data.warehouses && this.data.warehouses.length > 0 ? `
      <div class="card">
        <div class="card-title">🏭 分仓一览</div>
        ${this.data.warehouses.map(wh => `
          <div class="list-item">
            <div class="li-main"><div class="li-title">${wh.name}</div><div class="li-sub">${wh.id} · ${wh.type || '未分类'} · ${this.data.ingredients.filter(i => i.warehouseId === wh.id).length}项食材</div></div>
            <div class="li-right"><span class="text-sm text-gray">${this.data.accounts.filter(a => a.warehouseId === wh.id && a.role === 'warehouse').length}个账号</span></div>
          </div>
        `).join('')}
      </div>` : ''}
      <div class="card">
        <div class="card-title">📈 业务数据</div>
        <div class="list-item"><div class="li-main"><div class="li-title">入库单</div></div><div class="li-right"><span class="text-bold">${s.inbound}</span></div></div>
        <div class="list-item"><div class="li-main"><div class="li-title">出库单</div></div><div class="li-right"><span class="text-bold">${s.outbound}</span></div></div>
        <div class="list-item"><div class="li-main"><div class="li-title">门店订单</div></div><div class="li-right"><span class="text-bold">${s.orders}</span></div></div>
        <div class="list-item"><div class="li-main"><div class="li-title">配送中</div></div><div class="li-right"><span class="text-bold text-info">${s.inTransit}</span></div></div>
        <div class="list-item"><div class="li-main"><div class="li-title">验货单</div></div><div class="li-right"><span class="text-bold">${s.receiving}</span></div></div>
        <div class="list-item"><div class="li-main"><div class="li-title">耗用核算</div></div><div class="li-right"><span class="text-bold">${s.consumption}</span></div></div>
      </div>
      <div class="card">
        <div class="card-title">📨 最新订单</div>
        ${this.data.orders.slice(0, 5).map(o => `
          <div class="list-item" onclick="Admin.viewOrder('${o.id}')">
            <div class="li-main">
              <div class="li-title">${o.storeName} · ${o.items.length}项 · ¥${o.totalAmount}${o.warehouseName ? ' · 🏭' + o.warehouseName : ''}</div>
              <div class="li-sub">${o.id} · ${o.createdAt}</div>
            </div>
            <div class="li-right"><span class="badge badge-${o.status}">${App.statusText(o.status)}</span></div>
          </div>
        `).join('') || '<div class="empty-state"><div class="empty-text">暂无订单</div></div>'}
      </div>
    `;
  },

  // ===== Tab 1: 门店管理 =====
  pageStores() {
    return `
      <div class="flex-between mb-12">
        <span class="text-sm text-gray2">共 ${this.data.stores.length} 家门店</span>
        <button class="btn btn-primary btn-sm" onclick="Admin.showStoreForm()">+ 新增门店</button>
      </div>
      <div class="card">
        ${this.data.stores.map(s => `
          <div class="list-item">
            <div class="li-main">
              <div class="li-title">${s.name}</div>
              <div class="li-sub">${s.id} · ${s.type || '未分类'} · ${s.address || '无地址'}</div>
            </div>
            <div class="li-right">
              <div style="display:flex;gap:8px">
                <span class="text-info text-sm" onclick="Admin.showStoreForm('${s.id}')">编辑</span>
                <span class="text-danger text-sm" onclick="Admin.deleteStore('${s.id}')">删除</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  showStoreForm(id) {
    const store = id ? this.data.stores.find(s => s.id === id) : null;
    const html = `
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet">
        <div class="sheet-header"><span class="title">${store ? '编辑门店' : '新增门店'}</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
        <div class="sheet-body">
          <div class="form-group"><label class="form-label">门店号（自定义）</label><input class="form-input" id="sf-id" value="${store?.id || ''}" placeholder="如 ST006" ${store ? 'disabled' : ''} /></div>
          <div class="form-group"><label class="form-label">门店名称</label><input class="form-input" id="sf-name" value="${store?.name || ''}" placeholder="如：御前十七·新店" /></div>
          <div class="form-group"><label class="form-label">类型</label><input class="form-input" id="sf-type" value="${store?.type || ''}" placeholder="日料/热寿司/卤肉饭等" /></div>
          <div class="form-group"><label class="form-label">地址</label><input class="form-input" id="sf-address" value="${store?.address || ''}" placeholder="详细地址" /></div>
          <div class="form-group"><label class="form-label">电话</label><input class="form-input" id="sf-phone" value="${store?.phone || ''}" placeholder="联系电话" /></div>
        </div>
        <div class="sheet-footer">
          <button class="btn btn-outline btn-block" onclick="App.closeModal()">取消</button>
          <button class="btn btn-primary btn-block" onclick="Admin.submitStore('${id || ''}')">${store ? '保存' : '添加'}</button>
        </div>
      </div>
    `;
    App.showModal(html);
  },

  async submitStore(id) {
    const data = {
      id: document.getElementById('sf-id').value.trim(),
      name: document.getElementById('sf-name').value.trim(),
      type: document.getElementById('sf-type').value.trim(),
      address: document.getElementById('sf-address').value.trim(),
      phone: document.getElementById('sf-phone').value.trim(),
    };
    if (!data.name) return App.toast('门店名称不能为空');
    if (!id && !data.id) return App.toast('门店号不能为空');
    try {
      if (id) await API.updateStore(id, data);
      else await API.createStore(data);
      App.closeModal();
      App.toast(id ? '已保存' : '已添加');
      this.render();
    } catch (e) { App.toast(e.message); }
  },

  async deleteStore(id) {
    if (!await App.confirm('确认删除该门店？关联库存也会清除')) return;
    try {
      await API.deleteStore(id);
      App.toast('已删除');
      this.render();
    } catch (e) { App.toast(e.message); }
  },

  // ===== Tab 2: 账号管理 =====
  pageAccounts() {
    const roleLabel = { admin: '总部', warehouse: '仓库', store: '门店', developer: '开发者' };
    return `
      <div class="flex-between mb-12">
        <span class="text-sm text-gray2">共 ${this.data.accounts.length} 个账号</span>
        <button class="btn btn-primary btn-sm" onclick="Admin.showAccountForm()">+ 新增账号</button>
      </div>
      <div class="card">
        ${this.data.accounts.map(a => {
          let subText = a.phone;
          if (a.storeId) subText += ' · ' + (this.data.stores.find(s => s.id === a.storeId)?.name || a.storeId);
          if (a.warehouseId) subText += ' · 🏭 ' + ((this.data.warehouses || []).find(w => w.id === a.warehouseId)?.name || a.warehouseId);
          return `
          <div class="list-item">
            <div class="li-main">
              <div class="li-title">${a.name} <span class="badge badge-${a.role}">${roleLabel[a.role]}</span></div>
              <div class="li-sub">${subText}</div>
            </div>
            <div class="li-right">
              <div style="display:flex;gap:8px">
                <span class="text-info text-sm" onclick="Admin.showAccountForm('${a.id}')">编辑</span>
                ${a.role !== 'developer' ? `<span class="text-danger text-sm" onclick="Admin.deleteAccount('${a.id}')">删除</span>` : ''}
              </div>
            </div>
          </div>
        `;}).join('')}
      </div>
      <div class="card" style="background:#fffbe6;border:1px solid #ffe58f">
        <div class="text-sm text-gray2">💡 账号说明</div>
        <div class="text-sm mt-8" style="line-height:1.8">
          • <b>开发者账号</b>：系统级，审核注册申请，可切换三端<br>
          • <b>总部账号</b>：可切换后台/仓库/门店三端<br>
          • <b>仓库账号</b>：只能使用分配的分仓仓库端<br>
          • <b>门店账号</b>：只能使用所属门店端<br>
          • 开发者账号不可删除
        </div>
      </div>
    `;
  },

  showAccountForm(id) {
    const acc = id ? this.data.accounts.find(a => a.id === id) : null;
    const storeOptions = this.data.stores.map(s => `<option value="${s.id}" ${acc?.storeId === s.id ? 'selected' : ''}>${s.name}</option>`).join('');
    const warehouseOptions = (this.data.warehouses || []).map(w => `<option value="${w.id}" ${acc?.warehouseId === w.id ? 'selected' : ''}>${w.name}</option>`).join('');
    const html = `
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet">
        <div class="sheet-header"><span class="title">${acc ? '编辑账号' : '新增账号'}</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
        <div class="sheet-body">
          <div class="form-group"><label class="form-label">姓名</label><input class="form-input" id="af-name" value="${acc?.name || ''}" placeholder="如：张三" /></div>
          <div class="form-group"><label class="form-label">手机号</label><input class="form-input" id="af-phone" type="tel" maxlength="11" value="${acc?.phone || ''}" placeholder="11位手机号" ${acc ? 'disabled' : ''} /></div>
          <div class="form-group"><label class="form-label">角色</label>
            <select class="form-input" id="af-role" onchange="Admin.onRoleChange()">
              <option value="warehouse" ${acc?.role === 'warehouse' ? 'selected' : ''}>仓库端</option>
              <option value="store" ${acc?.role === 'store' ? 'selected' : ''}>门店端</option>
              <option value="admin" ${acc?.role === 'admin' ? 'selected' : ''}>总部（可切换三端）</option>
            </select>
          </div>
          <div class="form-group" id="af-warehouse-group" style="${acc?.role === 'warehouse' || (!acc && true) ? '' : 'display:none'}">
            <label class="form-label">所属分仓</label>
            <select class="form-input" id="af-warehouseId"><option value="">请选择分仓</option>${warehouseOptions}</select>
          </div>
          <div class="form-group" id="af-store-group" style="${acc?.role === 'store' || (!acc && false) ? '' : 'display:none'}">
            <label class="form-label">所属门店</label>
            <select class="form-input" id="af-storeId"><option value="">请选择</option>${storeOptions}</select>
          </div>
          <div class="form-group"><label class="form-label">${acc ? '新密码（留空不改）' : '密码'}</label><input class="form-input" id="af-password" type="password" placeholder="${acc ? '留空则不修改' : '请输入密码'}" /></div>
        </div>
        <div class="sheet-footer">
          <button class="btn btn-outline btn-block" onclick="App.closeModal()">取消</button>
          <button class="btn btn-primary btn-block" onclick="Admin.submitAccount('${id || ''}')">${acc ? '保存' : '创建'}</button>
        </div>
      </div>
    `;
    App.showModal(html);
    if (!acc) Admin.onRoleChange();
    if (acc?.storeId) document.getElementById('af-storeId').value = acc.storeId;
    if (acc?.warehouseId) document.getElementById('af-warehouseId').value = acc.warehouseId;
  },

  onRoleChange() {
    const role = document.getElementById('af-role').value;
    document.getElementById('af-store-group').style.display = role === 'store' ? '' : 'none';
    document.getElementById('af-warehouse-group').style.display = role === 'warehouse' ? '' : 'none';
  },

  async submitAccount(id) {
    const data = {
      name: document.getElementById('af-name').value.trim(),
      phone: document.getElementById('af-phone').value.trim(),
      role: document.getElementById('af-role').value,
      storeId: document.getElementById('af-storeId')?.value || null,
      warehouseId: document.getElementById('af-warehouseId')?.value || null,
      password: document.getElementById('af-password').value.trim(),
    };
    if (!data.name) return App.toast('姓名不能为空');
    if (!id && !data.phone) return App.toast('手机号不能为空');
    if (!id && !data.password) return App.toast('密码不能为空');
    if (data.role === 'store' && !data.storeId) return App.toast('门店账号需指定门店');
    if (data.role === 'warehouse' && !data.warehouseId) return App.toast('仓库账号需指定分仓');
    if (!data.password) delete data.password;
    try {
      if (id) await API.updateAccount(id, data);
      else await API.createAccount(data);
      App.closeModal();
      App.toast(id ? '已保存' : '已创建');
      this.render();
    } catch (e) { App.toast(e.message); }
  },

  async deleteAccount(id) {
    if (!await App.confirm('确认删除该账号？')) return;
    try {
      await API.deleteAccount(id);
      App.toast('已删除');
      this.render();
    } catch (e) { App.toast(e.message); }
  },

  // ===== Tab 3: 食材管理 =====
  pageIngredients() {
    const warehouses = this.data.warehouses || [];
    return `
      <div class="flex-between mb-12">
        <span class="text-sm text-gray2">共 ${this.data.ingredients.length} 项食材</span>
        <button class="btn btn-primary btn-sm" onclick="Admin.showIngredientForm()">+ 新增品项</button>
      </div>
      <div class="card">
        ${this.data.ingredients.map(ing => {
          const wh = warehouses.find(w => w.id === ing.warehouseId);
          const whName = wh ? wh.name : '未分配';
          return `
          <div class="list-item">
            <div class="li-main">
              <div class="li-title">${ing.name} <span class="text-gray text-sm">/${ing.unit}</span> <span class="badge badge-info" style="font-size:11px">${whName}</span></div>
              <div class="li-sub">${ing.category} · ${ing.spec || ''} · ${ing.supplier || ''}</div>
            </div>
            <div class="li-right">
              <div style="font-size:12px;color:var(--text2)">进价¥${ing.referencePrice} → 出价<b style="color:var(--primary)">¥${ing.outboundPrice || 0}</b></div>
              <div style="display:flex;gap:8px;margin-top:4px">
                <span class="text-info text-sm" onclick="Admin.showIngredientForm('${ing.id}')">编辑</span>
                <span class="text-danger text-sm" onclick="Admin.deleteIngredient('${ing.id}')">删除</span>
              </div>
            </div>
          </div>
        `;}).join('')}
      </div>
    `;
  },

  showIngredientForm(id) {
    const ing = id ? this.data.ingredients.find(i => i.id === id) : null;
    const warehouseOptions = (this.data.warehouses || []).map(w => `<option value="${w.id}" ${ing?.warehouseId === w.id ? 'selected' : ''}>${w.name}（${w.type || '未分类'}）</option>`).join('');
    const html = `
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet">
        <div class="sheet-header"><span class="title">${ing ? '编辑品项' : '新增品项'}</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
        <div class="sheet-body">
          <div class="form-group"><label class="form-label">品名</label><input class="form-input" id="if-name" value="${ing?.name || ''}" placeholder="如：三文鱼" /></div>
          <div class="form-group"><label class="form-label">所属分仓</label>
            <select class="form-input" id="if-warehouseId"><option value="">请选择分仓</option>${warehouseOptions}</select>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">分类</label><input class="form-input" id="if-category" value="${ing?.category || ''}" placeholder="海鲜/主食等" /></div>
            <div class="form-group"><label class="form-label">单位</label><input class="form-input" id="if-unit" value="${ing?.unit || ''}" placeholder="kg/瓶/包" /></div>
          </div>
          <div class="form-group"><label class="form-label">规格</label><input class="form-input" id="if-spec" value="${ing?.spec || ''}" placeholder="如：冰鲜整条" /></div>
          <div class="form-group"><label class="form-label">供应商</label><input class="form-input" id="if-supplier" value="${ing?.supplier || ''}" /></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">进货参考价</label><input class="form-input" id="if-referencePrice" type="number" value="${ing?.referencePrice || 0}" /></div>
            <div class="form-group"><label class="form-label">出库价（门店下单用）</label><input class="form-input" id="if-outboundPrice" type="number" value="${ing?.outboundPrice || 0}" /></div>
          </div>
          <div class="form-group"><label class="form-label">预警阈值</label><input class="form-input" id="if-warningThreshold" type="number" value="${ing?.warningThreshold || 0}" /></div>
        </div>
        <div class="sheet-footer">
          <button class="btn btn-outline btn-block" onclick="App.closeModal()">取消</button>
          <button class="btn btn-primary btn-block" onclick="Admin.submitIngredient('${id || ''}')">${ing ? '保存' : '添加'}</button>
        </div>
      </div>
    `;
    App.showModal(html);
    if (ing?.warehouseId) document.getElementById('if-warehouseId').value = ing.warehouseId;
  },

  async submitIngredient(id) {
    const data = {
      name: document.getElementById('if-name').value.trim(),
      warehouseId: document.getElementById('if-warehouseId').value.trim() || 'WH001',
      category: document.getElementById('if-category').value.trim() || '食材',
      unit: document.getElementById('if-unit').value.trim(),
      spec: document.getElementById('if-spec').value.trim(),
      supplier: document.getElementById('if-supplier').value.trim(),
      referencePrice: parseFloat(document.getElementById('if-referencePrice').value) || 0,
      outboundPrice: parseFloat(document.getElementById('if-outboundPrice').value) || 0,
      warningThreshold: parseFloat(document.getElementById('if-warningThreshold').value) || 0,
    };
    if (!data.name || !data.unit) return App.toast('品名和单位不能为空');
    if (!data.warehouseId) return App.toast('请选择所属分仓');
    try {
      if (id) await API.updateIngredient(id, data);
      else await API.createIngredient(data);
      App.closeModal();
      App.toast(id ? '已保存' : '已添加');
      this.render();
    } catch (e) { App.toast(e.message); }
  },

  async deleteIngredient(id) {
    if (!await App.confirm('确认删除该品项？关联库存也会清除')) return;
    try {
      await API.deleteIngredient(id);
      App.toast('已删除');
      this.render();
    } catch (e) { App.toast(e.message); }
  },

  // ===== Tab 4: 更多 =====
  pageMore() {
    const isDeveloper = App.state.account.role === 'developer';
    return `
      ${isDeveloper ? `
      <div class="card">
        <div class="card-title">📝 注册申请管理</div>
        <div class="list-item" onclick="Admin.showApplications()"><div class="li-main"><div class="li-title">审核注册申请</div><div class="li-sub">查看并审批超级管理员注册申请</div></div><span class="text-gray">→</span></div>
      </div>` : ''}
      <div class="card">
        <div class="card-title">业务监控</div>
        <div class="list-item" onclick="Admin.pageAllOrders()"><div class="li-main"><div class="li-title">📨 全部订单</div><div class="li-sub">查看所有门店订单</div></div><span class="text-gray">→</span></div>
        <div class="list-item" onclick="Admin.pageAllDeliveries()"><div class="li-main"><div class="li-title">🚚 全部配送</div><div class="li-sub">查看所有配送单及状态</div></div><span class="text-gray">→</span></div>
      </div>
      <div class="card">
        <div class="card-title">数据导出</div>
        <div class="list-item" onclick="Admin.showExportPanel()"><div class="li-main"><div class="li-title">📊 导出报表</div><div class="li-sub">盘存/入库/出库等周期数据导出</div></div><span class="text-gray">→</span></div>
        <div class="list-item" onclick="Admin.exportData()"><div class="li-main"><div class="li-title">📋 导出全部数据</div><div class="li-sub">导出全部数据为 JSON</div></div><span class="text-gray">→</span></div>
      </div>
      <div class="card">
        <div class="card-title">🏭 分仓管理</div>
        <div class="list-item" onclick="Admin.showWarehouseManagement()"><div class="li-main"><div class="li-title">分仓设置</div><div class="li-sub">管理冻货仓、蔬菜生鲜仓、物料仓等</div></div><span class="text-gray">→</span></div>
      </div>
      <div class="card">
        <div class="card-title">系统管理</div>
        <div class="list-item" onclick="Admin.showEnterpriseForm()"><div class="li-main"><div class="li-title">🏢 企业信息</div><div class="li-sub">设置企业名称</div></div><span class="text-gray">→</span></div>
        <div class="list-item" onclick="Admin.resetData()"><div class="li-main"><div class="li-title text-danger">🗑 重置数据</div><div class="li-sub">恢复初始状态（慎用）</div></div><span class="text-gray">→</span></div>
      </div>
      <div style="text-align:center;padding:16px 0"><span class="text-sm text-gray">灰鲸餐创·供应链管理系统 v2.3</span></div>
    `;
  },

  async pageAllOrders() {
    const orders = this.data.orders;
    const html = `
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet">
        <div class="sheet-header"><span class="title">全部订单 (${orders.length})</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
        <div class="sheet-body">
          ${orders.map(o => `
            <div class="list-item" onclick="Admin.viewOrder('${o.id}')">
              <div class="li-main">
                <div class="li-title">${o.storeName} · ${o.items.length}项 · ¥${o.totalAmount}${o.warehouseName ? ' · 🏭' + o.warehouseName : ''}</div>
                <div class="li-sub">${o.id} · ${o.createdAt}</div>
              </div>
              <div class="li-right"><span class="badge badge-${o.status}">${App.statusText(o.status)}</span></div>
            </div>
          `).join('') || '<div class="empty-state"><div class="empty-text">暂无订单</div></div>'}
        </div>
        <div class="sheet-footer"><button class="btn btn-outline btn-block" onclick="App.closeModal()">关闭</button></div>
      </div>
    `;
    App.showModal(html);
  },

  async viewOrder(id) {
    const order = this.data.orders.find(o => o.id === id);
    if (!order) return;
    const html = `
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet">
        <div class="sheet-header"><span class="title">订单详情</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
        <div class="sheet-body">
          <div class="detail-section"><div class="ds-label">订单号</div><div class="ds-value">${order.id}</div></div>
          <div class="detail-section"><div class="ds-label">门店</div><div class="ds-value">${order.storeName}</div></div>
          ${order.warehouseName ? `<div class="detail-section"><div class="ds-label">分仓</div><div class="ds-value">🏭 ${order.warehouseName}</div></div>` : ''}
          <div class="detail-section"><div class="ds-label">下单时间</div><div class="ds-value">${order.createdAt}</div></div>
          <div class="detail-section"><div class="ds-label">期望送达</div><div class="ds-value">${order.expectedDate}</div></div>
          <div class="detail-section"><div class="ds-label">状态</div><div class="ds-value"><span class="badge badge-${order.status}">${App.statusText(order.status)}</span></div></div>
          ${order.remark ? `<div class="detail-section"><div class="ds-label">备注</div><div class="ds-value">${order.remark}</div></div>` : ''}
          <div class="detail-section"><div class="ds-label">订单明细</div>
            <div class="mini-table">
              <div class="th"><span style="flex:2">品项</span><span style="flex:1;text-align:right">数量</span><span style="flex:1;text-align:right">单价</span><span style="flex:1;text-align:right">金额</span></div>
              ${order.items.map(i => `<div class="td"><span style="flex:2">${i.name}</span><span style="flex:1;text-align:right">${i.quantity}${i.unit}</span><span style="flex:1;text-align:right">¥${i.unitPrice}</span><span style="flex:1;text-align:right">¥${i.amount}</span></div>`).join('')}
              <div class="td" style="font-weight:600"><span style="flex:3">合计</span><span style="flex:1;text-align:right">¥${order.totalAmount}</span></div>
            </div>
          </div>
        </div>
        <div class="sheet-footer"><button class="btn btn-outline btn-block" onclick="App.closeModal()">关闭</button></div>
      </div>
    `;
    App.showModal(html);
  },

  async pageAllDeliveries() {
    const deliveries = this.data.deliveries;
    const html = `
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet">
        <div class="sheet-header"><span class="title">全部配送 (${deliveries.length})</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
        <div class="sheet-body">
          ${deliveries.map(d => `
            <div class="list-item">
              <div class="li-main">
                <div class="li-title">${d.storeName} · ${d.items.length}项 · ${d.driver || '未指派'}</div>
                <div class="li-sub">${d.id} · ${d.createdAt}</div>
              </div>
              <div class="li-right"><span class="badge badge-${d.status === 'in-transit' ? 'in-transit' : 'delivered'}">${App.statusText(d.status)}</span></div>
            </div>
          `).join('') || '<div class="empty-state"><div class="empty-text">暂无配送</div></div>'}
        </div>
        <div class="sheet-footer"><button class="btn btn-outline btn-block" onclick="App.closeModal()">关闭</button></div>
      </div>
    `;
    App.showModal(html);
  },

  async exportData() {
    try {
      const data = await API.exportData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scmp-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      App.toast('已导出');
    } catch (e) { App.toast(e.message); }
  },

  async resetData() {
    if (!await App.confirm('⚠️ 确认重置所有数据？此操作不可恢复！')) return;
    try {
      await API.resetData();
      App.toast('已重置');
      this.render();
    } catch (e) { App.toast(e.message); }
  },

  // ===== 注册申请管理（开发者） =====
  async showApplications() {
    let apps = [];
    try { apps = await API.listApplications(); } catch (e) { return App.toast(e.message); }
    const pending = apps.filter(a => a.status === 'pending');
    const processed = apps.filter(a => a.status !== 'pending');
    App.showModal(`
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet">
        <div class="sheet-header"><span class="title">注册申请管理 (${pending.length} 待审核)</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
        <div class="sheet-body">
          ${pending.length > 0 ? `<div class="card-title">待审核</div>` : '<div class="empty-state"><div class="empty-text">暂无待审核申请</div></div>'}
          ${pending.map(a => `
            <div style="background:#fffbe6;border:1px solid #ffe58f;border-radius:8px;padding:12px;margin-bottom:10px">
              <div style="font-weight:600;font-size:15px">${a.enterpriseName}</div>
              <div class="text-sm text-gray2" style="margin-top:4px">${a.name} · ${a.phone}</div>
              <div class="text-sm text-gray2">申请时间: ${a.createdAt}</div>
              <div style="display:flex;gap:8px;margin-top:10px">
                <button class="btn btn-primary btn-sm" style="flex:1" onclick="Admin.approveApp('${a.id}')">通过</button>
                <button class="btn btn-outline btn-sm" style="flex:1;border-color:var(--danger);color:var(--danger)" onclick="Admin.rejectApp('${a.id}')">拒绝</button>
              </div>
            </div>
          `).join('')}
          ${processed.length > 0 ? `<div class="card-title" style="margin-top:16px">已处理</div>` : ''}
          ${processed.map(a => `
            <div class="list-item">
              <div class="li-main">
                <div class="li-title">${a.enterpriseName} · ${a.name}</div>
                <div class="li-sub">${a.phone} · ${a.createdAt}</div>
              </div>
              <div class="li-right">
                <span class="badge badge-${a.status === 'approved' ? 'completed' : 'pending'}">${a.status === 'approved' ? '已通过' : '已拒绝'}</span>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="sheet-footer"><button class="btn btn-outline btn-block" onclick="App.closeModal()">关闭</button></div>
      </div>
    `);
  },

  async approveApp(id) {
    if (!await App.confirm('确认通过该申请？将创建超级管理员账号')) return;
    try {
      await API.approveApplication(id);
      App.toast('已通过，管理员账号已创建');
      App.closeModal();
      this.showApplications();
    } catch (e) { App.toast(e.message); }
  },

  async rejectApp(id) {
    const reason = prompt('请输入拒绝原因（选填）') || '';
    try {
      await API.rejectApplication(id, reason);
      App.toast('已拒绝');
      App.closeModal();
      this.showApplications();
    } catch (e) { App.toast(e.message); }
  },

  // ===== 数据导出 =====
  showExportPanel() {
    const today = new Date().toISOString().slice(0, 10);
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    App.showModal(`
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet">
        <div class="sheet-header"><span class="title">数据导出</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
        <div class="sheet-body">
          <div class="form-row">
            <div class="form-group"><label class="form-label">开始日期</label><input class="form-input" id="ex-start" type="date" value="${monthAgo}" /></div>
            <div class="form-group"><label class="form-label">结束日期</label><input class="form-input" id="ex-end" type="date" value="${today}" /></div>
          </div>
          <div class="card-title">仓库数据</div>
          <div class="list-item" onclick="Admin.doExport('warehouse-checks')"><div class="li-main"><div class="li-title">📋 仓库盘存数据</div><div class="li-sub">食材数量和差异明细</div></div><span class="text-info">导出 →</span></div>
          <div class="list-item" onclick="Admin.doExport('warehouse-inbound')"><div class="li-main"><div class="li-title">📋 仓库入库数据</div><div class="li-sub">食材数量和金额明细</div></div><span class="text-info">导出 →</span></div>
          <div class="list-item" onclick="Admin.doExport('warehouse-outbound')"><div class="li-main"><div class="li-title">📋 仓库出库数据</div><div class="li-sub">食材数量和金额明细</div></div><span class="text-info">导出 →</span></div>
          <div class="card-title" style="margin-top:12px">门店数据</div>
          <div class="list-item" onclick="Admin.doExport('store-checks')"><div class="li-main"><div class="li-title">📋 门店盘存数据</div><div class="li-sub">各门店食材数量和差异明细</div></div><span class="text-info">导出 →</span></div>
          <div class="list-item" onclick="Admin.doExport('store-inbound')"><div class="li-main"><div class="li-title">📋 门店入库数据</div><div class="li-sub">各门店验货入库食材金额明细</div></div><span class="text-info">导出 →</span></div>
        </div>
        <div class="sheet-footer"><button class="btn btn-outline btn-block" onclick="App.closeModal()">关闭</button></div>
      </div>
    `);
  },

  async doExport(type) {
    const startDate = document.getElementById('ex-start')?.value || '';
    const endDate = document.getElementById('ex-end')?.value || '';
    try {
      App.toast('正在导出...');
      if (type === 'warehouse-checks') {
        const list = await API.exportWarehouseChecks(startDate, endDate);
        const headers = ['盘存单号', '盘存时间', '品项', '系统数量', '实盘数量', '差异', '单位'];
        const rows = [];
        list.forEach(c => c.items.forEach(i => rows.push([c.id, c.createdAt, i.name, i.systemQty, i.actualQty, i.difference, i.unit])));
        App.exportCSV(`仓库盘存_${startDate}_${endDate}.csv`, headers, rows);
      } else if (type === 'warehouse-inbound') {
        const list = await API.exportWarehouseInbound(startDate, endDate);
        const headers = ['入库单号', '入库时间', '供应商', '品项', '数量', '单位', '单价', '金额'];
        const rows = [];
        list.forEach(o => o.items.forEach(i => rows.push([o.id, o.createdAt, o.supplier, i.name, i.quantity, i.unit, i.price, i.amount])));
        App.exportCSV(`仓库入库_${startDate}_${endDate}.csv`, headers, rows);
      } else if (type === 'warehouse-outbound') {
        const list = await API.exportWarehouseOutbound(startDate, endDate);
        const headers = ['出库单号', '出库时间', '门店', '品项', '数量', '单位', '单价', '金额'];
        const rows = [];
        list.forEach(o => o.items.forEach(i => rows.push([o.id, o.createdAt, o.storeName, i.name, i.quantity, i.unit, i.unitPrice || 0, i.amount || 0])));
        App.exportCSV(`仓库出库_${startDate}_${endDate}.csv`, headers, rows);
      } else if (type === 'store-checks') {
        const list = await API.exportStoreChecks(null, startDate, endDate);
        const headers = ['盘存单号', '盘存时间', '门店', '品项', '系统数量', '实盘数量', '差异', '单位'];
        const rows = [];
        const stores = this.data.stores;
        list.forEach(c => {
          const store = stores.find(s => s.id === c.storeId);
          c.items.forEach(i => rows.push([c.id, c.createdAt, store ? store.name : c.storeId || '', i.name, i.systemQty, i.actualQty, i.difference, i.unit]));
        });
        App.exportCSV(`门店盘存_${startDate}_${endDate}.csv`, headers, rows);
      } else if (type === 'store-inbound') {
        const list = await API.exportStoreInbound(null, startDate, endDate);
        const headers = ['验货单号', '验货时间', '门店', '品项', '应收数量', '实收数量', '拒收数量', '单位'];
        const rows = [];
        list.forEach(r => r.items.forEach(i => rows.push([r.id, r.createdAt, r.storeName, i.name, i.orderedQty, i.acceptedQty, i.rejectedQty, i.unit])));
        App.exportCSV(`门店入库_${startDate}_${endDate}.csv`, headers, rows);
      }
    } catch (e) { App.toast(e.message); }
  },

  // ===== 分仓管理 =====
  showWarehouseManagement() {
    const warehouses = this.data.warehouses || [];
    App.showModal(`
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet">
        <div class="sheet-header">
          <span class="title">分仓管理 (${warehouses.length})</span>
          <span class="sheet-close" onclick="App.closeModal()">✕</span>
        </div>
        <div class="sheet-body">
          <div class="flex-between mb-12">
            <span class="text-sm text-gray2">不同分仓负责不同类别食材</span>
            <button class="btn btn-primary btn-sm" onclick="Admin.showWarehouseForm()">+ 新增分仓</button>
          </div>
          ${warehouses.map(wh => {
            const ingCount = this.data.ingredients.filter(i => i.warehouseId === wh.id).length;
            const accCount = this.data.accounts.filter(a => a.warehouseId === wh.id && a.role === 'warehouse').length;
            return `
            <div class="list-item">
              <div class="li-main">
                <div class="li-title">${wh.name} <span class="badge badge-info" style="font-size:11px">${wh.type || '未分类'}</span></div>
                <div class="li-sub">${wh.id} · ${ingCount}项食材 · ${accCount}个账号 · ${wh.description || ''}</div>
              </div>
              <div class="li-right">
                <div style="display:flex;gap:8px">
                  <span class="text-info text-sm" onclick="Admin.showWarehouseForm('${wh.id}')">编辑</span>
                  <span class="text-danger text-sm" onclick="Admin.deleteWarehouse('${wh.id}')">删除</span>
                </div>
              </div>
            </div>
          `;}).join('') || '<div class="empty-state"><div class="empty-text">暂无分仓</div></div>'}
          <div class="card" style="background:#fffbe6;border:1px solid #ffe58f;margin-top:12px">
            <div class="text-sm text-gray2">💡 说明</div>
            <div class="text-sm mt-8" style="line-height:1.8">
              • 分仓用于管理不同类别的食材（如冻货、生鲜、物料）<br>
              • 仓库账号登录后只能看到所属分仓的数据<br>
              • 门店下单时系统自动按食材归属分仓拆分为多个订单<br>
              • 删除分仓前需先移除该仓的食材和账号
            </div>
          </div>
        </div>
        <div class="sheet-footer"><button class="btn btn-outline btn-block" onclick="App.closeModal()">关闭</button></div>
      </div>
    `);
  },

  showWarehouseForm(id) {
    const wh = id ? (this.data.warehouses || []).find(w => w.id === id) : null;
    const typeOptions = ['冻货仓', '蔬菜生鲜仓', '物料仓', '干货仓', '调料仓', '酒水库', '其他'].map(t =>
      `<option value="${t}" ${wh?.type === t ? 'selected' : ''}>${t}</option>`
    ).join('');
    App.showModal(`
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet">
        <div class="sheet-header"><span class="title">${wh ? '编辑分仓' : '新增分仓'}</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
        <div class="sheet-body">
          <div class="form-group"><label class="form-label">分仓编号（自定义）</label><input class="form-input" id="wf-id" value="${wh?.id || ''}" placeholder="如 WH004" ${wh ? 'disabled' : ''} /></div>
          <div class="form-group"><label class="form-label">分仓名称</label><input class="form-input" id="wf-name" value="${wh?.name || ''}" placeholder="如：冻货仓" /></div>
          <div class="form-group"><label class="form-label">分仓类型</label>
            <select class="form-input" id="wf-type"><option value="">请选择</option>${typeOptions}</select>
          </div>
          <div class="form-group"><label class="form-label">描述</label><input class="form-input" id="wf-description" value="${wh?.description || ''}" placeholder="选填，如：存放冷冻食材" /></div>
        </div>
        <div class="sheet-footer">
          <button class="btn btn-outline btn-block" onclick="App.closeModal()">取消</button>
          <button class="btn btn-primary btn-block" onclick="Admin.submitWarehouse('${id || ''}')">${wh ? '保存' : '添加'}</button>
        </div>
      </div>
    `);
    if (wh?.type) document.getElementById('wf-type').value = wh.type;
  },

  async submitWarehouse(id) {
    const data = {
      id: document.getElementById('wf-id').value.trim(),
      name: document.getElementById('wf-name').value.trim(),
      type: document.getElementById('wf-type').value.trim(),
      description: document.getElementById('wf-description').value.trim(),
    };
    if (!data.name) return App.toast('分仓名称不能为空');
    if (!id && !data.id) return App.toast('分仓编号不能为空');
    try {
      if (id) await API.updateWarehouse(id, data);
      else await API.createWarehouse(data);
      App.closeModal();
      App.toast(id ? '已保存' : '已添加');
      await this.loadData();
      this.showWarehouseManagement();
    } catch (e) { App.toast(e.message); }
  },

  async deleteWarehouse(id) {
    if (!await App.confirm('确认删除该分仓？需先移除该仓的食材和账号')) return;
    try {
      await API.deleteWarehouse(id);
      App.toast('已删除');
      await this.loadData();
      this.showWarehouseManagement();
    } catch (e) { App.toast(e.message); }
  },

  // ===== 企业信息设置 =====
  async showEnterpriseForm() {
    let settings = {};
    try { settings = await API.getSettings(); } catch (e) {}
    App.showModal(`
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet">
        <div class="sheet-header"><span class="title">企业信息设置</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
        <div class="sheet-body">
          <div class="form-group"><label class="form-label">企业名称</label><input class="form-input" id="ef-enterprise" value="${settings.enterpriseName || ''}" placeholder="如：灰鲸餐创" /></div>
          <div class="form-group"><label class="form-label">仓库名称</label><input class="form-input" id="ef-warehouse" value="${settings.warehouseName || ''}" placeholder="如：中央仓库" /></div>
          <div class="text-sm text-gray2" style="margin-top:8px">企业名称将显示在所有端登录后的左上角</div>
        </div>
        <div class="sheet-footer">
          <button class="btn btn-outline btn-block" onclick="App.closeModal()">取消</button>
          <button class="btn btn-primary btn-block" onclick="Admin.submitEnterprise()">保存</button>
        </div>
      </div>
    `);
  },

  async submitEnterprise() {
    const enterpriseName = document.getElementById('ef-enterprise').value.trim();
    const warehouseName = document.getElementById('ef-warehouse').value.trim();
    try {
      await API.updateSettings({ enterpriseName, warehouseName });
      // 更新当前账号的企业名称
      App.state.account.enterpriseName = enterpriseName;
      localStorage.setItem('scmp_account', JSON.stringify(App.state.account));
      App.closeModal();
      App.toast('已保存');
      this.render();
    } catch (e) { App.toast(e.message); }
  },
};
/**
 * 仓库管理端
 */
const Warehouse = {
  data: {
    stats: {}, inventory: [], inboundOrders: [], outboundOrders: [],
    checks: [], storeOrders: [], deliveries: [], ingredients: [],
    pendingReviewReceiving: [], warehouses: [],
  },

  async render() {
    const tab = App.tabState.warehouse || 0;
    const acc = App.state.account;
    // 获取当前分仓名称
    let whName = '';
    if (acc.warehouseId) {
      try {
        const warehouses = await API.listWarehouses();
        this.data.warehouses = warehouses;
        const wh = warehouses.find(w => w.id === acc.warehouseId);
        whName = wh ? wh.name : '';
      } catch (e) {}
    }
    const subtitle = whName ? `${acc.name} · 🏭 ${whName}` : acc.name;
    document.getElementById('app').innerHTML = App.topBar('仓库管理端', subtitle) + '<div class="container" id="wh-container">加载中...</div>';

    try {
      await this.loadData();
    } catch (e) {
      document.getElementById('wh-container').innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-text">${e.message}</div></div>`;
      return;
    }

    const pages = [this.pageHome, this.pageInbound, this.pageOutbound, this.pageCheck, this.pageMore];
    document.getElementById('wh-container').innerHTML = pages[tab].call(this);
    document.getElementById('app').innerHTML += App.renderTabBar('warehouse');

    // 启动自动位置上报定时器
    this.startAutoLocationReport();
  },

  async loadData() {
    const [stats, inventory, inboundOrders, outboundOrders, checks, storeOrders, deliveries, ingredients, pendingReviewReceiving] = await Promise.all([
      API.getWarehouseStats(),
      API.getWarehouseInventory(),
      API.getInboundOrders(),
      API.getOutboundOrders(),
      API.getWarehouseChecks(),
      API.getStoreOrders(),
      API.getDeliveries(),
      API.listIngredients(),
      API.getPendingReviewReceiving(),
    ]);
    this.data = { ...this.data, stats, inventory, inboundOrders, outboundOrders, checks, storeOrders, deliveries, ingredients, pendingReviewReceiving };
  },

  // ===== Tab 0: 首页 =====
  pageHome() {
    const s = this.data.stats;
    const pendingExceptions = this.data.pendingReviewReceiving || [];
    const acc = App.state.account;
    const wh = (this.data.warehouses || []).find(w => w.id === acc.warehouseId);
    return `
      ${wh ? `
      <div class="card" style="background:linear-gradient(135deg,var(--primary),var(--primary-dark));color:#fff;border:none">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="font-size:32px">🏭</div>
          <div>
            <div style="font-size:18px;font-weight:700">${wh.name}</div>
            <div style="font-size:13px;opacity:0.9">${wh.type || '未分类'} · ${this.data.inventory.length}项库存</div>
          </div>
        </div>
      </div>` : ''}
      <div class="stats-grid">
        <div class="stat-item"><div class="stat-value">${s.totalItems}</div><div class="stat-label">品项总数</div></div>
        <div class="stat-item ${s.lowStockCount > 0 ? 'warning' : 'success'}"><div class="stat-value">${s.lowStockCount}</div><div class="stat-label">库存预警</div></div>
        <div class="stat-item info"><div class="stat-value">${s.pendingOrders}</div><div class="stat-label">待处理订单</div></div>
        <div class="stat-item success"><div class="stat-value">¥${s.totalValue}</div><div class="stat-label">库存总值</div></div>
      </div>
      ${pendingExceptions.length > 0 ? `
      <div class="card" style="border-left:4px solid var(--warning)">
        <div class="card-title">⚠️ 验货异常待处理 <span class="badge badge-pending">${pendingExceptions.length}单</span></div>
        ${pendingExceptions.map(r => `
          <div class="list-item" onclick="Warehouse.showReceivingException('${r.id}')">
            <div class="li-main">
              <div class="li-title">${r.storeName} · ${r.items.length}项食材</div>
              <div class="li-sub">${r.id} · ${r.items.filter(i => Math.abs(i.acceptedQty - i.orderedQty) > 0.001).length}项异常</div>
            </div>
            <div class="li-right"><button class="btn btn-warning btn-sm">审核</button></div>
          </div>
        `).join('')}
      </div>` : ''}
      <div class="card">
        <div class="card-title">快捷操作</div>
        <div class="quick-actions">
          <div class="quick-action" onclick="App.switchTab('warehouse', 1)"><div class="qa-icon">📥</div><div class="qa-label">入库</div></div>
          <div class="quick-action" onclick="App.switchTab('warehouse', 2)"><div class="qa-icon">📤</div><div class="qa-label">出库</div></div>
          <div class="quick-action" onclick="App.switchTab('warehouse', 3)"><div class="qa-icon">📋</div><div class="qa-label">盘存</div></div>
          <div class="quick-action" onclick="Warehouse.showAllInventory()"><div class="qa-icon">📊</div><div class="qa-label">库存</div></div>
        </div>
      </div>
      ${s.pendingOrders > 0 ? `
      <div class="card" style="border-left:4px solid var(--warning)">
        <div class="card-title">📨 待处理订单 <span class="badge badge-pending">${s.pendingOrders}单</span></div>
        ${this.data.storeOrders.filter(o => o.status === 'pending').map(o => `
          <div class="list-item" onclick="Warehouse.showFulfillForm('${o.id}')">
            <div class="li-main">
              <div class="li-title">${o.storeName} · ${o.items.length}项 · ¥${o.totalAmount}</div>
              <div class="li-sub">${o.id} · 期望 ${o.expectedDate}</div>
            </div>
            <div class="li-right"><button class="btn btn-primary btn-sm">发货</button></div>
          </div>
        `).join('')}
      </div>` : ''}
      ${s.inTransit > 0 ? `
      <div class="card" style="border-left:4px solid var(--info)">
        <div class="card-title">🚚 配送中 <span class="badge badge-in-transit">${s.inTransit}单</span></div>
        ${this.data.deliveries.filter(d => d.status === 'in-transit').map(d => `
          <div class="list-item" onclick="Warehouse.showDeliveryTracking('${d.id}')">
            <div class="li-main"><div class="li-title">${d.storeName} · ${d.driver || '未指派'}</div><div class="li-sub">${d.id}</div></div>
            <div class="li-right"><button class="btn btn-info btn-sm">追踪</button></div>
          </div>
        `).join('')}
      </div>` : ''}
      ${s.lowStockCount > 0 ? `
      <div class="card">
        <div class="card-title">⚠️ 库存预警 <span class="badge badge-low">${s.lowStockCount}项</span></div>
        ${s.lowStockItems.map(i => `
          <div class="inv-item"><div class="inv-info"><div class="inv-name">${i.ingredient?.name}</div><div class="inv-spec">阈值: ${i.ingredient?.warningThreshold}${i.unit}</div></div><div class="inv-qty"><span class="num text-danger">${i.quantity}</span><span class="unit">${i.unit}</span></div></div>
        `).join('')}
      </div>` : ''}
    `;
  },

  // ===== Tab 1: 入库 =====
  pageInbound() {
    return `
      <div class="flex-between mb-12">
        <span class="text-sm text-gray2">入库记录 ${this.data.inboundOrders.length} 条</span>
        <button class="btn btn-primary btn-sm" onclick="Warehouse.showInboundForm()">+ 新建入库</button>
      </div>
      <div class="card">
        ${this.data.inboundOrders.map(o => `
          <div class="list-item" onclick="Warehouse.viewInbound('${o.id}')">
            <div class="li-main"><div class="li-title">${o.supplier} · ${o.items.length}项 · ¥${o.totalAmount}</div><div class="li-sub">${o.id} · ${o.createdAt}</div></div>
            <div class="li-right"><span class="badge badge-completed">已完成</span></div>
          </div>
        `).join('') || '<div class="empty-state"><div class="empty-text">暂无入库记录</div></div>'}
      </div>
    `;
  },

  showInboundForm() {
    const ingredients = this.data.ingredients;
    const html = `
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet">
        <div class="sheet-header"><span class="title">新建入库</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
        <div class="sheet-body">
          <div class="form-group"><label class="form-label">供应商</label><input class="form-input" id="ib-supplier" placeholder="供应商名称" /></div>
          <div class="form-group"><label class="form-label">备注</label><input class="form-input" id="ib-remark" placeholder="选填" /></div>
          <div class="form-group"><label class="form-label">入库明细（填写数量和进价）</label></div>
          ${ingredients.map((ing, i) => `
            <div class="ingredient-row">
              <div class="ir-name"><div class="name">${ing.name}</div><div class="spec">${ing.spec || ''} / ${ing.unit}</div></div>
              <input class="ir-input" type="number" id="ib-qty-${i}" placeholder="数量" />
              <input class="ir-input" type="number" id="ib-price-${i}" placeholder="进价" style="width:70px" value="${ing.referencePrice}" />
              <span class="ir-unit">${ing.unit}</span>
            </div>
          `).join('')}
        </div>
        <div class="sheet-footer">
          <button class="btn btn-outline btn-block" onclick="App.closeModal()">取消</button>
          <button class="btn btn-primary btn-block" onclick="Warehouse.submitInbound()">确认入库</button>
        </div>
      </div>
    `;
    App.showModal(html);
  },

  async submitInbound() {
    const supplier = document.getElementById('ib-supplier').value.trim();
    const remark = document.getElementById('ib-remark').value.trim();
    if (!supplier) return App.toast('请输入供应商名称');
    const items = [];
    this.data.ingredients.forEach((ing, i) => {
      const qty = parseFloat(document.getElementById(`ib-qty-${i}`).value);
      const price = parseFloat(document.getElementById(`ib-price-${i}`).value) || ing.referencePrice;
      if (qty && qty > 0) items.push({ ingredientId: ing.id, name: ing.name, quantity: qty, unit: ing.unit, price });
    });
    if (!items.length) return App.toast('请至少填写一项');
    try {
      await API.createInboundOrder({ supplier, items, remark });
      App.closeModal();
      App.toast('入库成功');
      this.render();
    } catch (e) { App.toast(e.message); }
  },

  viewInbound(id) {
    const o = this.data.inboundOrders.find(x => x.id === id);
    if (!o) return;
    App.showModal(`
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet"><div class="sheet-header"><span class="title">入库详情</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
      <div class="sheet-body">
        <div class="detail-section"><div class="ds-label">单号</div><div class="ds-value">${o.id}</div></div>
        <div class="detail-section"><div class="ds-label">供应商</div><div class="ds-value">${o.supplier}</div></div>
        <div class="detail-section"><div class="ds-label">入库时间</div><div class="ds-value">${o.createdAt}</div></div>
        ${o.remark ? `<div class="detail-section"><div class="ds-label">备注</div><div class="ds-value">${o.remark}</div></div>` : ''}
        <div class="detail-section"><div class="ds-label">入库明细</div>
          <div class="mini-table"><div class="th"><span style="flex:2">品项</span><span style="flex:1;text-align:right">数量</span><span style="flex:1;text-align:right">单价</span><span style="flex:1;text-align:right">金额</span></div>
          ${o.items.map(i => `<div class="td"><span style="flex:2">${i.name}</span><span style="flex:1;text-align:right">${i.quantity}${i.unit}</span><span style="flex:1;text-align:right">¥${i.price}</span><span style="flex:1;text-align:right">¥${i.amount}</span></div>`).join('')}
            <div class="td" style="font-weight:600"><span style="flex:3">合计</span><span style="flex:1;text-align:right">¥${o.totalAmount}</span></div>
          </div>
        </div>
      </div>
      <div class="sheet-footer"><button class="btn btn-outline btn-block" onclick="App.closeModal()">关闭</button></div></div>
    `);
  },

  // ===== Tab 2: 出库 =====
  pageOutbound() {
    const pending = this.data.storeOrders.filter(o => o.status === 'pending');
    return `
      ${pending.length > 0 ? `
      <div class="card" style="border-left:4px solid var(--warning)">
        <div class="card-title">📨 待发货订单 <span class="badge badge-pending">${pending.length}单</span></div>
        ${pending.map(o => `
          <div class="list-item" onclick="Warehouse.showFulfillForm('${o.id}')">
            <div class="li-main">
              <div class="li-title">${o.storeName} · ${o.items.length}项 · ¥${o.totalAmount}</div>
              <div class="li-sub">${o.id} · 期望 ${o.expectedDate}</div>
            </div>
            <div class="li-right"><button class="btn btn-primary btn-sm">发货</button></div>
          </div>
        `).join('')}
      </div>` : ''}
      <div class="flex-between mb-12">
        <span class="text-sm text-gray2">出库记录 ${this.data.outboundOrders.length} 条</span>
        <button class="btn btn-outline btn-sm" onclick="Warehouse.showOutboundForm()">+ 手动出库</button>
      </div>
      <div class="card">
        ${this.data.outboundOrders.map(o => `
          <div class="list-item" onclick="Warehouse.viewOutbound('${o.id}')">
            <div class="li-main"><div class="li-title">${o.storeName} · ${o.items.length}项 · ¥${o.totalAmount}</div><div class="li-sub">${o.id} · ${o.createdAt}</div></div>
            <div class="li-right"><span class="badge badge-completed">已完成</span></div>
          </div>
        `).join('') || '<div class="empty-state"><div class="empty-text">暂无出库记录</div></div>'}
      </div>
    `;
  },

  showFulfillForm(orderId) {
    const order = this.data.storeOrders.find(o => o.id === orderId);
    if (!order) return;
    // 检查库存
    const items = order.items.map(i => {
      const inv = this.data.inventory.find(w => w.ingredientId === i.ingredientId);
      const stock = inv ? inv.quantity : 0;
      return { ...i, stock, enough: stock >= i.quantity };
    });
    const allEnough = items.every(i => i.enough);

    App.showModal(`
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet">
        <div class="sheet-header"><span class="title">订单发货 - ${order.storeName}</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
        <div class="sheet-body">
          <div class="detail-section"><div class="ds-label">订单号</div><div class="ds-value">${order.id}</div></div>
          <div class="detail-section"><div class="ds-label">期望送达</div><div class="ds-value">${order.expectedDate}</div></div>
          <div class="detail-section"><div class="ds-label">订单明细</div>
            <div class="mini-table"><div class="th"><span style="flex:2">品项</span><span style="flex:1;text-align:right">订单量</span><span style="flex:1;text-align:right">库存</span><span style="flex:1;text-align:right">状态</span></div>
              ${items.map(i => `<div class="td"><span style="flex:2">${i.name}</span><span style="flex:1;text-align:right">${i.quantity}${i.unit}</span><span style="flex:1;text-align:right">${i.stock}${i.unit}</span><span style="flex:1;text-align:right">${i.enough ? '<span class="text-success">✓</span>' : '<span class="text-danger">不足</span>'}</span></div>`).join('')}
            </div>
          </div>
          ${!allEnough ? '<div class="card" style="background:#fff2f0;border:1px solid #ffccc7;margin-top:12px"><span class="text-danger text-sm">⚠️ 部分食材库存不足，无法发货。请先入库补充库存。</span></div>' : `
          <div class="form-row" style="margin-top:16px">
            <div class="form-group"><label class="form-label">配送司机 <span style="color:var(--danger)">*</span></label><input class="form-input" id="ff-driver" placeholder="司机姓名" /></div>
            <div class="form-group"><label class="form-label">车牌号</label><input class="form-input" id="ff-vehicle" placeholder="如：粤A·12345" /></div>
          </div>
          <div class="form-group"><label class="form-label">司机电话 <span style="color:var(--danger)">*</span></label><input class="form-input" id="ff-phone" type="tel" placeholder="司机手机号（必填）" maxlength="11" /></div>
          `}
        </div>
        <div class="sheet-footer">
          <button class="btn btn-outline btn-block" onclick="App.closeModal()">取消</button>
          ${allEnough ? `<button class="btn btn-primary btn-block" onclick="Warehouse.confirmFulfill('${order.id}')">确认发货</button>` : ''}
        </div>
      </div>
    `);
  },

  async confirmFulfill(orderId) {
    const driver = document.getElementById('ff-driver').value.trim();
    const vehicle = document.getElementById('ff-vehicle').value.trim();
    const phone = document.getElementById('ff-phone').value.trim();
    if (!driver) return App.toast('请输入司机姓名');
    if (!phone) return App.toast('请填写司机电话');
    if (!/^1\d{10}$/.test(phone)) return App.toast('司机电话格式不正确（11位手机号）');
    try {
      await API.fulfillOrder(orderId, { driver, vehicle, driverPhone: phone });
      App.closeModal();
      App.toast('发货成功，已生成配送单');
      this.render();
    } catch (e) { App.toast(e.message); }
  },

  showOutboundForm() {
    const html = `
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet">
        <div class="sheet-header"><span class="title">手动出库</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
        <div class="sheet-body">
          <div class="form-group"><label class="form-label">出库门店</label><select class="form-input" id="ob-store">${this.data.storeOrders[0] ? '' : ''}<option value="">请选择</option></select></div>
          <div class="form-group"><label class="form-label">备注</label><input class="form-input" id="ob-remark" placeholder="选填" /></div>
          <div class="form-group"><label class="form-label">出库明细</label></div>
          ${this.data.inventory.map((inv, i) => `
            <div class="ingredient-row">
              <div class="ir-name"><div class="name">${inv.ingredient?.name}</div><div class="spec">库存: ${inv.quantity}${inv.unit}</div></div>
              <input class="ir-input" type="number" id="ob-qty-${i}" placeholder="0" />
              <span class="ir-unit">${inv.unit}</span>
            </div>
          `).join('')}
        </div>
        <div class="sheet-footer">
          <button class="btn btn-outline btn-block" onclick="App.closeModal()">取消</button>
          <button class="btn btn-primary btn-block" onclick="Warehouse.submitOutbound()">确认出库</button>
        </div>
      </div>
    `;
    App.showModal(html);
  },

  async submitOutbound() {
    // 简化：手动出库需要选门店（这里用第一个门店作为默认）
    App.toast('请使用订单发货功能出库');
    App.closeModal();
  },

  viewOutbound(id) {
    const o = this.data.outboundOrders.find(x => x.id === id);
    if (!o) return;
    App.showModal(`
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet"><div class="sheet-header"><span class="title">出库详情</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
      <div class="sheet-body">
        <div class="detail-section"><div class="ds-label">单号</div><div class="ds-value">${o.id}</div></div>
        <div class="detail-section"><div class="ds-label">出库门店</div><div class="ds-value">${o.storeName}</div></div>
        <div class="detail-section"><div class="ds-label">出库时间</div><div class="ds-value">${o.createdAt}</div></div>
        ${o.remark ? `<div class="detail-section"><div class="ds-label">备注</div><div class="ds-value">${o.remark}</div></div>` : ''}
        <div class="detail-section"><div class="ds-label">出库明细</div>
          <div class="mini-table"><div class="th"><span style="flex:2">品项</span><span style="flex:1;text-align:right">数量</span><span style="flex:1;text-align:right">单价</span><span style="flex:1;text-align:right">金额</span></div>
            ${o.items.map(i => `<div class="td"><span style="flex:2">${i.name}</span><span style="flex:1;text-align:right">${i.quantity}${i.unit}</span><span style="flex:1;text-align:right">¥${i.unitPrice || 0}</span><span style="flex:1;text-align:right">¥${i.amount || 0}</span></div>`).join('')}
            ${o.totalAmount ? `<div class="td" style="font-weight:600"><span style="flex:3">合计</span><span style="flex:1;text-align:right">¥${o.totalAmount}</span></div>` : ''}
          </div>
        </div>
      </div>
      <div class="sheet-footer"><button class="btn btn-outline btn-block" onclick="App.closeModal()">关闭</button></div></div>
    `);
  },

  // ===== 配送追踪 =====
  async showDeliveryTracking(deliveryId) {
    const del = this.data.deliveries.find(d => d.id === deliveryId);
    if (!del) return;
    let tracks = [];
    try { tracks = await API.getDeliveryTracks(deliveryId); } catch (e) {}

    const hasLocation = del.currentLocation;
    App.showModal(`
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet">
        <div class="sheet-header"><span class="title">配送追踪</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
        <div class="sheet-body">
          <div class="detail-section"><div class="ds-label">配送单号</div><div class="ds-value">${del.id}</div></div>
          <div class="detail-section"><div class="ds-label">目的地</div><div class="ds-value">${del.storeName}</div></div>
          <div class="detail-section"><div class="ds-label">司机 / 车辆</div><div class="ds-value">${del.driver || '--'} / ${del.vehicle || '--'}</div></div>
          <div class="detail-section"><div class="ds-label">状态</div><div class="ds-value"><span class="badge badge-${del.status === 'in-transit' ? 'in-transit' : 'delivered'}">${App.statusText(del.status)}</span></div></div>

          <div class="delivery-map" id="delivery-map">
            <div class="dm-icon">${del.status === 'in-transit' ? '🚚' : '📍'}</div>
            <div class="dm-status">${del.status === 'in-transit' ? '配送中' : '已送达'}</div>
            ${hasLocation ? `<div class="dm-coords">${hasLocation.lat.toFixed(5)}, ${hasLocation.lng.toFixed(5)}</div><div class="dm-time">更新于 ${hasLocation.updatedAt}</div>` : '<div class="dm-coords">暂无位置信息</div>'}
          </div>

          ${del.status === 'in-transit' ? `
          <button class="btn btn-info btn-block mb-12" onclick="Warehouse.reportLocation('${del.id}')">📍 上报当前位置</button>
          ` : ''}

          <div class="card-title">配送轨迹</div>
          <div class="delivery-timeline">
            <div class="timeline-item"><div class="timeline-dot done"></div><div class="timeline-content"><div class="timeline-title">已发货</div><div class="timeline-time">${del.createdAt}</div></div></div>
            ${tracks.map(t => `<div class="timeline-item"><div class="timeline-dot active"></div><div class="timeline-content"><div class="timeline-title">位置更新</div><div class="timeline-time">${t.timestamp} · ${t.lat.toFixed(4)}, ${t.lng.toFixed(4)}</div></div></div>`).join('')}
            ${del.status === 'delivered' ? `<div class="timeline-item"><div class="timeline-dot done"></div><div class="timeline-content"><div class="timeline-title">已送达</div><div class="timeline-time">${del.updatedAt || ''}</div></div></div>` : ''}
          </div>
        </div>
        <div class="sheet-footer"><button class="btn btn-outline btn-block" onclick="App.closeModal()">关闭</button></div>
      </div>
    `);
  },

  async reportLocation(deliveryId) {
    if (!navigator.geolocation) return App.toast('设备不支持定位');
    App.toast('正在获取位置...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await API.updateDeliveryLocation(deliveryId, {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speed: pos.coords.speed || 0,
          });
          App.toast('位置已上报');
          App.closeModal();
          this.showDeliveryTracking(deliveryId);
        } catch (e) { App.toast(e.message); }
      },
      (err) => App.toast('定位失败：' + err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  },

  // ===== Tab 3: 盘存 =====
  pageCheck() {
    return `
      <div class="flex-between mb-12">
        <span class="text-sm text-gray2">盘存记录 ${this.data.checks.length} 次</span>
        <button class="btn btn-primary btn-sm" onclick="Warehouse.showCheckForm()">+ 新建盘存</button>
      </div>
      <div class="card" wx:if="${this.data.checks.length > 0}">
        ${this.data.checks.map(c => `
          <div class="list-item" onclick="Warehouse.viewCheck('${c.id}')">
            <div class="li-main"><div class="li-title">盘存 · ${c.items.length}项</div><div class="li-sub">${c.id} · ${c.createdAt}</div></div>
            <div class="li-right"><span class="badge badge-completed">已完成</span></div>
          </div>
        `).join('')}
      </div>
      <div class="card">
        <div class="card-title">当前仓库库存</div>
        ${this.data.inventory.map(inv => `
          <div class="inv-item">
            <div class="inv-info"><div class="inv-name">${inv.ingredient?.name}</div><div class="inv-spec">${inv.ingredient?.spec || ''}</div></div>
            <div class="inv-qty"><span class="num ${inv.isLow ? 'text-danger' : ''}">${inv.quantity}</span><span class="unit">${inv.unit}</span>${inv.isLow ? '<span class="badge badge-low">低</span>' : ''}</div>
          </div>
        `).join('') || '<div class="empty-state"><div class="empty-text">暂无库存</div></div>'}
      </div>
    `;
  },

  showCheckForm() {
    const html = `
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet">
        <div class="sheet-header"><span class="title">仓库盘存</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
        <div class="sheet-body">
          <div class="text-sm text-gray2" style="margin-bottom:12px">填写实际盘点数量，系统自动计算差异并更新库存</div>
          ${this.data.inventory.map((inv, i) => `
            <div class="ingredient-row">
              <div class="ir-name"><div class="name">${inv.ingredient?.name}</div><div class="spec">系统: ${inv.quantity}${inv.unit}</div></div>
              <input class="ir-input" type="number" id="ck-qty-${i}" value="${inv.quantity}" />
              <span class="ir-unit">${inv.unit}</span>
            </div>
          `).join('')}
        </div>
        <div class="sheet-footer">
          <button class="btn btn-outline btn-block" onclick="App.closeModal()">取消</button>
          <button class="btn btn-primary btn-block" onclick="Warehouse.submitCheck()">确认盘存</button>
        </div>
      </div>
    `;
    App.showModal(html);
  },

  async submitCheck() {
    const items = this.data.inventory.map((inv, i) => ({
      ingredientId: inv.ingredientId, name: inv.ingredient?.name,
      systemQty: inv.quantity, actualQty: parseFloat(document.getElementById(`ck-qty-${i}`).value) || 0, unit: inv.unit,
    }));
    try {
      await API.createWarehouseCheck({ items });
      App.closeModal();
      App.toast('盘存完成');
      this.render();
    } catch (e) { App.toast(e.message); }
  },

  viewCheck(id) {
    const c = this.data.checks.find(x => x.id === id);
    if (!c) return;
    App.showModal(`
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet"><div class="sheet-header"><span class="title">盘存详情</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
      <div class="sheet-body">
        <div class="detail-section"><div class="ds-label">盘存单号</div><div class="ds-value">${c.id}</div></div>
        <div class="detail-section"><div class="ds-label">盘存时间</div><div class="ds-value">${c.createdAt}</div></div>
        <div class="detail-section"><div class="ds-label">盘存明细</div>
          <div class="mini-table"><div class="th"><span style="flex:2">品项</span><span style="flex:1;text-align:right">系统数</span><span style="flex:1;text-align:right">实盘数</span><span style="flex:1;text-align:right">差异</span></div>
            ${c.items.map(i => `<div class="td"><span style="flex:2">${i.name}</span><span style="flex:1;text-align:right">${i.systemQty}${i.unit}</span><span style="flex:1;text-align:right">${i.actualQty}${i.unit}</span><span style="flex:1;text-align:right;color:${i.difference < 0 ? 'var(--danger)' : 'var(--success)'}">${i.difference > 0 ? '+' : ''}${i.difference}</span></div>`).join('')}
          </div>
        </div>
      </div>
      <div class="sheet-footer"><button class="btn btn-outline btn-block" onclick="App.closeModal()">关闭</button></div></div>
    `);
  },

  // ===== Tab 4: 更多 =====
  pageMore() {
    const pendingCount = (this.data.pendingReviewReceiving || []).length;
    return `
      ${pendingCount > 0 ? `
      <div class="card" style="border-left:4px solid var(--warning)">
        <div class="list-item" onclick="Warehouse.showReceivingExceptionList()"><div class="li-main"><div class="li-title">⚠️ 验货异常审核 <span class="badge badge-pending">${pendingCount}</span></div><div class="li-sub">门店验货数量异常待处理</div></div><span class="text-gray">→</span></div>
      </div>` : ''}
      <div class="card">
        <div class="card-title">数据导出</div>
        <div class="list-item" onclick="Warehouse.showExportPanel()"><div class="li-main"><div class="li-title">📊 导出报表</div><div class="li-sub">盘存/入库/出库数据导出</div></div><span class="text-gray">→</span></div>
      </div>
      <div class="card">
        <div class="list-item" onclick="Warehouse.showAllInventory()"><div class="li-main"><div class="li-title">📊 全部库存明细</div><div class="li-sub">查看仓库所有食材库存</div></div><span class="text-gray">→</span></div>
        <div class="list-item" onclick="Warehouse.showDeliveryList()"><div class="li-main"><div class="li-title">🚚 配送管理</div><div class="li-sub">查看配送单、追踪位置</div></div><span class="text-gray">→</span></div>
      </div>
      <div class="card">
        <div class="list-item" onclick="App.logout()"><div class="li-main"><div class="li-title text-info">🔄 退出登录</div><div class="li-sub">返回登录界面</div></div><span class="text-gray">→</span></div>
      </div>
    `;
  },

  // ===== 数据导出 =====
  showExportPanel() {
    const today = new Date().toISOString().slice(0, 10);
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    App.showModal(`
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet">
        <div class="sheet-header"><span class="title">数据导出</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
        <div class="sheet-body">
          <div class="form-row">
            <div class="form-group"><label class="form-label">开始日期</label><input class="form-input" id="wh-ex-start" type="date" value="${monthAgo}" /></div>
            <div class="form-group"><label class="form-label">结束日期</label><input class="form-input" id="wh-ex-end" type="date" value="${today}" /></div>
          </div>
          <div class="list-item" onclick="Warehouse.doExport('checks')"><div class="li-main"><div class="li-title">📋 仓库盘存数据</div><div class="li-sub">食材数量和差异明细</div></div><span class="text-info">导出 →</span></div>
          <div class="list-item" onclick="Warehouse.doExport('inbound')"><div class="li-main"><div class="li-title">📋 仓库入库数据</div><div class="li-sub">食材数量和金额明细</div></div><span class="text-info">导出 →</span></div>
          <div class="list-item" onclick="Warehouse.doExport('outbound')"><div class="li-main"><div class="li-title">📋 仓库出库数据</div><div class="li-sub">食材数量和金额明细</div></div><span class="text-info">导出 →</span></div>
        </div>
        <div class="sheet-footer"><button class="btn btn-outline btn-block" onclick="App.closeModal()">关闭</button></div>
      </div>
    `);
  },

  async doExport(type) {
    const startDate = document.getElementById('wh-ex-start')?.value || '';
    const endDate = document.getElementById('wh-ex-end')?.value || '';
    try {
      App.toast('正在导出...');
      if (type === 'checks') {
        const list = await API.exportWarehouseChecks(startDate, endDate);
        const headers = ['盘存单号', '盘存时间', '品项', '系统数量', '实盘数量', '差异', '单位'];
        const rows = [];
        list.forEach(c => c.items.forEach(i => rows.push([c.id, c.createdAt, i.name, i.systemQty, i.actualQty, i.difference, i.unit])));
        App.exportCSV(`仓库盘存_${startDate}_${endDate}.csv`, headers, rows);
      } else if (type === 'inbound') {
        const list = await API.exportWarehouseInbound(startDate, endDate);
        const headers = ['入库单号', '入库时间', '供应商', '品项', '数量', '单位', '单价', '金额'];
        const rows = [];
        list.forEach(o => o.items.forEach(i => rows.push([o.id, o.createdAt, o.supplier, i.name, i.quantity, i.unit, i.price, i.amount])));
        App.exportCSV(`仓库入库_${startDate}_${endDate}.csv`, headers, rows);
      } else if (type === 'outbound') {
        const list = await API.exportWarehouseOutbound(startDate, endDate);
        const headers = ['出库单号', '出库时间', '门店', '品项', '数量', '单位', '单价', '金额'];
        const rows = [];
        list.forEach(o => o.items.forEach(i => rows.push([o.id, o.createdAt, o.storeName, i.name, i.quantity, i.unit, i.unitPrice || 0, i.amount || 0])));
        App.exportCSV(`仓库出库_${startDate}_${endDate}.csv`, headers, rows);
      }
    } catch (e) { App.toast(e.message); }
  },

  showAllInventory() {
    const inv = this.data.inventory;
    let total = 0;
    inv.forEach(i => { if (i.ingredient) total += i.quantity * (i.ingredient.outboundPrice || i.ingredient.referencePrice || 0); });
    App.showModal(`
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet"><div class="sheet-header"><span class="title">仓库全部库存</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
      <div class="sheet-body">
        <div class="detail-section"><div class="ds-label">品项总数</div><div class="ds-value">${inv.length} 项</div></div>
        <div class="detail-section"><div class="ds-label">库存总值</div><div class="ds-value">¥${Math.round(total).toLocaleString()}</div></div>
        <div class="detail-section"><div class="ds-label">库存明细</div>
          <div class="mini-table"><div class="th"><span style="flex:2">品项</span><span style="flex:1;text-align:right">库存</span><span style="flex:1;text-align:right">出库价</span><span style="flex:1;text-align:right">小计</span></div>
            ${inv.map(i => { const v = Math.round(i.quantity * (i.ingredient?.outboundPrice || 0)); return `<div class="td"><span style="flex:2">${i.ingredient?.name || '--'}</span><span style="flex:1;text-align:right">${i.quantity}${i.unit}</span><span style="flex:1;text-align:right">¥${i.ingredient?.outboundPrice || 0}</span><span style="flex:1;text-align:right">¥${v.toLocaleString()}</span></div>`; }).join('')}
          </div>
        </div>
      </div>
      <div class="sheet-footer"><button class="btn btn-outline btn-block" onclick="App.closeModal()">关闭</button></div></div>
    `);
  },

  showDeliveryList() {
    const deliveries = this.data.deliveries;
    App.showModal(`
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet"><div class="sheet-header"><span class="title">配送管理 (${deliveries.length})</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
      <div class="sheet-body">
        ${deliveries.map(d => `
          <div class="list-item" onclick="App.closeModal();Warehouse.showDeliveryTracking('${d.id}')">
            <div class="li-main"><div class="li-title">${d.storeName} · ${d.driver || '未指派'}</div><div class="li-sub">${d.id} · ${d.items.length}项</div></div>
            <div class="li-right"><span class="badge badge-${d.status === 'in-transit' ? 'in-transit' : 'delivered'}">${App.statusText(d.status)}</span></div>
          </div>
        `).join('') || '<div class="empty-state"><div class="empty-text">暂无配送单</div></div>'}
      </div>
      <div class="sheet-footer"><button class="btn btn-outline btn-block" onclick="App.closeModal()">关闭</button></div></div>
    `);
  },

  // ===== 验货异常审核 =====
  showReceivingExceptionList() {
    const list = this.data.pendingReviewReceiving || [];
    App.showModal(`
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet"><div class="sheet-header"><span class="title">验货异常审核 (${list.length})</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
      <div class="sheet-body">
        ${list.length > 0 ? list.map(r => `
          <div class="list-item" onclick="App.closeModal();Warehouse.showReceivingException('${r.id}')">
            <div class="li-main">
              <div class="li-title">${r.storeName} · ${r.items.length}项</div>
              <div class="li-sub">${r.id} · ${r.createdAt}</div>
            </div>
            <div class="li-right"><span class="badge badge-pending">待审核</span></div>
          </div>
        `).join('') : '<div class="empty-state"><div class="empty-text">暂无待审核异常</div></div>'}
      </div>
      <div class="sheet-footer"><button class="btn btn-outline btn-block" onclick="App.closeModal()">关闭</button></div></div>
    `);
  },

  showReceivingException(receivingId) {
    const r = (this.data.pendingReviewReceiving || []).find(x => x.id === receivingId);
    if (!r) return App.toast('验货单不存在或已处理');

    const exceptionItems = r.items.filter(i => Math.abs(i.acceptedQty - i.orderedQty) > 0.001);
    App.showModal(`
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet">
        <div class="sheet-header"><span class="title">⚠️ 验货异常审核</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
        <div class="sheet-body">
          <div class="detail-section"><div class="ds-label">验货单号</div><div class="ds-value">${r.id}</div></div>
          <div class="detail-section"><div class="ds-label">门店</div><div class="ds-value">${r.storeName}</div></div>
          <div class="detail-section"><div class="ds-label">验货时间</div><div class="ds-value">${r.createdAt}</div></div>
          <div class="detail-section"><div class="ds-label">验收人</div><div class="ds-value">${r.receiver}</div></div>

          <div class="card-title" style="margin-top:12px">异常明细（${exceptionItems.length}项有修改）</div>
          <div class="mini-table"><div class="th"><span style="flex:2">品项</span><span style="flex:1;text-align:right">应收</span><span style="flex:1;text-align:right">实收</span><span style="flex:1;text-align:right">差额</span></div>
            ${r.items.map(i => {
              const diff = Math.round((i.acceptedQty - i.orderedQty) * 100) / 100;
              const isException = Math.abs(diff) > 0.001;
              return `<div class="td" style="${isException ? 'background:#fff7e6' : ''}"><span style="flex:2">${i.name}${isException ? ' ⚠️' : ''}</span><span style="flex:1;text-align:right">${i.orderedQty}${i.unit}</span><span style="flex:1;text-align:right">${i.acceptedQty}${i.unit}</span><span style="flex:1;text-align:right;color:${diff < 0 ? 'var(--danger)' : 'var(--success)'}">${diff > 0 ? '+' : ''}${diff}</span></div>`;
            }).join('')}
          </div>

          ${r.photos && r.photos.length > 0 ? `
          <div class="card-title" style="margin-top:12px">📷 验货照片</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">
            ${r.photos.map((src, i) => `<img src="${src}" style="width:100px;height:100px;object-fit:cover;border-radius:6px;border:1px solid #ddd" onclick="Warehouse.viewPhoto('${r.id}', ${i})" />`).join('')}
          </div>` : '<div class="text-sm text-gray2" style="padding:8px">未上传照片</div>'}

          ${r.remark ? `<div class="detail-section" style="margin-top:12px"><div class="ds-label">备注</div><div class="ds-value">${r.remark}</div></div>` : ''}

          <div style="background:#f6f8fa;border-radius:8px;padding:12px;margin-top:12px;font-size:13px;color:#666">
            <div style="font-weight:600;margin-bottom:6px">审核说明：</div>
            <div>✅ 同意：出库单数量同步修改为实收数量，差额退回仓库库存，门店按实收数量入库</div>
            <div>❌ 拒绝：门店按原订单数量入库，出库单不修改</div>
          </div>
        </div>
        <div class="sheet-footer">
          <button class="btn btn-outline btn-block" onclick="App.closeModal()">关闭</button>
          <button class="btn btn-danger btn-block" onclick="Warehouse.rejectException('${r.id}')">❌ 拒绝（按原数量入库）</button>
          <button class="btn btn-success btn-block" onclick="Warehouse.approveException('${r.id}')">✅ 同意（按实收数量入库）</button>
        </div>
      </div>
    `);
  },

  viewPhoto(receivingId, photoIndex) {
    const r = (this.data.pendingReviewReceiving || []).find(x => x.id === receivingId);
    if (!r || !r.photos || !r.photos[photoIndex]) return;
    const wrapper = document.createElement('div');
    wrapper.id = 'photo-viewer';
    wrapper.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px';
    wrapper.innerHTML = `<img src="${r.photos[photoIndex]}" style="max-width:100%;max-height:100%;object-fit:contain" onclick="this.parentElement.remove()" />`;
    document.body.appendChild(wrapper);
  },

  async approveException(receivingId) {
    try {
      const res = await API.approveReceivingException(receivingId);
      App.closeModal();
      App.toast(res.message || '已同意异常修改');
      this.render();
    } catch (e) { App.toast(e.message); }
  },

  async rejectException(receivingId) {
    try {
      const res = await API.rejectReceivingException(receivingId);
      App.closeModal();
      App.toast(res.message || '已拒绝异常修改');
      this.render();
    } catch (e) { App.toast(e.message); }
  },

  // ===== 司机位置自动上报（每10分钟） =====
  _autoReportTimer: null,

  startAutoLocationReport() {
    // 清除旧定时器
    if (this._autoReportTimer) clearInterval(this._autoReportTimer);

    // 每10分钟自动上报所有配送中的订单位置
    this._autoReportTimer = setInterval(() => {
      this.doAutoLocationReport();
    }, 10 * 60 * 1000); // 10分钟

    // 页面加载后也立即上报一次
    setTimeout(() => this.doAutoLocationReport(), 5000);
  },

  async doAutoLocationReport() {
    const inTransitDeliveries = (this.data.deliveries || []).filter(d => d.status === 'in-transit');
    if (inTransitDeliveries.length === 0) return;

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        for (const del of inTransitDeliveries) {
          try {
            await API.autoReportLocation(del.id, {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              speed: pos.coords.speed || 0,
            });
          } catch (e) {
            // 静默失败，不打扰用户
          }
        }
      },
      (err) => {
        // 静默失败
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  },
};
/**
 * 门店管理端
 */
const Store = {
  data: {
    stats: {}, inventory: [], storeOrders: [], deliveries: [],
    receivingOrders: [], checks: [], ingredients: [], consumptionRecords: [],
    warehouses: [],
    storeName: '', storeId: null,
  },

  async render() {
    const tab = App.tabState.store || 0;
    const acc = App.state.account;
    this.data.storeId = acc.storeId;
    document.getElementById('app').innerHTML = App.topBar('门店管理端', acc.name) + '<div class="container" id="st-container">加载中...</div>';

    try {
      await this.loadData();
    } catch (e) {
      document.getElementById('st-container').innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-text">${e.message}</div></div>`;
      return;
    }

    const pages = [this.pageHome, this.pageOrder, this.pageReceiving, this.pageCheck, this.pageMore];
    document.getElementById('st-container').innerHTML = pages[tab].call(this);
    document.getElementById('app').innerHTML += App.renderTabBar('store');
  },

  async loadData() {
    const [stats, inventory, storeOrders, deliveries, receivingOrders, checks, ingredients, consumptionRecords, warehouses] = await Promise.all([
      API.getStoreStats(this.data.storeId),
      API.getStoreInventory(this.data.storeId),
      API.getStoreOrders(),
      API.getDeliveries(),
      API.getReceivingOrders(),
      API.getStoreChecks(this.data.storeId),
      API.listIngredients(),
      API.getConsumptionRecords(this.data.storeId),
      API.listWarehouses(),
    ]);
    this.data = { ...this.data, stats, inventory, storeOrders, deliveries, receivingOrders, checks, ingredients, consumptionRecords, warehouses };
  },

  // ===== Tab 0: 首页 =====
  pageHome() {
    const s = this.data.stats;
    const pendingDeliveries = this.data.deliveries.filter(d => d.storeId === this.data.storeId && d.status === 'in-transit');
    return `
      <div class="stats-grid">
        <div class="stat-item"><div class="stat-value">${s.totalItems}</div><div class="stat-label">在库品项</div></div>
        <div class="stat-item ${s.lowStockCount > 0 ? 'warning' : 'success'}"><div class="stat-value">${s.lowStockCount}</div><div class="stat-label">库存预警</div></div>
        <div class="stat-item info"><div class="stat-value">${s.pendingOrders}</div><div class="stat-label">待处理订单</div></div>
        <div class="stat-item success"><div class="stat-value">¥${s.totalValue}</div><div class="stat-label">库存总值</div></div>
      </div>
      <div class="card">
        <div class="card-title">快捷操作</div>
        <div class="quick-actions">
          <div class="quick-action" onclick="App.switchTab('store', 1)"><div class="qa-icon">📝</div><div class="qa-label">下单</div></div>
          <div class="quick-action" onclick="App.switchTab('store', 2)"><div class="qa-icon">✅</div><div class="qa-label">验货</div></div>
          <div class="quick-action" onclick="App.switchTab('store', 3)"><div class="qa-icon">📋</div><div class="qa-label">盘存</div></div>
          <div class="quick-action" onclick="App.switchTab('store', 4)"><div class="qa-icon">💰</div><div class="qa-label">耗用</div></div>
        </div>
      </div>
      ${pendingDeliveries.length > 0 ? `
      <div class="card" style="border-left:4px solid var(--info)">
        <div class="card-title">🚚 配送中 <span class="badge badge-in-transit">${pendingDeliveries.length}单</span></div>
        ${pendingDeliveries.map(d => `
          <div class="list-item" onclick="Store.showDeliveryTracking('${d.id}')">
            <div class="li-main">
              <div class="li-title">${d.items.length}项食材 · ${d.driver || '未指派'}</div>
              <div class="li-sub">${d.id}</div>
            </div>
            <div class="li-right"><button class="btn btn-info btn-sm">追踪</button></div>
          </div>
        `).join('')}
      </div>` : ''}
      ${s.lowStockCount > 0 ? `
      <div class="card">
        <div class="card-title">⚠️ 库存预警 <span class="badge badge-low">${s.lowStockCount}项</span></div>
        ${s.lowStockItems.map(i => `
          <div class="inv-item"><div class="inv-info"><div class="inv-name">${i.ingredient?.name}</div><div class="inv-spec">阈值: ${i.ingredient?.warningThreshold}${i.unit}</div></div><div class="inv-qty"><span class="num text-danger">${i.quantity}</span><span class="unit">${i.unit}</span></div></div>
        `).join('')}
      </div>` : ''}
      <div class="card">
        <div class="card-title">📨 我的订单 <span class="more" onclick="App.switchTab('store', 1)">全部 →</span></div>
        ${this.data.storeOrders.slice(0, 3).map(o => `
          <div class="list-item" onclick="Store.viewOrder('${o.id}')">
            <div class="li-main"><div class="li-title">${o.items.length}项食材 · ¥${o.totalAmount}${o.warehouseName ? ' · 🏭' + o.warehouseName : ''}</div><div class="li-sub">${o.items[0]?.name}${o.items.length > 1 ? ' 等' : ''}</div></div>
            <div class="li-right"><span class="badge badge-${o.status}">${App.statusText(o.status)}</span><span class="li-time">${o.createdAt}</span></div>
          </div>
        `).join('') || '<div class="empty-state"><div class="empty-text">暂无订单</div></div>'}
      </div>
    `;
  },

  // ===== Tab 1: 下单 =====
  pageOrder() {
    return `
      <div class="flex-between mb-12">
        <span class="text-sm text-gray2">共 ${this.data.storeOrders.length} 条订单</span>
        <button class="btn btn-primary btn-sm" onclick="Store.showOrderForm()">+ 新建订单</button>
      </div>
      <div class="card">
        ${this.data.storeOrders.map(o => `
          <div class="list-item" onclick="Store.viewOrder('${o.id}')">
            <div class="li-main">
              <div class="li-title">${o.items.length}项食材 · ¥${o.totalAmount} · 期望 ${o.expectedDate}${o.warehouseName ? ' · 🏭' + o.warehouseName : ''}</div>
              <div class="li-sub">${o.items[0]?.name}${o.items.length > 1 ? ' 等' : ''}</div>
            </div>
            <div class="li-right">
              <span class="badge badge-${o.status}">${App.statusText(o.status)}</span>
              ${o.status === 'dispatched' ? `<button class="btn btn-info btn-sm" style="margin-left:4px" onclick="event.stopPropagation();Store.showOrderStatus('${o.id}')">📍实时状态</button>` : ''}
              <span class="li-time">${o.createdAt}</span>
            </div>
          </div>
        `).join('') || '<div class="empty-state"><div class="empty-text">暂无订单，快去下单吧</div></div>'}
      </div>
    `;
  },

  showOrderForm() {
    const ingredients = this.data.ingredients;
    const warehouses = this.data.warehouses || [];

    // 按仓库分组食材
    const groups = {};
    ingredients.forEach((ing) => {
      const whId = ing.warehouseId || 'WH001';
      if (!groups[whId]) groups[whId] = [];
      groups[whId].push(ing);
    });

    // 生成分组显示HTML
    let itemsHtml = '';
    Object.keys(groups).forEach(whId => {
      const wh = warehouses.find(w => w.id === whId);
      const whName = wh ? wh.name : '默认仓库';
      itemsHtml += `<div style="margin-top:12px;padding:8px 12px;background:var(--primary-light);border-radius:8px 8px 0 0;font-weight:600;font-size:14px;color:var(--primary)">🏭 ${whName}</div>`;
      groups[whId].forEach(ing => {
        const i = ingredients.indexOf(ing);
        itemsHtml += `
          <div class="ingredient-row" id="row-${i}" style="border-top:none">
            <div class="ir-name"><div class="name">${ing.name}</div><div class="spec">${ing.spec || ''} / ${ing.unit}</div></div>
            <div class="ir-price">¥${ing.outboundPrice || 0}/${ing.unit}</div>
            <input class="ir-input" type="number" id="of-qty-${i}" placeholder="0" oninput="Store.updateRowTotal(${i}, ${ing.outboundPrice || 0})" />
            <span class="ir-unit">${ing.unit}</span>
            <div class="ir-total" id="of-total-${i}">¥0</div>
          </div>
        `;
      });
    });

    const html = `
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet">
        <div class="sheet-header"><span class="title">新建订单</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
        <div class="sheet-body">
          <div class="form-group"><label class="form-label">期望送达日期</label><input class="form-input" id="of-date" type="date" value="${new Date().toISOString().slice(0,10)}" /></div>
          <div class="form-group"><label class="form-label">备注</label><input class="form-input" id="of-remark" placeholder="选填" /></div>
          <div class="form-group"><label class="form-label">下单明细（按分仓分组，填写数量即下单，显示出库价格）</label></div>
          <div id="order-items">
            ${itemsHtml}
          </div>
          <div style="text-align:right;font-size:16px;font-weight:600;margin-top:12px;padding:12px;background:var(--primary-light);border-radius:8px">
            合计: <span id="order-grand-total" style="color:var(--primary)">¥0</span>
          </div>
          <div class="text-sm text-gray2" style="margin-top:8px">💡 系统会自动按分仓拆分为多个订单</div>
        </div>
        <div class="sheet-footer">
          <button class="btn btn-outline btn-block" onclick="App.closeModal()">取消</button>
          <button class="btn btn-primary btn-block" onclick="Store.submitOrder()">提交订单</button>
        </div>
      </div>
    `;
    App.showModal(html);
  },

  updateRowTotal(i, price) {
    const qty = parseFloat(document.getElementById(`of-qty-${i}`).value) || 0;
    const total = Math.round(qty * price * 100) / 100;
    document.getElementById(`of-total-${i}`).textContent = '¥' + total;
    // 更新合计
    let grand = 0;
    this.data.ingredients.forEach((ing, idx) => {
      const q = parseFloat(document.getElementById(`of-qty-${idx}`).value) || 0;
      grand += q * (ing.outboundPrice || 0);
    });
    document.getElementById('order-grand-total').textContent = '¥' + (Math.round(grand * 100) / 100);
  },

  async submitOrder() {
    const expectedDate = document.getElementById('of-date').value;
    const remark = document.getElementById('of-remark').value.trim();
    if (!expectedDate) return App.toast('请选择期望送达日期');
    const items = [];
    this.data.ingredients.forEach((ing, i) => {
      const qty = parseFloat(document.getElementById(`of-qty-${i}`).value);
      if (qty && qty > 0) items.push({ ingredientId: ing.id, name: ing.name, quantity: qty, unit: ing.unit });
    });
    if (!items.length) return App.toast('请至少填写一项');
    try {
      const res = await API.createStoreOrder({ storeId: this.data.storeId, expectedDate, items, remark });
      App.closeModal();
      // V2.3: 后端返回 { success, orders, count, message }
      if (res.orders && res.orders.length > 1) {
        App.toast(`已拆分为 ${res.count} 个分仓订单并提交`);
      } else {
        App.toast(res.message || '下单成功');
      }
      this.render();
    } catch (e) { App.toast(e.message); }
  },

  viewOrder(id) {
    const o = this.data.storeOrders.find(x => x.id === id);
    if (!o) return;
    // 查找关联配送
    const delivery = this.data.deliveries.find(d => d.orderId === o.id);
    App.showModal(`
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet"><div class="sheet-header"><span class="title">订单详情</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
      <div class="sheet-body">
        <div class="detail-section"><div class="ds-label">订单号</div><div class="ds-value">${o.id}</div></div>
        ${o.warehouseName ? `<div class="detail-section"><div class="ds-label">分仓</div><div class="ds-value">🏭 ${o.warehouseName}</div></div>` : ''}
        <div class="detail-section"><div class="ds-label">下单时间</div><div class="ds-value">${o.createdAt}</div></div>
        <div class="detail-section"><div class="ds-label">期望送达</div><div class="ds-value">${o.expectedDate}</div></div>
        <div class="detail-section"><div class="ds-label">状态</div><div class="ds-value"><span class="badge badge-${o.status}">${App.statusText(o.status)}</span></div></div>
        ${o.remark ? `<div class="detail-section"><div class="ds-label">备注</div><div class="ds-value">${o.remark}</div></div>` : ''}
        <div class="detail-section"><div class="ds-label">订单明细</div>
          <div class="mini-table"><div class="th"><span style="flex:2">品项</span><span style="flex:1;text-align:right">数量</span><span style="flex:1;text-align:right">单价</span><span style="flex:1;text-align:right">金额</span></div>
            ${o.items.map(i => `<div class="td"><span style="flex:2">${i.name}</span><span style="flex:1;text-align:right">${i.quantity}${i.unit}</span><span style="flex:1;text-align:right">¥${i.unitPrice || 0}</span><span style="flex:1;text-align:right">¥${i.amount || 0}</span></div>`).join('')}
            <div class="td" style="font-weight:600"><span style="flex:3">合计</span><span style="flex:1;text-align:right">¥${o.totalAmount}</span></div>
          </div>
        </div>
        ${delivery ? `
        <div class="detail-section"><div class="ds-label">配送信息</div><div class="ds-value">
          ${delivery.driver || '未指派'} / ${delivery.vehicle || '--'}<br>
          <span class="badge badge-${delivery.status === 'in-transit' ? 'in-transit' : 'delivered'}">${App.statusText(delivery.status)}</span>
          ${delivery.status === 'in-transit' ? `<br><button class="btn btn-info btn-sm mt-8" onclick="App.closeModal();Store.showDeliveryTracking('${delivery.id}')">📍 查看实时位置</button>` : ''}
        </div></div>` : ''}
      </div>
      <div class="sheet-footer"><button class="btn btn-outline btn-block" onclick="App.closeModal()">关闭</button></div></div>
    `);
  },

  // ===== 订单实时状态查看 =====
  async showOrderStatus(orderId) {
    App.showModal(`
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet">
        <div class="sheet-header"><span class="title">📍 订单实时状态</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
        <div class="sheet-body" id="order-status-body">
          <div style="text-align:center;padding:20px"><span class="text-gray2">加载中...</span></div>
        </div>
      </div>
    `);

    try {
      const status = await API.getOrderStatus(orderId);
      const del = status.delivery;
      let html = `
        <div class="detail-section"><div class="ds-label">订单号</div><div class="ds-value">${status.orderId}</div></div>
        ${status.warehouseName ? `<div class="detail-section"><div class="ds-label">分仓</div><div class="ds-value">🏭 ${status.warehouseName}</div></div>` : ''}
        <div class="detail-section"><div class="ds-label">订单状态</div><div class="ds-value"><span class="badge badge-${status.orderStatus}">${App.statusText(status.orderStatus)}</span></div></div>
        <div class="detail-section"><div class="ds-label">下单时间</div><div class="ds-value">${status.createdAt}</div></div>
        <div class="detail-section"><div class="ds-label">期望送达</div><div class="ds-value">${status.expectedDate}</div></div>
      `;

      // 订单状态时间线
      html += `<div class="card-title" style="margin-top:16px">📋 订单进度</div>
        <div class="delivery-timeline">
          <div class="timeline-item"><div class="timeline-dot done"></div><div class="timeline-content"><div class="timeline-title">📝 订单已提交</div><div class="timeline-time">${status.createdAt}</div></div></div>
          ${status.orderStatus !== 'pending' ? `<div class="timeline-item"><div class="timeline-dot done"></div><div class="timeline-content"><div class="timeline-title">📦 仓库已发货</div><div class="timeline-time">${del ? del.createdAt : ''}</div></div></div>` : ''}
          ${del && del.status === 'in-transit' ? `<div class="timeline-item"><div class="timeline-dot active"></div><div class="timeline-content"><div class="timeline-title">🚚 正在配送中</div><div class="timeline-time">实时位置更新中</div></div></div>` : ''}
          ${del && del.status === 'delivered' ? `<div class="timeline-item"><div class="timeline-dot done"></div><div class="timeline-content"><div class="timeline-title">✅ 已送达</div><div class="timeline-time">${del.updatedAt || ''}</div></div></div>` : ''}
        </div>
      `;

      // 配送司机信息
      if (del) {
        html += `
          <div class="card-title" style="margin-top:16px">🚚 配送信息</div>
          <div class="detail-section"><div class="ds-label">司机</div><div class="ds-value">${del.driver || '--'}</div></div>
          <div class="detail-section"><div class="ds-label">车牌号</div><div class="ds-value">${del.vehicle || '--'}</div></div>
          ${del.phone ? `<div class="detail-section"><div class="ds-label">联系电话</div><div class="ds-value"><a href="tel:${del.phone}" style="font-size:16px;font-weight:600;color:var(--primary)">📞 ${del.phone}</a></div></div>` : '<div class="detail-section"><div class="ds-label">联系电话</div><div class="ds-value">--</div></div>'}
        `;

        // 实时位置
        if (del.currentLocation) {
          html += `
            <div class="delivery-map" style="margin-top:12px">
              <div class="dm-icon">${del.status === 'in-transit' ? '🚚' : '📍'}</div>
              <div class="dm-status">${del.status === 'in-transit' ? '正在配送中' : '已送达'}</div>
              <div class="dm-coords">📍 ${del.currentLocation.lat.toFixed(5)}, ${del.currentLocation.lng.toFixed(5)}</div>
              <div class="dm-time">最后更新: ${del.currentLocation.updatedAt}</div>
            </div>
          `;
        } else if (del.status === 'in-transit') {
          html += `<div class="text-sm text-gray2" style="text-align:center;padding:12px">等待司机上报位置...</div>`;
        }

        // 轨迹
        if (del.tracks && del.tracks.length > 0) {
          html += `<div class="card-title" style="margin-top:12px">📍 位置轨迹</div>`;
          html += del.tracks.map(t => `<div class="list-item"><div class="li-main"><div class="li-title">${t.lat.toFixed(4)}, ${t.lng.toFixed(4)}</div><div class="li-sub">${t.timestamp}${t.autoReport ? ' · 自动上报' : ''}</div></div></div>`).join('');
        }
      } else if (status.orderStatus === 'pending') {
        html += `<div class="text-sm text-gray2" style="text-align:center;padding:20px">订单待仓库处理，暂无配送信息</div>`;
      }

      html += `
        <div class="sheet-footer" style="margin-top:16px">
          ${del && del.status === 'in-transit' ? `<button class="btn btn-info btn-block" onclick="Store.showOrderStatus('${orderId}')">🔄 刷新状态</button>` : ''}
          <button class="btn btn-primary btn-block" onclick="App.closeModal()">关闭</button>
        </div>
      `;

      document.getElementById('order-status-body').innerHTML = html;
    } catch (e) {
      document.getElementById('order-status-body').innerHTML = `<div class="empty-state"><div class="empty-text">${e.message}</div></div>`;
    }
  },

  // ===== 配送追踪（门店端查看） =====
  async showDeliveryTracking(deliveryId) {
    const del = this.data.deliveries.find(d => d.id === deliveryId) || await API.getDelivery(deliveryId);
    if (!del) return;
    let tracks = [];
    try { tracks = await API.getDeliveryTracks(deliveryId); } catch (e) {}

    const hasLocation = del.currentLocation;
    App.showModal(`
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet">
        <div class="sheet-header"><span class="title">🚚 配送实时追踪</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
        <div class="sheet-body">
          <div class="detail-section"><div class="ds-label">配送单号</div><div class="ds-value">${del.id}</div></div>
          <div class="detail-section"><div class="ds-label">司机 / 车辆</div><div class="ds-value">${del.driver || '--'} / ${del.vehicle || '--'}</div></div>
          ${del.phone ? `<div class="detail-section"><div class="ds-label">联系电话</div><div class="ds-value"><a href="tel:${del.phone}">${del.phone}</a></div></div>` : ''}

          <div class="delivery-map" id="delivery-map">
            <div class="dm-icon">${del.status === 'in-transit' ? '🚚' : '📍'}</div>
            <div class="dm-status">${del.status === 'in-transit' ? '正在配送中' : '已送达'}</div>
            ${hasLocation ? `<div class="dm-coords">📍 ${hasLocation.lat.toFixed(5)}, ${hasLocation.lng.toFixed(5)}</div><div class="dm-time">最后更新: ${hasLocation.updatedAt}</div>` : '<div class="dm-coords">等待司机上报位置...</div>'}
          </div>

          <div class="card-title">配送轨迹</div>
          <div class="delivery-timeline">
            <div class="timeline-item"><div class="timeline-dot done"></div><div class="timeline-content"><div class="timeline-title">📦 已从仓库发货</div><div class="timeline-time">${del.createdAt}</div></div></div>
            ${tracks.map(t => `<div class="timeline-item"><div class="timeline-dot active"></div><div class="timeline-content"><div class="timeline-title">📍 位置更新</div><div class="timeline-time">${t.timestamp}</div></div></div>`).join('')}
            ${del.status === 'delivered' ? `<div class="timeline-item"><div class="timeline-dot done"></div><div class="timeline-content"><div class="timeline-title">✅ 已送达</div><div class="timeline-time">${del.updatedAt || ''}</div></div></div>` : ''}
          </div>

          ${del.status === 'in-transit' ? '<div class="text-sm text-info" style="text-align:center;padding:8px">💡 司机正在配送中，位置会实时更新</div>' : ''}
        </div>
        <div class="sheet-footer">
          ${del.status === 'in-transit' ? `<button class="btn btn-outline btn-block" onclick="Store.refreshTracking('${del.id}')">🔄 刷新位置</button>` : ''}
          <button class="btn btn-primary btn-block" onclick="App.closeModal()">关闭</button>
        </div>
      </div>
    `);
  },

  async refreshTracking(deliveryId) {
    App.closeModal();
    try {
      const del = await API.getDelivery(deliveryId);
      // 更新本地数据
      const idx = this.data.deliveries.findIndex(d => d.id === deliveryId);
      if (idx >= 0) this.data.deliveries[idx] = del;
      this.showDeliveryTracking(deliveryId);
    } catch (e) { App.toast(e.message); }
  },

  // ===== Tab 2: 验货 =====
  pageReceiving() {
    const pendingDeliveries = this.data.deliveries.filter(d => d.storeId === this.data.storeId && d.status === 'in-transit');
    return `
      ${pendingDeliveries.length > 0 ? `
      <div class="card" style="border-left:4px solid var(--info)">
        <div class="card-title">🚚 待验货 <span class="badge badge-in-transit">${pendingDeliveries.length}单</span></div>
        ${pendingDeliveries.map(d => `
          <div class="list-item" onclick="Store.showReceivingForm('${d.id}')">
            <div class="li-main">
              <div class="li-title">${d.items.length}项食材 · ${d.driver || ''}</div>
              <div class="li-sub">${d.id} · ${d.vehicle || ''}</div>
            </div>
            <div class="li-right"><button class="btn btn-primary btn-sm">验货</button></div>
          </div>
        `).join('')}
      </div>` : ''}
      <div class="flex-between mb-12"><span class="text-sm text-gray2">验货记录 ${this.data.receivingOrders.length} 条</span></div>
      <div class="card">
        ${this.data.receivingOrders.map(r => {
          const statusBadge = r.status === 'pending_review'
            ? '<span class="badge badge-pending">待审核</span>'
            : r.reviewResult === 'approved'
            ? '<span class="badge badge-completed">已同意</span>'
            : r.reviewResult === 'rejected'
            ? '<span class="badge badge-completed">已拒绝</span>'
            : '<span class="badge badge-completed">已完成</span>';
          return `
          <div class="list-item" onclick="Store.viewReceiving('${r.id}')">
            <div class="li-main"><div class="li-title">验货 · ${r.items.length}项${r.exceptionFlag ? ' ⚠️' : ''}</div><div class="li-sub">${r.id}</div></div>
            <div class="li-right">${statusBadge}<span class="li-time">${r.createdAt}</span></div>
          </div>
        `;}).join('') || '<div class="empty-state"><div class="empty-text">暂无验货记录</div></div>'}
      </div>
    `;
  },

  showReceivingForm(deliveryId) {
    const del = this.data.deliveries.find(d => d.id === deliveryId);
    if (!del) return;
    App.showModal(`
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet">
        <div class="sheet-header"><span class="title">验货入库</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
        <div class="sheet-body">
          <div class="detail-section"><div class="ds-label">配送单号</div><div class="ds-value">${del.id}</div></div>
          <div class="detail-section"><div class="ds-label">司机 / 车辆</div><div class="ds-value">${del.driver || '--'} / ${del.vehicle || '--'}</div></div>
          ${del.phone ? `<div class="detail-section"><div class="ds-label">联系电话</div><div class="ds-value"><a href="tel:${del.phone}">${del.phone}</a></div></div>` : ''}
          <div class="text-sm text-gray2" style="display:block;margin:12px 0">填写实际验收数量，如修改了实收数量需拍照上传凭证</div>
          ${del.items.map((item, i) => `
            <div style="margin-bottom:12px;background:#fafafa;border-radius:8px;padding:10px 12px" id="rc-item-${i}">
              <div class="flex-between mb-8"><span class="text-bold">${item.name}</span><span class="text-sm text-gray">订单: ${item.quantity}${item.unit}</span></div>
              <div class="form-row">
                <div class="form-group" style="margin-bottom:0"><label class="form-label">验收数量</label><input class="form-input" type="number" id="rc-accept-${i}" value="${item.quantity}" style="padding:6px 8px;font-size:13px" oninput="Store.checkReceivingException(${i}, ${item.quantity})" /></div>
                <div class="form-group" style="margin-bottom:0"><label class="form-label">拒收数量</label><input class="form-input" type="number" id="rc-reject-${i}" value="0" style="padding:6px 8px;font-size:13px" /></div>
              </div>
              <input class="form-input" id="rc-reason-${i}" placeholder="拒收原因（选填）" style="margin-top:8px;padding:6px 8px;font-size:13px" />
              <div id="rc-exception-tip-${i}" style="display:none;margin-top:8px;padding:6px 8px;background:#fff7e6;border:1px solid #ffd591;border-radius:6px;font-size:12px;color:#d46b08">
                ⚠️ 实收数量与订单不符，请拍照上传凭证
              </div>
            </div>
          `).join('')}
          <div class="form-group">
            <label class="form-label">拍照上传（实收数量有修改时必传）</label>
            <input type="file" id="rc-photos" accept="image/*" capture="camera" multiple style="font-size:13px;margin-bottom:8px" onchange="Store.previewPhotos(this)" />
            <div id="rc-photo-preview" style="display:flex;flex-wrap:wrap;gap:8px"></div>
          </div>
          <div class="form-group"><label class="form-label">验收备注</label><input class="form-input" id="rc-remark" placeholder="选填" /></div>
        </div>
        <div class="sheet-footer">
          <button class="btn btn-outline btn-block" onclick="App.closeModal()">取消</button>
          <button class="btn btn-primary btn-block" onclick="Store.submitReceiving('${del.id}')">确认验收入库</button>
        </div>
      </div>
    `);
    // 存储照片 base64 数组
    this._receivingPhotos = [];
  },

  // 检测验货异常
  checkReceivingException(index, orderedQty) {
    const acceptInput = document.getElementById(`rc-accept-${index}`);
    const tip = document.getElementById(`rc-exception-tip-${index}`);
    const acceptedQty = parseFloat(acceptInput.value) || 0;
    if (Math.abs(acceptedQty - orderedQty) > 0.001) {
      tip.style.display = 'block';
      acceptInput.style.borderColor = '#ffa940';
    } else {
      tip.style.display = 'none';
      acceptInput.style.borderColor = '';
    }
  },

  // 预览拍照图片
  previewPhotos(input) {
    this._receivingPhotos = this._receivingPhotos || [];
    const previewDiv = document.getElementById('rc-photo-preview');
    const files = Array.from(input.files);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        // 压缩图片到最大宽度 800px
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxW = 800;
          let w = img.width, h = img.height;
          if (w > maxW) { h = h * maxW / w; w = maxW; }
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.6);
          this._receivingPhotos.push(compressed);

          const div = document.createElement('div');
          div.style.cssText = 'position:relative;width:80px;height:80px;border-radius:6px;overflow:hidden;border:1px solid #ddd';
          div.innerHTML = `<img src="${compressed}" style="width:100%;height:100%;object-fit:cover" /><span onclick="Store.removePhoto(${this._receivingPhotos.length - 1})" style="position:absolute;top:0;right:0;background:rgba(0,0,0,0.6);color:#fff;width:20px;height:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px">✕</span>`;
          previewDiv.appendChild(div);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  },

  removePhoto(index) {
    this._receivingPhotos.splice(index, 1);
    // 重新渲染预览
    const previewDiv = document.getElementById('rc-photo-preview');
    previewDiv.innerHTML = '';
    this._receivingPhotos.forEach((src, i) => {
      const div = document.createElement('div');
      div.style.cssText = 'position:relative;width:80px;height:80px;border-radius:6px;overflow:hidden;border:1px solid #ddd';
      div.innerHTML = `<img src="${src}" style="width:100%;height:100%;object-fit:cover" /><span onclick="Store.removePhoto(${i})" style="position:absolute;top:0;right:0;background:rgba(0,0,0,0.6);color:#fff;width:20px;height:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px">✕</span>`;
      previewDiv.appendChild(div);
    });
  },

  async submitReceiving(deliveryId) {
    const del = this.data.deliveries.find(d => d.id === deliveryId);
    if (!del) return;
    const items = del.items.map((item, i) => ({
      ingredientId: item.ingredientId, name: item.name,
      orderedQty: item.quantity, deliveredQty: item.quantity,
      acceptedQty: parseFloat(document.getElementById(`rc-accept-${i}`).value) || 0,
      rejectedQty: parseFloat(document.getElementById(`rc-reject-${i}`).value) || 0,
      rejectReason: document.getElementById(`rc-reason-${i}`).value.trim(),
      unit: item.unit,
    }));
    const remark = document.getElementById('rc-remark').value.trim();

    // 检测温异常
    const hasException = items.some(item => Math.abs(item.acceptedQty - item.orderedQty) > 0.001);
    const photos = this._receivingPhotos || [];

    if (hasException && photos.length === 0) {
      return App.toast('实收数量有修改，请至少上传一张照片凭证');
    }

    try {
      const res = await API.createReceivingOrder({ deliveryId, items, remark, photos });
      App.closeModal();
      App.toast(res.message || '验收入库成功');
      this._receivingPhotos = [];
      this.render();
    } catch (e) { App.toast(e.message); }
  },

  viewReceiving(id) {
    const r = this.data.receivingOrders.find(x => x.id === id);
    if (!r) return;
    const statusText = r.status === 'pending_review' ? '待仓库审核' : r.reviewResult === 'approved' ? '仓库已同意实收修改' : r.reviewResult === 'rejected' ? '仓库已拒绝，按原数量入库' : '已完成';
    App.showModal(`
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet"><div class="sheet-header"><span class="title">验货详情</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
      <div class="sheet-body">
        <div class="detail-section"><div class="ds-label">验货单号</div><div class="ds-value">${r.id}</div></div>
        <div class="detail-section"><div class="ds-label">配送单号</div><div class="ds-value">${r.deliveryId}</div></div>
        <div class="detail-section"><div class="ds-label">验货时间</div><div class="ds-value">${r.createdAt}</div></div>
        <div class="detail-section"><div class="ds-label">审核状态</div><div class="ds-value">${statusText}</div></div>
        ${r.reviewedAt ? `<div class="detail-section"><div class="ds-label">审核时间</div><div class="ds-value">${r.reviewedAt}</div></div>` : ''}
        <div class="detail-section"><div class="ds-label">验货明细</div>
          <div class="mini-table"><div class="th"><span style="flex:2">品项</span><span style="flex:1;text-align:right">应收</span><span style="flex:1;text-align:right">实收</span><span style="flex:1;text-align:right">拒收</span></div>
            ${r.items.map(i => `<div class="td"><span style="flex:2">${i.name}${Math.abs(i.acceptedQty - i.orderedQty) > 0.001 ? ' ⚠️' : ''}</span><span style="flex:1;text-align:right">${i.orderedQty}${i.unit}</span><span style="flex:1;text-align:right">${i.acceptedQty}${i.unit}</span><span style="flex:1;text-align:right">${i.rejectedQty}${i.unit}</span></div>`).join('')}
          </div>
        </div>
        ${r.photos && r.photos.length > 0 ? `
        <div class="detail-section"><div class="ds-label">验货照片</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">
            ${r.photos.map((src, i) => `<img src="${src}" style="width:100px;height:100px;object-fit:cover;border-radius:6px;border:1px solid #ddd" onclick="Store.viewPhoto('${r.id}', ${i})" />`).join('')}
          </div>
        </div>` : ''}
      </div>
      <div class="sheet-footer"><button class="btn btn-outline btn-block" onclick="App.closeModal()">关闭</button></div></div>
    `);
  },

  viewPhoto(receivingId, photoIndex) {
    const r = this.data.receivingOrders.find(x => x.id === receivingId);
    if (!r || !r.photos || !r.photos[photoIndex]) return;
    const wrapper = document.createElement('div');
    wrapper.id = 'photo-viewer';
    wrapper.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px';
    wrapper.innerHTML = `<img src="${r.photos[photoIndex]}" style="max-width:100%;max-height:100%;object-fit:contain" onclick="this.parentElement.remove()" />`;
    document.body.appendChild(wrapper);
  },

  // ===== Tab 3: 盘存 =====
  pageCheck() {
    return `
      <div class="flex-between mb-12">
        <span class="text-sm text-gray2">盘存记录 ${this.data.checks.length} 次</span>
        <button class="btn btn-primary btn-sm" onclick="Store.showCheckForm()">+ 新建盘存</button>
      </div>
      <div class="card">
        ${this.data.checks.map(c => `
          <div class="list-item" onclick="Store.viewCheck('${c.id}')">
            <div class="li-main"><div class="li-title">盘存 · ${c.items.length}项</div><div class="li-sub">${c.id}</div></div>
            <div class="li-right"><span class="badge badge-completed">已完成</span><span class="li-time">${c.createdAt}</span></div>
          </div>
        `).join('')}
      </div>
      <div class="card">
        <div class="card-title">当前门店库存</div>
        ${this.data.inventory.map(inv => `
          <div class="inv-item">
            <div class="inv-info"><div class="inv-name">${inv.ingredient?.name}</div><div class="inv-spec">${inv.ingredient?.spec || ''}</div></div>
            <div class="inv-qty"><span class="num ${inv.isLow ? 'text-danger' : ''}">${inv.quantity}</span><span class="unit">${inv.unit}</span>${inv.isLow ? '<span class="badge badge-low">低</span>' : ''}</div>
          </div>
        `).join('') || '<div class="empty-state"><div class="empty-text">暂无库存，下单验货后自动生成</div></div>'}
      </div>
    `;
  },

  showCheckForm() {
    if (!this.data.inventory.length) return App.toast('暂无库存，无法盘存');
    App.showModal(`
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet">
        <div class="sheet-header"><span class="title">门店盘存</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
        <div class="sheet-body">
          <div class="text-sm text-gray2" style="margin-bottom:12px">填写实际盘点数量，系统自动计算差异并更新库存</div>
          ${this.data.inventory.map((inv, i) => `
            <div class="ingredient-row">
              <div class="ir-name"><div class="name">${inv.ingredient?.name}</div><div class="spec">系统: ${inv.quantity}${inv.unit}</div></div>
              <input class="ir-input" type="number" id="sc-qty-${i}" value="${inv.quantity}" />
              <span class="ir-unit">${inv.unit}</span>
            </div>
          `).join('')}
        </div>
        <div class="sheet-footer">
          <button class="btn btn-outline btn-block" onclick="App.closeModal()">取消</button>
          <button class="btn btn-primary btn-block" onclick="Store.submitCheck()">确认盘存</button>
        </div>
      </div>
    `);
  },

  async submitCheck() {
    const items = this.data.inventory.map((inv, i) => ({
      ingredientId: inv.ingredientId, name: inv.ingredient?.name,
      systemQty: inv.quantity, actualQty: parseFloat(document.getElementById(`sc-qty-${i}`).value) || 0, unit: inv.unit,
    }));
    try {
      await API.createStoreCheck({ storeId: this.data.storeId, items });
      App.closeModal();
      App.toast('盘存完成');
      this.render();
    } catch (e) { App.toast(e.message); }
  },

  viewCheck(id) {
    const c = this.data.checks.find(x => x.id === id);
    if (!c) return;
    App.showModal(`
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet"><div class="sheet-header"><span class="title">盘存详情</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
      <div class="sheet-body">
        <div class="detail-section"><div class="ds-label">盘存单号</div><div class="ds-value">${c.id}</div></div>
        <div class="detail-section"><div class="ds-label">盘存时间</div><div class="ds-value">${c.createdAt}</div></div>
        <div class="detail-section"><div class="ds-label">盘存明细</div>
          <div class="mini-table"><div class="th"><span style="flex:2">品项</span><span style="flex:1;text-align:right">系统数</span><span style="flex:1;text-align:right">实盘数</span><span style="flex:1;text-align:right">差异</span></div>
            ${c.items.map(i => `<div class="td"><span style="flex:2">${i.name}</span><span style="flex:1;text-align:right">${i.systemQty}${i.unit}</span><span style="flex:1;text-align:right">${i.actualQty}${i.unit}</span><span style="flex:1;text-align:right;color:${i.difference < 0 ? 'var(--danger)' : 'var(--success)'}">${i.difference > 0 ? '+' : ''}${i.difference}</span></div>`).join('')}
          </div>
        </div>
      </div>
      <div class="sheet-footer"><button class="btn btn-outline btn-block" onclick="App.closeModal()">关闭</button></div></div>
    `);
  },

  // ===== Tab 4: 更多 =====
  pageMore() {
    return `
      <div class="card">
        <div class="card-title">数据导出</div>
        <div class="list-item" onclick="Store.showExportPanel()"><div class="li-main"><div class="li-title">📊 导出报表</div><div class="li-sub">盘存/入库食材数据导出</div></div><span class="text-gray">→</span></div>
      </div>
      <div class="card">
        <div class="card-title">耗用核算</div>
        <div class="list-item" onclick="Store.showConsumptionList()"><div class="li-main"><div class="li-title">💰 耗用核算记录</div><div class="li-sub">${this.data.consumptionRecords.length} 条记录</div></div><span class="text-gray">→</span></div>
        <div class="list-item" onclick="Store.showConsumptionForm()"><div class="li-main"><div class="li-title">+ 新建耗用核算</div><div class="li-sub">期初+入库-期末=耗用</div></div><span class="text-gray">→</span></div>
      </div>
      <div class="card">
        <div class="card-title">其他</div>
        <div class="list-item" onclick="Store.showMyInventory()"><div class="li-main"><div class="li-title">📊 门店库存明细</div><div class="li-sub">查看本店全部库存</div></div><span class="text-gray">→</span></div>
        <div class="list-item" onclick="Store.showIngredients()"><div class="li-main"><div class="li-title">🥬 食材品项查看</div><div class="li-sub">查看所有可下单食材及价格</div></div><span class="text-gray">→</span></div>
      </div>
      <div class="card">
        <div class="list-item" onclick="App.logout()"><div class="li-main"><div class="li-title text-info">🔄 退出登录</div><div class="li-sub">返回登录界面</div></div><span class="text-gray">→</span></div>
      </div>
    `;
  },

  // ===== 数据导出 =====
  showExportPanel() {
    const today = new Date().toISOString().slice(0, 10);
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    App.showModal(`
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet">
        <div class="sheet-header"><span class="title">数据导出</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
        <div class="sheet-body">
          <div class="form-row">
            <div class="form-group"><label class="form-label">开始日期</label><input class="form-input" id="st-ex-start" type="date" value="${monthAgo}" /></div>
            <div class="form-group"><label class="form-label">结束日期</label><input class="form-input" id="st-ex-end" type="date" value="${today}" /></div>
          </div>
          <div class="list-item" onclick="Store.doExport('checks')"><div class="li-main"><div class="li-title">📋 门店盘存数据</div><div class="li-sub">食材数量和差异明细</div></div><span class="text-info">导出 →</span></div>
          <div class="list-item" onclick="Store.doExport('inbound')"><div class="li-main"><div class="li-title">📋 入库食材金额明细</div><div class="li-sub">周期验货入库食材总计金额明细</div></div><span class="text-info">导出 →</span></div>
        </div>
        <div class="sheet-footer"><button class="btn btn-outline btn-block" onclick="App.closeModal()">关闭</button></div>
      </div>
    `);
  },

  async doExport(type) {
    const startDate = document.getElementById('st-ex-start')?.value || '';
    const endDate = document.getElementById('st-ex-end')?.value || '';
    try {
      App.toast('正在导出...');
      if (type === 'checks') {
        const list = await API.exportStoreChecks(this.data.storeId, startDate, endDate);
        const headers = ['盘存单号', '盘存时间', '品项', '系统数量', '实盘数量', '差异', '单位'];
        const rows = [];
        list.forEach(c => c.items.forEach(i => rows.push([c.id, c.createdAt, i.name, i.systemQty, i.actualQty, i.difference, i.unit])));
        App.exportCSV(`门店盘存_${startDate}_${endDate}.csv`, headers, rows);
      } else if (type === 'inbound') {
        const list = await API.exportStoreInbound(this.data.storeId, startDate, endDate);
        // 按食材汇总
        const summary = {};
        list.forEach(r => r.items.forEach(i => {
          const key = i.ingredientId;
          if (!summary[key]) summary[key] = { name: i.name, unit: i.unit, totalQty: 0, totalAccepted: 0, totalRejected: 0, count: 0 };
          summary[key].totalQty += i.orderedQty || 0;
          summary[key].totalAccepted += i.acceptedQty || 0;
          summary[key].totalRejected += i.rejectedQty || 0;
          summary[key].count++;
        }));
        const ing = this.data.ingredients;
        const headers = ['品项', '规格', '单位', '验货次数', '应收总量', '实收总量', '拒收总量', '出库单价', '实收金额'];
        const rows = Object.values(summary).map(s => {
          const ingData = ing.find(x => x.name === s.name);
          const price = ingData ? (ingData.outboundPrice || 0) : 0;
          return [s.name, ingData ? (ingData.spec || '') : '', s.unit, s.count, s.totalQty, s.totalAccepted, s.totalRejected, price, Math.round(s.totalAccepted * price * 100) / 100];
        });
        // 添加合计行
        const totalAmount = rows.reduce((sum, r) => sum + (r[8] || 0), 0);
        rows.push(['合计', '', '', '', '', '', '', '', Math.round(totalAmount * 100) / 100]);
        App.exportCSV(`门店入库明细_${startDate}_${endDate}.csv`, headers, rows);
      }
    } catch (e) { App.toast(e.message); }
  },

  showMyInventory() {
    const inv = this.data.inventory;
    let total = 0;
    inv.forEach(i => { if (i.ingredient) total += i.quantity * (i.ingredient.outboundPrice || i.ingredient.referencePrice || 0); });
    App.showModal(`
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet"><div class="sheet-header"><span class="title">门店库存明细</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
      <div class="sheet-body">
        <div class="detail-section"><div class="ds-label">品项总数</div><div class="ds-value">${inv.length} 项</div></div>
        <div class="detail-section"><div class="ds-label">库存总值</div><div class="ds-value">¥${Math.round(total).toLocaleString()}</div></div>
        <div class="detail-section"><div class="ds-label">库存明细</div>
          <div class="mini-table"><div class="th"><span style="flex:2">品项</span><span style="flex:1;text-align:right">库存</span><span style="flex:1;text-align:right">单价</span><span style="flex:1;text-align:right">小计</span></div>
            ${inv.map(i => { const v = Math.round(i.quantity * (i.ingredient?.outboundPrice || 0)); return `<div class="td"><span style="flex:2">${i.ingredient?.name || '--'}</span><span style="flex:1;text-align:right">${i.quantity}${i.unit}</span><span style="flex:1;text-align:right">¥${i.ingredient?.outboundPrice || 0}</span><span style="flex:1;text-align:right">¥${v.toLocaleString()}</span></div>`; }).join('')}
          </div>
        </div>
      </div>
      <div class="sheet-footer"><button class="btn btn-outline btn-block" onclick="App.closeModal()">关闭</button></div></div>
    `);
  },

  showIngredients() {
    const warehouses = this.data.warehouses || [];
    App.showModal(`
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet"><div class="sheet-header"><span class="title">食材品项 (${this.data.ingredients.length})</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
      <div class="sheet-body">
        <div class="mini-table"><div class="th"><span style="flex:2">品项</span><span style="flex:1;text-align:right">分仓</span><span style="flex:1;text-align:right">出库价</span></div>
          ${this.data.ingredients.map(ing => {
            const wh = warehouses.find(w => w.id === ing.warehouseId);
            return `<div class="td"><span style="flex:2">${ing.name}</span><span style="flex:1;text-align:right;font-size:12px">${wh ? wh.name : '--'}</span><span style="flex:1;text-align:right">¥${ing.outboundPrice || 0}/${ing.unit}</span></div>`;
          }).join('')}
        </div>
      </div>
      <div class="sheet-footer"><button class="btn btn-outline btn-block" onclick="App.closeModal()">关闭</button></div></div>
    `);
  },

  showConsumptionList() {
    App.showModal(`
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet"><div class="sheet-header"><span class="title">耗用核算记录 (${this.data.consumptionRecords.length})</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
      <div class="sheet-body">
        ${this.data.consumptionRecords.map(r => `
          <div class="list-item" onclick="App.closeModal();Store.viewConsumption('${r.id}')">
            <div class="li-main"><div class="li-title">耗用核算 · ${r.period}</div><div class="li-sub">${r.items.length}项 · 总成本 ¥${r.totalCost}</div></div>
            <div class="li-right"><span class="badge badge-completed">已完成</span></div>
          </div>
        `).join('') || '<div class="empty-state"><div class="empty-text">暂无记录</div></div>'}
      </div>
      <div class="sheet-footer"><button class="btn btn-outline btn-block" onclick="App.closeModal()">关闭</button></div></div>
    `);
  },

  showConsumptionForm() {
    const inv = this.data.inventory;
    if (!inv.length) return App.toast('暂无库存，无法核算');
    App.showModal(`
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet">
        <div class="sheet-header"><span class="title">新建耗用核算</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
        <div class="sheet-body">
          <div class="form-group"><label class="form-label">核算周期</label><input class="form-input" id="cp-period" type="date" value="${new Date().toISOString().slice(0,10)}" /></div>
          <div class="form-group"><label class="form-label">备注</label><input class="form-input" id="cp-remark" placeholder="选填" /></div>
          <div class="text-sm text-gray2" style="margin-bottom:8px">公式：耗用量 = 期初 + 入库 - 期末</div>
          ${inv.map((item, i) => `
            <div style="margin-bottom:12px;background:#fafafa;border-radius:8px;padding:10px 12px">
              <div class="flex-between mb-8"><span class="text-bold">${item.ingredient?.name}</span><span class="text-sm text-gray">¥${item.ingredient?.outboundPrice || 0}/${item.unit}</span></div>
              <div class="form-row">
                <div class="form-group" style="margin-bottom:0"><label class="form-label">期初库存</label><div class="form-picker" style="padding:6px 8px;font-size:13px">${item.quantity}${item.unit}</div></div>
                <div class="form-group" style="margin-bottom:0"><label class="form-label">今日入库</label><input class="form-input" type="number" id="cp-recv-${i}" value="0" style="padding:6px 8px;font-size:13px" /></div>
              </div>
              <div class="form-group" style="margin-top:8px;margin-bottom:0"><label class="form-label">期末实盘数量</label><input class="form-input" type="number" id="cp-end-${i}" value="${item.quantity}" style="padding:6px 8px;font-size:13px" /></div>
            </div>
          `).join('')}
        </div>
        <div class="sheet-footer">
          <button class="btn btn-outline btn-block" onclick="App.closeModal()">取消</button>
          <button class="btn btn-primary btn-block" onclick="Store.submitConsumption()">确认核算</button>
        </div>
      </div>
    `);
  },

  async submitConsumption() {
    const period = document.getElementById('cp-period').value;
    const remark = document.getElementById('cp-remark').value.trim();
    const items = this.data.inventory.map((inv, i) => ({
      ingredientId: inv.ingredientId, name: inv.ingredient?.name,
      beginningQty: inv.quantity,
      receivedQty: parseFloat(document.getElementById(`cp-recv-${i}`).value) || 0,
      endingQty: parseFloat(document.getElementById(`cp-end-${i}`).value) || 0,
      unitCost: inv.ingredient?.outboundPrice || inv.ingredient?.referencePrice || 0,
      unit: inv.unit,
    }));
    try {
      await API.createConsumptionRecord({ storeId: this.data.storeId, period, items, remark });
      App.closeModal();
      App.toast('核算完成');
      this.render();
    } catch (e) { App.toast(e.message); }
  },

  viewConsumption(id) {
    const r = this.data.consumptionRecords.find(x => x.id === id);
    if (!r) return;
    App.showModal(`
      <div class="overlay-mask" onclick="App.closeModal()"></div>
      <div class="sheet"><div class="sheet-header"><span class="title">耗用核算详情</span><span class="sheet-close" onclick="App.closeModal()">✕</span></div>
      <div class="sheet-body">
        <div class="detail-section"><div class="ds-label">核算周期</div><div class="ds-value">${r.period}</div></div>
        <div class="detail-section"><div class="ds-label">总成本</div><div class="ds-value" style="font-size:18px;font-weight:700;color:var(--primary)">¥${r.totalCost}</div></div>
        <div class="detail-section"><div class="ds-label">明细</div>
          <div class="mini-table"><div class="th"><span style="flex:2">品项</span><span style="flex:1;text-align:right">期初</span><span style="flex:1;text-align:right">入库</span><span style="flex:1;text-align:right">期末</span><span style="flex:1;text-align:right">耗用</span><span style="flex:1;text-align:right">成本</span></div>
            ${r.items.map(i => `<div class="td"><span style="flex:2">${i.name}</span><span style="flex:1;text-align:right">${i.beginningQty}</span><span style="flex:1;text-align:right">${i.receivedQty}</span><span style="flex:1;text-align:right">${i.endingQty}</span><span style="flex:1;text-align:right">${i.consumedQty}</span><span style="flex:1;text-align:right">¥${i.totalCost}</span></div>`).join('')}
          </div>
        </div>
      </div>
      <div class="sheet-footer"><button class="btn btn-outline btn-block" onclick="App.closeModal()">关闭</button></div></div>
    `);
  },
};
