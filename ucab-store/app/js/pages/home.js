import { bootstrap } from '../shell.js';
import {
  listProducts,
  subscribeNewsletter,
} from '../state.js';
import {
  escapeHTML,
  formatCategory,
  formatMoney,
  stars,
  toast,
} from '../ui.js';

await bootstrap();
render();
window.addEventListener('catalog:updated', render);

function render() {
  const mount = document.getElementById('view');
  const products = listProducts();
  const featured = [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4);

  mount.innerHTML = `
    <section class="hero">
      <div class="hero-inner">
        <h1>Productos seleccionados, entregados a la velocidad de un clic.</h1>
        <p>Descubre lo mejor del catálogo UCAB Store: tecnología, moda y accesorios, con una experiencia 100% online y offline.</p>
        <div class="cta-row">
          <a href="/app/catalog.html" class="btn btn-accent">Explorar catálogo</a>
          <a href="/app/register.html" class="btn btn-ghost" style="color:#fff;border-color:rgba(255,255,255,.4)">Crear cuenta</a>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-inner">
        <h2>¿Por qué comprar con nosotros?</h2>
        <p class="lead">Diseñado pensando en una experiencia moderna y confiable.</p>
        <div class="benefits">
          <div class="benefit-card">
            <div class="icon">🚚</div>
            <h3>Envío rápido</h3>
            <p>Recibe tus pedidos sin esperas innecesarias.</p>
          </div>
          <div class="benefit-card">
            <div class="icon">📶</div>
            <h3>Soporte Offline</h3>
            <p>Haz tus compras incluso si te quedas sin conexión temporalmente.</p>
          </div>
          <div class="benefit-card">
            <div class="icon">🔒</div>
            <h3>Pago seguro</h3>
            <p>Tus datos transaccionales están protegidos bajo estándares modernos.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section" style="margin-top:0">
      <div class="section-inner">
        <h2>Productos destacados</h2>
        <div class="product-grid">
          ${featured.length === 0
            ? '<p class="empty">El catálogo se está cargando. Vuelve en un instante.</p>'
            : featured.map(card).join('')}
        </div>
      </div>
    </section>

    <section class="section" style="background: var(--surface-2); border-radius: var(--radius); padding: 3rem 1.5rem; margin: 2rem 0;">
      <div class="section-inner" style="max-width: var(--container); margin: 0 auto; text-align: center;">
        <h2>Lo que dicen nuestros clientes</h2>
        <p class="lead muted" style="margin-bottom: 2.5rem;">Opiniones de la comunidad estudiantil y profesional de la UCAB Store.</p>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; text-align: left;">
          
          <div class="form-card" style="margin: 0; max-width: none; background: var(--surface); padding: 1.5rem; border-radius: var(--radius-sm); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="color: var(--accent); margin-bottom: 0.5rem; font-size: 1.1rem;">★★★★★</div>
              <p style="font-style: italic; margin-bottom: 1.5rem; color: var(--text-muted); line-height: 1.5;">"Excelente servicio. Compré una laptop estando en los módulos sin conexión y el pedido se sincronizó apenas salí. ¡Súper confiable!"</p>
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <img src="https://api.dicebear.com/7.x/initials/svg?seed=Alejandro" alt="Alejandro G." style="width: 42px; height: 42px; border-radius: 50%; background: var(--surface-2);" />
              <div>
                <strong style="display: block; font-size: 0.9rem; color: var(--text);">Alejandro G.</strong>
                <span class="muted" style="font-size: 0.8rem; color: var(--text-muted);">Estudiante de Informática</span>
              </div>
            </div>
          </div>

          <div class="form-card" style="margin: 0; max-width: none; background: var(--surface); padding: 1.5rem; border-radius: var(--radius-sm); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="color: var(--accent); margin-bottom: 0.5rem; font-size: 1.1rem;">★★★★★</div>
              <p style="font-style: italic; margin-bottom: 1.5rem; color: var(--text-muted); line-height: 1.5;">"La indumentaria y accesorios tienen una calidad increíble. La entrega llegó súper rápido a la dirección indicada y pude marcar que ya llegó desde mi perfil."</p>
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <img src="https://api.dicebear.com/7.x/initials/svg?seed=Valeria" alt="Valeria M." style="width: 42px; height: 42px; border-radius: 50%; background: var(--surface-2);" />
              <div>
                <strong style="display: block; font-size: 0.9rem; color: var(--text);">Valeria M.</strong>
                <span class="muted" style="font-size: 0.8rem; color: var(--text-muted);">Usuario Premium</span>
              </div>
            </div>
          </div>

          <div class="form-card" style="margin: 0; max-width: none; background: var(--surface); padding: 1.5rem; border-radius: var(--radius-sm); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="color: var(--accent); margin-bottom: 0.5rem; font-size: 1.1rem;">★★★★☆</div>
              <p style="font-style: italic; margin-bottom: 1.5rem; color: var(--text-muted); line-height: 1.5;">"La fluidez visual en dispositivos móviles y ordenadores es perfecta. El sistema de alertas por Toast te mantiene informado en todo momento."</p>
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <img src="https://api.dicebear.com/7.x/initials/svg?seed=Ricardo" alt="Ricardo T." style="width: 42px; height: 42px; border-radius: 50%; background: var(--surface-2);" />
              <div>
                <strong style="display: block; font-size: 0.9rem; color: var(--text);">Ricardo T.</strong>
                <span class="muted" style="font-size: 0.8rem; color: var(--text-muted);">Egresado UCAB</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <section class="newsletter">
      <h2>Únete al newsletter</h2>
      <p>Recibe ofertas y novedades directamente en tu correo.</p>
      <form id=\"newsletterForm\" novalidate>
        <input type=\"email\" required placeholder=\"tu@correo.com\" aria-label=\"Correo\" />
        <button class=\"btn btn-accent\" type=\"submit\">Suscribirme</button>
      </form>
    </section>
  `;

  mount.querySelector('#newsletterForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = e.target.querySelector('input');
    if (!input.value || !input.checkValidity()) { toast('Ingresa un correo válido.'); return; }
    subscribeNewsletter(input.value);
    input.value = '';
    toast('¡Gracias por suscribirte!');
  });
}

function card(p) {
  return `
    <a class="product-card" href="/app/product.html?id=${encodeURIComponent(p.id)}">
      <div class="thumb"><img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.title)}" loading="lazy"/></div>
      <div class="body">
        <div class="title">${escapeHTML(p.title)}</div>
        <div class="meta">${stars(p.rating || 0)} <span class="tag">${escapeHTML(formatCategory(p.category))}</span></div>
        <div class="price">${formatMoney(p.price)}</div>
      </div>
    </a>
  `;
}