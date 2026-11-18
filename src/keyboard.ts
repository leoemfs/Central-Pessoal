/**
 * E42: teclado do celular aberto.
 * - `body.kb-open` enquanto um campo de texto está em uso com o teclado aberto: a barra de baixo e o + somem.
 * - `--kb`: altura do teclado que fica por cima da página (0 quando o navegador já encolhe a tela),
 *   para a barra de formatação do editor ficar colada em cima do teclado.
 */
const EDITABLE = 'input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=range]):not([type=color]):not([type=file]), textarea, select, [contenteditable="true"]';

export function isEditable(el: Element | null): boolean {
  return !!el && el.matches?.(EDITABLE) === true;
}

export function initKeyboard() {
  if (typeof window === 'undefined' || !window.matchMedia?.('(pointer: coarse)').matches) return;
  const vv = window.visualViewport;
  let tallest = window.innerHeight;
  const update = () => {
    tallest = Math.max(tallest, window.innerHeight);
    const visible = vv ? vv.height + vv.offsetTop : window.innerHeight;
    // Parte da tela coberta pelo teclado (quando o navegador não encolhe a página).
    const covered = Math.max(0, Math.round(window.innerHeight - visible));
    // Teclado aberto: a área visível ficou bem menor que a tela inteira.
    const open = tallest - (vv ? vv.height : window.innerHeight) > 150;
    const typing = open && isEditable(document.activeElement);
    document.documentElement.style.setProperty('--kb', `${covered}px`);
    document.body.classList.toggle('kb-open', typing);
  };
  vv?.addEventListener('resize', update);
  vv?.addEventListener('scroll', update);
  window.addEventListener('resize', update);
  // Girou a tela: a medida da tela inteira muda.
  window.addEventListener('orientationchange', () => {
    tallest = 0;
    window.setTimeout(update, 300);
  });
  document.addEventListener('focusin', () => window.setTimeout(update, 50));
  document.addEventListener('focusout', () => window.setTimeout(update, 50));
}
