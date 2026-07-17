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
