// Gestor central de estado.
// Todo se persiste en sessionStorage (según requerimientos).
// Las órdenes hechas en modo offline se guardan en una cola y
// se procesan automáticamente al volver online.
import { fetchProducts } from './api.js';

const KEYS = {
  products: 'ucab:products',
  users: 'ucab:users',
  cart: 'ucab:cart',
  orders: 'ucab:orders',
  reviews: 'ucab:reviews',
  newsletter: 'ucab:newsletter',
  queue: 'ucab:queue',
  bootstrapped: 'ucab:bootstrapped',
  theme: 'ucab:theme',
  session: 'ucab:session',
  activeUsers: 'ucab:active',
  offlineOverride: 'ucab:offlineOverride',
};

// ----- Utilidades de almacenamiento (sessionStorage) -----
function read(key, fallback) {
  try { return JSON.parse(sessionStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function write(key, value) { sessionStorage.setItem(key, JSON.stringify(value)); }
function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

async function hashPassword(pw) {
  const data = new TextEncoder().encode(pw);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ===== Credenciales demo predeterminadas =====
export const DEMO_CREDENTIALS = {
  admin:  { email: 'admin@ucab.edu',    password: 'admin123' },
  client: { email: 'cliente@ucab.edu',  password: 'cliente123' },
};

// ----- Inicialización -----
export async function initState() {
  if (!read(KEYS.users, null)) {
    await seedUsers();
  }
  if (!read(KEYS.cart, null)) write(KEYS.cart, []);
  if (!read(KEYS.orders, null)) write(KEYS.orders, []);
  if (!read(KEYS.reviews, null)) write(KEYS.reviews, {});
  if (!read(KEYS.queue, null)) write(KEYS.queue, []);
  if (!read(KEYS.newsletter, null)) write(KEYS.newsletter, []);
  markUserActive();
}

async function seedUsers() {
  const adminPw = await hashPassword(DEMO_CREDENTIALS.admin.password);
  const clientPw = await hashPassword(DEMO_CREDENTIALS.client.password);
  const users = [
    {
      id: uid('u'), name: 'Administrador UCAB',
      email: DEMO_CREDENTIALS.admin.email, password: adminPw,
      role: 'admin', avatar: '', address: 'Caracas, Venezuela', createdAt: Date.now(),
    },
    {
      id: uid('u'), name: 'Cliente Demo',
      email: DEMO_CREDENTIALS.client.email, password: clientPw,
      role: 'client', avatar: '', address: '', createdAt: Date.now(),
    },
  ];
  write(KEYS.users, users);
}

export async function ensureCatalog() {
  const existing = read(KEYS.products, []);
  if (existing && existing.length > 0) return existing;
  if (read(KEYS.bootstrapped, false)) return existing;
  if (!isOnline()) return existing;
  try {
    const products = await fetchProducts();
    write(KEYS.products, products);
    write(KEYS.bootstrapped, true);
    window.dispatchEvent(new CustomEvent('catalog:updated'));
    return products;
  } catch (err) {
    console.warn('No se pudo cargar la API externa:', err);
    return existing;
  }
}

// ===== Tema =====
export function getTheme() { return sessionStorage.getItem(KEYS.theme) || 'light'; }
export function setTheme(t) {
  sessionStorage.setItem(KEYS.theme, t);
  document.body.dataset.theme = t;
  window.dispatchEvent(new CustomEvent('theme:changed', { detail: t }));
}

// ===== Conexión (con override manual) =====
export function isOfflineOverride() { return read(KEYS.offlineOverride, false); }
export function setOfflineOverride(v) {
  write(KEYS.offlineOverride, !!v);
  window.dispatchEvent(new CustomEvent('conn:changed'));
}
export function isOnline() { return navigator.onLine && !isOfflineOverride(); }

// ===== Usuarios y sesión =====
export function listUsers() { return read(KEYS.users, []); }
function saveUsers(users) { write(KEYS.users, users); }

export async function registerUser({ name, email, password }) {
  email = email.trim().toLowerCase();
  const users = listUsers();
  if (users.some((u) => u.email === email)) {
    throw new Error('Ya existe un usuario con ese correo.');
  }
  const user = {
    id: uid('u'),
    name: name.trim(),
    email,
    password: await hashPassword(password),
    role: 'client',
    avatar: '',
    address: '',
    createdAt: Date.now(),
  };
  users.push(user);
  saveUsers(users);
  return sanitize(user);
}

export async function loginUser(email, password) {
  email = email.trim().toLowerCase();
  const users = listUsers();
  const hashed = await hashPassword(password);
  const user = users.find((u) => u.email === email && u.password === hashed);
  if (!user) throw new Error('Credenciales inválidas.');
  const safe = sanitize(user);
  sessionStorage.setItem(KEYS.session, JSON.stringify(safe));
  markUserActive(user.id);
  window.dispatchEvent(new CustomEvent('auth:changed'));
  return safe;
}

export function logoutUser() {
  sessionStorage.removeItem(KEYS.session);
  window.dispatchEvent(new CustomEvent('auth:changed'));
}

export function currentUser() {
  try { return JSON.parse(sessionStorage.getItem(KEYS.session)); }
  catch { return null; }
}

export async function resetPassword(email, newPassword) {
  email = email.trim().toLowerCase();
  const users = listUsers();
  const u = users.find((x) => x.email === email);
  if (!u) throw new Error('No existe un usuario con ese correo.');
  u.password = await hashPassword(newPassword);
  saveUsers(users);
}

export function updateProfile(patch) {
  const session = currentUser();
  if (!session) throw new Error('No hay sesión activa.');
  const users = listUsers();
  const user = users.find((u) => u.id === session.id);
  if (!user) throw new Error('Usuario no encontrado.');
  Object.assign(user, {
    name: patch.name ?? user.name,
    avatar: patch.avatar ?? user.avatar,
    address: patch.address ?? user.address,
  });
  saveUsers(users);
  const safe = sanitize(user);
  sessionStorage.setItem(KEYS.session, JSON.stringify(safe));
  window.dispatchEvent(new CustomEvent('auth:changed'));
  return safe;
}

function sanitize(u) { const { password, ...rest } = u; return rest; }

function markUserActive(id) {
  const active = read(KEYS.activeUsers, []);
  const uid = id ?? currentUser()?.id;
  if (!uid) return;
  if (!active.includes(uid)) {
    active.push(uid);
    write(KEYS.activeUsers, active);
  }
}
export function activeUserCount() { return read(KEYS.activeUsers, []).length; }

// ===== Productos =====
export function listProducts() { return read(KEYS.products, []); }
export function getProduct(id) { return listProducts().find((p) => String(p.id) === String(id)); }
export function listCategories() {
  return [...new Set(listProducts().map((p) => p.category))].sort();
}
export function saveProduct(product) {
  const products = listProducts();
  const idx = products.findIndex((p) => p.id === product.id);
  if (idx >= 0) products[idx] = product;
  else products.push({ ...product, id: product.id || uid('p') });
  write(KEYS.products, products);
  window.dispatchEvent(new CustomEvent('catalog:updated'));
}
export function deleteProduct(id) {
  write(KEYS.products, listProducts().filter((p) => p.id !== id));
  window.dispatchEvent(new CustomEvent('catalog:updated'));
}

// ===== Carrito =====
export function getCart() { return read(KEYS.cart, []); }
function saveCart(cart) {
  write(KEYS.cart, cart);
  window.dispatchEvent(new CustomEvent('cart:updated'));
}
export function addToCart(productId, qty = 1) {
  const cart = getCart();
  const existing = cart.find((c) => c.productId === productId);
  if (existing) existing.qty += qty;
  else cart.push({ productId, qty });
  saveCart(cart);
}
export function updateCartQty(productId, qty) {
  let cart = getCart();
  if (qty <= 0) cart = cart.filter((c) => c.productId !== productId);
  else cart = cart.map((c) => (c.productId === productId ? { ...c, qty } : c));
  saveCart(cart);
}
export function removeFromCart(productId) {
  saveCart(getCart().filter((c) => c.productId !== productId));
}
export function clearCart() { saveCart([]); }
export function cartTotals() {
  const items = getCart().map((it) => {
    const p = getProduct(it.productId);
    return { ...it, product: p, subtotal: p ? p.price * it.qty : 0 };
  }).filter((it) => it.product);
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;
  return { items, subtotal, tax, total };
}

// ===== Órdenes =====
export function listOrders() { return read(KEYS.orders, []); }
export function listOrdersByUser(userId) {
  return listOrders().filter((o) => o.userId === userId);
}
export function placeOrder({ user, payment, items, totals, offline = false }) {
  const order = {
    id: uid('o'),
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    items: items.map((it) => ({
      productId: it.productId, title: it.product.title,
      price: it.product.price, qty: it.qty,
    })),
    payment: {
      cardLast4: payment.cardNumber.replace(/\s+/g, '').slice(-4),
      holder: payment.holder,
    },
    totals,
    status: 'pending',
    createdAt: Date.now(),
    offlineCreated: offline,
  };
  const orders = listOrders();
  orders.unshift(order);
  write(KEYS.orders, orders);
  return order;
}
export function updateOrderStatus(orderId, status) {
  const orders = listOrders();
  const o = orders.find((x) => x.id === orderId);
  if (o) { o.status = status; write(KEYS.orders, orders); }
}

// ===== Cola offline =====
export function enqueueOrder(payload) {
  const queue = read(KEYS.queue, []);
  queue.push({ id: uid('q'), payload, queuedAt: Date.now() });
  write(KEYS.queue, queue);
  window.dispatchEvent(new CustomEvent('queue:updated'));
}
export function queueSize() { return read(KEYS.queue, []).length; }
export async function processQueue() {
  const queue = read(KEYS.queue, []);
  if (queue.length === 0) return 0;
  for (const job of queue) {
    placeOrder({ ...job.payload, offline: false });
  }
  write(KEYS.queue, []);
  window.dispatchEvent(new CustomEvent('queue:updated'));
  return queue.length;
}

// ===== Reseñas =====
export function getReviews(productId) {
  const all = read(KEYS.reviews, {});
  return all[productId] || [];
}
export function addReview(productId, { rating, comment, user }) {
  const all = read(KEYS.reviews, {});
  const list = all[productId] || [];
  list.unshift({
    id: uid('r'),
    rating: Number(rating),
    comment: String(comment || '').trim(),
    userName: user.name, userId: user.id,
    createdAt: Date.now(),
  });
  all[productId] = list;
  write(KEYS.reviews, all);
}
export function averageRating(productId) {
  const reviews = getReviews(productId);
  if (reviews.length === 0) {
    const p = getProduct(productId);
    return { avg: p?.rating ?? 0, count: p?.ratingCount ?? 0 };
  }
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return { avg: sum / reviews.length, count: reviews.length };
}

// ===== Newsletter =====
export function subscribeNewsletter(email) {
  email = email.trim().toLowerCase();
  const list = read(KEYS.newsletter, []);
  if (!list.includes(email)) {
    list.push(email);
    write(KEYS.newsletter, list);
  }
}

// ===== Métricas (dashboard) =====
export function dashboardMetrics() {
  const orders = listOrders();
  const revenue = orders.reduce((s, o) => s + (o.totals?.total || 0), 0);
  const counts = {};
  orders.forEach((o) => o.items.forEach((it) => {
    counts[it.productId] = (counts[it.productId] || 0) + it.qty;
  }));
  const topProducts = Object.entries(counts)
    .map(([pid, qty]) => ({ product: getProduct(pid), qty }))
    .filter((x) => x.product)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 3);
  return {
    revenue, orderCount: orders.length, topProducts,
    totalUsers: listUsers().length,
    activeUsers: activeUserCount(),
  };
}
