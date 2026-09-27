const $ = selector => document.querySelector(selector);
const money = amount => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(amount);
const state = { catalog: null, photo: 0, item: null };

function element(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content != null) node.textContent = content;
  return node;
}

function render() {
  if (!state.catalog) return;
  let items = [...state.catalog.items];
  const query = $('#search').value.trim().toLocaleLowerCase('es');
  if (query) items = items.filter(item => `${item.title} ${item.description}`.toLocaleLowerCase('es').includes(query));
  switch ($('#sort').value) {
    case 'price-asc': items.sort((a, b) => a.price - b.price); break;
    case 'price-desc': items.sort((a, b) => b.price - a.price); break;
    case 'name': items.sort((a, b) => a.title.localeCompare(b.title, 'es')); break;
  }
  const grid = $('#products');
  grid.replaceChildren();
  if (!items.length) {
    const empty = element('div', 'empty-state');
    empty.append(element('h3', '', query ? 'No encontramos coincidencias.' : 'Aún no hay artículos en venta.'), element('p', '', query ? 'Prueba con otra palabra o borra la búsqueda.' : 'Vuelve pronto para ver nuevos diseños.'));
    grid.append(empty);
  }
  for (const item of items) {
    const card = element('article', 'product-card');
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Ver ${item.title}, ${money(item.price)}`);
    const photo = element('div', 'product-photo');
    const img = element('img');
    img.src = item.images[0]?.small || item.images[0]?.big || '/favicon.svg';
    img.alt = item.title;
    img.loading = 'lazy';
    photo.append(img);
    if (item.shipping) photo.append(element('span', 'card-badge', 'ENVÍO DISPONIBLE'));
    if (item.images.length > 1) photo.append(element('span', 'photo-count', `▣ ${item.images.length}`));
    const body = element('div', 'product-body');
    const headline = element('div', 'product-topline');
    headline.append(element('h3', '', item.title), element('span', 'product-price', money(item.price)));
    body.append(headline, element('p', 'product-desc', item.description || 'Descubre todos los detalles del anuncio.'), element('span', 'product-link', 'Ver detalles ↗'));
    card.append(photo, body);
    card.addEventListener('click', () => openDetail(item));
    card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openDetail(item); } });
    grid.append(card);
  }
  $('#catalog-count').textContent = `${state.catalog.items.length} ${state.catalog.items.length === 1 ? 'ARTÍCULO DISPONIBLE' : 'ARTÍCULOS DISPONIBLES'}`;
  $('#catalog-update').textContent = state.catalog.source === 'live' ? 'Catálogo consultado en Wallapop recientemente' : 'Mostrando una copia guardada del catálogo';
  const heroPhoto = state.catalog.items[0]?.images[0]?.big;
  if (heroPhoto) $('#hero-image').style.backgroundImage = `url(${JSON.stringify(heroPhoto)})`;
}

function showPhoto() {
  const images = state.item.images;
  $('#detail-image').src = images[state.photo]?.big || images[state.photo]?.small || '/favicon.svg';
  $('#detail-image').alt = `Foto ${state.photo + 1} de ${state.item.title}`;
  $('#gallery-counter').textContent = `${state.photo + 1} / ${images.length}`;
  $('#previous-photo').hidden = $('#next-photo').hidden = images.length <= 1;
  for (const [index, thumb] of [...$('#thumbnails').children].entries()) thumb.classList.toggle('selected', index === state.photo);
}

function changePhoto(direction) {
  state.photo = (state.photo + direction + state.item.images.length) % state.item.images.length;
  showPhoto();
}

function openDetail(item) {
  state.item = item;
  state.photo = 0;
  $('#detail-title').textContent = item.title;
  $('#detail-price').textContent = money(item.price);
  $('#detail-description').textContent = item.description || 'Consulta todos los detalles en el anuncio de Wallapop.';
  $('#detail-link').href = item.url;
  $('#share').textContent = 'Copiar enlace';
  const thumbs = $('#thumbnails');
  thumbs.replaceChildren();
  for (const [index, image] of item.images.entries()) {
    const button = element('button');
    button.type = 'button';
    button.setAttribute('aria-label', `Ver foto ${index + 1}`);
    const img = element('img'); img.src = image.small || image.big; img.alt = '';
    button.append(img);
    button.addEventListener('click', () => { state.photo = index; showPhoto(); });
    thumbs.append(button);
  }
  if (!item.images.length) state.item = { ...item, images: [{ small: '/favicon.svg', big: '/favicon.svg' }] };
  showPhoto();
  $('#detail').showModal();
}

async function load() {
  try {
    const response = await fetch('/api/catalog', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.catalog = await response.json();
    if (!Array.isArray(state.catalog.items)) throw new Error('Invalid catalog');
  } catch {
    try {
      const response = await fetch('/snapshot.json');
      if (!response.ok) throw new Error('Snapshot unavailable');
      state.catalog = await response.json();
      state.catalog.source = 'snapshot';
      $('#catalog-status').textContent = 'Wallapop no responde ahora mismo. Mostramos una copia guardada; los precios y la disponibilidad pueden haber cambiado. Comprueba el anuncio antes de comprar.';
    } catch {
      state.catalog = { items: [], source: 'offline' };
      $('#catalog-status').classList.add('error');
      $('#catalog-status').textContent = 'No hemos podido cargar los anuncios. Puedes abrir el perfil de Wallapop desde el enlace de esta página.';
    }
  }
  render();
}

$('#search').addEventListener('input', render);
$('#sort').addEventListener('change', render);
$('#close-detail').addEventListener('click', () => $('#detail').close());
$('#detail').addEventListener('click', event => { if (event.target === $('#detail')) $('#detail').close(); });
$('#previous-photo').addEventListener('click', () => changePhoto(-1));
$('#next-photo').addEventListener('click', () => changePhoto(1));
$('#detail').addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') changePhoto(-1);
  if (event.key === 'ArrowRight') changePhoto(1);
});
$('#share').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(state.item.url); $('#share').textContent = 'Enlace copiado ✓'; }
  catch { $('#share').textContent = 'No se pudo copiar'; }
});
$('#year').textContent = new Date().getFullYear();
load();
