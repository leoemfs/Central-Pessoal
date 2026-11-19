# Como usar o app (E43): central de ajuda

Pedido do Leonardo em 18/11; prévia aprovada em 19/11: https://claude.ai/artifact/6DAKtA79Nf9fD9mb3qa72A

## A ideia
O atalho da gaveta "Como usar a barra" virou **"Como usar o app"** (`#/ajuda`), uma central de ajuda única:
- **No topo:** o tutorial da barra (o de sempre, `openTutorial` em `src/modules/Montagem.tsx`).
- **Embaixo:** **"Guia de cada módulo"**: ícone do módulo, número de passos e o selo **Novo** ou **Visto**. Só aparecem módulos à vista (os guardados não).
- **Primeira vez em cada módulo:** um cartão **"Como usar <módulo>"** no topo da casa do módulo, com "Ver o passo a passo" e o ícone de **arquivar**. Ao arquivar (ou depois de abrir o guia), o cartão some.
- **Guia também no ⋮ do módulo:** "Como usar <módulo>", logo antes da busca (`usePageMenu` em `src/PageMenu.tsx`).
- **O guia:** uma janela passo a passo, igual à de Estudos (`TutorialSheet` em `src/modules/estudos/Tutorial.tsx`): "1 de N", Voltar/Próximo, um desenho ou ícone por passo e um atalho "Abrir <tela> ›" para a tela daquele passo.

## Como está feito (parte 1, v0.146.0, PR #254)
- `src/modules/Ajuda.tsx`: a tela da central.
- `src/guias.ts` (+ `guias.test.ts`): a lista `GUIDES` (`{ id, label, steps }`), `visibleGuides()` e `markSeen()`.
- `settings.guidesSeen: string[]` (padrão `[]` em `normalize()`): guias já abertos ("Visto").
- Estudos já tem tudo: guia (6 passos), cartão da 1ª vez (`TutorialCard`, com arquivar em `study.tutorialOff`) e "Como usar Estudos" no ⋮. Abrir o guia marca "Visto".
- Gaveta: atalho id `barra` em `src/modules/Mais.tsx` (o id ficou igual para não bagunçar a ordem salva).

## O que falta (uma parte por vez, tamanho P cada)
Para cada módulo:
1. **Guia** com os passos (texto curto, em português simples), num componente genérico reaproveitável. Ao fazer Finanças, transformar o `TutorialSheet` de Estudos num `GuideSheet` comum que recebe os passos.
2. **Cartão da 1ª vez** na casa do módulo, com arquivar. Guardar quem foi arquivado num campo novo de `settings` (ex.: `guidesOff: string[]`, com padrão em `normalize()`), em vez de um campo por módulo.
3. **"Como usar <módulo>"** no ⋮ da casa do módulo (antes da busca).
4. Entrar em `GUIDES` (`src/guias.ts`) para aparecer na central.

Ordem combinada: **Finanças** primeiro, depois Diário, Agenda, Listas, Núcleo, Carreira, Objetivos, Saúde, Notas, Você.

### Passos sugeridos para Finanças (6)
1. **As quatro abas:** Despesas, Receitas, Cartões e Caixinhas; o mês fica logo abaixo (tocar no mês abre "Escolher mês").
2. **Botão +:** lança despesa (conta, compra, parcela) ou receita; por último, Categorias.
3. **Orçamento** (ferramenta à esquerda na barra): limite por categoria e aviso ao passar de 80%.
4. **Relatórios** (ferramenta à direita): para onde foi o dinheiro no mês e nos últimos 6 meses.
5. **Cartões e faturas:** compras no cartão entram na fatura do mês certo; tocar na fatura para ver e pagar.
6. **Caixinhas:** guardar dinheiro para um objetivo, com depósitos e retiradas.

## Regras do app que valem aqui
- Barra de cima: ‹ · caminho · ⋮ (ver `CLAUDE.md`). Nada de botão de ajuda solto no topo.
- Texto simples e curto; cada passo com no máximo 2 frases.
- Antes do PR: `npm test`, `npm run build` e Playwright no Pixel 7 (central, guia, cartão, ⋮ e "Visto").
