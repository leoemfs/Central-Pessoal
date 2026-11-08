# Correção: compra no cartão "some" da fatura

> **Status: A CORRIGIR.** Item C1 da Central (`docs/CENTRAL.md`).

## O que o usuário viu
Cadastrou um cartão novo e lançou uma despesa nele. O cartão aparece em Cartões e o **limite diminui**, mas a fatura mostra **R$ 0,00** e a compra não entra nas contas do mês.

## Causa
- A compra vai para a fatura certa: se foi feita no dia do fechamento ou depois, ela cai na **próxima** fatura (ex.: comprou em 06/11, o cartão fecha dia 5 → fatura que vence em dezembro).
- Mas a aba **Cartões** mostra sempre a fatura que **vence no mês escolhido no topo** (novembro). Essa fatura está vazia, então aparece R$ 0,00.
- O limite (`cardUsed`) soma **todas** as faturas não pagas, por isso ele diminui.
- Na aba **Mês**, a fatura só aparece no mês em que vence (dezembro), então em novembro a compra "não é contabilizada".
- Nada se perde: os dados estão certos. O problema é **onde a tela procura**.

## Correção
0. **Perguntar em qual fatura a compra entra** (pedido do usuário, o mais importante):
   - ao lançar uma despesa no cartão, o formulário mostra **"Entra na fatura de:"** com botões, ex.: **novembro (vence 10/11)** e **dezembro (vence 10/12)**;
   - já vem marcada a fatura calculada pela data, mas dá para trocar;
   - motivo: quem acabou de cadastrar o cartão costuma lançar compras que **já estão na fatura atual** (ex.: cadastrou no dia 7 uma compra que o banco já pôs na fatura que está fechando). O app não pode empurrar sozinho para a próxima;
   - parcelado: a escolha vale para a 1ª parcela, e as outras seguem mês a mês;
   - editar a despesa também permite trocar a fatura;
   - dados: `addExpense`/`editExpense` aceitam `invoiceMonth` escolhido (opcional). Sem a escolha, continua como hoje.
1. **Cartão na aba Cartões:**
   - mostra a **fatura aberta** (a que está recebendo as compras agora), com o valor e "fecha em 05/12 · vence em 10/12";
   - se a fatura do mês escolhido tiver valor e for outra, mostra as duas: "Vence em novembro: R$ X" e "Fatura aberta: R$ Y";
   - tocar no cartão abre a fatura aberta, com setas para ver as outras.
2. **Ao salvar uma compra no cartão:** aviso "Entra na fatura de dezembro (vence 10/12)".
3. **Na aba Mês:** quando houver compras de cartão feitas no mês que caem em fatura futura, uma linha discreta: "No cartão este mês: R$ Y (próximas faturas)", que abre a fatura.
4. **No detalhe da despesa:** deixar claro "Fatura de dezembro · vence 10/12" (com link, como já existe).

## Testes
- Regra: compra com fatura escolhida (atual ou próxima), parcelada começando na escolhida, editar trocando a fatura; o limite e a fatura somam certo.
- Regra: compra no dia do fechamento e depois dele cai na fatura seguinte; antes dele, na fatura atual (já existe, conferir).
- Nova regra `openInvoiceMonth(card, hoje)` com testes: antes do fechamento, no dia e depois; meses curtos (dia 31); vencimento antes do fechamento.
- No navegador (celular): cadastrar cartão novo, lançar compra hoje com fechamento já passado e com fechamento por vir, e ver valor no cartão, no aviso, na aba Mês e na fatura.
