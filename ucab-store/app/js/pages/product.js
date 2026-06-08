import { bootstrap } from '../shell.js';
import {
  addReview,
  addToCart,
  averageRating,
  currentUser,
  getProduct,
  getReviews,
} from '../state.js';
import {
  escapeHTML,
  formatCategory,
  formatDate,
  formatMoney,
  stars,
  toast,
} from '../ui.js';

await bootstrap();

const id = new URLSearchParams(location.search).get('id');
const product = id ? getProduct(id) : null;

const mount = document.getElementById('view');
if (!product) {
  mount.innerHTML = `<div class="container empty">
    <h2>Producto no encontrado</h2>
    <a href="catalog.html" class="btn btn-primary">Volver al catálogo</a>
  </div>`;
} else {
  render();
}

function render() {
  const reviews = getReviews(product.id);
  const r = averageRating(product.id);
  const user = currentUser();

  mount.innerHTML = `
    <div class="container">
      <a href="catalog.html" class="muted">← Volver al catálogo</a>
      <div class="product-detail" style="margin-top:1rem">
        <div class="gallery"><img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.title)}"/></div>
        <div>
          <span class="tag">${escapeHTML(formatCategory(product.category))}</span>
          <h1 style="margin-top:.5rem">${escapeHTML(product.title)}</h1>
          <div class="row" style="margin-bottom:.5rem">${stars(r.avg)} <span class="muted">(${r.count} reseñas)</span></div>
          <p class="muted">${escapeHTML(product.description)}</p>
          <div class="price" style="font-size:2rem;color:var(--primary);font-weight:700;margin:1rem 0">${formatMoney(product.price)}</div>
          <div class="row">
            <input type="number" id="qtyInput" class="input" min="1" value="1" style="max-width:90px"/>
            <button class="btn btn-primary" id="addBtn">Agregar al carrito</button>
          </div>
          <div class="action-stack">
            <a href="catalog.html" class="btn btn-outline btn-block">← Volver al catálogo</a>
          </div>
        </div>
      </div>

      <section style="margin-top:3rem">
        <h2>Reseñas</h2>
        ${user
          ? reviewForm()
          : '<p class="muted"><a href="login.html">Inicia sesión</a> para dejar una reseña.</p>'}
        <div id="reviewList" style="margin-top:1rem">
          ${reviews.length === 0
            ? '<p class="empty">Aún no hay reseñas. ¡Sé el primero!</p>'
            : reviews.map(reviewItem).join('')}
        </div>
      </section>
    </div>
  `;

  mount.querySelector('#addBtn').addEventListener('click', () => {
    const qty = Math.max(1, Number(mount.querySelector('#qtyInput').value || 1));
    addToCart(product.id, qty);
    toast('Producto agregado al carrito.');
  });

  const form = mount.querySelector('#reviewForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const rating = Number(data.get('rating'));
      const comment = data.get('comment');
      if (!rating) { toast('Selecciona una calificación.'); return; }
      addReview(product.id, { rating, comment, user });
      render();
      toast('Reseña publicada.');
    });
  }
}

function reviewForm() {
  return `
    <form id="reviewForm" class="form-card" style="max-width:520px;margin:1rem 0">
      <h3>Deja tu reseña</h3>
      <div class="field">
        <label>Calificación</label>
        <div class="star-input">
          ${[5,4,3,2,1].map((n) => `
            <input type="radio" name="rating" value="${n}" id="r${n}"/><label for="r${n}">★</label>
          `).join('')}
        </div>
      </div>
      <div class="field">
        <label for="comment">Comentario</label>
        <textarea name="comment" id="comment" class="textarea" rows="3" placeholder="¿Qué te pareció el producto?"></textarea>
      </div>
      <button class="btn btn-primary" type="submit">Publicar</button>
    </form>`;
}

function reviewItem(r) {
  return `
    <article class="review">
      <div class="review-head">
        <strong>${escapeHTML(r.userName)}</strong>
        ${stars(r.rating)}
      </div>
      <p class="muted" style="margin:.4rem 0 0">${escapeHTML(r.comment) || '<em>Sin comentario.</em>'}</p>
      <small class="muted">${formatDate(r.createdAt)}</small>
    </article>`;
}
