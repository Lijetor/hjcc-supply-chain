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
