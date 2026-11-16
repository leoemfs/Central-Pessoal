/**
 * Jornada (N2.17d): efeitos de recompensa, como na "Prévia da Jornada". Números que sobem do botão
 * ("+15 XP", "+2 INT") e moedas que voam até o ouro da faixa do topo, que pulsa. Sem efeito com
 * "menos movimento".
 */
const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function layer(): HTMLElement {
  let el = document.querySelector<HTMLElement>('.jn-fx');
  if (!el) {
    el = document.createElement('div');
    el.className = 'jn-fx';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  }
  return el;
}

/** O ouro visível na faixa do topo (a linha compacta quando ela está encolhida). */
function goldTarget(): HTMLElement | null {
  const list = [...document.querySelectorAll<HTMLElement>('.jn-hud-purse .g')];
  return list.find((x) => x.getBoundingClientRect().height > 0 && getComputedStyle(x.closest('.jn-hud-compact, .jn-hud-row') ?? x).opacity !== '0') ?? list[0] ?? null;
}

export function pulse(el: Element | null) {
  if (!el || reduced()) return;
  el.classList.remove('jn-bump');
  void (el as HTMLElement).offsetWidth;
  el.classList.add('jn-bump');
}

/** Textos que sobem a partir de um ponto. */
export function floatTexts(from: DOMRect, parts: { text: string; color: string }[]) {
  if (reduced()) return;
  const root = layer();
  parts.forEach((p, i) => {
    const f = document.createElement('span');
    f.className = 'jn-float';
    f.textContent = p.text;
    f.style.color = p.color;
    f.style.left = `${Math.max(8, from.left - 56 - i * 8)}px`;
    f.style.top = `${from.top - 4 - i * 20}px`;
    f.style.animationDelay = `${i * 0.12}s`;
    root.appendChild(f);
    window.setTimeout(() => f.remove(), 1700);
  });
}

/** Moedas que voam de um ponto até o ouro da faixa. */
export function flyCoins(from: DOMRect, src: string, n: number) {
  const target = goldTarget();
  if (reduced() || !target) return;
  const t = target.getBoundingClientRect();
  const root = layer();
  for (let i = 0; i < n; i++) {
    const c = document.createElement('img');
    c.className = 'jn-flyer';
    c.src = src;
    c.alt = '';
    const sx = from.left + from.width / 2 + (Math.random() * 30 - 15);
    const sy = from.top + (Math.random() * 20 - 10);
    c.style.left = `${sx}px`;
    c.style.top = `${sy}px`;
    root.appendChild(c);
    window.setTimeout(() => {
      c.style.transform = `translate(${t.left + 6 - sx}px, ${t.top + 6 - sy}px) scale(0.8)`;
      c.style.opacity = '0';
    }, 40 + i * 70);
    window.setTimeout(() => {
      c.remove();
      if (i === n - 1) pulse(target);
    }, 900 + i * 70);
  }
}

/** Confete por cima de tudo (tela de título novo, resumo da semana). */
export function confetti() {
  if (reduced()) return;
  const root = layer();
  const box = document.createElement('div');
  box.className = 'jn-confetti-fx';
  const colors = ['#4ade80', '#fde047', '#a78bfa', '#60a5fa', '#f472b6', '#fb923c'];
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('i');
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = colors[i % colors.length];
    p.style.setProperty('--dx', `${Math.random() * 120 - 60}px`);
    p.style.animationDelay = `${Math.random() * 0.8}s`;
    p.style.animationDuration = `${2 + Math.random() * 1.4}s`;
    box.appendChild(p);
  }
  root.appendChild(box);
  window.setTimeout(() => box.remove(), 4200);
}
