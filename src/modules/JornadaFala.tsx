/**
 * Jornada (N2.17g1): fala de personagem em balão, como na "Prévia da Jornada". O texto aparece letra
 * a letra; tocar completa a fala ou passa para a próxima. Serve para a Mestra Lume e, depois, a Campanha.
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { npcIcon } from '../jornada/catalog';

const NAMES = { lume: 'Mestra Lume', nina: 'Nina, a mercadora', tork: 'Tork, o ferreiro' } as const;
const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function NpcDialog({ npc, lines, onDone }: { npc: keyof typeof NAMES; lines: string[]; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(reduced() ? lines[0].length : 0);
  const box = useRef<HTMLButtonElement>(null);
  const full = lines[i] ?? '';
  const typing = shown < full.length;
  useEffect(() => {
    if (!typing) return;
    const t = window.setTimeout(() => setShown((n) => Math.min(full.length, n + 2)), 22);
    return () => window.clearTimeout(t);
  }, [shown, typing, full.length]);
  useEffect(() => box.current?.focus({ preventScroll: true }), []);
  const next = () => {
    if (typing) return setShown(full.length);
    if (i + 1 < lines.length) {
      setI(i + 1);
      setShown(reduced() ? lines[i + 1].length : 0);
    } else onDone();
  };
  return createPortal(
    <div className="jn-dialog-shade" role="dialog" aria-modal="true" aria-label={`Fala de ${NAMES[npc]}`}>
      <div className="jn-dialog">
        <button ref={box} type="button" className="jn-dialog-box" aria-label="Continuar" onClick={next}>
          <img className="jn-dialog-face" alt="" src={npcIcon(npc)} />
          <span className="jn-dialog-text">
            <span className="jn-dialog-who jn-px">{NAMES[npc]}</span>
            <span aria-live="polite">{full.slice(0, shown)}</span>
          </span>
          {!typing && <span className="jn-dialog-more" aria-hidden="true">▼</span>}
        </button>
        <span className="jn-dialog-skip">
          {i + 1} de {lines.length} · toque para continuar
        </span>
      </div>
    </div>,
    document.body,
  );
}
