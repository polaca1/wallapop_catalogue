const USER_ID = 'vjrdvxx8nx6k';
const PROFILE_URL = 'https://www.wallapop.com/user/ubicacionpablo-481568219';
const API = 'https://api.wallapop.com/api/v3';

function safeImage(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'cdn.wallapop.com' ? url.href : '';
  } catch { return ''; }
}

export function normalize(profile, listingPages) {
  const items = listingPages.flatMap(page => Array.isArray(page?.data) ? page.data : []);
  return {
    profile: {
      name: String(profile.micro_name || 'Pablo'),
      city: String(profile.location?.city || 'España'),
      avatar: safeImage(profile.image?.urls_by_size?.medium || profile.image?.urls_by_size?.small),
      url: PROFILE_URL
    },
    items: items.map(item => ({
      id: String(item.id),
      title: String(item.title || 'Artículo'),
      description: String(item.description || ''),
      price: Number(item.price?.amount || 0),
      currency: 'EUR',
      images: (item.images || []).map(image => ({
        small: safeImage(image.urls?.small),
        big: safeImage(image.urls?.big || image.urls?.medium || image.urls?.small)
      })).filter(image => image.small || image.big),
      url: `https://es.wallapop.com/item/${encodeURIComponent(String(item.slug || ''))}`,
      shipping: Boolean(item.shipping?.item_is_shippable && item.shipping?.user_allows_shipping),
      reserved: Boolean(item.reserved || item.is_reserved)
    })),
    updatedAt: new Date().toISOString(),
    source: 'live'
  };
}

async function getJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8500);
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; PabloCatalog/1.0)' },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Wallapop returned ${response.status}`);
    return response.json();
  } finally { clearTimeout(timeout); }
}

export async function fetchCatalog() {
  const [profile, firstPage] = await Promise.all([
    getJson(`${API}/users/${USER_ID}`),
    getJson(`${API}/users/${USER_ID}/items`)
  ]);
  const pages = [firstPage];
  let next = firstPage.meta?.next_page;
  const seen = new Set();
  // Paginate with a hard cap to avoid excessive upstream requests.
  while (next && !seen.has(next) && pages.length < 10) {
    seen.add(next);
    const page = await getJson(`${API}/users/${USER_ID}/items?next_page=${encodeURIComponent(next)}`);
    pages.push(page);
    next = page.meta?.next_page;
  }
  return normalize(profile, pages);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método no permitido' });
  }
  try {
    const catalog = await fetchCatalog();
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    return res.status(200).json(catalog);
  } catch (error) {
    console.error('Wallapop catalog error:', error.message);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ error: 'El catálogo no está disponible ahora mismo.' });
  }
}
