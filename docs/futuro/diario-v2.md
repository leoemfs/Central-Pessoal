# M44 Diário v2

Aprovado em 18/11 ("aprovado... vamos fazer"). Tamanho **M**, em 3 partes.

Prévia navegável: https://claude.ai/artifact/2oKRSzJde2ihqnMbp4hLPh

## Decisões (18/11)
- **Barra de baixo igual:** Início · Humor · **Diário** · Revisão · Favoritos.
- **Fichas de etiqueta** no lugar da linha "Mais recentes / Mais antigos": Todas + as etiquetas com registro no mês, com a contagem, numa linha com rolagem para o lado (`src/hscroll.ts`). Mês + fichas formam um bloco preso no topo (`PageHeader` com `actions`/`tabs`).
- **Ordem no ⋮** (`usePageMenu`): Personalizar cartões · Mais antigos primeiro (vira "Mais recentes primeiro" quando ligado) · Buscar no diário por último.
- **Nome do mês** continua abrindo o histórico por ano e mês (o de hoje).
- **Cartão "Esta semana"** no topo do Diário: bolinhas dos dias da semana com registro, sequência atual e "X de N no seu ritmo" (ritmo do Diário das Configurações). Botão "Ver na Revisão".
- **Cartão "Neste dia":** registros de 1 mês, 6 meses e 1 ano atrás, na mesma data. Só aparece se houver. "Fechar por hoje" esconde até amanhã. Tocar abre o texto inteiro.
- **Personalizar cartões** (no ⋮): ligar/desligar "Esta semana" e "Neste dia".
- **Pergunta do dia** no topo do formulário do + (só em registro novo): muda a cada dia; "Outra pergunta" troca; "Responder" põe a pergunta no título. O registro guarda a pergunta respondida (`prompt`), mostrada em letra verde pequena no feed.
- **Revisão:** em cima, o **calendário do mês** (dias com registro em verde; cada linha é uma semana, a semana da revisão marcada; ‹ › troca o mês) com dias escritos no mês, dias seguidos e recorde. Tocar numa semana muda a revisão de baixo, que continua igual à de hoje. A seta da semana da Revisão sai (a escolha é pelo calendário).
- A sequência só conta; dia sem registro fica cinza, sem aviso de falta.

## Dados novos (com padrão em `normalize()`)
- `journal[].prompt: string` (padrão `''`).
- `settings.journalCards: { week: boolean, memories: boolean }` (padrão os dois `true`).
- `settings.journalMemoHiddenOn: string` (data em que "Neste dia" foi fechado; padrão `''`).
- Ordem do feed: `settings.journalOrder: 'recentes' | 'antigos'` (padrão `'recentes'`).

## Partes
1. **M44a** Fichas de etiqueta, ordem no ⋮, Personalizar cartões e pergunta do dia (P a M).
2. **M44b** Cartões "Esta semana" e "Neste dia" (P).
3. **M44c** Calendário do mês na Revisão (P a M).

Regras puras (sequência, recorde, dias da semana, lembranças, pergunta do dia) em `src/journal.ts` com testes em `src/journal.test.ts`.

Afeta: `modules/Diario.tsx`, `modules/Revisao.tsx`, `data.ts` (`normalize`), `PageMenu.tsx` (uso), Busca (procurar também na pergunta), Jornada (missões do diário não mudam).
