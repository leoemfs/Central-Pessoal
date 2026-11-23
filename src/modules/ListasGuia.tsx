import { GuideCard, GuideSheet, type GuideStep } from './Guia';

/** E43: os 6 passos do guia "Como usar Listas". */
export const LISTAS_STEPS: GuideStep[] = [
  {
    icon: 'cart',
    title: 'Listas por categoria',
    text: [
      'As fichas no topo separam as categorias: **Mercado**, **Cozinha**, **Roupas**, **Casa**, **Viagem** e as que você criar.',
      'Cada categoria tem o seu jeito (mercado, compras, receita ou checklist). Lista fixada aparece no Início.',
    ],
  },
  {
    icon: 'plus',
    title: 'Crie pelo botão +',
    text: [
      'O + cria uma **lista nova** ou uma **receita**.',
      'Por último, separado, ficam as **Categorias**: crie, mude a cor ou apague.',
    ],
    to: 'Criar uma lista',
    go: 'listas/nova',
  },
  {
    icon: 'bag',
    title: 'Lista de mercado',
    text: [
      'Escreva na caixa **Adicionar** (ex.: "2 kg tomate"). Ao marcar, o item desce para **No carrinho** e o app pergunta quanto custou.',
      'No fim, **Concluir compra** lança a despesa em Finanças.',
    ],
  },
  {
    icon: 'pot',
    title: 'Receitas na Cozinha',
    text: [
      'Mude as **porções** e as quantidades se ajustam sozinhas.',
      'Um toque manda os ingredientes para a **lista de mercado**.',
    ],
    to: 'Ver as receitas',
    go: 'listas/cozinha',
  },
  {
    icon: 'receipt',
    title: 'Compras',
    text: [
      'Na barra de baixo, à esquerda da casa de Listas.',
      'Mostra as compras concluídas, com total e loja. Tocar numa compra abre a despesa em Finanças.',
    ],
    to: 'Abrir as compras',
    go: 'compras',
  },
  {
    icon: 'tag',
    title: 'Preços',
    text: [
      'Na barra de baixo, à direita da casa de Listas.',
      'Anote preços no mercado e compare por unidade (R$/kg, R$/L). O cartão **Sem preço** junta o que falta preço.',
    ],
    to: 'Abrir os preços',
    go: 'precos',
  },
];

export function ListasGuideSheet({ onClose }: { onClose: () => void }) {
  return <GuideSheet id="listas" label="Listas" steps={LISTAS_STEPS} onClose={onClose} />;
}

/** Cartão da 1ª vez em Listas (arquivado em `settings.guidesOff`). */
export function ListasGuideCard() {
  return <GuideCard id="listas" label="Listas" summary="Seis passos rápidos: categorias, botão +, mercado, receitas, Compras e Preços." steps={LISTAS_STEPS} />;
}
