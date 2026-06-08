import { bootstrap } from '../shell.js';
import {
  addToCart,
  averageRating,
  listCategories,
  listProducts,
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

function render() {
  const mount = document.getElementById('view');
  const categories = listCategories();
  const maxPrice = Math.max(100, ...listProducts().map((p) => p.price));

  mount.innerHTML = `
    <div class="container">
      <h1>Catálogo</h1>
      <p class="muted">Filtra por categoría, precio o busca por nombre.</p>

      <div class="filters">
        <div class="field">
          <label for="searchInput">Búsqueda</label>
          <input id="searchInput" class="input" type="search" placeholder="Buscar productos..." />
        </div>
        <div class="field">
          <label for="categorySelect">Categoría</label>
          <select id="categorySelect" class="select">
            <option value="">Todas</option>
            ${categories.map((c) => `<option value="${escapeHTML(c)}">${escapeHTML(formatCategory(c))}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="priceRange">Precio máximo: <span id="priceLabel">$${maxPrice.toFixed(0)}</span></label>
          <input id="priceRange" class="input" type="range" min="0" max="${Math.ceil(maxPrice)}" value="${Math.ceil(maxPrice)}" step="1" />
        </div>
        <div class="field">
          <label for="sortSelect">Ordenar</label>
          <select id="sortSelect" class="select">
            <option value="featured">Destacados</option>
            <option value="price-asc">Precio: menor a mayor</option>
            <option value="price-desc">Precio: mayor a menor</option>
            <option value="rating">Mejor calificados</option>
          </select>
        </div>
      </div>

      <div id="catalogGrid" class="product-grid"></div>
    </div>
  `;

  const grid = mount.querySelector('#catalogGrid');
  const search = mount.querySelector('#searchInput');
  const cat = mount.querySelector('#categorySelect');
  const price = mount.querySelector('#priceRange');
  const sort = mount.querySelector('#sortSelect');
  const priceLabel = mount.querySelector('#priceLabel');

  function update() {
    const q = search.value.trim().toLowerCase();
    const selectedCat = cat.value;
    const maxP = Number(price.value);
    priceLabel.textContent = `$${maxP}`;

    let items = listProducts().filter((p) => {
      if (selectedCat && p.category !== selectedCat) return false;
      if (p.price > maxP) return false;
      if (q && !(`${p.title} ${p.description}`).toLowerCase().includes(q)) return false;
      return true;
    });
    switch (sort.value) {
      case 'price-asc': items.sort((a, b) => a.price - b.price); break;
      case 'price-desc': items.sort((a, b) => b.price - a.price); break;
      case 'rating': items.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      default: items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    if (items.length === 0) {
      grid.innerHTML = '<p class="empty">No se encontraron productos con esos filtros.</p>';
      return;
    }
    grid.innerHTML = items.map(card).join('');
    grid.querySelectorAll('[data-add]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(btn.dataset.add, 1);
        toast('Producto agregado al carrito.');
      });
    });
  }

  [search, cat, price, sort].forEach((el) => el.addEventListener('input', update));
  window.addEventListener('catalog:updated', update);
  update();
}

function card(p) {
  const r = averageRating(p.id);
  return `
    <article class="product-card">
      <a href="product.html?id=${encodeURIComponent(p.id)}" class="thumb">
        <img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.title)}" loading="lazy"/>
      </a>
      <div class="body">
        <a href="product.html?id=${encodeURIComponent(p.id)}" style="color:inherit">
          <div class="title">${escapeHTML(p.title)}</div>
        </a>
        <div class="meta">${stars(r.avg)} <span class="tag">${escapeHTML(formatCategory(p.category))}</span></div>
        <div class="price">${formatMoney(p.price)}</div>
        <div class="actions">
          <a href="product.html?id=${encodeURIComponent(p.id)}" class="btn btn-sm btn-ghost">Ver</a>
          <button class="btn btn-sm btn-primary" data-add="${p.id}">Agregar</button>
        </div>
      </div>
    </article>
  `;
}
