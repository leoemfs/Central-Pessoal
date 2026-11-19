import { GuideCard, GuideSheet, type GuideStep } from '../Guia';
import { useStudy } from './shared';

/** Os passos do tutorial de Estudos (N11.5): o que é, como fazer e onde tocar para ver na prática. */
export const STUDY_STEPS: GuideStep[] = [
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

/** Passo a passo de Estudos (guia comum, E43). */
export function TutorialSheet({ onClose }: { onClose: () => void }) {
  return <GuideSheet id="estudos" label="Estudos" steps={STUDY_STEPS} onClose={onClose} />;
}

/** Cartão "Como usar Estudos" (antes de "Estudando agora"), com Arquivar (guardado em `study.tutorialOff`). */
export function TutorialCard() {
  const { study, set } = useStudy();
  return (
    <GuideCard
      id="estudos"
      label="Estudos"
      summary="Seis passos rápidos: Biblioteca, ciclo, tópicos, notebook, fontes e mapas, e cursos prontos."
      steps={STUDY_STEPS}
      off={study.tutorialOff}
      onArchive={() => set((s) => ({ ...s, tutorialOff: true }))}
    />
  );
}
