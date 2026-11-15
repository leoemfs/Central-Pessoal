"""Gera public/estudos/curso-github.json: "Curso de GitHub completo" (pacote pessoal).
Rode: python3 docs/estudos/pacote-curso-github.py public/estudos/curso-github.json"""
import json, sys

F = {
 'progit1': ('Pro Git, cap. 1: Começando', 'https://git-scm.com/book/pt-br/v2/Come%C3%A7ando-Sobre-Controle-de-Vers%C3%A3o', 'livro', 'Livro oficial e gratuito, em português.'),
 'progit2': ('Pro Git, cap. 2: Fundamentos de Git', 'https://git-scm.com/book/pt-br/v2/Fundamentos-de-Git-Obtendo-um-Reposit%C3%B3rio-Git', 'livro', ''),
 'install': ('Git: download e instalação', 'https://git-scm.com/downloads', 'site', ''),
 'ghdocs': ('GitHub Docs: começar com o Git', 'https://docs.github.com/pt/get-started/getting-started-with-git', 'doc', 'Documentação oficial, em português.'),
 'ignore': ('GitHub Docs: ignorar arquivos', 'https://docs.github.com/pt/get-started/getting-started-with-git/ignoring-files', 'doc', ''),
 'gitignore': ('Modelos de .gitignore', 'https://github.com/github/gitignore', 'site', ''),
 'undo': ('Pro Git: desfazendo coisas', 'https://git-scm.com/book/pt-br/v2/Fundamentos-de-Git-Desfazendo-coisas', 'livro', ''),
 'lgb': ('Learn Git Branching (jogo interativo)', 'https://learngitbranching.js.org/?locale=pt_BR', 'curso', 'Aprende jogando, em português.'),
 'commits': ('Conventional Commits', 'https://www.conventionalcommits.org/pt-br/v1.0.0/', 'site', 'Um padrão para mensagens de commit.'),
 'repo': ('O repositório do Central Pessoal', 'https://github.com/leoemfs/Central-Pessoal', 'site', 'O seu próprio projeto, para praticar lendo.'),
}

def page(serve, como, exemplo, cuidados, exercicio, prompt):
    md = "## Para que serve\n" + serve + "\n## Como funciona\n" + como
    if exemplo:
        md += "\n## No Central Pessoal\n" + exemplo
    md += "\n## Cuidados\n" + "\n".join("- " + c for c in cuidados)
    md += "\n## Exercício\n" + exercicio + "\n## Prompt para praticar\n> " + prompt + "\n"
    return md

T = []
def topic(nome, fontes, *a):
    T.append({"nome": nome, "pagina": page(*a), "fontes": [F[k][1] for k in fontes]})

topic("Controle de versão: o que é Git e o que é GitHub", ['progit1', 'ghdocs'],
 "Guardar **cada versão** do projeto, saber o que mudou, quem mudou e por quê, e poder voltar atrás. É o \"Ctrl+Z\" do projeto inteiro, com histórico para sempre.",
 "- **Git** é o programa que guarda as versões. Roda no seu computador (ou na máquina do Claude na nuvem).\n- **GitHub** é o site que guarda uma cópia do repositório na internet e acrescenta colaboração: PRs, revisão, issues, automações (Actions) e sites (Pages).\n- Cada versão salva é um **commit**: uma foto do projeto com uma mensagem.\n- O Git é **distribuído**: cada cópia tem o histórico inteiro.",
 "O Central Pessoal tem centenas de commits. Cada versão do app (v0.16, v0.17... v0.64) virou um ou mais commits e um PR no GitHub. Ao mesclar, o GitHub publica o app sozinho.",
 ["Git ≠ GitHub: dá para usar Git sem GitHub, mas não o contrário.", "O histórico é público num repositório público: nada de senhas ou dados pessoais.", "Commits pequenos e frequentes contam a história melhor do que um commit gigante."],
 "Abra o repositório do Central Pessoal no GitHub e encontre: quantos commits ele tem, o último commit e quem fez.",
 "Explique a diferença entre Git e GitHub com uma analogia do dia a dia e depois com um exemplo real de um app pessoal publicado no GitHub Pages.")

topic("Instalar e configurar o Git", ['install', 'progit1'],
 "Deixar o Git pronto no seu computador, com o seu nome e e-mail nos commits.",
 "1. Instale pelo site oficial (no Windows, o Git for Windows já traz o Git Bash).\n2. Confira: `git --version`.\n3. Diga quem você é (vale para todos os projetos):\n```\ngit config --global user.name \"Leonardo\"\ngit config --global user.email \"seu-email@exemplo.com\"\n```\n4. Nome padrão do ramo principal: `git config --global init.defaultBranch main`.\n5. Veja tudo: `git config --list`.",
 "Nos commits do Central Pessoal você vê dois autores: você (quando mescla pelo GitHub) e o Claude (`Co-Authored-By`), porque as conversas na nuvem configuram o autor assim.",
 ["Use no `user.email` o mesmo e-mail da conta do GitHub, para os commits aparecerem no seu perfil.", "O GitHub permite um e-mail \"noreply\" para esconder o seu e-mail real.", "Configuração `--global` vale para todos os projetos; sem ela, só para o projeto atual."],
 "Instale o Git, configure nome e e-mail e mostre o resultado de `git config --list`.",
 "Vou instalar o Git no Windows pela primeira vez. Me guie passo a passo, incluindo as opções do instalador que um iniciante deve escolher e como conferir se deu certo.")

topic("O repositório: criar, clonar e a pasta .git", ['progit2', 'repo'],
 "Ter um projeto sob controle do Git, seja começando do zero ou copiando um que já existe.",
 "- `git init`: transforma a pasta atual num repositório (cria a pasta escondida `.git`).\n- `git clone <endereço>`: baixa um repositório inteiro, com todo o histórico.\n- A pasta `.git` é o \"cofre\": guarda todas as versões. **Não mexa nela à mão.**\n- `git status`: o comando que você mais vai usar. Mostra o que mudou.",
 "```\ngit clone https://github.com/leoemfs/Central-Pessoal.git\ncd Central-Pessoal\ngit status\n```\nCada conversa do Claude na nuvem começa exatamente assim: clonando o repositório.",
 ["Apagar a pasta `.git` apaga o histórico local.", "Não crie um repositório dentro de outro.", "Clone por HTTPS no começo: é o mais simples."],
 "Clone o Central Pessoal, rode `git status` e `git log --oneline -5` e anote o que aparece.",
 "Me explique o que existe dentro da pasta .git de um repositório (em alto nível, sem detalhes internos demais) e por que clonar traz o histórico inteiro.")

topic("As três áreas: trabalho, preparação e histórico", ['progit2', 'lgb'],
 "Entender o caminho de uma mudança até virar versão. É a ideia mais importante do Git.",
 "1. **Área de trabalho:** os arquivos como estão na pasta. Você edita aqui.\n2. **Área de preparação** (staging): o que vai entrar no próximo commit. Você escolhe com `git add`.\n3. **Histórico** (repositório): as versões salvas, com `git commit`.\n\n```\ngit status          # o que mudou\ngit add arquivo.ts  # prepara um arquivo\ngit add -A          # prepara tudo\ngit commit -m \"mensagem\"\n```",
 "Quando o Claude termina um item, ele faz `git add -A` e `git commit` com uma mensagem como \"M30 (v0.62): mapa mental em tela cheia\".",
 ["`git add .` prepara tudo da pasta atual: confira com `git status` antes.", "Dá para preparar só parte das mudanças e deixar o resto para outro commit.", "Arquivo novo só entra no Git depois do primeiro `git add`."],
 "Num projeto de teste, crie 2 arquivos, prepare só um, faça o commit e confira com `git status` que o outro ficou de fora.",
 "Explique as três áreas do Git (trabalho, preparação e histórico) com a analogia de preparar uma caixa para mandar pelo correio, e me dê um exercício de 10 minutos.")

topic("Commits e boas mensagens", ['commits', 'repo'],
 "Salvar versões que contam uma história fácil de entender depois, por você ou por outra pessoa.",
 "- Um commit = uma mudança com sentido completo (\"corrige o total da fatura\", não \"várias coisas\").\n- Mensagem: uma primeira linha curta dizendo **o que** mudou; se precisar, uma linha em branco e depois o **porquê**.\n- Padrão comum (Conventional Commits): `feat:`, `fix:`, `docs:`.\n- `git commit --amend` corrige o último commit, mas **só antes de enviar**.",
 "O Central Pessoal usa o código do item e a versão: \"N2.4 (v0.60): Arsenal, provador, loja...\". Assim, o histórico conversa com a Central.",
 ["Mensagens como \"ajustes\" ou \"wip\" não ajudam ninguém.", "Não misture assuntos num commit só.", "Não use `--amend` em commits que já foram enviados."],
 "Leia os últimos 20 commits do Central Pessoal (`git log --oneline -20`) e escolha o melhor e o pior título. Reescreva o pior.",
 "Aqui estão 5 mensagens de commit minhas. Reescreva cada uma num formato bom e explique a regra que você usou: [cole as mensagens]")

topic("Ver o histórico e as diferenças", ['progit2'],
 "Investigar: o que mudou, quando e por quê. Ajuda a achar quando um bug apareceu.",
 "- `git log --oneline`: uma linha por commit.\n- `git log --oneline --graph --all`: o desenho dos ramos.\n- `git diff`: o que mudou e ainda não foi preparado.\n- `git diff --staged`: o que já foi preparado.\n- `git show <commit>`: o que um commit mudou.\n- `git log -p -- src/finance.ts`: a história de um arquivo.\n- `git blame arquivo`: quem mudou cada linha por último.",
 "No GitHub, a aba **Commits** e a visão de cada PR (aba \"Files changed\") mostram as mesmas diferenças, em verde (acrescentado) e vermelho (removido).",
 ["Para sair do `git log` comprido, aperte `q`.", "O `blame` não serve para culpar ninguém: ele mostra o contexto da mudança.", "Diferença grande demais? Olhe arquivo por arquivo."],
 "Use `git log -p -- src/boxes.ts` e descubra qual commit criou as Caixinhas.",
 "Me ensine a investigar quando um bug apareceu usando git log, git diff e git show, com um passo a passo para um projeto React.")

topic("Desfazer com segurança", ['undo', 'lgb'],
 "Corrigir erros sem medo e sem perder trabalho.",
 "- **Mudança não preparada:** `git restore arquivo` volta ao último commit (perde a edição).\n- **Tirar da preparação:** `git restore --staged arquivo`.\n- **Commit já enviado:** `git revert <commit>` cria um commit novo que desfaz o antigo. O histórico continua honesto. **É o jeito seguro.**\n- **`git reset`:** volta o ramo para trás. Com `--hard`, apaga mudanças. Use só em commits que **ninguém mais tem**.\n- **Salvar para depois:** `git stash` guarda as mudanças e `git stash pop` traz de volta.",
 "A regra do projeto é \"sem force push e sem rebase\": nada que reescreva a história já enviada ao GitHub. Para desfazer algo publicado, o caminho é um commit novo (revert ou correção).",
 ["`restore` e `reset --hard` apagam edições não salvas: confira antes.", "Nunca reescreva commits que já estão no GitHub.", "Na dúvida, crie um ramo de segurança antes de mexer: `git branch backup`."],
 "Num projeto de teste: faça 3 commits, desfaça o do meio com `git revert` e veja o histórico.",
 "Explique a diferença entre git restore, git revert e git reset com exemplos, e me diga qual usar em cada situação, do mais seguro para o mais perigoso.")

topic(".gitignore: o que não entra no Git", ['ignore', 'gitignore'],
 "Manter fora do Git o que não é código: bibliotecas baixadas, arquivos gerados, senhas e arquivos pessoais.",
 "- O arquivo `.gitignore`, na raiz, lista padrões a ignorar:\n```\nnode_modules/\ndist/\n.env\n*.log\n```\n- `node_modules/`: as bibliotecas (o `npm install` baixa de novo).\n- `dist/`: o app montado (o GitHub Actions gera na hora de publicar).\n- `.env`: chaves e senhas, **nunca** no Git.",
 "Abra o `.gitignore` do Central Pessoal e veja o que ele deixa de fora. Por isso o repositório é leve, mesmo o app usando várias bibliotecas.",
 ["O `.gitignore` não tira do Git o que já foi commitado: aí precisa de `git rm --cached arquivo`.", "Se uma senha já foi commitada, troque a senha: o histórico guarda tudo.", "Use os modelos prontos do GitHub para cada linguagem."],
 "Escreva um `.gitignore` para um projeto Node com React e compare com o modelo oficial do GitHub.",
 "Explique o que deve e o que não deve ir para o Git num projeto React com Vite, com um .gitignore comentado linha por linha.")

topic("O caminho de uma mudança no Central Pessoal", ['repo', 'ghdocs'],
 "Juntar tudo da trilha e ver o fluxo real, do pedido até o app atualizado no seu celular.",
 "1. A conversa clona o repositório (`git clone`) e trabalha num **ramo** próprio.\n2. Antes de começar, traz o que há de novo no `main` (`git fetch` e `git merge`).\n3. Edita, testa e faz commits (`git add`, `git commit`).\n4. Envia o ramo ao GitHub (`git push`).\n5. Abre um **PR** do ramo para o `main`.\n6. Você revisa e **mescla**.\n7. O GitHub Actions monta e publica no GitHub Pages.\n8. O app no celular se atualiza ao fechar e abrir.",
 "Os passos 5 a 7 são o assunto da próxima trilha (GitHub e colaboração) e da trilha de Actions e Pages.",
 ["Sempre traga o `main` antes de começar e antes de abrir o PR: evita conflitos.", "Um PR por item deixa fácil de revisar e de desfazer.", "Se o PR mostra conflito, peça para resolver sem perder nada dos dois lados."],
 "Desenhe este fluxo no mapa mental do curso, com um ramo para cada passo.",
 "Explique o fluxo clone → branch → commit → push → pull request → merge → deploy como uma história, usando um app pessoal como exemplo, e diga onde cada erro comum acontece.")

pack = {
 "formato": "central-pessoal/pacote-de-estudo", "versao": 1,
 "id": "curso-github", "nome": "Curso de GitHub completo",
 "area": {"nome": "Desenvolvimento de software", "catalogo": "dev"},
 "temas": [{"nome": "Curso de GitHub completo", "trilhas": [{
   "nome": "Git do zero",
   "descricao": "Controle de versão na prática: instalar, commits, histórico, desfazer com segurança e o caminho de uma mudança.",
   "pagina": "## Sobre esta trilha\nA base de tudo: o Git no seu computador. Cada página tem **para que serve**, **como funciona**, um exemplo **do próprio Central Pessoal**, cuidados, um **exercício** e um **prompt para praticar**.\n\n> Dica: o jogo **Learn Git Branching** (nas fontes) ajuda muito a visualizar.\n\n> Próximas trilhas: GitHub e colaboração, Automação e publicação, Segurança e boas práticas, GitHub com IA. Chegam pelo mesmo link.",
   "topicos": T}]}],
 "notebook": {"nome": "Curso de GitHub", "descricao": "Git e GitHub do zero ao fluxo usado no Central Pessoal."},
 "fontes": [{"titulo": v[0], "url": v[1], "tipo": v[2], "nota": v[3]} for v in F.values()],
 "mapas": [{"nome": "Git e GitHub", "raiz": {"texto": "Git e GitHub", "filhos": [
   {"texto": "Git (no computador)", "filhos": [{"texto": "Trabalho → preparação → histórico"}, {"texto": "commit, log, diff"}, {"texto": "restore, revert, stash"}, {"texto": ".gitignore"}]},
   {"texto": "GitHub (na internet)", "filhos": [{"texto": "push e pull"}, {"texto": "Branch e PR"}, {"texto": "Revisão e merge"}, {"texto": "Issues"}]},
   {"texto": "Automação", "filhos": [{"texto": "GitHub Actions"}, {"texto": "GitHub Pages"}]},
   {"texto": "Segurança", "filhos": [{"texto": "Sem senhas no Git"}, {"texto": "Sem reescrever o que já foi enviado"}]},
 ]}}],
 "ciclos": [{"nome": "Ciclo 1: Git do zero", "trilha": "Git do zero"}],
}
json.dump(pack, open(sys.argv[1], 'w'), ensure_ascii=False, indent=1)
