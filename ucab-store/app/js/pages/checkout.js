import { requireAuth } from '../auth.js';
import { bootstrap } from '../shell.js';
import {
  cartTotals,
  clearCart,
  enqueueOrder,
  isOnline,
  placeOrder,
} from '../state.js';
import {
  formatMoney,
  successModal,
  toast,
} from '../ui.js';

await bootstrap();

const user = requireAuth();
if (user) render();

function render() {
  const mount = document.getElementById('view');
  const { items, subtotal, tax, total } = cartTotals();
  if (items.length === 0) {
    mount.innerHTML = `<div class="container empty">
      <h2>No hay productos para pagar</h2>
      <a class="btn btn-primary" href="catalog.html">Ir al catálogo</a>
    </div>`;
    return;
  }
  const online = isOnline();

  mount.innerHTML = `
    <div class="container">
      <h1>Checkout</h1>
      <div class="cart-layout">
        <form id="checkoutForm" class="form-card" style="max-width:none;margin:0">
          <h3>Datos de envío</h3>
          <div class="field">
            <label for="address">Dirección</label>
            <input class="input" id="address" name="address" required value="${user.address || ''}"/>
          </div>
          <h3 style="margin-top:1rem">Pago</h3>
          <div class="field">
            <label for="holder">Titular de la tarjeta</label>
            <input class="input" id="holder" name="holder" required value="${user.name}"/>
          </div>
          <div class="field">
            <label for="cardNumber">Número de tarjeta</label>
            <input class="input" id="cardNumber" name="cardNumber" inputmode="numeric" required placeholder="4242 4242 4242 4242" maxlength="19"/>
          </div>
          <div class="form-row">
            <div class="field">
              <label for="expiry">Vencimiento</label>
              <input class="input" id="expiry" name="expiry" required placeholder="MM/AA" maxlength="5"/>
            </div>
            <div class="field">
              <label for="cvv">CVV</label>
              <input class="input" id="cvv" name="cvv" required inputmode="numeric" maxlength="4"/>
            </div>
          </div>
          <button class="btn btn-primary btn-block" type="submit">Pagar ${formatMoney(total)}</button>
          <p class="muted" style="margin-top:.75rem;font-size:.85rem">
            ${online ? 'Pago seguro simulado.' : 'Estás offline. La orden se guardará y se procesará automáticamente al recuperar la conexión.'}
          </p>
        </form>

        <aside class="summary">
          <h3>Resumen</h3>
          ${items.map((it) => `<div class="summary-row"><span>${it.qty}× ${it.product.title.slice(0, 22)}…</span><span>${formatMoney(it.subtotal)}</span></div>`).join('')}
          <div class="summary-row"><span>Subtotal</span><span>${formatMoney(subtotal)}</span></div>
          <div class="summary-row"><span>IVA (16%)</span><span>${formatMoney(tax)}</span></div>
          <div class="summary-row total"><span>Total</span><span>${formatMoney(total)}</span></div>
        </aside>
      </div>
    </div>
  `;

  const form = mount.querySelector('#checkoutForm');
  form.cardNumber.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
  });
  form.expiry.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
    e.target.value = v;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate(form)) return;
    const totals = { subtotal, tax, total };
    const data = Object.fromEntries(new FormData(form));
    if (isOnline()) {
      placeOrder({ user, payment: data, items, totals, offline: false });
      clearCart();
      await successModal({
        title: '¡Compra realizada!',
        message: `Tu orden por ${formatMoney(total)} fue procesada con éxito.`,
        icon: '🎉',
      });
    } else {
      enqueueOrder({ user, payment: data, items, totals });
      clearCart();
      await successModal({
        title: 'Compra en cola',
        message: 'Estás offline: la orden quedó en cola y se procesará automáticamente al volver online.',
        icon: '📥',
      });
    }
    location.href = 'profile.html';
  });
}

function validate(form) {
  const card = form.cardNumber.value.replace(/\s+/g, '');
  if (!/^\d{13,16}$/.test(card)) { toast('Número de tarjeta inválido.'); return false; }
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(form.expiry.value)) { toast('Vencimiento inválido (MM/AA).'); return false; }
  if (!/^\d{3,4}$/.test(form.cvv.value)) { toast('CVV inválido.'); return false; }
  if (!form.address.value.trim()) { toast('Ingresa una dirección de envío.'); return false; }
  return true;
}
