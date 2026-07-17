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
