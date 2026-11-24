import { GuideCard, GuideSheet, type GuideStep } from './Guia';

/** E43: os 6 passos do guia "Como usar Núcleo". */
export const NUCLEO_STEPS: GuideStep[] = [
  {
    icon: 'sprout',
    title: 'As quatro abas',
    text: [
      '**Rituais** (rotinas fixas), **Hábitos** (a construir ou abandonar), **Mente** e **Corpo**.',
      'Deslize para o lado ou toque na aba para trocar.',
    ],
  },
  {
    icon: 'plus',
    title: 'Crie pelo botão +',
    text: [
      'O + cria um **ritual** ou um **hábito**: dias da semana, período, horário e o gatilho "depois de…".',
      'Hábito a construir tem meta de dias (padrão 66) até virar ritual.',
    ],
    to: 'Criar um ritual ou hábito',
    go: 'nucleo/novo',
  },
  {
    icon: 'checkCircle',
    title: 'Marque o dia',
    text: [
      'Toque no círculo para marcar. A sequência só conta os dias da rotina, e o app avisa para **não falhar duas vezes**.',
      'Tocar no nome abre os detalhes: **pausar**, **arquivar** ou editar.',
    ],
  },
  {
    icon: 'heartPulse',
    title: 'Mente e Corpo',
    text: [
      '**Mente**: meditação, respiração e "Três coisas boas". **Corpo**: treino em casa, fichas, alongamentos e caminhada.',
      'Hábito ligado a uma prática ganha o botão **Iniciar** e é marcado sozinho ao concluir.',
    ],
    to: 'Ver as práticas de Mente',
    go: 'nucleo/mente',
  },
  {
    icon: 'bars',
    title: 'Progresso',
    text: [
      'Na barra de baixo, à esquerda da casa do Núcleo.',
      'Mostra constância, sequências e os atributos que você está treinando.',
    ],
    to: 'Abrir o Progresso',
    go: 'progresso',
  },
  {
    icon: 'clock',
    title: 'Práticas',
    text: [
      'Na barra de baixo, à direita da casa do Núcleo.',
      'O histórico de meditações, respirações e treinos, por semana.',
    ],
    to: 'Abrir as Práticas',
    go: 'historico',
  },
];

export function NucleoGuideSheet({ onClose }: { onClose: () => void }) {
  return <GuideSheet id="nucleo" label="Núcleo" steps={NUCLEO_STEPS} onClose={onClose} />;
}

/** Cartão da 1ª vez no Núcleo (arquivado em `settings.guidesOff`). */
export function NucleoGuideCard() {
  return <GuideCard id="nucleo" label="Núcleo" summary="Seis passos rápidos: abas, botão +, marcar o dia, Mente e Corpo, Progresso e Práticas." steps={NUCLEO_STEPS} />;
}
