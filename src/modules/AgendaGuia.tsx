import { GuideCard, GuideSheet, type GuideStep } from './Guia';

/** E43: os 6 passos do guia "Como usar Agenda". */
export const AGENDA_STEPS: GuideStep[] = [
  {
    icon: 'calendar',
    title: 'O calendário',
    text: [
      'A casa da Agenda mostra o mês. Use as setas ou toque no nome do mês para escolher outro.',
      'Os pontinhos mostram o que há no dia: **compromisso**, **tarefa** e **conta a pagar** (de Finanças).',
    ],
  },
  {
    icon: 'calendarCheck',
    title: 'Toque num dia para ver o dia',
    text: [
      'Tocando no dia, você vê tudo dele junto e pode criar um compromisso ou uma tarefa já naquela data.',
      'Para ver hoje, é só tocar no dia de hoje (ele vem marcado).',
    ],
    to: 'Ver o dia de hoje',
    go: 'agenda/hoje',
  },
  {
    icon: 'plus',
    title: 'Crie pelo botão +',
    text: [
      'Na Agenda, o + marca um **compromisso** (data e hora). Em Tarefas, cria uma **tarefa**.',
      'Pelo + do Início também dá para escolher Tarefa ou Compromisso.',
    ],
    to: 'Marcar um compromisso',
    go: 'agenda/novo-compromisso',
  },
  {
    icon: 'tasks',
    title: 'Tarefas',
    text: [
      'Na barra de baixo, à esquerda da casa da Agenda.',
      'Filtre por **Pendentes**, **Hoje e atrasadas** ou **Concluídas**. Toque no círculo para concluir.',
    ],
    to: 'Abrir as tarefas',
    go: 'tarefas',
  },
  {
    icon: 'bell',
    title: '🔔 Me lembrar',
    text: [
      'Tarefas, compromissos e reuniões têm o interruptor **Me lembrar**. Ligado, o aviso vai para o **Google Agenda**, que avisa no celular.',
      'Compromisso: 30 min antes (sem hora, às 9h). Tarefa: às 9h do prazo. Contas avisam pelas Configurações do Google Agenda.',
    ],
  },
  {
    icon: 'list',
    title: 'Próximos',
    text: [
      'Na barra de baixo, à direita da casa da Agenda.',
      'Junta compromissos, tarefas e contas dos **próximos 30 dias**, em ordem. O que tem aviso aparece com 🔔.',
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
  return <GuideCard id="agenda" label="Agenda" summary="Seis passos rápidos: calendário, dia, botão +, tarefas, Me lembrar e Próximos." steps={AGENDA_STEPS} />;
}
