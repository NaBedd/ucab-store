import { requireAuth } from '../auth.js';
import {
  bootstrap,
  performLogout,
} from '../shell.js';
import {
  currentUser,
  listOrdersByUser,
  updateOrderStatus,
  updateProfile,
} from '../state.js';
import {
  escapeHTML,
  formatDate,
  formatMoney,
  toast,
} from '../ui.js';

await bootstrap();

const user = requireAuth();
if (user) render();

function render() {
  const u = currentUser();
  const mount = document.getElementById('view');
  const orders = listOrdersByUser(u.id);

  mount.innerHTML = `
    <div class="container">
      <h1>Mi perfil</h1>
      <div class="cart-layout">
        <form id="profileForm" class="form-card" style="max-width:none;margin:0">
          <div class="row" style="margin-bottom:1rem;gap:1rem">
            <img src="${u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`}" alt="avatar" style="width:64px;height:64px;border-radius:50%;background:var(--surface-2)"/>
            <div>
              <strong>${escapeHTML(u.name)}</strong>
              ${u.role === 'admin' ? '<span class="admin-pill">Admin</span>' : ''}
              <div class="muted" style="font-size:.85rem">${escapeHTML(u.email)}</div>
            </div>
          </div>
          <div class="field">
            <label for="name">Nombre</label>
            <input class="input" id="name" name="name" value="${escapeHTML(u.name)}" required/>
          </div>
          <div class="field">
            <label for="avatar">Avatar (URL)</label>
            <input class="input" id="avatar" name="avatar" value="${escapeHTML(u.avatar || '')}" placeholder="https://..."/>
          </div>
          <div class="field">
            <label for="address">Dirección de envío</label>
            <input class="input" id="address" name="address" value="${escapeHTML(u.address || '')}"/>
          </div>
          <div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:.5rem">
            <button class="btn btn-primary" type="submit">Guardar cambios</button>
            <button class="btn btn-danger" type="button" id="logoutBtn">Cerrar sesión</button>
          </div>
        </form>

        <aside class="summary">
          <h3>Mis órdenes</h3>
          ${orders.length === 0
            ? '<p class="muted">Aún no tienes compras.</p>'
            : orders.map(orderHTML).join('')}
        </aside>
      </div>
    </div>
  `;

  mount.querySelector('#profileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    updateProfile(data);
    toast('Perfil actualizado.');
    render();
  });

  mount.querySelector('#logoutBtn').addEventListener('click', performLogout);

  // Escuchar los eventos del botón para confirmar la recepción del pedido
  mount.querySelectorAll('[data-receive-order]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const orderId = btn.dataset.receiveOrder;
      updateOrderStatus(orderId, 'delivered');
      toast('Órden marcada como recibida.');
      render(); // Vuelve a renderizar la vista para reflejar el cambio de estado de inmediato
    });
  });
}

function orderHTML(o) {
  const labelMap = {
    pending: 'Pendiente',
    shipped: 'Enviado',
    delivered: 'Entregado'
  };

  const statusLabel = labelMap[o.status] || o.status;

  // Si la orden aún no se ha entregado, renderiza el botón de acción rápida
  const actionButton = o.status !== 'delivered' 
    ? `<button class="btn btn-sm btn-accent" data-receive-order="${o.id}" style="margin-top:.5rem;display:block;width:100%">¡Ya llegó! 📦</button>` 
    : '';

  return `
    <div style="border-top:1px solid var(--border);padding:.75rem 0;font-size:.9rem">
      <div class="spread">
        <strong>#${o.id.slice(-6)}</strong>
        <span class="status status-${o.status}">${statusLabel}</span>
      </div>
      <div class="muted" style="margin-top:.25rem">${formatDate(o.createdAt)} — ${formatMoney(o.totals?.total || 0)}</div>
      ${actionButton}
    </div>`;
}