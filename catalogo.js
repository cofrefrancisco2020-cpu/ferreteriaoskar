(() => {
  'use strict';
  const data = window.OSKAR_CATALOG;
  if (!data || !Array.isArray(data.families)) {
    document.getElementById('family-grid').textContent = 'No se pudo cargar el catálogo. Recarga la página.';
    return;
  }
  const $ = id => document.getElementById(id);
  const families = data.families;
  const state = { category: '', subcategory: '', query: '', sort: 'relevance', limit: 24, current: null };
  const categoryOrder = ['Herramientas manuales','Herramientas eléctricas','Fijaciones y herrajes','Brocas y perforación','Discos y corte','Construcción y obra','Electricidad','Soldadura','Pinturas y terminaciones','Adhesivos y selladores','Cerrajería','Agua y jardín','Seguridad y EPP','Hogar y varios'];
  const plain = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const esc = value => String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const plural = (n, singular, multiple) => `${n.toLocaleString('es-CL')} ${n === 1 ? singular : multiple}`;
  const familyText = f => plain([f.name, f.category, f.subcategory, ...f.items.flatMap(i => [i.name, i.description])].join(' '));
  const searchable = new Map(families.map(f => [f.id, familyText(f)]));
  const countItems = list => list.reduce((sum, f) => sum + f.items.length, 0);
  const cats = categoryOrder.filter(cat => families.some(f => f.category === cat));
  const categoryArt = { 'Soldadura': './assets/categorias/soldadura.png', 'Agua y jardín': './assets/categorias/agua-y-jardin.png' };
  const brandLogos = {
    'TOTAL': 'total.png', 'TRUPER': 'truper.svg', 'PRETUL': 'pretul.svg',
    'DEWALT': 'dewalt.png', 'SATA': 'sata.svg', 'BOSCH': 'bosch.svg',
    'KAMASA': 'kamasa.png', 'MAKAWA': 'makawa.png', 'KOTHMAN': 'kothman.png',
    'HUA NAN': 'hua-nan.png', 'WURTH': 'wurth.svg', 'ROLACK': 'rolack.png',
    'FERRETOOLS': 'ferretools.webp', 'DIAGER': 'diager.webp', 'DELTA': 'delta.jpg',
    'WESCO': 'wesco.png', 'SELLOTEC': 'sellotec.jpg', 'ASAKI': 'asaki.webp',
    'TORO NEGRO': 'toro-negro.webp', 'W-MAX': 'w-max.webp'
  };
  const brandMark = (brand, className = 'brand-badge') => brand && brandLogos[brand]
    ? `<span class="${className}" data-brand="${esc(brand)}"><img src="./assets/marcas/${brandLogos[brand]}" alt="Logo ${esc(brand)}" loading="lazy"></span>`
    : '';
  const displayName = item => {
    if (!item.brand || !brandLogos[item.brand]) return item.name;
    const escapedBrand = item.brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return item.name.replace(new RegExp(`\\b${escapedBrand}\\b`, 'gi'), '').replace(/\s{2,}/g, ' ').replace(/\s+([,;.)])/g, '$1').replace(/[-–|]\s*$/, '').trim() || item.name;
  };
  let toastTimer;

  function notify(message) {
    $('toast').textContent = message;
    $('toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('toast').classList.remove('show'), 3600);
  }
  function makeCategoryCards() {
    $('category-grid').innerHTML = cats.map((cat, index) => {
      const list = families.filter(f => f.category === cat);
      const active = state.category === cat;
      const photos = list.filter(f => f.image).sort((a,b) => Number(b.image.includes('/catalogo-ai/')) - Number(a.image.includes('/catalogo-ai/'))).slice(0,3).map(f => `<img src="${esc(f.image)}" alt="" loading="lazy">`).join('') || (categoryArt[cat] ? `<img src="${esc(categoryArt[cat])}" alt="" loading="lazy">` : '');
      return `<button class="category-card${active ? ' active' : ''}" type="button" data-category="${esc(cat)}" aria-pressed="${active}"><span class="category-images" aria-hidden="true">${photos}</span><span class="cat-index">${String(index + 1).padStart(2,'0')}</span><span class="cat-arrow" aria-hidden="true">↗</span><strong>${esc(cat)}</strong><small>${plural(countItems(list), 'referencia', 'referencias')} · ${plural(list.length, 'familia', 'familias')}</small></button>`;
    }).join('');
  }
  function makeSubcategories() {
    const box = $('subcategory-list');
    if (!state.category) { box.hidden = true; box.innerHTML = ''; return; }
    const names = [...new Set(families.filter(f => f.category === state.category).map(f => f.subcategory))];
    if (names.length < 2) { box.hidden = true; box.innerHTML = ''; return; }
    box.hidden = false;
    box.innerHTML = `<button type="button" data-subcategory="" class="${!state.subcategory ? 'active' : ''}" aria-pressed="${!state.subcategory}">Todas</button>` + names.map(name => `<button type="button" data-subcategory="${esc(name)}" class="${state.subcategory === name ? 'active' : ''}" aria-pressed="${state.subcategory === name}">${esc(name)}</button>`).join('');
  }
  function relevance(f) {
    if (!state.query) return (f.image ? 100 : 0) + Math.min(f.items.length, 80);
    const q = plain(state.query);
    const name = plain(f.name);
    if (name === q) return 1000;
    if (name.startsWith(q)) return 800;
    if (name.includes(q)) return 600;
    const match = f.items.some(i => plain(i.name).includes(q));
    return match ? 400 : 100;
  }
  function matchingFamilies() {
    const terms = plain(state.query).split(' ').filter(Boolean);
    const filtered = families.filter(f => (!state.category || f.category === state.category) && (!state.subcategory || f.subcategory === state.subcategory) && terms.every(term => searchable.get(f.id).includes(term)));
    filtered.sort((a,b) => state.sort === 'az' ? a.name.localeCompare(b.name,'es') : state.sort === 'variants' ? b.items.length - a.items.length || a.name.localeCompare(b.name,'es') : relevance(b) - relevance(a) || a.name.localeCompare(b.name,'es'));
    return filtered;
  }
  function visual(f) {
    const unanimousBrand = f.items.length && f.items.every(item => item.brand && item.brand === f.items[0].brand) ? f.items[0].brand : '';
    const logo = brandMark(f.imageBrand || unanimousBrand);
    if (f.image) return `<div class="family-visual"><img src="${esc(f.image)}" alt="Imagen de ${esc(f.name)}" loading="lazy">${logo}<span class="photo-kind">${esc(f.imageKind || 'Imagen referencial')}</span></div>`;
    return `<div class="family-visual no-photo"><span aria-hidden="true">${esc(f.name.charAt(0))}</span>${logo}</div>`;
  }
  function card(f) {
    const matching = state.query ? f.items.filter(i => plain([i.name,i.description].join(' ')).includes(plain(state.query))).slice(0,2) : [];
    const subtitle = matching.length ? matching.map(displayName).join(' · ') : f.items.length === 1 ? f.description : `Explora las ${f.items.length} variantes de esta familia y consulta sus medidas y características.`;
    return `<article class="family-card">${visual(f)}<div class="family-body"><small>${esc(f.category)}</small><h3>${esc(f.name)}</h3><p>${esc(subtitle)}</p><div class="family-bottom"><span>${plural(f.items.length, 'modelo o medida', 'modelos y medidas')}</span><span aria-hidden="true">↗</span></div></div><button type="button" class="family-open" data-family="${esc(f.id)}" aria-label="Ver modelos y medidas de ${esc(f.name)}">Ver detalle</button></article>`;
  }
  function render() {
    makeCategoryCards();
    makeSubcategories();
    const list = matchingFamilies();
    const visible = list.slice(0, state.limit);
    $('results-title').textContent = state.category || 'Todas las familias';
    $('results-summary').textContent = `${plural(list.length,'familia','familias')} · ${plural(countItems(list),'referencia','referencias')}` + (state.query ? ` para “${state.query}”` : '');
    $('family-grid').innerHTML = visible.map(card).join('');
    $('empty-state').hidden = list.length !== 0;
    $('load-more').hidden = visible.length >= list.length;
    $('load-more').textContent = `Ver más familias (${(list.length - visible.length).toLocaleString('es-CL')} restantes) ↓`;
    $('reset-filters').hidden = !state.category && !state.subcategory && !state.query;
    $('clear-search').hidden = !state.query;
  }
  function reset() {
    state.category = ''; state.subcategory = ''; state.query = ''; state.limit = 24;
    $('catalog-search').value = '';
    render();
  }
  function renderVariants() {
    const f = state.current;
    if (!f) return;
    const terms = plain($('variant-search').value).split(' ').filter(Boolean);
    const list = f.items.filter(i => terms.every(t => plain(i.name + ' ' + i.description).includes(t)));
    $('variant-list').innerHTML = list.length ? list.map(item => {
      const safeFamilyImage = f.image && (!item.brand || !f.imageBrand || item.brand === f.imageBrand);
      const illustration = item.image ? `<figure class="variant-photo"><img src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy">${brandMark(item.brand)}<figcaption>${esc(item.imageKind || 'Imagen referencial')}</figcaption></figure>` : safeFamilyImage ? `<figure class="variant-photo"><img src="${esc(f.image)}" alt="Imagen de la familia ${esc(f.name)}" loading="lazy">${brandMark(item.brand)}<figcaption>Imagen de la familia; esta variante puede ser diferente</figcaption></figure>` : '';
      return `<details><summary><span>${esc(displayName(item))}</span>${brandMark(item.brand, 'variant-brand')}</summary><div class="variant-detail">${illustration}<div><p>${esc(item.description || 'Consulta las características de esta variante.')}</p><button class="copy-variant" type="button" data-variant="${f.items.indexOf(item)}">Copiar consulta ↗</button></div></div></details>`;
    }).join('') : '<div class="variant-empty">No hay medidas o modelos que coincidan en esta familia.</div>';
  }
  function openFamily(id) {
    const f = families.find(item => item.id === id);
    if (!f) return;
    state.current = f;
    $('dialog-family-name').textContent = f.name;
    $('dialog-category').textContent = `${f.category} / ${f.subcategory}`;
    $('dialog-description').textContent = f.items.length === 1 ? f.description : `Explora las ${f.items.length} variantes de esta familia. Abre cada modelo o medida para leer su descripción.`;
    $('dialog-variant-total').textContent = plural(f.items.length, 'referencia disponible en el listado', 'referencias disponibles en el listado');
    $('dialog-image').innerHTML = f.image ? `<img src="${esc(f.image)}" alt="Imagen de ${esc(f.name)}">${brandMark(f.imageBrand)}` : `<span class="placeholder" aria-hidden="true">${esc(f.name.charAt(0))}</span>`;
    $('variant-search').value = '';
    renderVariants();
    $('family-dialog').showModal();
  }

  $('category-grid').addEventListener('click', event => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    state.category = state.category === button.dataset.category ? '' : button.dataset.category;
    state.subcategory = ''; state.limit = 24;
    render();
    $('results-title').scrollIntoView({behavior:'smooth',block:'start'});
  });
  $('subcategory-list').addEventListener('click', event => {
    const button = event.target.closest('[data-subcategory]');
    if (!button) return;
    state.subcategory = button.dataset.subcategory; state.limit = 24; render();
  });
  $('family-grid').addEventListener('click', event => {
    const button = event.target.closest('[data-family]');
    if (button) openFamily(button.dataset.family);
  });
  $('catalog-search-form').addEventListener('submit', event => { event.preventDefault(); $('results-title').scrollIntoView({behavior:'smooth',block:'start'}); });
  $('catalog-search').addEventListener('input', event => { state.query = event.target.value.trim(); state.limit = 24; render(); });
  $('clear-search').addEventListener('click', () => { state.query = ''; $('catalog-search').value = ''; render(); $('catalog-search').focus(); });
  $('sort-select').addEventListener('change', event => { state.sort = event.target.value; state.limit = 24; render(); });
  $('reset-filters').addEventListener('click', reset);
  $('empty-reset').addEventListener('click', reset);
  $('show-all').addEventListener('click', () => { reset(); $('results-title').scrollIntoView({behavior:'smooth',block:'start'}); });
  $('load-more').addEventListener('click', () => { state.limit += 24; render(); });
  $('close-dialog').addEventListener('click', () => $('family-dialog').close());
  $('family-dialog').addEventListener('click', event => { if (event.target === $('family-dialog')) $('family-dialog').close(); });
  $('variant-search').addEventListener('input', renderVariants);
  $('variant-list').addEventListener('click', async event => {
    const button = event.target.closest('[data-variant]');
    if (!button || !state.current) return;
    const item = state.current.items[Number(button.dataset.variant)];
    if (!item) return;
    const message = `Hola, vi en el catálogo de Ferretería Oskar el producto “${item.name}”. ¿Me pueden confirmar disponibilidad, precio y características? Gracias.`;
    try { await navigator.clipboard.writeText(message); notify('Consulta copiada. Abre WhatsApp y pégala en el chat.'); }
    catch { notify('No se pudo copiar automáticamente. Puedes escribir el nombre del producto en WhatsApp.'); }
  });
  $('hero-count').textContent = data.rowCount.toLocaleString('es-CL');
  render();
})();
