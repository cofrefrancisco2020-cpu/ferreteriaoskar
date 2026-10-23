document.documentElement.classList.add('js');

const menuButton = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  mainNav.classList.toggle('open', open);
});
mainNav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  mainNav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir menú');
}));

const motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !motionReduced) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -7% 0px', threshold: 0.08 });
  revealItems.forEach(item => revealObserver.observe(item));
} else {
  revealItems.forEach(item => item.classList.add('in-view'));
}

const progressBar = document.querySelector('.scroll-progress');
let scrollQueued = false;
function updateProgress() {
  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  progressBar.style.width = `${Math.min(100, (window.scrollY / maxScroll) * 100)}%`;
  scrollQueued = false;
}
window.addEventListener('scroll', () => {
  if (!scrollQueued) {
    requestAnimationFrame(updateProgress);
    scrollQueued = true;
  }
}, { passive: true });
updateProgress();

const filterButtons = document.querySelectorAll('.filter');
const productCards = document.querySelectorAll('.product-card');
filterButtons.forEach(button => button.addEventListener('click', () => {
  filterButtons.forEach(item => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  const filter = button.dataset.filter;
  productCards.forEach(card => {
    card.hidden = filter !== 'todos' && card.dataset.category !== filter;
    if (!card.hidden) card.classList.add('in-view');
  });
}));

const form = document.querySelector('#quote-form');
const dialog = document.querySelector('#message-dialog');
const messageField = document.querySelector('#prepared-message');
const status = document.querySelector('#copy-status');
form?.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(form);
  const name = String(data.get('name') || '').trim();
  const interest = String(data.get('interest') || '').trim();
  const details = String(data.get('details') || '').trim();
  if (!name || !interest || details.length < 8) {
    form.reportValidity();
    return;
  }
  messageField.value = `Hola, Ferretería Oskar. Soy ${name} y quisiera consultar por ${interest.toLowerCase()}.\n\n${details}\n\n¿Me pueden confirmar opciones y disponibilidad? Gracias.`;
  status.textContent = '';
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
  document.body.classList.add('dialog-open');
});
function closeDialog() {
  if (typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
  document.body.classList.remove('dialog-open');
}
dialog?.querySelector('.dialog-close')?.addEventListener('click', closeDialog);
dialog?.addEventListener('close', () => document.body.classList.remove('dialog-open'));
dialog?.addEventListener('click', event => {
  if (event.target === dialog) closeDialog();
});
document.querySelector('#copy-message')?.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(messageField.value);
    status.textContent = 'Mensaje copiado. Ahora abre WhatsApp y pégalo en el chat.';
  } catch {
    messageField.focus();
    messageField.select();
    status.textContent = 'Seleccionamos el mensaje. Cópialo y pégalo en WhatsApp.';
  }
});

document.querySelector('#year').textContent = new Date().getFullYear();
