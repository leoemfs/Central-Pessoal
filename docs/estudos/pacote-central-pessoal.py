import json, sys
F = {
 'mdn_web': ('MDN: Aprendendo desenvolvimento web', 'https://developer.mozilla.org/pt-BR/docs/Learn', 'curso', 'Base de HTML, CSS e JavaScript, em português.'),
 'mdn_js': ('MDN: Guia de JavaScript', 'https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide', 'doc', ''),
 'ts': ('TypeScript: Handbook', 'https://www.typescriptlang.org/docs/handbook/intro.html', 'doc', 'Documentação oficial (inglês).'),
 'ts5': ('TypeScript para quem já sabe JavaScript', 'https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html', 'doc', ''),
 'react': ('React: Aprenda React', 'https://pt-br.react.dev/learn', 'curso', 'Tutorial oficial, em português.'),
 'react_state': ('React: Estado, a memória de um componente', 'https://pt-br.react.dev/learn/state-a-components-memory', 'doc', ''),
 'vite': ('Vite: Guia', 'https://vite.dev/guide/', 'doc', ''),
 'npm': ('npm: o que é o package.json', 'https://docs.npmjs.com/cli/v10/configuring-npm/package-json', 'doc', ''),
 'idb': ('MDN: Usando o IndexedDB', 'https://developer.mozilla.org/pt-BR/docs/Web/API/IndexedDB_API/Using_IndexedDB', 'doc', ''),
 'hash': ('MDN: hashchange', 'https://developer.mozilla.org/pt-BR/docs/Web/API/Window/hashchange_event', 'doc', ''),
 'pwa': ('web.dev: Aprenda PWA', 'https://web.dev/learn/pwa', 'curso', 'Curso gratuito do Google (inglês).'),
 'sw': ('MDN: Service Worker API', 'https://developer.mozilla.org/pt-BR/docs/Web/API/Service_Worker_API', 'doc', ''),
 'manifest': ('MDN: Manifesto de aplicativo web', 'https://developer.mozilla.org/pt-BR/docs/Web/Manifest', 'doc', ''),
 'git': ('Pro Git (livro gratuito)', 'https://git-scm.com/book/pt-br/v2', 'livro', 'Capítulos 1 a 3 bastam para começar.'),
}
src = lambda *k: [F[x][1] for x in k]

PROMPT = "\n## Prompt para estudar com IA\n> {}\n"
def page(serve, no_app, ideias, exercicio, prompt):
    md = "## Para que serve\n" + serve + "\n## No Central Pessoal\n" + no_app + "\n## Ideias-chave\n" + "\n".join("- " + i for i in ideias) + "\n## Exercício\n" + exercicio + PROMPT.format(prompt)
    return md

topicos = [
 ("Mapa do app: o que é o Central Pessoal por dentro", page(
   "Ter a visão de cima antes de mergulhar em cada peça. Quem entende o mapa sabe onde procurar quando algo quebra.",
   "O Central Pessoal é um **site que funciona como app** (PWA). Não tem servidor próprio: tudo roda no navegador do celular e os dados ficam **no aparelho** (IndexedDB), com cópia opcional no Google Drive.\n\nO caminho de uma ação, do toque até ficar salvo:\n1. Você toca num botão de uma tela (`src/modules/...`).\n2. A tela chama uma **regra pura** (`src/finance.ts`, `src/habits.ts`...) que calcula o resultado.\n3. O resultado vira o novo estado em `src/store.tsx` (`update`).\n4. O `store` grava tudo no IndexedDB (`src/db.ts`) com um pequeno atraso, para agrupar mudanças seguidas.\n5. O React redesenha só o que mudou.\n\nPublicação: o código fica no GitHub; ao mesclar um PR, o GitHub Actions (`.github/workflows/deploy.yml`) monta o app e publica no GitHub Pages.",
   ["Sem servidor: menos custo e mais privacidade, mas tudo precisa caber no aparelho.", "Telas (React) e regras (TypeScript puro) ficam separadas.", "Um único objeto de dados (`AppData`, em `src/types.ts`) guarda o app inteiro.", "Cada mudança vira uma versão nova (`package.json`) e um PR."],
   "Abra o mapa mental \"Arquitetura do Central Pessoal\" deste notebook e acrescente um ramo com o caminho de **uma** ação que você usa todo dia (ex.: marcar um hábito). Escreva os 5 passos com as suas palavras.",
   "Explique, como para um iniciante, o caminho de um toque num botão até o dado ficar salvo num app React que guarda tudo no IndexedDB, sem servidor. Use um exemplo de lista de tarefas e me faça 3 perguntas no fim para eu checar se entendi.")),
 ("HTML, CSS e JavaScript: a base de tudo", page(
   "Todo app web é feito dessas três coisas: **HTML** diz o que existe na tela, **CSS** diz como fica, **JavaScript** diz o que acontece.",
   "- O HTML é quase todo gerado pelo React a partir de JSX (o \"HTML dentro do JavaScript\" dos arquivos `.tsx`). O único HTML escrito à mão é o `index.html`.\n- Todo o visual está em `src/styles.css`: cores como variáveis (`--accent`, `--bg`), temas claro e escuro e classes como `.card` e `.btn`.\n- O JavaScript é escrito em **TypeScript** (próximo tópico) e o Vite transforma em JavaScript comum.",
   ["Variáveis de CSS (`--accent`) permitem trocar a cor do app inteiro de uma vez (Configurações › Aparência).", "Flexbox e grid organizam os cartões e as barras.", "Eventos (`click`, `pointerdown`) são a ponte entre o toque e o código."],
   "No computador, abra o app, aperte F12 e, na aba Elements, encontre um `.card`. Mude a cor de fundo ali mesmo e veja o efeito (nada é salvo). Depois procure a mesma classe em `src/styles.css` no GitHub.",
   "Me dê um mini-projeto de 30 minutos para praticar HTML, CSS e JavaScript juntos: um cartão com um botão que conta toques. Explique cada linha e proponha 2 variações para eu fazer sozinho.")),
 ("TypeScript: tipos que evitam erros", page(
   "TypeScript é JavaScript com **tipos**: você diz o formato dos dados e o editor avisa antes de o erro chegar ao celular.",
   "- `src/types.ts` descreve todos os dados do app: `Expense` (despesa), `Habit` (hábito), `StudyCycle` (ciclo)... e o `AppData`, que junta tudo.\n- `npm run build` roda `tsc --noEmit` antes de montar o app: se um tipo não bate, o build para.\n- Os testes (`src/*.test.ts`) rodam direto no Node com os tipos removidos.",
   ["`interface` descreve a forma de um objeto.", "Tipos unidos: `'afazer' | 'andando' | 'feito'` só aceita esses 3 textos.", "`null` explícito (`dueDate: string | null`) obriga a tratar o caso vazio.", "Os tipos não existem no app publicado: servem para quem escreve o código."],
   "Abra `src/types.ts` e encontre a `interface Habit`. Liste 5 campos e o que cada um guarda. Depois responda: por que `archivedAt` pode ser `null`?",
   "Sou iniciante. Pegue esta interface do meu app e explique campo por campo, depois crie 3 exemplos de objetos válidos e 2 inválidos, dizendo o erro que o TypeScript daria: [cole aqui a interface Habit de src/types.ts]")),
 ("React: componentes e estado", page(
   "React monta a tela a partir de **componentes** (funções que devolvem JSX) e redesenha sozinho quando o **estado** muda.",
   "- Cada tela é um componente: `Dashboard` (Início), `Financas`, `Diario`...\n- Peças reaproveitadas ficam em `src/ui.tsx`: `Sheet` (janela de baixo), `Fullscreen`, `Toggle`, `MoneyInput`, `notify` (aviso rápido).\n- O estado do app inteiro mora no `DataProvider` (`src/store.tsx`); as telas usam `useStore()` para ler `data` e chamar `update(...)`.\n- Estado só da tela (ex.: uma janela aberta) usa `useState`.",
   ["Componente = função que recebe `props` e devolve JSX.", "`useState` guarda um valor e redesenha quando ele muda.", "`useEffect` roda algo depois de desenhar (ex.: medir, ouvir eventos).", "`useMemo` evita recalcular contas pesadas a cada desenho.", "Nunca mude o estado direto: crie um objeto novo (`{ ...d, tasks: [...] }`)."],
   "Abra `src/ui.tsx` e encontre o componente `Pill`. Explique o que ele recebe e o que devolve. Depois procure no projeto (lupa do GitHub) 3 telas que usam `<Pill`.",
   "Explique `useState`, `useEffect` e `useMemo` com exemplos de um app de hábitos (marcar hoje, contar a sequência, salvar). Para cada um, mostre um erro comum de iniciante e como corrigir.")),
 ("Vite e npm: rodar, testar e montar o app", page(
   "O **npm** instala as bibliotecas e roda os comandos do projeto. O **Vite** liga o app no computador enquanto você programa e monta a versão final para publicar.",
   "- `package.json` lista as dependências (React, Tiptap do editor de Estudos) e os comandos:\n- `npm run dev`: app no computador, atualiza a cada mudança salva.\n- `npm test`: roda os testes das regras (`node --test`).\n- `npm run build`: confere os tipos e gera a pasta `dist/`, que vai para o GitHub Pages.\n- `vite.config.ts` usa `base: './'`, para o app funcionar dentro da subpasta `/Central-Pessoal/`.\n- A `version` do `package.json` muda a cada item entregue (ex.: 0.62.0).",
   ["`dependencies` vão para o app; `devDependencies` só ajudam a programar.", "`package-lock.json` trava as versões exatas.", "Versão semântica: 0.62.1 = ajuste; 0.63.0 = item novo."],
   "Instale o Node.js no computador, clone o projeto (`git clone`), rode `npm install` e `npm run dev`. Abra o endereço que aparecer e mude um texto da tela de Início para ver a atualização ao vivo.",
   "Vou rodar um projeto React + Vite pela primeira vez no Windows. Me guie passo a passo, do zero (instalar o Node, clonar do GitHub, instalar e rodar), dizendo o que devo ver na tela em cada passo e o que fazer se der erro.")),
 ("Organização do código: regras puras e telas", page(
   "Separar **o que o app calcula** de **como ele mostra** deixa o código testável e fácil de mudar sem quebrar o resto.",
   "- Regras puras em `src/*.ts`: `finance.ts` (faturas, parcelas), `habits.ts` (sequências), `boxes.ts` (caixinhas), `estudos.ts`, `mapas.ts`... Recebem dados e devolvem dados, sem tela.\n- Cada regra tem testes em `src/*.test.ts` (mais de 260 hoje).\n- Telas em `src/modules/`, uma pasta ou arquivo por módulo.\n- O **Mapa dos módulos** (em `docs/CENTRAL.md`) diz quem usa o quê, para mudar um módulo sem quebrar os outros.",
   ["Função pura: mesma entrada, mesma saída, sem efeito escondido.", "Teste = um exemplo com a resposta certa conferida sozinha.", "Quando um bug aparece, primeiro escreva o teste que falha; depois corrija."],
   "Abra `src/boxes.test.ts`, escolha um teste e explique em 3 frases o que ele confere. Depois invente um caso que ainda não está testado.",
   "Mostre com um exemplo simples (calcular o total de uma fatura de cartão) a diferença entre misturar regra e tela e separar a regra numa função pura com teste usando node:test. Termine com um exercício para eu fazer.")),
 ("Dados no aparelho: IndexedDB, normalize e backup", page(
   "Guardar os dados **no próprio celular**, sem servidor, e garantir que dados antigos sempre abram nas versões novas.",
   "- `src/db.ts` grava no **IndexedDB** (um banco de dados do navegador). Se falhar, usa uma cópia de reserva no `localStorage`.\n- `src/store.tsx` salva com um pequeno atraso para agrupar mudanças seguidas (ex.: digitação).\n- `src/data.ts` tem o `normalize()`: todo dado lido (do aparelho, de um backup ou da nuvem) passa por ele e ganha valores padrão para campos novos. **Regra do projeto: todo campo novo precisa de padrão ali.**\n- O backup é o mesmo objeto `AppData` em arquivo `.json`.",
   ["IndexedDB guarda objetos grandes e funciona offline.", "Migração: quando o formato muda, o `normalize()` converte o antigo sem perder nada.", "Backup em arquivo + cópia no Drive = duas redes de segurança."],
   "Em Configurações › Backup, exporte um backup e abra o arquivo no computador. Encontre a parte `study` e localize um ciclo seu. Repare que é o mesmo formato de `StudyCycle` em `src/types.ts`.",
   "Explique o IndexedDB para um iniciante comparando com o localStorage. Depois explique por que um app sem servidor precisa de uma função de normalização ao ler dados antigos, com um exemplo de campo novo sendo adicionado.")),
 ("Rotas por hash e navegação", page(
   "Trocar de tela sem recarregar a página e permitir que o voltar do celular funcione.",
   "- O endereço depois do `#` diz a tela: `#/financas/nova`, `#/estudos/mapa/123`.\n- `src/router.ts` lê o hash e avisa o app quando ele muda (`hashchange`).\n- `SECTIONS` em `src/App.tsx` liga cada caminho à sua tela.\n- `src/navStack.ts` guarda a trilha para o voltar subir um nível (Orçamento → Finanças → Início).\n- Janelas (`Sheet`, `Fullscreen`) fecham com o voltar antes de sair da tela.",
   ["Hash não vai para o servidor: por isso funciona no GitHub Pages sem configuração.", "O voltar do celular dispara `popstate`/`hashchange`.", "Uma tabela de rotas central deixa claro onde cada tela mora."],
   "No app, abra Estudos › um mapa e copie o endereço. Identifique as 3 partes do hash. Depois procure `estudos` em `SECTIONS` no `src/App.tsx`.",
   "Explique como funciona um roteador por hash num app React de uma página só, com um exemplo de 3 telas, e por que ele é uma boa escolha para um app publicado no GitHub Pages.")),
 ("PWA: instalar e abrir sem internet", page(
   "Fazer um site se comportar como app: ícone na tela inicial, tela cheia e funcionar sem internet.",
   "- `public/manifest.webmanifest`: nome, ícones, cores e modo tela cheia.\n- `public/sw.js`: o **service worker** guarda os arquivos do app no aparelho. Páginas: tenta a rede primeiro e, sem internet, usa a cópia.\n- `src/main.tsx` registra o service worker só no app publicado.\n- Por isso, depois de mesclar um PR, às vezes é preciso fechar e abrir o app duas vezes para a versão nova aparecer.",
   ["Manifest = a identidade do app.", "Service worker = um intermediário entre o app e a internet.", "Estratégias de cache: rede primeiro (atualiza) ou cache primeiro (rápido)."],
   "No Chrome do computador, abra o app, F12 › Application › Service Workers e Manifest. Veja o nome, os ícones e o arquivo `sw.js` ativo. Marque \"Offline\" e recarregue: o app abre?",
   "Explique o que são manifest e service worker num PWA, com um service worker mínimo de \"rede primeiro, cache se offline\" comentado linha por linha. Depois liste 3 cuidados para o app atualizar direito depois de publicar.")),
]

pack = {
 "formato": "central-pessoal/pacote-de-estudo", "versao": 1,
 "id": "cp-como-foi-feito", "nome": "Como o Central Pessoal foi feito",
 "area": {"nome": "Desenvolvimento de software", "catalogo": "dev"},
 "temas": [{"nome": "Como o Central Pessoal foi feito", "trilhas": [{
   "nome": "Parte 1: fundamentos e arquitetura",
   "descricao": "## Sobre esta trilha\nO app que você usa todo dia, explicado por dentro: do toque na tela até o dado salvo e publicado. Cada página tem **para que serve**, **onde ver no código** (github.com/leoemfs/Central-Pessoal), ideias-chave, um **exercício** e um **prompt** para estudar com IA.\n\n> Próximas partes: Parte 2, tecnologias e APIs (Google, GitHub, testes); Parte 3, desenvolver com IA (Claude Code, CLAUDE.md, prompts). Importe o pacote de novo quando saírem: só o que é novo entra.",
   "topicos": [{"nome": n, "pagina": md} for n, md in topicos]}]}],
 "notebook": {"nome": "Como o Central Pessoal foi feito", "descricao": "Estudo pessoal do próprio app: arquitetura, tecnologias e desenvolvimento com IA."},
 "fontes": [{"titulo": v[0], "url": v[1], "tipo": v[2], "nota": v[3]} for v in F.values()],
 "mapas": [{"nome": "Arquitetura do Central Pessoal", "raiz": {"texto": "Central Pessoal", "filhos": [
   {"texto": "Telas (React)", "filhos": [{"texto": "src/modules"}, {"texto": "src/ui.tsx (peças)"}, {"texto": "App.tsx (rotas e barras)"}]},
   {"texto": "Regras (TypeScript)", "filhos": [{"texto": "finance, habits, estudos..."}, {"texto": "Testes node:test"}]},
   {"texto": "Dados", "filhos": [{"texto": "AppData (types.ts)"}, {"texto": "store.tsx (estado)"}, {"texto": "IndexedDB (db.ts)"}, {"texto": "normalize() e backup"}]},
   {"texto": "Publicação", "filhos": [{"texto": "GitHub e PRs"}, {"texto": "GitHub Actions"}, {"texto": "GitHub Pages"}, {"texto": "PWA: manifest e sw.js"}]},
   {"texto": "Integrações", "filhos": [{"texto": "Google Drive"}, {"texto": "Google Agenda e Tarefas"}]},
   {"texto": "Como é feito", "filhos": [{"texto": "Claude Code"}, {"texto": "CLAUDE.md e Central"}, {"texto": "anotar → aprovar → construir → testar"}]},
 ]}}],
 "ciclos": [{"nome": "Ciclo 1: fundamentos do Central Pessoal", "trilha": "Parte 1: fundamentos e arquitetura"}],
}
# fontes por tópico
links = [src('mdn_web','git'), src('mdn_web','mdn_js'), src('ts','ts5'), src('react','react_state'), src('vite','npm'), src('mdn_js'), src('idb'), src('hash'), src('pwa','sw','manifest')]
for t, l in zip(pack["temas"][0]["trilhas"][0]["topicos"], links): t["fontes"] = l
json.dump(pack, open(sys.argv[1], 'w'), ensure_ascii=False, indent=1)
