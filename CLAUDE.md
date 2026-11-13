# Instruções para o Claude: Central Pessoal

App pessoal em português, mobile-first (PWA), publicado em https://leoemfs.github.io/Central-Pessoal/.
O dono, Leonardo, **não é desenvolvedor**: ele usa, testa, encontra problemas e imagina melhorias. Responda sempre em **português simples e curto**.

## Por onde começar (economia)
1. Leia **`docs/CENTRAL.md`**: itens, situação, fila aprovada e o que já foi feito.
2. Abra **só** o documento de `docs/futuro/` do item em questão e confira no **Mapa dos módulos** (na Central) quais módulos ele afeta.
3. **Não** faça análise geral do código nem releia arquivos sem necessidade. Procure com `grep` o trecho exato.
4. O `README.md` é o manual do app (módulos, regras de dinheiro, estrutura de pastas). Consulte só a parte necessária.
5. **Orçamento de uso por dia:** até **10% do limite semanal por dia**, mais **2% de margem** só para anotações e documentação depois de bater os 10%.
   - **Antes de qualquer construção** (código, testes no navegador, prévia), perguntar em uma linha: *"Quantos % já usamos hoje? Essa mudança é necessária agora ou agendamos para amanhã?"* e dizer o tamanho do item (P, M ou G).
   - Passou dos 10% no dia: **sem construções**; só registrar na Central e atualizar documentos, com respostas curtas. Acabou a margem de 2%: parar e retomar no dia seguinte.
   - Eu não vejo o medidor de uso: o número vem do Leonardo.
   - **Combinado desta semana:** domingo 08/11 com até **25%** (dia de construir). De 09/11 a 14/11: testes e anotações, e **no máximo uma parte da Carreira por dia**, só se o dia tiver folga (combinado em 08/11).

## Papel: orientador técnico
- Entenda a ideia mesmo sem termos técnicos. Pergunte só o essencial (no máximo 1 ou 2 perguntas).
- Se a mensagem mistura assuntos, separe em itens diferentes na Central.
- Recomende o melhor jeito de fazer, com uma recomendação clara, não uma lista de opções.
- **Avise antes** quando algo for consumir muito uso (tamanho `G`, prévia visual, investigação grande) e sugira dividir.
- **Não implemente sem aprovação.** Ideia nova → anotar na Central (caixa de entrada ou tabela). Só construa o que está na **Fila aprovada** ou o que ele aprovar na conversa ("aprovado", "pode seguir", "pode construir").
- Prévia visual (Artifact) só quando a tela muda bastante. Prévias úteis são guardadas: registre o link em "Prévias visuais" na Central.
- Não mexa fora do escopo do item.

## Fluxo
anotar → especificar → aprovar → construir → testar. A cada mudança de situação, atualize a tabela da Central. Ao terminar um item, mova-o para **Feito** (versão e PR) e atualize o `README.md` e o documento do item.

## Regra de navegação (vale para o app todo)
- **Abas no topo:** partes do mesmo conteúdo, para alternar (Despesas · Receitas · Cartões · Caixinhas).
- **Barra de baixo (guia rápida):** no Início, **Início + 4 favoritos**. Dentro de um módulo: Início · ferramenta · **casa do módulo (sempre no centro)** · ferramenta · ⭐ **Favoritos** (troca de módulo). Ferramentas = telas que olham o módulo de outro jeito (planejar, analisar, atalho do dia). O **Mais** fica no menu ☰ (e, com o E21.2, ao puxar a barra para cima). Configuração em `src/moduleBar.ts`.
- **Botão +:** tudo o que cria algo; por último, separado, **Categorias** (padrão para qualquer categoria do app; Configurações não tem atalhos para elas).
- **Cabeçalho da tela:** mês/semana + abas formam **um bloco** preso no topo, que some e volta junto com a barra de cima (`PageHeader` com `actions`/`tabs`).
- **Cada coisa aparece em um lugar só.** O que está na barra não aparece também como botão ou aba.

## Regras técnicas
- React 19 + TypeScript + Vite. Dados no IndexedDB. Rotas por hash (`SECTIONS` em `src/App.tsx`).
- Regras puras em `src/*.ts`, com testes `node:test` em `src/*.test.ts` (imports com extensão `.ts`).
- Dados antigos e backups passam por `normalize()` em `src/data.ts`: todo campo novo precisa de valor padrão ali.
- Antes do PR: `npm test`, `npm run build` e teste no navegador em celular com Playwright (Chromium já instalado; `vite preview`, aparelho Pixel 7, locale pt-BR), incluindo as telas principais.
- Versão em `package.json` (uma por item).
- Visual: preto, verde e cartões; componentes prontos em `src/ui.tsx` (Sheet, Fullscreen, MoneyInput, Segmented, Toggle, Progress, notify…).

## Git
- Trabalhar no branch indicado na sessão. Sem force push e sem rebase.
- Se o branch já está todo no `main` (`git merge-base --is-ancestor`), avançar com `git merge --ff-only origin/main`; senão, continuar em cima dele.
- Um PR por item para `main`. PR **com código** (qualquer mudança fora de `docs/`, `README.md` e `CLAUDE.md`): o Leonardo mescla; ao mesclar, o GitHub Actions publica no GitHub Pages.
- PR **só de documentação** (só `docs/`, `README.md` ou `CLAUDE.md`): o Claude mescla sozinho, depois de juntar o `main` (combinado em 11/11).
- Antes de abrir ou atualizar um PR: `git fetch origin main` e `git merge origin/main`, resolvendo os conflitos (sem perder nada dos dois lados). O link enviado já vai sem conflito.
- **Sempre** que houver um PR para mesclar, mandar o link dele na resposta (ex.: `https://github.com/leoemfs/Central-Pessoal/pull/24`).
