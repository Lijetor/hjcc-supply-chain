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
