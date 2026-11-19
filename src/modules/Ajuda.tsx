import { useState } from 'react';
import { SECTIONS } from '../App';
import { useStore } from '../store';
import { isHidden } from '../setup';
import { visibleGuides } from '../guias';
import { Icon, PageHeader, Pill } from '../ui';
import { openTutorial } from './Montagem';
import { TutorialSheet } from './estudos/Tutorial';
import { FinGuideSheet } from './financas/Guia';
import { DiarioGuideSheet } from './DiarioGuia';
import { AgendaGuideSheet } from './AgendaGuia';

/**
 * E43: "Como usar o app" (atalho da gaveta). No topo, o tutorial da barra; embaixo, um guia por módulo à vista,
 * com "Novo" ou "Visto". Os guias chegam um módulo por vez.
 */
export function AjudaPage() {
  const { data } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const guides = visibleGuides((m) => isHidden(data, m));
  return (
    <>
      <PageHeader title="Como usar o app" subtitle="O jeito de andar pelo app e um guia rápido de cada módulo." />
      <section className="card">
        <div className="card-head">
          <h2>A barra e o menu</h2>
        </div>
        <p className="muted small">Favoritos, ferramentas de cada módulo, voltar, puxar a barra para abrir o menu e o ⋮ do topo. Seis passos, fazendo de verdade.</p>
        <button type="button" className="btn primary block" style={{ marginTop: 12 }} onClick={openTutorial}>
          Ver o tutorial da barra
        </button>
      </section>
      <section className="card">
        <div className="card-head">
          <h2>Guia de cada módulo</h2>
        </div>
        <ul className="list">
          {guides.map((g) => {
            const seen = data.settings.guidesSeen.includes(g.id);
            return (
              <li key={g.id}>
                <button type="button" className="row link-row help-row" onClick={() => setOpen(g.id)}>
                  <span className="mg-icon" data-mod={g.id}>
                    <Icon name={SECTIONS.find((x) => x.path === g.id)?.icon ?? 'info'} size={18} />
                  </span>
                  <span className="row-body">
                    <span className="row-title">{g.label}</span>
                    <span className="row-meta">{g.steps} passos</span>
                  </span>
                  <Pill tone={seen ? 'gray' : 'blue'}>{seen ? 'Visto' : 'Novo'}</Pill>
                  <Icon name="right" size={18} />
                </button>
              </li>
            );
          })}
        </ul>
        <p className="muted small" style={{ marginTop: 8 }}>
          Os guias dos outros módulos chegam aos poucos.
        </p>
      </section>
      {open === 'financas' && <FinGuideSheet onClose={() => setOpen(null)} />}
      {open === 'diario' && <DiarioGuideSheet onClose={() => setOpen(null)} />}
      {open === 'agenda' && <AgendaGuideSheet onClose={() => setOpen(null)} />}
      {open === 'estudos' && <TutorialSheet onClose={() => setOpen(null)} />}
    </>
  );
}
