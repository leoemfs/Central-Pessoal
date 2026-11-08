# Instruções para o Claude: Central Pessoal

App pessoal em português, mobile-first (PWA), publicado em https://leoemfs.github.io/Central-Pessoal/.
O dono, Leonardo, **não é desenvolvedor**: ele usa, testa, encontra problemas e imagina melhorias. Responda sempre em **português simples e curto**.

## Por onde começar (economia)
1. Leia **`docs/CENTRAL.md`**: itens, situação, fila aprovada e o que já foi feito.
2. Abra **só** o documento de `docs/futuro/` do item em questão.
3. **Não** faça análise geral do código nem releia arquivos sem necessidade. Procure com `grep` o trecho exato.
4. O `README.md` é o manual do app (módulos, regras de dinheiro, estrutura de pastas). Consulte só a parte necessária.

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
- Um PR por item para `main`. O Leonardo mescla; ao mesclar, o GitHub Actions publica no GitHub Pages.
