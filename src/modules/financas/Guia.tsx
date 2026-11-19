import { GuideCard, GuideSheet, type GuideStep } from '../Guia';

/** E43: os 6 passos do guia "Como usar Finanças". */
export const FIN_STEPS: GuideStep[] = [
  {
    icon: 'wallet',
    title: 'As quatro abas',
    text: [
      'No topo ficam **Despesas**, **Receitas**, **Cartões** e **Caixinhas**. Toque ou arraste para o lado para trocar.',
      'O mês fica logo abaixo das abas: use as setas ou toque no mês para escolher outro.',
    ],
  },
  {
    icon: 'plus',
    title: 'Lance pelo botão +',
    text: [
      'O **+** lança uma despesa (conta, compra ou parcela), uma receita, um cartão ou uma caixinha.',
      'Por último, separado, fica **Categorias**, para criar e arrumar as suas.',
    ],
    to: 'Abrir o +',
    go: 'financas/menu',
  },
  {
    icon: 'gauge',
    title: 'Orçamento',
    text: [
      'Na barra de baixo, à esquerda da casa de Finanças. Defina um limite por categoria.',
      'O app avisa quando o gasto passa de **80%** do limite.',
    ],
    to: 'Abrir o Orçamento',
    go: 'orcamento',
  },
  {
    icon: 'pie',
    title: 'Relatórios',
    text: [
      'Na barra de baixo, à direita da casa de Finanças.',
      'Mostra para onde foi o dinheiro no mês e nos últimos 6 meses.',
    ],
    to: 'Abrir os Relatórios',
    go: 'relatorios',
  },
  {
    icon: 'card',
    title: 'Cartões e faturas',
    text: [
      'Compra no cartão entra sozinha na **fatura do mês certo**, pelo dia de fechamento.',
      'Toque na fatura para ver as compras e marcar como paga.',
    ],
    to: 'Ver os cartões',
    go: 'financas/cartoes',
  },
  {
    icon: 'piggy',
    title: 'Caixinhas',
    text: [
      'Guarde dinheiro para um objetivo, como uma viagem ou uma reserva.',
      'Cada caixinha tem **depósitos** e **retiradas**, e mostra quanto falta para a meta.',
    ],
    to: 'Ver as caixinhas',
    go: 'financas/caixinhas',
  },
];

export function FinGuideSheet({ onClose }: { onClose: () => void }) {
  return <GuideSheet id="financas" label="Finanças" steps={FIN_STEPS} onClose={onClose} />;
}

/** Cartão da 1ª vez em Finanças (arquivado em `settings.guidesOff`). */
export function FinGuideCard() {
  return <GuideCard id="financas" label="Finanças" summary="Seis passos rápidos: abas, botão +, orçamento, relatórios, cartões e caixinhas." steps={FIN_STEPS} />;
}
