import { GuideCard, GuideSheet, type GuideStep } from './Guia';

/** E43: os 6 passos do guia "Como usar Agenda". */
export const AGENDA_STEPS: GuideStep[] = [
  {
    icon: 'calendar',
    title: 'Calendário e Tarefas',
    text: [
      'As duas abas no topo: **Calendário** mostra o mês; **Tarefas** mostra a lista do que fazer.',
      'O mês fica abaixo do título: use as setas ou toque nele para escolher outro.',
    ],
  },
  {
    icon: 'plus',
    title: 'Crie pelo botão +',
    text: [
      'No Calendário, o + marca um **compromisso** (data e hora). Na aba Tarefas, cria uma **tarefa**.',
      'Pelo + do Início também dá para escolher Tarefa ou Compromisso.',
    ],
    to: 'Marcar um compromisso',
    go: 'agenda/novo-compromisso',
  },
  {
    icon: 'calendarCheck',
    title: 'Toque num dia',
    text: [
      'Os pontinhos mostram o que há no dia: **compromisso**, **tarefa** e **conta a pagar** (de Finanças).',
      'Tocando no dia, você vê tudo junto e pode criar um compromisso ou uma tarefa já naquela data.',
    ],
  },
  {
    icon: 'tasks',
    title: 'Tarefas',
    text: [
      'Filtre por **Pendentes**, **Hoje e atrasadas** ou **Concluídas**. Toque no círculo para concluir.',
      'Cada tarefa pode ter data, prioridade e etiqueta.',
    ],
    to: 'Abrir as tarefas',
    go: 'agenda/tarefas',
  },
  {
    icon: 'sun',
    title: 'Hoje',
    text: [
      'Na barra de baixo, à esquerda da casa da Agenda.',
      'Abre o dia de hoje direto: compromissos, tarefas e contas.',
    ],
    to: 'Ver o dia de hoje',
    go: 'agenda/hoje',
  },
  {
    icon: 'list',
    title: 'Próximos',
    text: [
      'Na barra de baixo, à direita da casa da Agenda.',
      'Junta compromissos, tarefas e contas dos **próximos 30 dias**, em ordem.',
    ],
    to: 'Abrir os Próximos',
    go: 'proximos',
  },
];

export function AgendaGuideSheet({ onClose }: { onClose: () => void }) {
  return <GuideSheet id="agenda" label="Agenda" steps={AGENDA_STEPS} onClose={onClose} />;
}

/** Cartão da 1ª vez na Agenda (arquivado em `settings.guidesOff`). */
export function AgendaGuideCard() {
  return <GuideCard id="agenda" label="Agenda" summary="Seis passos rápidos: abas, botão +, dias, tarefas, Hoje e Próximos." steps={AGENDA_STEPS} />;
}
