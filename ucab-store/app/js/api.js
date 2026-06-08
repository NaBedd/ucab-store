// Cliente para la API externa FakeStore. Solo se usa la primera vez
// para poblar el catálogo local; después el admin controla todo.
const BASE = 'https://fakestoreapi.com';

export async function fetchProducts() {
  const res = await fetch(`${BASE}/products`);
  if (!res.ok) throw new Error('No se pudo obtener el catálogo remoto.');
  const data = await res.json();
  return data.map((p) => ({
    id: String(p.id),
    title: p.title,
    description: p.description,
    price: Number(p.price),
    category: p.category,
    image: p.image,
    rating: p.rating?.rate ?? 0,
    ratingCount: p.rating?.count ?? 0,
  }));
}
