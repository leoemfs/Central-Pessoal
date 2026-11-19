import { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { markSeen } from '../../guias';
import { go } from '../../router';
import { Icon, notify, Sheet, type IconName } from '../../ui';
import { useStudy } from './shared';

/** Os passos do tutorial de Estudos (N11.5): o que é, como fazer e onde tocar para ver na prática. */
const STEPS: { icon: IconName; title: string; text: string[]; to: string; go: string }[] = [
  {
    icon: 'library',
    title: 'Escolha um assunto na Biblioteca',
    text: [
      'A Biblioteca guarda roteiros para explorar: **áreas** (ex.: Idiomas), **temas** (ex.: Inglês) e **trilhas**, que são listas de tópicos em ordem.',
      'Nada ali é obrigatório. Use como mapa do caminho e crie as suas áreas e trilhas quando quiser.',
      'Em cada linha, o ícone de **arquivar** tira da lista sem apagar e a **lixeira** exclui o que é seu.',
    ],
    to: 'Abrir a Biblioteca',
    go: 'estudos/biblioteca',
  },
  {
    icon: 'route',
    title: 'Monte um ciclo com uma trilha',
    text: [
      'Abra uma trilha e marque só os tópicos que quer estudar agora. Depois toque em **Montar ciclo**.',
      'O ciclo é o seu plano do momento: aparece em **Estudando agora**, aqui na tela de Estudos.',
    ],
    to: 'Ver os ciclos',
    go: 'ciclos',
  },
  {
    icon: 'check',
    title: 'Avance tópico por tópico',
    text: [
      'Cada tópico do ciclo passa por **A estudar → Estudando → Concluído**. Toque para mudar.',
      'O progresso aparece na trilha e no ciclo. Ciclo concluído pode ir para o currículo, em Carreira.',
    ],
    to: 'Ver os ciclos',
    go: 'ciclos',
  },
  {
    icon: 'notebook',
    title: 'Anote num notebook',
    text: [
      'O notebook é o seu caderno: páginas e subpáginas com texto, listas, vocabulário e links.',
      'Cada tópico pode virar uma página. Também dá para começar um notebook livre, sem trilha nenhuma.',
    ],
    to: 'Abrir os notebooks',
    go: 'estudos/notebooks',
  },
  {
    icon: 'mindmap',
    title: 'Guarde fontes e faça mapas',
    text: [
      '**Fontes** são sites, vídeos, livros e cursos que você usa. Uma fonte pode servir a vários estudos.',
      '**Mapas mentais** resumem um assunto em ramos. São bons para revisar e para consultar depois.',
    ],
    to: 'Ver as fontes',
    go: 'estudos/fontes',
  },
  {
    icon: 'download',
    title: 'Importe um curso pronto',
    text: [
      'Em **Importar curso**, o app monta um pedido para você colar numa IA. Ela devolve um arquivo e o app cria tudo de uma vez: trilhas, notebook, fontes, mapas e um ciclo para começar.',
      'Curso grande vem em partes: importe cada parte do mesmo curso e ela se junta à anterior.',
    ],
    to: 'Importar um curso',
    go: 'estudos/importar-curso',
  },
];

/** Texto com **negrito**, sem marcação nenhuma além disso. */
function Rich({ text }: { text: string }) {
  return <>{text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : part))}</>;
}

/** Passo a passo do tutorial, numa janela com Voltar e Próximo. */
export function TutorialSheet({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  // E43: abriu o guia, ele aparece como "Visto" em Como usar o app.
  const { update } = useStore();
  useEffect(() => {
    update((d) => (d.settings.guidesSeen.includes('estudos') ? d : { ...d, settings: { ...d.settings, guidesSeen: markSeen(d.settings.guidesSeen, 'estudos') } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;
  return (
    <Sheet
      title="Como usar Estudos"
      badge={<span className="muted small tabular">{i + 1} de {STEPS.length}</span>}
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
        <button
          type="button"
          className="link st-tut-go"
          onClick={() => {
            onClose();
            go(step.go);
          }}
        >
          {step.to} <Icon name="right" size={16} />
        </button>
        <div className="st-tut-dots" aria-hidden="true">
          {STEPS.map((s, k) => (
            <span key={s.title} className={k === i ? 'on' : undefined} />
          ))}
        </div>
      </div>
    </Sheet>
  );
}

/** Cartão "Como usar Estudos" (antes de "Estudando agora"), com Arquivar. */
export function TutorialCard() {
  const { study, set } = useStudy();
  const [open, setOpen] = useState(false);
  if (study.tutorialOff) return null;
  return (
    <section className="card st-course-cta">
      <div className="st-course-cta-text">
        <span className="tile-icon st-green">
          <Icon name="info" />
        </span>
        <div className="st-tut-head">
          <h2>Como usar Estudos</h2>
          <p className="muted small">Seis passos rápidos: Biblioteca, ciclo, tópicos, notebook, fontes e mapas, e cursos prontos.</p>
        </div>
        <button
          type="button"
          className="icon-btn st-quiet"
          aria-label="Arquivar o tutorial"
          title="Arquivar"
          onClick={() => {
            set((s) => ({ ...s, tutorialOff: true }));
            notify('Tutorial arquivado', 'O passo a passo fica no ⋮ de Estudos e em Como usar o app.');
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
      {open && <TutorialSheet onClose={() => setOpen(false)} />}
    </section>
  );
}
