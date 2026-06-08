import { bootstrap } from '../shell.js';
import {
  listProducts, saveProduct, deleteProduct, listCategories,
  listOrders, updateOrderStatus, dashboardMetrics,
} from '../state.js';
import { escapeHTML, formatMoney, formatCategory, formatDate, toast, confirmModal } from '../ui.js';
import { requireAuth } from '../auth.js';

await bootstrap();

const user = requireAuth('admin');
if (user) render();

function render() {
  const mount = document.getElementById('view');
  mount.innerHTML = `
    <div class="container">
      <h1>Panel de administración</h1>
      <div class="tabs" id="adminTabs">
        <button data-tab="dashboard" class="active">Dashboard</button>
        <button data-tab="inventory">Inventario</button>
        <button data-tab="orders">Ventas</button>
      </div>
      <div id="tabContent"></div>
    </div>
  `;
  const tabs = mount.querySelector('#adminTabs');
  const content = mount.querySelector('#tabContent');
  const renderers = { dashboard, inventory, orders };

  function switchTab(name) {
    tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    renderers[name](content);
  }
  tabs.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-tab]');
    if (btn) switchTab(btn.dataset.tab);
  });
  switchTab('dashboard');
}

function dashboard(root) {
  const m = dashboardMetrics();
  const max = Math.max(1, ...m.topProducts.map((p) => p.qty));
  root.innerHTML = `
    <div class="stat-grid">
      <div class="stat"><div class="label">Ingresos totales</div><div class="value">${formatMoney(m.revenue)}</div></div>
      <div class="stat"><div class="label">Órdenes</div><div class="value">${m.orderCount}</div></div>
      <div class="stat"><div class="label">Usuarios registrados</div><div class="value">${m.totalUsers}</div></div>
      <div class="stat"><div class="label">Usuarios activos</div><div class="value">${m.activeUsers}</div></div>
    </div>
    <h2>Top 3 productos más vendidos</h2>
    ${m.topProducts.length === 0
      ? '<p class="muted">Aún no hay ventas registradas.</p>'
      : `<div class="bar-chart">
          ${m.topProducts.map((tp) => `
            <div class="bar-row">
              <span title="${escapeHTML(tp.product.title)}">${escapeHTML(tp.product.title.slice(0, 28))}…</span>
              <div class="bar"><span style="width:${(tp.qty / max * 100).toFixed(0)}%"></span></div>
              <strong>${tp.qty}</strong>
            </div>`).join('')}
        </div>`}
  `;
}

function inventory(root) {
  const products = listProducts();
  root.innerHTML = `
    <div class="spread" style="margin-bottom:1rem">
      <h2>Inventario (${products.length})</h2>
      <button id="newProductBtn" class="btn btn-primary">+ Nuevo producto</button>
    </div>
    <div id="productEditor"></div>
    <table class="table">
      <thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Acciones</th></tr></thead>
      <tbody>
        ${products.map((p) => `
          <tr>
            <td>
              <div class="row"><img src="${escapeHTML(p.image)}" alt="" style="width:40px;height:40px;object-fit:contain;background:#fff;border-radius:4px"/>
                <span>${escapeHTML(p.title)}</span></div>
            </td>
            <td><span class="tag">${escapeHTML(formatCategory(p.category))}</span></td>
            <td>${formatMoney(p.price)}</td>
            <td>
              <button class="btn btn-sm" data-edit="${p.id}">Editar</button>
              <button class="btn btn-sm btn-danger" data-del="${p.id}">Eliminar</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>
  `;

  root.querySelector('#newProductBtn').addEventListener('click', () => editor(root, null));
  root.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => {
    editor(root, products.find((x) => x.id === b.dataset.edit));
  }));
  root.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
    const ok = await confirmModal({
      title: 'Eliminar producto',
      message: '¿Seguro que deseas eliminar este producto del inventario?',
      confirmText: 'Eliminar', danger: true, icon: '🗑️',
    });
    if (ok) {
      deleteProduct(b.dataset.del);
      inventory(root);
      toast('Producto eliminado.');
    }
  }));
}

function editor(root, product) {
  const slot = root.querySelector('#productEditor');
  const isNew = !product;
  const p = product || { id: '', title: '', description: '', price: 0, category: '', image: '', rating: 0, ratingCount: 0 };
  const categories = listCategories();

  slot.innerHTML = `
    <form class="form-card" style="max-width:none" id="prodForm">
      <h3>${isNew ? 'Nuevo producto' : 'Editar producto'}</h3>
      <div class="form-row">
        <div class="field"><label>Título</label><input class="input" name="title" required value="${escapeHTML(p.title)}"/></div>
        <div class="field"><label>Categoría</label>
          <input class="input" name="category" required value="${escapeHTML(p.category)}" list="catList"/>
          <datalist id="catList">${categories.map((c) => `<option value="${escapeHTML(c)}">${escapeHTML(formatCategory(c))}</option>`).join('')}</datalist>
        </div>
      </div>
      <div class="form-row">
        <div class="field"><label>Precio (USD)</label><input class="input" name="price" type="number" step="0.01" min="0" required value="${p.price}"/></div>
        <div class="field"><label>Imagen (URL)</label><input class="input" name="image" required value="${escapeHTML(p.image)}"/></div>
      </div>
      <div class="field"><label>Descripción</label><textarea class="textarea" name="description" rows="3">${escapeHTML(p.description)}</textarea></div>
      <div class="row">
        <button class="btn btn-primary" type="submit">${isNew ? 'Crear' : 'Guardar'}</button>
        <button class="btn btn-ghost" type="button" id="cancelEdit">Cancelar</button>
      </div>
    </form>
  `;
  slot.querySelector('#cancelEdit').addEventListener('click', () => { slot.innerHTML = ''; });
  slot.querySelector('#prodForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.price = Number(data.price);
    data.id = isNew ? '' : p.id;
    data.rating = p.rating;
    data.ratingCount = p.ratingCount;
    saveProduct({ ...p, ...data });
    toast(isNew ? 'Producto creado.' : 'Producto actualizado.');
    inventory(root);
  });
}

function orders(root) {
  const list = listOrders();
  root.innerHTML = `
    <h2>Historial de ventas (${list.length})</h2>
    ${list.length === 0
      ? '<p class="empty">Aún no hay órdenes registradas.</p>'
      : `<table class="table">
          <thead><tr><th>#</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th></tr></thead>
          <tbody>
            ${list.map((o) => `
              <tr>
                <td>#${o.id.slice(-6)}</td>
                <td>${escapeHTML(o.userName)}<div class="muted" style="font-size:.8rem">${escapeHTML(o.userEmail)}</div></td>
                <td>${formatDate(o.createdAt)}</td>
                <td>${formatMoney(o.totals.total)}</td>
                <td>
                  <select class="select" data-status="${o.id}">
                    ${['pending','shipped','delivered'].map((s) =>
                      `<option value="${s}" ${o.status===s?'selected':''}>${labelFor(s)}</option>`).join('')}
                  </select>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>`}
  `;
  root.querySelectorAll('[data-status]').forEach((sel) => sel.addEventListener('change', (e) => {
    updateOrderStatus(sel.dataset.status, e.target.value);
    toast('Estado actualizado.');
  }));
}

function labelFor(s) {
  return { pending: 'Pendiente', shipped: 'Enviado', delivered: 'Entregado' }[s] || s;
}
