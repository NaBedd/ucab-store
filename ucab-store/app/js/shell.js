// Renderiza header/footer compartidos en cada página y conecta
// los eventos globales (tema, conexión, carrito, sesión).
import {
  currentUser,
  ensureCatalog,
  getCart,
  getTheme,
  initState,
  isOfflineOverride,
  isOnline,
  logoutUser,
  processQueue,
  queueSize,
  setOfflineOverride,
  setTheme,
} from './state.js';
import {
  $,
  $$,
  confirmModal,
  escapeHTML,
  openModal,
  successModal,
  toast,
} from './ui.js';

const NAV_LINKS = [
  { href: 'index.html',   label: 'Inicio',   key: 'home' },
  { href: 'catalog.html', label: 'Catálogo', key: 'catalog' },
  { href: 'cart.html',    label: 'Carrito',  key: 'cart', badge: true },
];

function initials(name) {
  return name.trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase();
}

function renderHeader() {
  const header = $('header.topbar');
  if (!header) return;
  const user = currentUser();
  const active = document.body.dataset.page;

  const linksHTML = NAV_LINKS.map((l) => `
    <a href="${l.href}" class="${active === l.key ? 'active' : ''}" data-nav="${l.key}">
      ${l.label}${l.badge ? ` <span class="badge" id="cartBadge">0</span>` : ''}
    </a>
  `).join('');

  const adminLink = user?.role === 'admin'
    ? `<a href="admin.html" class="${active === 'admin' ? 'active' : ''}">Admin</a>`
    : '';

  const profileHTML = user
    ? `<a href="profile.html" class="profile-chip" title="Ir al perfil de ${escapeHTML(user.name)}">
         <span class="avatar">${user.avatar
            ? `<img src="${escapeHTML(user.avatar)}" alt=""/>`
            : escapeHTML(initials(user.name))}</span>
         <span class="pname">${escapeHTML(user.name.split(' ')[0])}</span>
         ${user.role === 'admin' ? '<span class="admin-pill">Admin</span>' : ''}
       </a>`
    : `<a href="login.html" class="btn btn-sm btn-primary">Ingresar</a>`;

  header.innerHTML = `
    <a href="index.html" class="brand">
      <span class="brand-mark">UCAB</span>
      <span class="brand-name">Store</span>
    </a>
    <nav class="nav" id="mainNav">
      ${linksHTML}
      ${adminLink}
      ${profileHTML}
    </nav>
    <div class="topbar-actions">
      <button id="themeToggle" class="icon-btn" aria-label="Cambiar tema">🌙</button>
      <button id="navToggle" class="icon-btn mobile-only" aria-label="Menú">☰</button>
    </div>
  `;
  updateCartBadge();
  wireHeader();
}

function wireHeader() {
  const themeBtn = $('#themeToggle');
  themeBtn.textContent = getTheme() === 'dark' ? '☀️' : '🌙';
  themeBtn.addEventListener('click', () => {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    setTheme(next);
    themeBtn.textContent = next === 'dark' ? '☀️' : '🌙';
  });
  $('#navToggle').addEventListener('click', () => $('#mainNav').classList.toggle('open'));
}

function renderAdminBanner() {
  const slot = $('#adminBanner');
  if (!slot) return;
  const user = currentUser();
  if (user?.role === 'admin') {
    slot.innerHTML = `Has iniciado sesión como <strong>${escapeHTML(user.name)}</strong> con permisos de administrador. 
      <a href="admin.html">Ir al panel</a>.`;
    slot.hidden = false;
  } else {
    slot.hidden = true;
    slot.innerHTML = '';
  }
}

function renderFooter() {
  const footer = $('footer.footer');
  if (!footer) return;
  footer.innerHTML = `
    <div class="footer-cols">
      <div>
        <h4>UCAB Store</h4>
        <p>Proyecto académico — Programación Orientada a la Web.</p>
      </div>
      <div>
        <h4>Enlaces</h4>
        <ul>
          <li><a href="catalog.html">Catálogo</a></li>
          <li><a href="login.html">Iniciar sesión</a></li>
          <li><a href="#" data-social="Política de privacidad">Política de privacidad</a></li>
        </ul>
      </div>
      <div>
        <h4>Síguenos</h4>
        <ul class="social">
          <li><a href="#" data-social="Twitter" aria-label="Twitter">𝕏</a></li>
          <li><a href="#" data-social="Instagram" aria-label="Instagram">📷</a></li>
          <li><a href="#" data-social="Facebook" aria-label="Facebook">f</a></li>
        </ul>
      </div>
      <div>
        <h4>Estado de conexión</h4>
        <button class="conn-toggle" id="connToggle" type="button" title="Click para alternar entre online y offline">
          <span class="dot"></span><span id="connText">Online</span>
        </button>
        <p style="margin-top:.5rem;font-size:.85rem">Pendientes en cola: <strong id="queueCount">0</strong></p>
      </div>
    </div>
    <div class="footer-bottom">© 2026 UCAB Store. Todos los derechos reservados.</div>
  `;
  wireFooter();
  updateConnectionUI();
  updateQueueIndicator();
}

function wireFooter() {
  $('#connToggle').addEventListener('click', async () => {
    const goingOffline = isOnline();
    setOfflineOverride(goingOffline);
    if (!goingOffline) {
      const n = queueSize();
      if (n > 0) {
        const processed = await processQueue();
        if (processed > 0) toast(`Se sincronizaron ${processed} órdenes pendientes.`);
      }
    } else {
      toast('Modo offline activado. Las nuevas compras se guardarán en cola.');
    }
  });
  $$('[data-social]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const name = a.dataset.social;
      openModal({
        title: `${name}`,
        body: `<p class="muted modal-text-center">Estás a punto de salir de UCAB Store para visitar <strong>${escapeHTML(name)}</strong>.</p>
               <p class="muted modal-text-center" style="font-size:.85rem">(Este es un enlace de demostración: no se abrirá ningún sitio real.)</p>`,
        icon: '🔗',
        actions: [
          { label: 'Cancelar', variant: 'btn-ghost' },
          { label: 'Continuar', variant: 'btn-primary' },
        ],
      });
    });
  });
}

export function updateCartBadge() {
  const count = getCart().reduce((s, c) => s + c.qty, 0);
  const badge = $('#cartBadge');
  if (badge) badge.textContent = String(count);
}

export function updateQueueIndicator() {
  const el = $('#queueCount');
  if (el) el.textContent = String(queueSize());
}

export function updateConnectionUI() {
  const btn = $('#connToggle');
  const text = $('#connText');
  if (!btn) return;
  const online = isOnline();
  btn.dataset.state = online ? 'online' : 'offline';
  if (text) text.textContent = online ? 'Online' : 'Offline (manual)';
}

// ===== Logout flow (confirm + success modal con fondo borroso) =====
export async function performLogout() {
  const ok = await confirmModal({
    title: 'Cerrar sesión',
    message: '¿Estás seguro de que deseas cerrar tu sesión actual?',
    confirmText: 'Sí, cerrar sesión',
    cancelText: 'Cancelar',
    danger: true,
    icon: '👋',
  });
  if (!ok) return false;
  
  // 1. Borramos la sesión en el estado local
  logoutUser();
  
  // 2. Comprobamos de forma segura si estamos en la raíz o en index.html
  const isHome = location.pathname.endsWith('index.html') || location.pathname.endsWith('/');
  
  // 3. Si estamos en un sitio protegido (como perfil o admin), redirigimos al inicio
  if (!isHome) {
    sessionStorage.setItem('ucab:postLogoutSuccess', '1');
    location.href = 'index.html';
    return true;
  }
  
  // 4. Si ya estábamos en el index, solo mostramos el aviso de éxito de inmediato
  await successModal({
    title: 'Sesión cerrada',
    message: 'Tu sesión se cerró correctamente. ¡Esperamos verte pronto!',
    icon: '✓',
  });
  return true;
}

// Si venimos redirigidos desde profile tras cerrar sesión, mostramos el modal
function maybeShowPostLogout() {
  if (sessionStorage.getItem('ucab:postLogoutSuccess')) {
    sessionStorage.removeItem('ucab:postLogoutSuccess');
    successModal({
      title: 'Sesión cerrada',
      message: 'Tu sesión se cerró correctamente. ¡Esperamos verte pronto!',
      icon: '✓',
    });
  }
}

// ===== Bootstrap =====
export async function bootstrap() {
  await initState();
  setTheme(getTheme());
  renderHeader();
  renderFooter();
  renderAdminBanner();

  if ('serviceWorker' in navigator) {
    try { await navigator.serviceWorker.register('sw.js', { scope: '' }); }
    catch (e) { /* opcional */ }
  }

  try { await ensureCatalog(); } catch {}

  window.addEventListener('cart:updated', updateCartBadge);
  window.addEventListener('queue:updated', updateQueueIndicator);
  window.addEventListener('conn:changed', updateConnectionUI);
  window.addEventListener('online', updateConnectionUI);
  window.addEventListener('offline', updateConnectionUI);
  window.addEventListener('auth:changed', () => { renderHeader(); renderAdminBanner(); });

  // Auto-sync cuando se recupera la conexión real
  window.addEventListener('online', async () => {
    if (!isOfflineOverride() && queueSize() > 0) {
      const n = await processQueue();
      if (n > 0) toast(`Se sincronizaron ${n} órdenes pendientes.`);
    }
  });

  maybeShowPostLogout();
}
