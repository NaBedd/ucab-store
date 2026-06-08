// Helpers de presentación pura (formateo, escape, modales, toasts, traducción de categorías).

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function escapeHTML(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export function formatMoney(n) {
  return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(n || 0);
}

export function formatDate(ts) {
  return new Date(ts).toLocaleString('es-VE', { dateStyle: 'medium', timeStyle: 'short' });
}

export function stars(value) {
  const pct = Math.max(0, Math.min(5, value)) / 5 * 100;
  return `<span class="stars" style="--pct:${pct}%"><span class="stars-fill"></span></span>`;
}

// ===== Traducción y formato de categorías al español =====
const CATEGORY_MAP = {
  "electronics": "Electrónica",
  "jewelery": "Joyería",
  "men's clothing": "Ropa de hombre",
  "women's clothing": "Ropa de mujer",
};
export function formatCategory(c) {
  if (!c) return '';
  const k = String(c).toLowerCase();
  if (CATEGORY_MAP[k]) return CATEGORY_MAP[k];
  // Capitaliza primera letra respetando el resto en minúscula
  return c.charAt(0).toUpperCase() + c.slice(1).toLowerCase();
}

// ===== Toast =====
let toastTimer;
export function toast(message, type = 'info') {
  let el = $('#toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.dataset.type = type;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

// ===== Modal genérico =====
// openModal({ title, body, icon, actions: [{label, variant, onClick, close}] })
// Retorna una promesa que se resuelve cuando el modal se cierra.
export function openModal({ title = '', body = '', icon = '', iconType = '', actions = [], dismissible = true } = {}) {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    const iconHTML = icon ? `<div class="modal-icon ${iconType}">${icon}</div>` : '';
    const actionsHTML = actions.length
      ? `<div class="modal-actions">${actions.map((a, i) =>
          `<button data-act="${i}" class="btn ${a.variant || ''}">${escapeHTML(a.label)}</button>`).join('')}</div>`
      : '';

    modal.innerHTML = `
      ${iconHTML}
      ${title ? `<h3 class="${icon ? 'modal-text-center' : ''}">${escapeHTML(title)}</h3>` : ''}
      <div class="modal-body ${icon ? 'modal-text-center' : ''}">${body}</div>
      ${actionsHTML}
    `;
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    function close(value) {
      backdrop.remove();
      document.removeEventListener('keydown', onKey);
      resolve(value);
    }
    function onKey(e) {
      if (e.key === 'Escape' && dismissible) close(null);
    }
    document.addEventListener('keydown', onKey);
    if (dismissible) {
      backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(null); });
    }
    modal.querySelectorAll('button[data-act]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const act = actions[Number(btn.dataset.act)];
        let value = act.value ?? act.label;
        if (act.onClick) {
          const ret = await act.onClick({ modal, close: (v) => close(v) });
          if (ret !== undefined) value = ret;
        }
        if (act.close !== false) close(value);
      });
    });

    // Focus primer input si hay
    const firstInput = modal.querySelector('input, textarea, select, button');
    if (firstInput) setTimeout(() => firstInput.focus(), 50);
  });
}

// Modal de confirmación rápida
export function confirmModal({ title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', danger = false, icon = '⚠️' } = {}) {
  return openModal({
    title,
    body: `<p class="muted modal-text-center">${escapeHTML(message)}</p>`,
    icon, iconType: danger ? 'danger' : '',
    actions: [
      { label: cancelText, variant: 'btn-ghost', value: false },
      { label: confirmText, variant: danger ? 'btn-danger' : 'btn-primary', value: true },
    ],
  });
}

// Modal de éxito (con fondo borroso)
export function successModal({ title = '¡Listo!', message = '', icon = '✓', buttonText = 'Aceptar' } = {}) {
  return openModal({
    title,
    body: `<p class="muted modal-text-center">${escapeHTML(message)}</p>`,
    icon, iconType: 'success',
    actions: [{ label: buttonText, variant: 'btn-primary', value: true }],
  });
}
