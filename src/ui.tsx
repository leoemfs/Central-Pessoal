import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { formatMoney } from './utils';

const P: Record<string, ReactNode> = {
  home: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v10h13V10" /></>,
  tasks: <><rect x="3.5" y="3.5" width="17" height="17" rx="3.5" /><path d="m8 12.2 2.8 2.8L16 9.5" /></>,
  wallet: <><rect x="2.5" y="6" width="19" height="14" rx="2.5" /><path d="M2.5 10.5h19M6 6l9-2.5 1.5 2.5" /><circle cx="17" cy="15.2" r="1.2" /></>,
  target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="0.8" /></>,
  sprout: <><path d="M12 21v-8.5" /><path d="M12 12.5c0-4.2 2.9-7 7.5-7 0 4.2-2.9 7-7.5 7z" /><path d="M12 15c0-3.4-2.4-5.8-6.5-5.8 0 3.4 2.4 5.8 6.5 5.8z" /><path d="M7.5 21h9" /></>,
  gauge: <><path d="M4.2 17.5a9 9 0 1 1 15.6 0" /><path d="m12 13.5 4-4.5" /><circle cx="12" cy="13.5" r="1.4" /><path d="M7 12h1M12 7v1M17 12h-1" /></>,
  piggy: <><path d="M4.5 11.8C4.5 8.6 7.8 6.5 12 6.5c4.3 0 7.5 2.1 7.5 5.3 0 1.8-1 3.3-2.6 4.3v2.9h-2.4v-1.7a10 10 0 0 1-4.6 0V19H7.5v-2.9c-1.8-1-3-2.5-3-4.3z" /><path d="M19.5 10.5h1.3v2.6h-1.3M9.5 6.9 8.6 4.6l2.8 1.2M15 10.5h.01" /></>,
  list: <><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></>,
  eyeOff: <><path d="M3 3l18 18" /><path d="M10.6 6.1A9.7 9.7 0 0 1 12 6c5 0 8.5 4.5 9 6-.3.9-1.4 2.6-3.1 4M6.6 7.6C4.6 9 3.4 10.9 3 12c.6 1.6 4 6 9 6 1.5 0 2.9-.4 4.1-1" /><path d="M10 10a3 3 0 0 0 4 4" /></>,
  star: <path d="m12 3.6 2.6 5.2 5.7.8-4.1 4 1 5.7-5.2-2.7-5.1 2.7 1-5.7-4.2-4 5.8-.8z" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5c1.2-3.7 4.2-5.6 7.5-5.6s6.3 1.9 7.5 5.6" /></>,
  note: <><path d="M6 3h8.5L19 7.5V21H6z" /><path d="M14 3v5h5M9 13h7M9 17h4.5" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  calendarCheck: <><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4m-6.5 9.5 2 2 4-4" /></>,
  installments: <><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4M7.5 14h9M7.5 17.5h6" /></>,
  sliders: <><path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" /><circle cx="15" cy="6" r="2" /><circle cx="9" cy="12" r="2" /><circle cx="17" cy="18" r="2" /></>,
  grid: <><rect x="4" y="4" width="6.5" height="6.5" rx="1.8" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8" /></>,
  journal: <><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v16H6.5A1.5 1.5 0 0 0 5 20.5z" /><path d="M5 20.5A1.5 1.5 0 0 0 6.5 22H19v-3M9 7.5h6M9 11h4" /></>,
  menu: <path d="M4 7h16M4 12h10M4 17h16" />,
  bell: <><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></>,
  pie: <><path d="M12 3v9h9" /><path d="M20.5 15A9 9 0 1 1 9 3.5" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" /></>,
  calendarPlus: <><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4M12 13v5M9.5 15.5h5" /></>,
  listPlus: <path d="M4 7h12M4 12h12M4 17h7M17 15v6M14 18h6" />,
  notePen: <><path d="M14 3H6v18h6" /><path d="M9 8h6M9 12h4" /><path d="m14 20 6.5-6.5-2-2L12 18v2z" /></>,
  heartPulse: <><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /><path d="M5 12h3l1.5-2.5 2.5 5 1.5-2.5H19" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  sword: <><path d="M14.5 4H20v5.5L9.5 20 4 14.5z" /><path d="m7 13 4 4M4.5 19.5l2-2" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  plusCircle: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>,
  trash: <><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></>,
  pin: <><path d="M9 4h6l-1 6 3 3H7l3-3z" /><path d="M12 13v7" /></>,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  left: <path d="m15 5-7 7 7 7" />,
  right: <path d="m9 5 7 7-7 7" />,
  down: <path d="m6 9 6 6 6-6" />,
  up: <path d="m6 15 6-6 6 6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  checkCircle: <><circle cx="12" cy="12" r="9" /><path d="m8 12.3 2.7 2.7L16 9.7" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
  flame: <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 .3 1.6 1 2.5 2 3 .2-3-.2-5.5.5-8z" />,
  download: <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 20h14" />,
  upload: <path d="M12 16V5m0 0L7.5 9.5M12 5l4.5 4.5M5 20h14" />,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  mapPin: <><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></>,
  contactless: <path d="M8 8.5a5 5 0 0 1 0 7M11.5 6a8.5 8.5 0 0 1 0 12M15 3.5a12 12 0 0 1 0 17" />,
  card: <><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 9.5h19M6 15h4" /></>,
  repeat: <path d="M4 12a8 8 0 0 1 13.7-5.7L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.7L4 15.5M4 20v-4.5h4.5" />,
  receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></>,
  coins: <><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  alert: <><path d="M12 4 2.5 20h19z" /><path d="M12 10v4M12 17h.01" /></>,
  send: <><path d="m4 12 16-8-6 16-3-6z" /><path d="m11 14 9-10" /></>,
  pause: <><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></>,
  undo: <><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="9" cy="9.5" r="1.8" /><path d="m4 18 5-5 4 4 2.5-2.5L20 19M18 2v5M15.5 4.5h5" /></>,
  palette: <><path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.5S13 18 13 17s.8-1.5 2-1.5h2a4 4 0 0 0 4-4C21 6.8 17 3 12 3z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7" r="1" /><circle cx="15" cy="7.5" r="1" /></>,
  shield: <><path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6z" /><path d="m9 12 2 2 4-4" /></>,
  // Ícones de categoria
  utensils: <path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 21v-8h-3V9.5C14 6.5 15 4 17 3z" />,
  car: <><path d="M4 16v-4l2-5.5h12L20 12v4z" /><path d="M4 12h16M6.5 16v2.5M17.5 16v2.5" /><path d="M7.5 14h.01M16.5 14h.01" /></>,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  book: <><path d="M4 5.5C6.5 4 9.5 4 12 6c2.5-2 5.5-2 8-.5V19c-2.5-1.5-5.5-1.5-8 .5-2.5-2-5.5-2-8-.5z" /><path d="M12 6v13.5" /></>,
  smile: <><circle cx="12" cy="12" r="9" /><path d="M8.5 14a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01" /></>,
  play: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m10 9 5 3-5 3z" /></>,
  bag: <><path d="M5 8h14l-1 12H6z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  tag: <><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="7.5" r="1.3" /></>,
  bolt: <path d="M13 3 5 13h6l-1 8 8-10h-6z" />,
  gift: <><rect x="3.5" y="8" width="17" height="4" rx="1" /><path d="M5 12v8h14v-8M12 8v12M12 8C10.5 5 7 5 7 7s3 1 5 1c2 0 5 1 5-1s-3.5-2-5 1z" /></>,
  paw: <><circle cx="7" cy="9" r="1.6" /><circle cx="12" cy="6.5" r="1.6" /><circle cx="17" cy="9" r="1.6" /><path d="M12 12c-3 0-5 3.5-5 5.5S9 20 12 19s5 .5 5-1.5-2-5.5-5-5.5z" /></>,
  dumbbell: <path d="M6 7v10M18 7v10M3.5 9.5v5M20.5 9.5v5M6 12h12" />,
  plane: <path d="M10.5 13.5 3 11l1.5-1.5 7 1 4-4.5a1.8 1.8 0 0 1 2.5 2.5L13.5 13l1 7-1.5 1.5-2.5-8z" />,
  phone: <><rect x="7" y="3" width="10" height="18" rx="2" /><path d="M11 18h2" /></>,
  shirt: <path d="M8 4 3 7l2 4 2-1v10h10V10l2 1 2-4-5-3a3 3 0 0 1-8 0z" />,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5h6v2M3 12h18" /></>,
  flag: <path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
  timer: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2M10 2h4" /></>,
  bulb: <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />,
  cart: <><circle cx="9" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" /><path d="M3 4h2l2.4 11h10.2L20 8H6.2" /></>,
  pot: <path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM2 10h2M20 10h2M9 6c0-1 1-1 1-2M14 6c0-1 1-1 1-2" />,
  store: <path d="M4 9 5.5 4h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6" />,
  trendUp: <path d="M7 17 17 7M9 7h8v8" />,
  trendDown: <path d="M7 7l10 10M17 9v8H9" />,
  bars: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  // Estudos e Carreira
  cap: <><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" /><path d="M22 9v6" /></>,
  route: <><circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" /><path d="M8 19h8.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H16" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  mindmap: <><circle cx="12" cy="12" r="2.6" /><circle cx="4.5" cy="5" r="1.8" /><circle cx="19.5" cy="5" r="1.8" /><circle cx="4.5" cy="19" r="1.8" /><circle cx="19.5" cy="19" r="1.8" /><path d="M10 10.2 6 6.4M14 10.2l4-3.8M10 13.8l-4 3.8M14 13.8l4 3.8" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" /></>,
  code: <path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16" />,
  spark: <><path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z" /><path d="M19 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" /></>,
  notebook: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 3v18M12.5 8H16M12.5 12H16" /></>,
  library: <><path d="M4 4h4v16H4zM10 4h4v16h-4z" /><path d="m15.5 5 3.8-1 3.2 15.5-3.8 1z" /></>,
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></>,
  ext: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>,
  restore: <><path d="M4 12a8 8 0 1 0 2.4-5.7" /><path d="M4 4v4.5h4.5" /></>,
  archive: <><rect x="3" y="4" width="18" height="5" rx="1" /><path d="M5 9v11h14V9M10 13h4" /></>,
};

export type IconName = keyof typeof P;

/** Ícones disponíveis ao criar uma categoria. */
export const CATEGORY_ICONS: IconName[] = [
  'home', 'utensils', 'car', 'heart', 'book', 'smile', 'play', 'bag', 'bolt', 'gift',
  'paw', 'dumbbell', 'plane', 'phone', 'shirt', 'briefcase', 'card', 'coins', 'tag',
];

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[name] ?? P.tag}
    </svg>
  );
}

export function IconButton({ icon, label, onClick, tone, active }: { icon: IconName; label: string; onClick: () => void; tone?: 'danger'; active?: boolean }) {
  return (
    <button type="button" className={`icon-btn${tone === 'danger' ? ' danger' : ''}${active ? ' active' : ''}`} onClick={onClick} aria-label={label} title={label}>
      <Icon name={icon} size={18} />
    </button>
  );
}

/**
 * Cabeçalho da tela. Quando tem navegação (mês, semana) ou abas, vira um bloco preso no topo:
 * some ao rolar para baixo e volta ao rolar para cima, junto com a barra de cima (igual em todos os módulos).
 */
export function PageHeader({ title, subtitle, actions, tabs }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; tabs?: ReactNode }) {
  const header = (
    <header className="page-header">
      <div className="page-title">
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
  if (!actions && !tabs) return header;
  return (
    <StickyHead>
      {header}
      {tabs}
    </StickyHead>
  );
}

/** Bloco preso no topo. O fundo em volta só aparece quando ele está de fato grudado (senão cobriria o cartão de baixo). */
function StickyHead({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => {
      const top = parseFloat(getComputedStyle(el).top) || 0;
      el.classList.toggle('stuck', window.scrollY > 0 && el.getBoundingClientRect().top <= top + 1);
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    return () => window.removeEventListener('scroll', check);
  }, []);
  return (
    <div ref={ref} className="sticky-head">
      {children}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}

export function Card({ title, action, children, className = '' }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <div className="card-head">
          {title && <h2>{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function MonthNav({ label, onPrev, onNext, onLabel }: { label: string; onPrev: () => void; onNext: () => void; onLabel?: () => void }) {
  return (
    <div className="month-nav">
      <IconButton icon="left" label="Mês anterior" onClick={onPrev} />
      {onLabel ? (
        <button type="button" className="month-label link-like" onClick={onLabel}>
          {label}
        </button>
      ) : (
        <span className="month-label">{label}</span>
      )}
      <IconButton icon="right" label="Próximo mês" onClick={onNext} />
    </div>
  );
}

export type PillTone = 'green' | 'orange' | 'red' | 'blue' | 'gray';
export function Pill({ tone = 'gray', children }: { tone?: PillTone; children: ReactNode }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

export function CategoryBadge({ icon, color, size = 40 }: { icon: string; color: string; size?: number }) {
  return (
    <span className="cat-badge" style={{ width: size, height: size, color, background: `${color}26` }} aria-hidden="true">
      <Icon name={icon as IconName} size={Math.round(size * 0.5)} />
    </span>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`switch${checked ? ' on' : ''}`} onClick={() => onChange(!checked)}>
      <span />
    </button>
  );
}

/** Campo de valor em reais: os dígitos entram pela direita (6 → 7 → 1 vira R$ 6,71). */
export function MoneyInput({ cents, onChange, large, label, autoFocus }: { cents: number; onChange: (cents: number) => void; large?: boolean; label: string; autoFocus?: boolean }) {
  return (
    <input
      className={`input money${large ? ' large' : ''}`}
      inputMode="numeric"
      aria-label={label}
      autoFocus={autoFocus}
      value={formatMoney(cents / 100)}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 11);
        onChange(Number(digits || '0'));
      }}
      onFocus={(e) => {
        const el = e.target;
        requestAnimationFrame(() => el.setSelectionRange(el.value.length, el.value.length));
      }}
    />
  );
}

// ---------- Botão "voltar" do celular fecha janelas e menus ----------

interface Overlay {
  id: string;
  close: () => void;
  closedByBack: boolean;
}
const overlays: Overlay[] = [];
let ignorePops = 0;

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    if (ignorePops > 0) {
      ignorePops--;
      return;
    }
    const top = overlays[overlays.length - 1];
    if (top) {
      top.closedByBack = true;
      top.close();
    }
  });
}

/**
 * Enquanto o componente está aberto, o "voltar" do celular (ou do navegador) fecha só ele,
 * em vez de sair da página. Fechado pelo X ou ao salvar, remove a entrada extra do histórico.
 */
export function useBackToClose(onClose: () => void) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const entry: Overlay = { id: Math.random().toString(36).slice(2), close: () => close.current(), closedByBack: false };
    history.pushState({ overlay: entry.id }, '');
    overlays.push(entry);
    return () => {
      overlays.splice(overlays.indexOf(entry), 1);
      // Se ainda estamos na entrada desta janela (não houve navegação no meio), volta uma posição.
      if (!entry.closedByBack && (history.state as { overlay?: string } | null)?.overlay === entry.id) {
        ignorePops++;
        history.back();
      }
    };
  }, []);
}

// ---------- Sheet (janela de formulário / detalhes) ----------

const openSheets: symbol[] = [];

export function Sheet({ title, badge, onClose, children, footer, size }: { title: ReactNode; badge?: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode; size?: 'wide' }) {
  const close = useRef(onClose);
  close.current = onClose;
  const [me] = useState(() => Symbol('sheet'));
  useBackToClose(onClose);

  useEffect(() => {
    openSheets.push(me);
    document.body.classList.add('sheet-open');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openSheets[openSheets.length - 1] === me) close.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      openSheets.splice(openSheets.indexOf(me), 1);
      if (!openSheets.length) document.body.classList.remove('sheet-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [me]);

  return createPortal(
    <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close.current()}>
      <div className={`sheet${size === 'wide' ? ' wide' : ''}`} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
        <header className="sheet-head">
          <h2>{title}</h2>
          {badge}
          <button type="button" className="icon-btn" onClick={() => close.current()} aria-label="Fechar">
            <Icon name="x" />
          </button>
        </header>
        <div className="sheet-body">{children}</div>
        {footer && <footer className="sheet-foot">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

// ---------- Tela cheia (práticas e entrevista) ----------

export function Fullscreen({ onClose, label, className = '', children }: { onClose: () => void; label: string; className?: string; children: ReactNode }) {
  const close = useRef(onClose);
  close.current = onClose;
  useBackToClose(onClose);
  useEffect(() => {
    document.body.classList.add('sheet-open');
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !document.querySelector('.sheet-backdrop') && close.current();
    window.addEventListener('keydown', onKey);
    return () => {
      if (!document.querySelector('.sheet-backdrop')) document.body.classList.remove('sheet-open');
      window.removeEventListener('keydown', onKey);
    };
  }, []);
  return createPortal(
    <div className={`fullscreen ${className}`} role="dialog" aria-modal="true" aria-label={label}>
      {children}
    </div>,
    document.body,
  );
}

// ---------- Avisos rápidos ----------

type ToastMsg = { id: number; title: string; text?: string };
let toastSeq = 0;
const toastListeners = new Set<(t: ToastMsg) => void>();

/** Mostra um aviso curto na parte de baixo da tela. */
export function notify(title: string, text?: string) {
  const t = { id: ++toastSeq, title, text };
  toastListeners.forEach((fn) => fn(t));
}

export function Toasts() {
  const [list, setList] = useState<ToastMsg[]>([]);
  useEffect(() => {
    const on = (t: ToastMsg) => {
      setList([t]);
      window.setTimeout(() => setList((cur) => cur.filter((x) => x.id !== t.id)), 3200);
    };
    toastListeners.add(on);
    return () => void toastListeners.delete(on);
  }, []);
  return createPortal(
    <div className="toasts" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className="toast">
          <strong>{t.title}</strong>
          {t.text && <span className="muted small">{t.text}</span>}
        </div>
      ))}
    </div>,
    document.body,
  );
}

/** Chips de múltipla escolha, com aria-pressed (e a ordem do toque, com `numbered`). */
export function MultiChips({ options, value, onToggle, label, numbered }: { options: [string, string][]; value: string[]; onToggle: (v: string) => void; label: string; numbered?: boolean }) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {options.map(([v, l]) => {
        const i = value.indexOf(v);
        return (
          <button key={v} type="button" aria-pressed={i !== -1} className={`chip-btn${i !== -1 ? ' on' : ''}`} onClick={() => onToggle(v)}>
            {numbered && i !== -1 ? `${i + 1}. ` : ''}
            {l}
          </button>
        );
      })}
    </div>
  );
}

/** Anel de porcentagem (perfil completo). */
export function Ring({ pct, size = 64 }: { pct: number; size?: number }) {
  return (
    <span className="ring" style={{ width: size, height: size, ['--p' as string]: pct } as CSSProperties} role="img" aria-label={`${pct}% preenchido`}>
      <span>{pct}%</span>
    </span>
  );
}

export function Field({ label, hint, children }: { label: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

/** Lista de opções em "chips" (escolha única). */
export function Chips<T extends string>({ options, value, onChange, label }: { options: { value: T; label: ReactNode }[]; value: T | null; onChange: (v: T) => void; label: string }) {
  return (
    <div className="chips" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className={`chip-btn${value === o.value ? ' on' : ''}`} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Elementos onde deslizar o dedo tem outro uso (digitar, rolar para o lado, escolher cor…). */
const NO_SWIPE = 'input, textarea, select, [data-noswipe], .chips, .swatches';

function scrollsSideways(el: Element | null, stop: Element): boolean {
  for (let n = el; n && n !== stop; n = n.parentElement) {
    const ox = getComputedStyle(n).overflowX;
    if ((ox === 'auto' || ox === 'scroll') && n.scrollWidth > n.clientWidth) return true;
  }
  return false;
}

/**
 * Abas. Com `swipe` (abas do módulo, dentro do PageHeader): deslizar o dedo para o lado, em qualquer parte
 * da tela, troca de aba; e trocar de aba volta ao começo da tela.
 */
export function Segmented<T extends string>({ options, value, onChange, label, swipe }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string; swipe?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const latest = useRef({ options, value, onChange, swipe });
  latest.current = { options, value, onChange, swipe };

  function pick(v: T) {
    if (v === latest.current.value) return;
    latest.current.onChange(v);
    if (latest.current.swipe && window.scrollY > 0) window.scrollTo({ top: 0 });
  }

  useEffect(() => {
    if (!swipe) return;
    const area = ref.current?.closest('main') ?? ref.current?.parentElement;
    if (!area) return;
    let start: { x: number; y: number; t: number } | null = null;
    const onStart = (e: TouchEvent) => {
      const target = e.target as Element;
      start = e.touches.length === 1 && !target.closest(NO_SWIPE) && !scrollsSideways(target, area) ? { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() } : null;
    };
    const onEnd = (e: TouchEvent) => {
      if (!start) return;
      const dx = e.changedTouches[0].clientX - start.x;
      const dy = e.changedTouches[0].clientY - start.y;
      const quick = Date.now() - start.t < 600;
      start = null;
      // Movimento claramente para o lado: pelo menos 60px e bem mais horizontal que vertical.
      if (!quick || Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.8) return;
      const { options: opts, value: cur } = latest.current;
      const i = opts.findIndex((o) => o.value === cur);
      const next = opts[dx < 0 ? i + 1 : i - 1];
      if (next) pick(next.value);
    };
    area.addEventListener('touchstart', onStart, { passive: true });
    area.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      area.removeEventListener('touchstart', onStart);
      area.removeEventListener('touchend', onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swipe]);

  return (
    <div ref={ref} className="segmented" role="tablist" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value} className={value === o.value ? 'on' : ''} onClick={() => pick(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Progress({ pct, tone = 'green' }: { pct: number; tone?: 'green' | 'orange' | 'red' }) {
  return (
    <div className="progress" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={tone} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

/** Desenho em pixel art a partir de linhas de caracteres (cada caractere = um pixel da paleta). */
export function Pixels({ rows, pal, size = 6 }: { rows: string[]; pal: Record<string, string>; size?: number }) {
  return (
    <div className="pixels" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${rows[0].length}, ${size}px)`, gridAutoRows: `${size}px` }}>
      {rows.join('').split('').map((ch, i) => (
        <span key={i} style={{ background: pal[ch] ?? 'transparent' }} />
      ))}
    </div>
  );
}
