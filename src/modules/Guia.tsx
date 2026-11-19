import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { archiveGuide, markSeen, showGuideCard } from '../guias';
import { go } from '../router';
import { Icon, notify, Sheet, type IconName } from '../ui';

/** E43: um passo do guia de um módulo. `go`: tela que o atalho "<to> ›" abre (sem ele, não há atalho). */
export interface GuideStep {
  icon: IconName;
  title: string;
  text: string[];
  to?: string;
  go?: string;
}

/** Texto com **negrito**, sem marcação nenhuma além disso. */
function Rich({ text }: { text: string }) {
  return <>{text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : part))}</>;
}

/** Guia comum de qualquer módulo: passo a passo numa janela com Voltar e Próximo. Abrir marca "Visto". */
export function GuideSheet({ id, label, steps, onClose }: { id: string; label: string; steps: GuideStep[]; onClose: () => void }) {
  const [i, setI] = useState(0);
  const { update } = useStore();
  useEffect(() => {
    update((d) => (d.settings.guidesSeen.includes(id) ? d : { ...d, settings: { ...d.settings, guidesSeen: markSeen(d.settings.guidesSeen, id) } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const step = steps[i];
  const last = i === steps.length - 1;
  const target = step.go;
  return (
    <Sheet
      title={`Como usar ${label}`}
      badge={<span className="muted small tabular">{i + 1} de {steps.length}</span>}
      onClose={onClose}
      footer={
        <div className="btn-row st-tut-nav">
          <button type="button" className="btn soft" disabled={i === 0} onClick={() => setI(i - 1)}>
            Voltar
          </button>
          <button type="button" className="btn primary" onClick={() => (last ? onClose() : setI(i + 1))}>
            {last ? 'Pronto' : 'Próximo'}
          </button>
        </div>
      }
    >
      <div className="st-tut">
        <span className="tile-icon st-green st-tut-icon">
          <Icon name={step.icon} size={26} />
        </span>
        <h3>{step.title}</h3>
        {step.text.map((t) => (
          <p key={t}>
            <Rich text={t} />
          </p>
        ))}
        {target && step.to && (
          <button
            type="button"
            className="link st-tut-go"
            onClick={() => {
              onClose();
              go(target);
            }}
          >
            {step.to} <Icon name="right" size={16} />
          </button>
        )}
        <div className="st-tut-dots" aria-hidden="true">
          {steps.map((s, k) => (
            <span key={s.title} className={k === i ? 'on' : undefined} />
          ))}
        </div>
      </div>
    </Sheet>
  );
}

/**
 * Cartão "Como usar <módulo>" da 1ª vez, com Arquivar. Sem `off`/`onArchive`, usa `settings.guidesOff`.
 * Some depois de abrir o guia (ele fica "Visto").
 */
export function GuideCard({ id, label, summary, steps, off, onArchive }: { id: string; label: string; summary: string; steps: GuideStep[]; off?: boolean; onArchive?: () => void }) {
  const { data, update } = useStore();
  const [open, setOpen] = useState(false);
  const hidden = off ?? !showGuideCard(data.settings.guidesSeen, data.settings.guidesOff, id);
  if (hidden && !open) return null;
  return (
    <>
      {!hidden && (
        <section className="card st-course-cta">
          <div className="st-course-cta-text">
            <span className="tile-icon st-green">
              <Icon name="info" />
            </span>
            <div className="st-tut-head">
              <h2>Como usar {label}</h2>
              <p className="muted small">{summary}</p>
            </div>
            <button
              type="button"
              className="icon-btn st-quiet"
              aria-label="Arquivar o guia"
              title="Arquivar"
              onClick={() => {
                if (onArchive) onArchive();
                else update((d) => ({ ...d, settings: { ...d.settings, guidesOff: archiveGuide(d.settings.guidesOff, id) } }));
                notify('Guia arquivado', `O passo a passo fica no ⋮ de ${label} e em Como usar o app.`);
              }}
            >
              <Icon name="archive" size={18} />
            </button>
          </div>
          <div className="btn-row">
            <button type="button" className="btn primary small" onClick={() => setOpen(true)}>
              Ver o passo a passo
            </button>
          </div>
        </section>
      )}
      {open && <GuideSheet id={id} label={label} steps={steps} onClose={() => setOpen(false)} />}
    </>
  );
}
