/**
 * Seletores com rolagem para o lado (16/11, prévia "Seletores com rolagem"). Vale para o app todo:
 * toda fileira de opções (`.chips`, `.jn-chipset`, `.segmented.scroll`) fica numa linha só que rola
 * para o lado. Aqui, sem mexer em cada tela, o app:
 * - marca as bordas com mais opções escondidas (`hs-l` / `hs-r`), para a sombra aparecer só onde há mais;
 * - traz para o meio a opção tocada.
 */
const SEL = '.chips, .jn-chipset, .segmented.scroll';

function edges(el: HTMLElement) {
  const more = el.scrollWidth > el.clientWidth + 2;
  el.classList.toggle('hs-l', more && el.scrollLeft > 2);
  el.classList.toggle('hs-r', more && el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
}

const reduced = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Coloca a opção no meio da fileira (sem mexer na rolagem da página). */
export function centerOption(row: HTMLElement, btn: HTMLElement) {
  if (row.scrollWidth <= row.clientWidth + 2) return;
  const left = btn.offsetLeft - row.offsetLeft - (row.clientWidth - btn.offsetWidth) / 2;
  row.scrollTo({ left: Math.max(0, left), behavior: reduced() ? 'auto' : 'smooth' });
}

/**
 * Computador (mouse): a roda do mouse rola a fileira para o lado e dá para arrastar com o mouse.
 * Sem isso, as opções escondidas na ponta só apareciam com Shift + roda (a barra de rolagem fica escondida).
 */
function mouseScroll(el: HTMLElement) {
  el.addEventListener(
    'wheel',
    (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || el.scrollWidth <= el.clientWidth + 2) return;
      const max = el.scrollWidth - el.clientWidth;
      const canGo = e.deltaY > 0 ? el.scrollLeft < max - 1 : el.scrollLeft > 1;
      if (!canGo) return; // na ponta, a página continua rolando normalmente
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    },
    { passive: false },
  );
  let startX = 0;
  let startLeft = 0;
  let dragging = false;
  let moved = false;
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || el.scrollWidth <= el.clientWidth + 2) return;
    dragging = true;
    moved = false;
    startX = e.clientX;
    startLeft = el.scrollLeft;
  });
  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) < 6) return;
    moved = true;
    el.classList.add('hs-drag');
    el.scrollLeft = startLeft - dx;
  });
  const stop = () => {
    dragging = false;
    el.classList.remove('hs-drag');
  };
  el.addEventListener('pointerup', stop);
  el.addEventListener('pointerleave', stop);
  // Arrastou: o clique de soltar não escolhe a opção.
  el.addEventListener(
    'click',
    (e) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    },
    true,
  );
}

/** Liga o comportamento no app todo (uma vez, ao abrir o app). */
export function initHScroll() {
  if (typeof document === 'undefined') return;
  const seen = new WeakSet<HTMLElement>();
  const setup = () => {
    document.querySelectorAll<HTMLElement>(SEL).forEach((el) => {
      if (!seen.has(el)) {
        seen.add(el);
        el.addEventListener('scroll', () => edges(el), { passive: true });
        mouseScroll(el);
        // A opção escolhida aparece ao abrir a tela.
        const on = el.querySelector<HTMLElement>('[aria-pressed="true"], [aria-checked="true"], [aria-selected="true"], .on');
        if (on) centerOption(el, on);
      }
      edges(el);
    });
  };
  document.addEventListener(
    'click',
    (e) => {
      const btn = (e.target as Element).closest?.('button');
      const row = btn?.parentElement;
      if (btn && row && row.matches(SEL)) requestAnimationFrame(() => centerOption(row, btn));
    },
    true,
  );
  window.addEventListener('resize', setup);
  new MutationObserver(() => requestAnimationFrame(setup)).observe(document.body, { childList: true, subtree: true });
  setup();
}
