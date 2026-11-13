# Versão PC (PWA no computador)

> Central própria da versão para computador (13/11). Com o app Android (N4), o computador continua usando o **PWA**: por isso a compatibilidade com o PC começa já.
> **Duas versões do mesmo app:** **celular** (barra de baixo, gestos) e **PC** (menu lateral, mouse e teclado). Os dados são os mesmos; muda só o jeito de mostrar e de usar.

## Larguras da tela (regra)
| Largura da janela | Versão | O que aparece |
|---|---|---|
| menos de 900 px | celular | barra de baixo, cabeçalho que some ao rolar, gestos |
| 900 a 1279 px | PC | menu fixo à esquerda + módulo no meio (como hoje; print de 13/11 em ~930 px) |
| 1280 px ou mais | PC larga | menu + módulo + coluna **"Sempre à vista"** à direita (E21) |

- Diminuiu a janela: a coluna da direita **some** antes de apertar o módulo. Nada pode quebrar nem rolar para o lado.
- Hoje o app troca para a versão PC em 900 px (`@media (min-width: 900px)` no CSS). A faixa de 1280 px é nova (E21).

## O que é só do celular (não vale no PC)
- **Esconder as barras ao rolar** (o cabeçalho some ao rolar para baixo e volta ao puxar para cima): no PC fica sempre fixo, e a opção em Personalização só aparece no celular.
- Deslizar o dedo para trocar de aba (E5) e outros gestos de toque: no PC, clicar nas abas.
- Barra de baixo, botão "tocar de novo mostra os favoritos" e tutorial da barra: só celular.
- *A conferir item a item na parte PC1.*

## Partes (propostas, nada aprovado ainda)
- **PC1 · Levantamento (P, só documento):** passar tela por tela em 900, 1280 e 1600 px e listar o que é só do celular, o que quebra e o que falta no PC (atalhos de teclado, passar o mouse, menu de clique direito).
- **PC2 · Regras de largura e celular × PC (P):** a faixa de 1280 px, o cabeçalho sem "esconder ao rolar" no PC e os gestos desligados no PC.
- **PC3 · Coluna "Sempre à vista" (E21, M):** parte 1, calendário com tarefas + Diário fixos; parte 2, escolher com o lápis. Prévia: https://claude.ai/artifact/6ieaisBSfhX9ayDtYcJE9V
- **Depois:** atalhos de teclado (ex.: `N` nova despesa, `/` buscar), instalação do PWA no Windows, janela própria.

## Histórico
- v0.27.1 (C10): coluna central de 980 px no computador.
- 13/11: E21 e esta central criados a partir do print do Mais em ~930 px (menu + conteúdo, sem coluna).

Afeta: layout do app todo (`App.tsx`, CSS), Personalização (opção de esconder ao rolar), Início (`cardLayout.ts`, cartões da coluna), backup.
