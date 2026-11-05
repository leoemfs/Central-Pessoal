# Caixinhas (Finanças)

> **Status: IMPLEMENTADO na v0.13** (a parte de Finanças; a parte da Jornada continua para depois). Diferenças em relação a este texto:
> - a missão "dia de guardar" aparece no Início ("Dia de guardar") e na própria aba, mas ainda não na Agenda nem na Revisão semanal;
> - a meta é opcional (caixinha sem meta só soma);
> - ao comemorar os marcos (25/50/75/100%) o app mostra um aviso; baús e títulos ficam para a Jornada;
> - o balanço do mês fica em Finanças › Receitas: linhas "Caixinhas" (o que os planos pedem e o que foi guardado) e "Livre para usar";
> - código: `src/boxes.ts` (regras, com testes em `boxes.test.ts`) e `src/modules/financas/Caixinhas.tsx` (telas).

Metas de dinheiro guardado, como a "caixinha" dos bancos digitais. Ficam em **Finanças**, numa 4ª aba (Despesas · Receitas · Cartões · Caixinhas), e funcionam **com ou sem a Jornada**.

## Como funciona
- **Caixinha:** nome, meta em R$, prazo opcional e um **plano** ("R$ 100 toda semana", "R$ 200 todo mês").
- **Movimentos:** "Guardar" e "Tirar", com data e valor. O saldo é a soma.
- **O app não move dinheiro.** Ele só registra o que você guardou no banco ou na poupança.
- **No dia do plano** aparece a missão "Guardar R$ 100 em Viagem" no Início, na Agenda e na Revisão semanal. Ao marcar, você confirma o valor de verdade, que pode ser diferente do plano.
- **Balanço do mês:** guardar não é gasto. Receitas − despesas − guardado = livre para usar.
- **Ao tirar, o app pergunta o motivo:**
  - **Realizei o objetivo:** a caixinha vira "realizada" e fica no histórico com uma medalha.
  - **Emergência:** registra, mostra o novo percentual e mantém o plano.
  - **Outro:** só registra.

## Com a Jornada
- **Guardar na data do plano:** +20 XP, +10 de ouro e +3 de Disciplina. A recompensa é pelo **hábito**, e não pelo valor: R$ 20 e R$ 2.000 valem o mesmo.
- **Guardar fora do plano** conta para a meta, mas não dá XP. Isso evita ganhar pontos registrando e apagando.
- **Marcos de cada caixinha**, que valem **uma vez por caixinha**:
  - 25% e 75%: baú de bronze;
  - 50%: baú de prata;
  - 100%: baú dourado e o título **Poupadora/Poupador**.
- **Tirar nunca tira** XP, ouro ou itens. Tirar com "Realizei o objetivo" é a maior conquista: comemoração, título **Realizadora/Realizador** e +200 de ouro.
- **Na cena da Jornada,** um pote de vidro enche de moedas conforme a caixinha principal chega perto da meta. Tocar nele abre as caixinhas.
- **Campanha:** no Mercado de Ouro, os objetivos são criar a caixinha e guardar nas datas combinadas. O chefe, Goblin dos Juros, provoca: "tira da caixinha e devolve depois…".
- **Nomes na tela:** **ouro** é a moeda do jogo; **R$** é dinheiro de verdade. A tela sempre separa os dois.

## Dados
```ts
interface SavingsBox {
  id: string; name: string; target: number; deadline: string | null;
  plan: { amount: number; every: 'semana' | 'mes'; startDate: string } | null;
  moves: { id: string; date: string; amount: number; kind: 'plano' | 'extra' | 'retirada'; reason: 'realizei' | 'emergencia' | 'outro' | null }[];
  marks: number[];          // marcos já alcançados (25, 50, 75, 100) — cada um só uma vez
  realizedAt: string | null;
  createdAt: string;
}
```
