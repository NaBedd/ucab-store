import { bootstrap } from '../shell.js';
import {
  cartTotals,
  clearCart,
  removeFromCart,
  updateCartQty,
} from '../state.js';
import {
  escapeHTML,
  formatMoney,
  toast,
} from '../ui.js';

await bootstrap();
render();

function render() {
  const mount = document.getElementById('view');
  const { items, subtotal, tax, total } = cartTotals();
  if (items.length === 0) {
    mount.innerHTML = `
      <div class="container empty">
        <h2>Tu carrito está vacío</h2>
        <p>Explora el catálogo para encontrar tus productos favoritos.</p>
        <a href="catalog.html" class="btn btn-primary">Ir al catálogo</a>
      </div>`;
    return;
  }

  mount.innerHTML = `
    <div class="container">
      <h1>Tu carrito</h1>
      <div class="cart-layout">
        <div class="cart-list">
          ${items.map(itemHTML).join('')}
          <div class="row" style="justify-content:space-between">
            <a href="catalog.html" class="btn btn-ghost btn-sm">← Seguir comprando</a>
            <button class="btn btn-ghost btn-sm" id="clearBtn">Vaciar carrito</button>
          </div>
        </div>
        <aside class="summary">
          <h3>Resumen</h3>
          <div class="summary-row"><span>Subtotal</span><span>${formatMoney(subtotal)}</span></div>
          <div class="summary-row"><span>IVA (16%)</span><span>${formatMoney(tax)}</span></div>
          <div class="summary-row total"><span>Total</span><span>${formatMoney(total)}</span></div>
          <a href="checkout.html" class="btn btn-primary btn-block" style="margin-top:1rem">Proceder al pago</a>
        </aside>
      </div>
    </div>`;

  mount.querySelectorAll('[data-inc]').forEach((b) => b.addEventListener('click', () => {
    const it = items.find((i) => i.productId === b.dataset.inc);
    updateCartQty(b.dataset.inc, it.qty + 1); render();
  }));
  mount.querySelectorAll('[data-dec]').forEach((b) => b.addEventListener('click', () => {
    const it = items.find((i) => i.productId === b.dataset.dec);
    updateCartQty(b.dataset.dec, it.qty - 1); render();
  }));
  mount.querySelectorAll('[data-clone]').forEach((b) => b.addEventListener('click', () => {
    const it = items.find((i) => i.productId === b.dataset.clone);
    updateCartQty(b.dataset.clone, it.qty + 1); render();
    toast('Producto duplicado.');
  }));
  mount.querySelectorAll('[data-remove]').forEach((b) => b.addEventListener('click', () => {
    removeFromCart(b.dataset.remove); render();
  }));
  mount.querySelector('#clearBtn').addEventListener('click', () => {
    clearCart(); render();
  });
}

function itemHTML(it) {
  return `
    <div class="cart-item">
      <div class="thumb"><img src="${escapeHTML(it.product.image)}" alt="${escapeHTML(it.product.title)}"/></div>
      <div>
        <strong>${escapeHTML(it.product.title)}</strong>
        <div class="muted" style="font-size:.85rem">${formatMoney(it.product.price)} c/u</div>
        <div class="row" style="margin-top:.5rem">
          <div class="qty-ctrl">
            <button data-dec="${it.productId}" aria-label="Restar">−</button>
            <span class="qty">${it.qty}</span>
            <button data-inc="${it.productId}" aria-label="Sumar">+</button>
          </div>
          <button class="btn btn-sm btn-ghost" data-clone="${it.productId}">Agregar</button>
          <button class="btn btn-sm btn-danger" data-remove="${it.productId}">Eliminar</button>
        </div>
      </div>
      <div style="text-align:right"><strong>${formatMoney(it.subtotal)}</strong></div>
    </div>`;
}
