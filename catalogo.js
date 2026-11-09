(() => {
  'use strict';
  const data = window.OSKAR_CATALOG;
  if (!data || !Array.isArray(data.families)) {
    document.getElementById('family-grid').textContent = 'No se pudo cargar el catálogo. Recarga la página.';
    return;
  }
  const $ = id => document.getElementById(id);
  const families = data.families;
  const familyById = new Map(families.map(f => [f.id, f]));
  const cartStorageKey = 'oskar-consulta-v1';
  const businessWhatsapp = '56988185541';
  const cart = new Map();
  const cartId = (familyId, index) => `${familyId}::${index}`;
  try {
    const saved = JSON.parse(localStorage.getItem(cartStorageKey) || '[]');
    if (Array.isArray(saved)) saved.forEach(entry => {
      const f = familyById.get(entry.familyId);
      const index = Number(entry.index);
      const quantity = Number(entry.quantity);
      if (f && Number.isInteger(index) && f.items[index] && Number.isInteger(quantity) && quantity > 0) {
        cart.set(cartId(f.id, index), {familyId:f.id, index, quantity:Math.min(quantity, 99)});
      }
    });
  } catch { /* La lista sigue funcionando si el almacenamiento local está desactivado. */ }
  const state = { category: '', subcategory: '', query: '', sort: 'relevance', limit: 24, current: null };
  const categoryOrder = ['Herramientas manuales','Herramientas eléctricas','Fijaciones y herrajes','Brocas y perforación','Discos y corte','Construcción y obra','Electricidad','Soldadura','Pinturas y terminaciones','Adhesivos y selladores','Cerrajería','Agua y jardín','Seguridad y EPP','Hogar y varios'];
  const categoryLabel = cat => cat === 'Herramientas eléctricas' ? 'Herramientas eléctricas e inalámbricas' : cat;
  const plain = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const esc = value => String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const plural = (n, singular, multiple) => `${n.toLocaleString('es-CL')} ${n === 1 ? singular : multiple}`;
  const familyText = f => plain([f.name, categoryLabel(f.category), f.subcategory, ...f.items.flatMap(i => [i.name, i.description])].join(' '));
  const searchable = new Map(families.map(f => [f.id, familyText(f)]));
  const countItems = list => list.reduce((sum, f) => sum + f.items.length, 0);
  const cats = categoryOrder.filter(cat => families.some(f => f.category === cat));
  const categoryVisuals = {
    'Herramientas manuales': ['./assets/catalogo-ai/alicate-pretul.webp', './assets/catalogo-ai/remachadora-makawa.webp', './assets/catalogo-ai/cuchillo-pretul.webp'],
    'Herramientas eléctricas': ['./assets/catalogo-ai/taladro-total.webp', './assets/catalogo-ai/rotomartillo-total.webp', './assets/catalogo-ai/sierra-circular-dewalt.webp'],
    'Fijaciones y herrajes': ['./assets/catalogo-ai/tornillo-crs.webp', './assets/catalogo-ai/perno-expansion.webp', './assets/catalogo-ai/tirafondo.webp'],
    'Brocas y perforación': ['./assets/catalogo-ai/broca-sds-plus.webp', './assets/catalogo-ai/sierra-copa-metal.webp', './assets/catalogo-ai/brocas-madera-kamasa.webp'],
    'Discos y corte': ['./assets/categorias/disco-delta-marca.webp', './assets/categorias/disco-rolack-marca.webp', './assets/categorias/disco-delta-inox.webp'],
    'Construcción y obra': ['./assets/categorias/construccion-obra.webp'],
    'Electricidad': ['./assets/catalogo-ai/tomacorriente-referencia-v2.webp', './assets/catalogo-ai/interruptor-referencia-v2.webp', './assets/catalogo-ai/extension-electrica-referencia-v2.webp'],
    'Soldadura': ['./assets/categorias/soldadura.webp'],
    'Pinturas y terminaciones': ['./assets/categorias/pinturas-terminaciones-v2.webp'],
    'Adhesivos y selladores': ['./assets/categorias/sellador-wurth-marca.webp', './assets/categorias/sellador-sellotec-marca.webp'],
    'Cerrajería': ['./assets/categorias/cerrajeria.webp'],
    'Agua y jardín': ['./assets/categorias/agua-y-jardin.webp'],
    'Seguridad y EPP': ['./assets/categorias/seguridad-epp.webp'],
    'Hogar y varios': ['./assets/categorias/hogar-varios.webp']
  };
  const brandLogos = {
    'TOTAL': 'total.png', 'TRUPER': 'truper.svg', 'PRETUL': 'pretul.svg',
    'DEWALT': 'dewalt.png', 'SATA': 'sata.svg', 'BOSCH': 'bosch.svg',
    'KAMASA': 'kamasa.png', 'MAKAWA': 'makawa.png', 'KOTHMAN': 'kothman.png',
    'HUA NAN': 'hua-nan.png', 'WURTH': 'wurth.svg', 'ROLACK': 'rolack.png',
    'FERRETOOLS': 'ferretools.webp', 'DIAGER': 'diager.webp', 'DELTA': 'delta.jpg',
    'WESCO': 'wesco.png', 'SELLOTEC': 'sellotec.jpg', 'ASAKI': 'asaki.webp',
    'TORO NEGRO': 'toro-negro.webp', 'W-MAX': 'w-max.webp',
    'NEXXO': 'nexxo.webp', 'AKFIX': 'akfix.webp', 'NEVA': 'neva.webp',
    'STANLEY': 'stanley.webp',
    'WAMAX': 'w-max.webp'
  };
  const brandMark = (brand, className = 'brand-badge') => !brand ? '' : brandLogos[brand]
    ? `<span class="${className}" data-brand="${esc(brand)}"><img src="./assets/marcas/${brandLogos[brand]}" alt="Logo ${esc(brand)}" loading="lazy"></span>`
    : `<span class="${className} brand-wordmark" data-brand="${esc(brand)}" aria-label="Marca ${esc(brand)}">${esc(brand)}</span>`;
  const productImage = (image, sprite, alt, lazy = true) => sprite
    ? `<span class="sprite-image" role="img" aria-label="${esc(alt)}" style="background-image:url('${esc(image)}');background-position:${sprite[0] * 100 / 3}% ${sprite[1] * 100 / 3}%"></span>`
    : `<img src="${esc(image)}" alt="${esc(alt)}"${lazy ? ' loading="lazy"' : ''}>`;
  const displayName = item => {
    if (!item.brand) return item.name;
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
  function cartProducts() {
    return [...cart].map(([key, entry]) => ({key, entry, family:familyById.get(entry.familyId)})).filter(row => row.family?.items[row.entry.index]);
  }
  function saveCart() {
    try { localStorage.setItem(cartStorageKey, JSON.stringify([...cart.values()])); }
    catch { /* La consulta se conserva durante esta visita. */ }
  }
  function renderCart() {
    const rows = cartProducts();
    const units = rows.reduce((total, row) => total + row.entry.quantity, 0);
    $('cart-count').textContent = units;
    $('dialog-cart-count').textContent = units;
    $('cart-toggle-text').textContent = units ? 'Revisar y consultar' : 'Mi lista';
    $('open-cart').setAttribute('aria-label', `Ver mi lista de consulta, ${plural(units, 'producto', 'productos')}`);
    $('cart-summary').textContent = `${plural(rows.length, 'producto', 'productos')} · ${plural(units, 'unidad', 'unidades')}`;
    $('cart-empty').hidden = rows.length > 0;
    $('clear-cart').hidden = rows.length === 0;
    $('cart-items').innerHTML = rows.map(({key, entry, family}) => {
      const item = family.items[entry.index];
      const photo = item.image || family.image;
      const thumb = photo ? productImage(photo, item.image ? item.sprite : family.sprite, `Imagen de ${item.name}`) : '';
      return `<article class="cart-line" data-cart-key="${esc(key)}"><div class="cart-line-photo">${thumb}</div><div class="cart-line-info"><div class="cart-line-meta"><small>${esc(categoryLabel(family.category))}</small>${brandMark(item.brand, 'cart-brand')}</div><h3>${esc(displayName(item))}</h3><div class="cart-line-actions"><div class="cart-quantity" aria-label="Cantidad de ${esc(item.name)}"><button type="button" data-cart-action="decrease" aria-label="Quitar una unidad de ${esc(item.name)}">−</button><output>${entry.quantity}</output><button type="button" data-cart-action="increase" aria-label="Agregar una unidad de ${esc(item.name)}">+</button></div><button class="cart-remove" type="button" data-cart-action="remove" aria-label="Quitar ${esc(item.name)} de la lista">Quitar</button></div></div></article>`;
    }).join('');
    const send = $('cart-whatsapp');
    send.setAttribute('aria-disabled', String(!rows.length));
    send.tabIndex = rows.length ? 0 : -1;
    const message = `Hola, quisiera consultar disponibilidad y precio de estos productos de Ferretería Oskar:\n\n${rows.map(({entry, family}, index) => `${index + 1}. ${family.items[entry.index].name} — ${entry.quantity} ${entry.quantity === 1 ? 'unidad' : 'unidades'}`).join('\n')}\n\nGracias.`;
    send.href = rows.length ? `https://wa.me/${businessWhatsapp}?text=${encodeURIComponent(message)}` : '#';
  }
  function addToCart(family, index) {
    const key = cartId(family.id, index);
    const existing = cart.get(key);
    if (existing && existing.quantity >= 99) { notify('Puedes consultar hasta 99 unidades por producto.'); return; }
    cart.set(key, {familyId:family.id, index, quantity:(existing?.quantity || 0) + 1});
    saveCart(); renderCart();
    notify('Agregado a tu lista. Pulsa «Revisar y consultar» para ir a WhatsApp.');
  }
  function openCart() {
    if ($('family-dialog').open) $('family-dialog').close();
    $('cart-dialog').showModal();
  }
  function makeCategoryCards() {
    $('category-grid').innerHTML = cats.map((cat, index) => {
      const list = families.filter(f => f.category === cat);
      const active = state.category === cat;
      const photos = (categoryVisuals[cat] || []).map(file => `<img src="${esc(file)}" alt="" loading="lazy">`).join('');
      return `<button class="category-card${active ? ' active' : ''}" type="button" data-category="${esc(cat)}" aria-pressed="${active}"><span class="category-images" aria-hidden="true">${photos}</span><span class="cat-index">${String(index + 1).padStart(2,'0')}</span><span class="cat-arrow" aria-hidden="true">↗</span><strong>${esc(categoryLabel(cat))}</strong><small>${plural(countItems(list), 'referencia', 'referencias')} · ${plural(list.length, 'familia', 'familias')}</small></button>`;
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
    if (f.image) return `<div class="family-visual">${productImage(f.image, f.sprite, `Imagen de ${f.name}`)}<span class="photo-kind" title="${esc(f.imageKind || 'Imagen referencial')}">${f.imageKind === 'Fotografía del producto' ? 'Foto del producto' : 'Imagen referencial'}</span></div>`;
    return `<div class="family-visual no-photo"><span aria-hidden="true">${esc(f.name.charAt(0))}</span></div>`;
  }
  function card(f) {
    const matching = state.query ? f.items.filter(i => plain([i.name,i.description].join(' ')).includes(plain(state.query))).slice(0,2) : [];
    const subtitle = matching.length ? matching.map(displayName).join(' · ') : f.items.length === 1 ? f.description : `Explora las ${f.items.length} variantes de esta familia y consulta sus medidas y características.`;
    const unanimousBrand = f.items.length && f.items.every(item => item.brand && item.brand === f.items[0].brand) ? f.items[0].brand : '';
    const familyBrand = brandMark(unanimousBrand && (!f.imageBrand || f.imageBrand === unanimousBrand) ? unanimousBrand : '');
    const quickAdd = f.items.length === 1 ? `<button type="button" class="family-quick-add" data-quick-add="${esc(f.id)}" aria-label="Agregar ${esc(f.items[0].name)} a mi lista">Agregar a mi lista <span aria-hidden="true">＋</span></button>` : '';
    return `<article class="family-card">${visual(f)}<div class="family-body"><div class="family-meta"><small>${esc(categoryLabel(f.category))}</small>${familyBrand}</div><h3>${esc(f.name)}</h3><p>${esc(subtitle)}</p>${quickAdd}<div class="family-bottom"><span>${plural(f.items.length, 'modelo o medida', 'modelos y medidas')}</span><span aria-hidden="true">↗</span></div></div><button type="button" class="family-open" data-family="${esc(f.id)}" aria-label="Ver modelos y medidas de ${esc(f.name)}">Ver detalle</button></article>`;
  }
  function render() {
    makeCategoryCards();
    makeSubcategories();
    const list = matchingFamilies();
    const visible = list.slice(0, state.limit);
    $('results-title').textContent = state.category ? categoryLabel(state.category) : 'Todas las familias';
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
      const safeFamilyImage = f.image && (!f.imageBrand || item.brand === f.imageBrand);
      const illustration = item.image ? `<figure class="variant-photo">${productImage(item.image, item.sprite, item.name)}<figcaption>${esc(item.imageKind || 'Imagen referencial')}</figcaption></figure>` : safeFamilyImage ? `<figure class="variant-photo">${productImage(f.image, f.sprite, `Imagen de la familia ${f.name}`)}<figcaption>Imagen referencial; el modelo puede ser diferente</figcaption></figure>` : '';
      const index = f.items.indexOf(item);
      const added = cart.has(cartId(f.id, index));
      return `<details><summary><span class="variant-name">${esc(displayName(item))}</span>${brandMark(item.brand, 'variant-brand')}<button class="add-variant variant-quick-add" type="button" data-variant="${index}" aria-label="Agregar ${esc(item.name)} a mi lista">${added ? 'Agregar otra' : 'Agregar a mi lista'} <span aria-hidden="true">＋</span></button></summary><div class="variant-detail">${illustration}<div><p>${esc(item.description || 'Consulta las características de esta variante.')}</p></div></div></details>`;
    }).join('') : '<div class="variant-empty">No hay medidas o modelos que coincidan en esta familia.</div>';
  }
  function openFamily(id) {
    const f = families.find(item => item.id === id);
    if (!f) return;
    state.current = f;
    $('dialog-family-name').textContent = f.name;
    $('dialog-category').textContent = `${categoryLabel(f.category)} / ${f.subcategory}`;
    $('dialog-description').textContent = f.items.length === 1 ? f.description : `Explora las ${f.items.length} variantes de esta familia. Abre cada modelo o medida para leer su descripción.`;
    $('dialog-variant-total').textContent = plural(f.items.length, 'referencia disponible en el listado', 'referencias disponibles en el listado');
    const unanimousBrand = f.items.length && f.items.every(item => item.brand && item.brand === f.items[0].brand) ? f.items[0].brand : '';
    $('dialog-image').innerHTML = f.image ? productImage(f.image, f.sprite, `Imagen de ${f.name}`, false) : `<span class="placeholder" aria-hidden="true">${esc(f.name.charAt(0))}</span>`;
    $('dialog-brand').innerHTML = brandMark(unanimousBrand);
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
    const quickAdd = event.target.closest('[data-quick-add]');
    if (quickAdd) {
      const family = familyById.get(quickAdd.dataset.quickAdd);
      if (family?.items.length === 1) addToCart(family, 0);
      return;
    }
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
  $('open-cart').addEventListener('click', openCart);
  $('open-cart-from-family').addEventListener('click', openCart);
  $('close-cart').addEventListener('click', () => $('cart-dialog').close());
  $('cart-dialog').addEventListener('click', event => { if (event.target === $('cart-dialog')) $('cart-dialog').close(); });
  $('cart-explore').addEventListener('click', () => { $('cart-dialog').close(); $('catalog-search').focus(); });
  $('clear-cart').addEventListener('click', () => { cart.clear(); saveCart(); renderCart(); notify('Tu lista de consulta quedó vacía.'); });
  $('cart-items').addEventListener('click', event => {
    const button = event.target.closest('[data-cart-action]');
    const line = button?.closest('[data-cart-key]');
    if (!button || !line) return;
    const entry = cart.get(line.dataset.cartKey);
    if (!entry) return;
    if (button.dataset.cartAction === 'remove' || (button.dataset.cartAction === 'decrease' && entry.quantity === 1)) cart.delete(line.dataset.cartKey);
    else if (button.dataset.cartAction === 'increase') entry.quantity = Math.min(99, entry.quantity + 1);
    else if (button.dataset.cartAction === 'decrease') entry.quantity--;
    saveCart(); renderCart();
  });
  $('cart-whatsapp').addEventListener('click', event => { if (!cart.size) event.preventDefault(); });
  $('variant-search').addEventListener('input', renderVariants);
  $('variant-list').addEventListener('click', event => {
    const button = event.target.closest('[data-variant]');
    if (!button || !state.current) return;
    event.preventDefault();
    event.stopPropagation();
    const index = Number(button.dataset.variant);
    if (!state.current.items[index]) return;
    addToCart(state.current, index);
    button.innerHTML = 'Agregar otra <span aria-hidden="true">＋</span>';
  });
  $('hero-count').textContent = data.rowCount.toLocaleString('es-CL');
  renderCart();
  render();
})();
