import { GuideCard, GuideSheet, type GuideStep } from './Guia';

/** E43: os 6 passos do guia "Como usar Diário". */
export const DIARIO_STEPS: GuideStep[] = [
  {
    icon: 'journal',
    title: 'Seu feed',
    text: [
      'O registro mais novo fica no topo, aberto; os anteriores ficam recolhidos. Toque em **Expandir registro** para ler.',
      'O mês fica abaixo do título: toque nele para escolher outro, com quantos registros cada mês tem.',
    ],
  },
  {
    icon: 'plus',
    title: 'Escreva pelo botão +',
    text: [
      'Data e hora entram sozinhas. Se quiser, ponha uma **etiqueta** e até fotos.',
      'A **pergunta do dia** ajuda a começar: "Outra pergunta" troca e "Responder" põe no título.',
    ],
    to: 'Escrever agora',
    go: 'diario/nova',
  },
  {
    icon: 'tag',
    title: 'Etiquetas, busca e ordem',
    text: [
      'As **fichas** no topo (Pessoal, Trabalho…) mostram só os registros daquela etiqueta.',
      'No **⋮** ficam a ordem (mais antigos ou mais recentes primeiro) e, por último, a busca em todos os registros.',
    ],
  },
  {
    icon: 'calendarCheck',
    title: 'Esta semana e Neste dia',
    text: [
      '**Esta semana** mostra os dias em que você escreveu, os dias seguidos e o seu ritmo.',
      '**Neste dia** traz o que você escreveu há 1 mês, 6 meses e 1 ano, quando houver.',
    ],
  },
  {
    icon: 'smile',
    title: 'Humor',
    text: [
      'Na barra de baixo, à esquerda da casa do Diário. Marque como foi o dia, de 😞 a 😄.',
      'A anotação do humor vira um registro no Diário.',
    ],
    to: 'Abrir o Humor',
    go: 'humor',
  },
  {
    icon: 'calendarCheck',
    title: 'Revisão da semana',
    text: [
      'Na barra de baixo, à direita da casa do Diário.',
      'Junta a semana: rotina, gastos, agenda, estudos e diário, com uma reflexão que fica salva.',
    ],
    to: 'Abrir a Revisão',
    go: 'revisao',
  },
];

export function DiarioGuideSheet({ onClose }: { onClose: () => void }) {
  return <GuideSheet id="diario" label="Diário" steps={DIARIO_STEPS} onClose={onClose} />;
}

/** Cartão da 1ª vez no Diário (arquivado em `settings.guidesOff`). */
export function DiarioGuideCard() {
  return <GuideCard id="diario" label="Diário" summary="Seis passos rápidos: feed, botão +, etiquetas, cartões, humor e revisão." steps={DIARIO_STEPS} />;
}
