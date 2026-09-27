const $ = selector => document.querySelector(selector);
const money = amount => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(amount);
const state = { catalog: null, photo: 0, item: null };
// The logo listing advertises the custom printing service, not a product.
const isPrintingService = item => item.id === '3zlm3mkxm4jx' || /impresiones-3d-1292053393(?:$|[?#])/.test(item.url || '');

function element(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content != null) node.textContent = content;
  return node;
}

function render() {
  if (!state.catalog) return;
  const products = state.catalog.items.filter(item => !isPrintingService(item));
  let items = [...products];
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
  $('#catalog-count').textContent = `${products.length} ${products.length === 1 ? 'ARTÍCULO DISPONIBLE' : 'ARTÍCULOS DISPONIBLES'}`;
  $('#catalog-update').textContent = state.catalog.source === 'live' ? 'Catálogo consultado en Wallapop recientemente' : 'Mostrando una copia guardada del catálogo';
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
// Custom printing request: model links stay in the browser until the visitor
// chooses to open WhatsApp. No model is downloaded or uploaded by this form.
const SIZE_LABELS = { small: 'Pequeño (hasta 10 cm)', medium: 'Mediano (más de 10 a 20 cm)', large: 'Grande (más de 20 cm)' };
const MATERIAL_LABELS = { PLA: 'PLA', PETG: 'PETG', TPU: 'TPU flexible', ADVICE: 'Que me aconsejéis' };
const MATERIAL_GUIDE = {
  decorative: { material: 'PLA', title: 'Recomendado: PLA', copy: 'Para decoración y maquetas de interior. Buen acabado y una opción sencilla para empezar.' },
  functional: { material: 'PETG', title: 'Recomendado: PETG', copy: 'Una opción para piezas rígidas de uso diario que necesitan más tenacidad que el PLA. Revisaremos las exigencias concretas del modelo.' },
  flexible: { material: 'TPU', title: 'Recomendado: TPU flexible', copy: 'Para piezas que deben doblarse o ser elásticas. El grado de flexibilidad se concreta al revisar el modelo.' },
  unsure: { material: 'ADVICE', title: 'Te ayudamos a elegir', copy: 'Revisaremos el modelo y te propondremos un material adecuado antes de confirmar el presupuesto.' }
};
const dimensionInputs = [...document.querySelectorAll('.dimension-input')];
let automaticMaterial = true;

function sizeFromDimensions(dimensions) {
  const longest = Math.max(...dimensions);
  return longest <= 10 ? 'small' : longest <= 20 ? 'medium' : 'large';
}

function exactDimensions() {
  const values = dimensionInputs.map(input => Number(input.value));
  return dimensionInputs.every(input => input.value !== '' && input.validity.valid) && values.every(value => Number.isFinite(value) && value > 0) ? values : null;
}

function dimensionsText(values) {
  return values.map(value => value.toLocaleString('es-ES', { maximumFractionDigits: 1 })).join(' × ') + ' cm';
}

function updateRequestSummary() {
  const size = document.querySelector('input[name="size-choice"]:checked').value;
  const dimensions = exactDimensions();
  $('#request-summary').textContent = `${dimensions ? dimensionsText(dimensions) : SIZE_LABELS[size].split(' (')[0]} · ${MATERIAL_LABELS[$('#model-material').value]}`;
}

function updateMaterial() {
  const guide = MATERIAL_GUIDE[$('#model-use').value];
  if (automaticMaterial) $('#model-material').value = guide.material;
  $('#material-recommendation-title').textContent = guide.title;
  $('#material-recommendation-copy').textContent = guide.copy;
  $('#use-recommended').hidden = $('#model-material').value === guide.material;
  updateRequestSummary();
}

function updateDimensions() {
  dimensionInputs.forEach(input => input.setCustomValidity(''));
  const filled = dimensionInputs.filter(input => input.value !== '');
  if (filled.length && filled.length < 3) {
    dimensionInputs.find(input => input.value === '').setCustomValidity('Introduce las tres medidas o déjalas todas vacías.');
  }
  const dimensions = exactDimensions();
  if (dimensions) {
    const size = sizeFromDimensions(dimensions);
    document.querySelector(`input[name="size-choice"][value="${size}"]`).checked = true;
    $('#dimension-status').textContent = `Tamaño calculado: ${SIZE_LABELS[size].split(' (')[0].toLocaleLowerCase('es')}. Medidas: ${dimensionsText(dimensions)}.`;
  } else {
    $('#dimension-status').textContent = filled.length ? 'Completa las tres medidas con números mayores que cero, o borra todas para usar un tamaño aproximado.' : 'Introduce las tres medidas para calcular el tamaño automáticamente.';
  }
  updateRequestSummary();
}

function validateModelUrl() {
  const input = $('#model-url');
  input.setCustomValidity('');
  if (!input.value.trim()) return;
  try {
    const url = new URL(input.value.trim());
    if (!['https:', 'http:'].includes(url.protocol) || !url.hostname || url.username || url.password) throw new Error('Invalid model link');
  } catch {
    input.setCustomValidity('Pega un enlace completo que empiece por https:// o http://, sin contraseñas.');
  }
}

function buildRequestMessage() {
  const size = document.querySelector('input[name="size-choice"]:checked').value;
  const dimensions = exactDimensions();
  const use = $('#model-use').selectedOptions[0].textContent;
  return [
    'Hola 3DPrintNova, me gustaría pedir presupuesto para imprimir este modelo:',
    '',
    `Enlace: ${$('#model-url').value.trim()}`,
    `Tamaño: ${SIZE_LABELS[size]}${dimensions ? ' — calculado por el lado más largo' : ' — aproximado'}`,
    dimensions ? `Medidas (ancho × alto × fondo): ${dimensionsText(dimensions)}` : 'Medidas exactas: por confirmar',
    `Uso: ${use}`,
    `Material solicitado: ${MATERIAL_LABELS[$('#model-material').value]}`,
    '',
    '¿Me confirmáis el precio, la disponibilidad del material y el plazo? Gracias.'
  ].join('\n');
}

$('#model-url').addEventListener('input', validateModelUrl);
dimensionInputs.forEach(input => {
  input.addEventListener('input', updateDimensions);
  input.addEventListener('invalid', () => { input.closest('details').open = true; });
});
document.querySelectorAll('input[name="size-choice"]').forEach(input => input.addEventListener('change', () => {
  dimensionInputs.forEach(field => { field.value = ''; field.setCustomValidity(''); });
  updateDimensions();
}));
$('#model-use').addEventListener('change', updateMaterial);
$('#model-material').addEventListener('change', () => { automaticMaterial = false; updateMaterial(); });
$('#use-recommended').addEventListener('click', () => { automaticMaterial = true; updateMaterial(); });
$('#service-form').addEventListener('submit', event => {
  validateModelUrl();
  updateDimensions();
  if (!event.currentTarget.reportValidity()) { event.preventDefault(); return; }
  $('#whatsapp-message').value = buildRequestMessage();
});
$('#service-form').addEventListener('formdata', event => event.formData.delete('size-choice'));
updateMaterial();

$('#year').textContent = new Date().getFullYear();
load();
