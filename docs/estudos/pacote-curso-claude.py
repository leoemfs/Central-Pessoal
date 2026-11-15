"""Gera public/estudos/curso-claude.json: "Curso de Claude para desenvolvimento" (pacote pessoal).
Conferido com a documentação oficial do Claude Code em 15/11/2026. Rode: python3 docs/estudos/pacote-curso-claude.py public/estudos/curso-claude.json"""
import json, sys

D = 'https://code.claude.com/docs/en/'
F = {
 'overview': ('Claude Code: visão geral', D + 'overview', 'doc', 'Instalação e o que ele faz.'),
 'workflows': ('Claude Code: fluxos comuns (inclui modo plano)', D + 'common-workflows', 'doc', ''),
 'memory': ('Claude Code: memória e CLAUDE.md', D + 'memory', 'doc', ''),
 'permissions': ('Claude Code: permissões', D + 'permissions', 'doc', ''),
 'modes': ('Claude Code: modos de permissão', D + 'permission-modes', 'doc', ''),
 'commands': ('Claude Code: lista de comandos', D + 'commands', 'doc', ''),
 'skills': ('Claude Code: skills', D + 'skills', 'doc', ''),
 'agents': ('Claude Code: subagentes', D + 'sub-agents', 'doc', ''),
 'hooks': ('Claude Code: guia de hooks', D + 'hooks-guide', 'doc', ''),
 'mcp': ('Claude Code: MCP', D + 'mcp', 'doc', ''),
 'web': ('Claude Code na web e no celular', D + 'claude-code-on-the-web', 'doc', ''),
 'costs': ('Claude Code: custos e uso', D + 'costs', 'doc', ''),
 'settings': ('Claude Code: configurações', D + 'settings', 'doc', ''),
 'mcpsite': ('Model Context Protocol (site oficial)', 'https://modelcontextprotocol.io', 'site', ''),
 'skillsrepo': ('Exemplos de skills da Anthropic', 'https://github.com/anthropics/skills', 'site', 'Skills prontas para estudar o formato.'),
}

def page(serve, como, exemplo, cuidados, exercicio, prompt):
    md = "## Para que serve\n" + serve + "\n## Como funciona\n" + como
    if exemplo:
        md += "\n## Exemplo\n" + exemplo
    md += "\n## Cuidados\n" + "\n".join("- " + c for c in cuidados)
    md += "\n## Exercício\n" + exercicio + "\n## Prompt para praticar\n> " + prompt + "\n"
    return md

T = []
def topic(nome, fontes, *a):
    T.append({"nome": nome, "pagina": page(*a), "fontes": [F[k][1] for k in fontes]})

topic("O que é o Claude Code e onde usar", ['overview', 'web'],
 "O Claude Code é um assistente que **trabalha dentro do seu projeto**: lê os arquivos, edita, roda comandos e testes, e usa o Git. Você conversa em português e ele age, pedindo permissão quando precisa.",
 "- Funciona no **terminal**, no **VS Code** e no **JetBrains**, no **app de computador**, na **web** (claude.ai/code) e no **celular** (aba Code do app Claude).\n- Todos leem as mesmas instruções do projeto (`CLAUDE.md`), as mesmas configurações e as mesmas ferramentas conectadas (MCP).\n- No computador ele trabalha nos seus arquivos. Na web e no celular, ele trabalha numa **máquina na nuvem** com uma cópia do repositório do GitHub (é assim que o Central Pessoal é feito).",
 "Você escreve: \"rode os testes e corrija o que falhar\". Ele roda `npm test`, lê o erro, abre o arquivo, corrige, roda de novo e mostra o que mudou.",
 ["Ele erra: confira sempre o resultado (testes, prévia no navegador).", "Ele só sabe do projeto o que lê ou o que você conta: contexto bom = resultado bom.", "No celular, o trabalho fica na nuvem até virar commit e PR."],
 "Liste 3 tarefas do Central Pessoal que você já pediu e diga, para cada uma, que ferramentas o Claude Code precisou usar (ler arquivo, editar, rodar comando, GitHub).",
 "Me explique a diferença entre conversar com o Claude no chat comum e usar o Claude Code num projeto. Use exemplos de um app pessoal em React e diga quando usar cada um.")

topic("Instalar e a primeira sessão no computador", ['overview'],
 "Ter o Claude Code no seu computador para estudar e mexer no projeto com calma, vendo cada passo.",
 "- Windows (PowerShell): `irm https://claude.ai/install.ps1 | iex`. Mac/Linux: `curl -fsSL https://claude.ai/install.sh | bash`. Confira com `claude --version`.\n- No Windows, instale também o **Git for Windows**.\n- Entre na pasta do projeto e digite `claude`. Na primeira vez, ele pede o login da sua conta Claude.\n- Pedido único sem abrir conversa: `claude -p \"explique o src/store.tsx\"`.\n- `/help` mostra os comandos; `/exit` sai.",
 "```\ngit clone https://github.com/leoemfs/Central-Pessoal\ncd Central-Pessoal\nclaude\n```\nDepois: \"me dê um tour de 5 minutos por este projeto\".",
 ["Instale pela forma oficial: a instalação nativa se atualiza sozinha.", "Rode sempre dentro da pasta do projeto: é ela que ele enxerga.", "Comece só lendo e perguntando, antes de pedir mudanças."],
 "Instale, clone o Central Pessoal e peça o tour. Anote 3 coisas que você não sabia sobre o app.",
 "Sou iniciante e vou instalar o Claude Code no Windows pela primeira vez. Me guie passo a passo, dizendo o que devo ver em cada etapa e o que fazer se aparecer erro.")

topic("Como pedir: explorar, planejar, fazer e conferir", ['workflows'],
 "Conseguir bons resultados de primeira. O jeito de pedir muda tudo.",
 "1. **Explorar:** \"leia X e me explique como funciona Y\" (sem mudar nada).\n2. **Planejar:** \"proponha um plano para Z\" (ou use o modo plano).\n3. **Fazer:** aprove o plano e deixe ele construir.\n4. **Conferir:** \"rode os testes\", \"abra no navegador e me mostre\".\n\nAjuda muito:\n- citar arquivos com `@caminho/arquivo`;\n- colar prints e mensagens de erro;\n- dizer **o que é sucesso** (\"pronto quando o teste X passar\");\n- dar exemplos do que você quer.",
 "Pedido fraco: \"melhora a lista de compras\". Pedido bom: \"na lista de mercado, os itens marcados devem descer para 'No carrinho'. Pronto quando: marcar desce, desmarcar volta ao corredor, e os testes de `src/lists.test.ts` passam\".",
 ["Um pedido por vez: tarefas misturadas viram resultados misturados.", "Se ele foi para o caminho errado, interrompa (Esc) e corrija cedo.", "Peça para ele perguntar quando não tiver certeza."],
 "Reescreva um pedido antigo seu ao Claude no formato: o que, onde, por que e \"pronto quando\".",
 "Vou te mandar um pedido que fiz para um assistente de código. Reescreva no melhor formato (contexto, objetivo, critério de pronto, limites) e explique cada mudança: [cole o pedido]")

topic("CLAUDE.md: as instruções do projeto", ['memory'],
 "Guardar as regras do projeto num arquivo que o Claude lê **toda vez que começa**. É por isso que ele já sabe responder em português simples e seguir a Central no Central Pessoal.",
 "- `CLAUDE.md` na raiz do projeto (ou `.claude/CLAUDE.md`): regras do projeto, vão para o Git.\n- `~/.claude/CLAUDE.md`: suas regras para todos os projetos.\n- `CLAUDE.local.md`: notas pessoais do projeto (fora do Git).\n- `@arquivo` dentro do CLAUDE.md importa outro arquivo.\n- `.claude/rules/*.md`: regras por assunto, que podem valer só para certas pastas.\n- **Memória automática:** o próprio Claude anota aprendizados por projeto; `/memory` mostra e edita.\n- `/init` cria um CLAUDE.md inicial olhando o projeto.",
 "```\n# Regras técnicas\n- Rode `npm test` e `npm run build` antes do PR.\n- Todo campo novo precisa de padrão em `normalize()` (src/data.ts).\n```",
 ["Mantenha curto (até umas 200 linhas): longo demais, ele segue menos.", "Regras concretas e conferíveis (\"rode npm test\") funcionam; vagas (\"código bom\") não.", "É uma orientação, não uma trava: para algo que deve acontecer **sempre**, use um hook."],
 "Leia o `CLAUDE.md` do Central Pessoal e classifique cada regra em: jeito de conversar, fluxo de trabalho, regra técnica ou Git. Qual você mudaria?",
 "Aqui está o CLAUDE.md do meu projeto. Aponte regras vagas, repetidas ou que se contradizem e proponha uma versão mais curta e clara: [cole o arquivo]")

topic("Permissões e modos de trabalho", ['permissions', 'modes'],
 "Decidir o quanto o Claude pode fazer sozinho, com segurança.",
 "- Ler arquivos não pede permissão. Editar, rodar comandos e acessar a internet pedem, a não ser que você libere.\n- **Modos** (troque com Shift+Tab no terminal):\n- **Manual** (`default`): pergunta no primeiro uso de cada coisa.\n- **Aceitar edições** (`acceptEdits`): edita arquivos sem perguntar.\n- **Plano** (`plan`): só lê e planeja, não edita.\n- **Auto** (`auto`): segue sem perguntar o rotineiro; um verificador confere cada ação antes.\n- Regras fixas em `.claude/settings.json`, no bloco `permissions`, com listas `allow`, `ask` e `deny`. O `deny` sempre vence.",
 "```\n{\"permissions\": {\n  \"allow\": [\"Bash(npm run *)\", \"Bash(npm test)\"],\n  \"deny\": [\"Read(./.env)\"]\n}}\n```",
 ["\"Sim, não pergunte de novo\" grava uma regra em `.claude/settings.local.json`.", "Regras de permissão não são uma barreira de segurança completa: o isolamento (sandbox, nuvem) é que protege de verdade.", "Modos que pulam todas as permissões são só para máquinas isoladas."],
 "Escreva 3 regras `allow` e 1 `deny` que fariam sentido para o Central Pessoal, e explique cada uma.",
 "Explique os modos de permissão do Claude Code como se eu fosse iniciante, com um exemplo de quando usar cada um num projeto pessoal, e os riscos de cada um.")

topic("Modo plano: pensar antes de mexer", ['workflows', 'modes'],
 "Ver e aprovar o plano **antes** de qualquer mudança. Evita retrabalho em tarefas médias e grandes.",
 "- Entre com Shift+Tab até aparecer \"plan mode\", com `/plan` ou abrindo com `claude --permission-mode plan`.\n- O Claude explora o projeto e apresenta o plano.\n- Você escolhe: aprovar e deixar ele seguir, aprovar e revisar cada edição, ou continuar planejando.\n- Ctrl+G abre o plano no seu editor para você ajustar.",
 "\"/plan adicionar repetição semanal na Agenda\" → ele lê `Agenda.tsx`, `types.ts` e `data.ts`, e propõe: campo novo, padrão no normalize, regra pura com teste, tela. Você aprova ou pede ajuste.",
 ["Use para tudo que mexe em mais de um arquivo.", "Leia o plano de verdade: é a hora mais barata de corrigir o rumo.", "No Central Pessoal, a Central e os documentos de `docs/futuro/` fazem o papel de plano aprovado."],
 "Pegue um item da fila da Central e peça um plano no modo plano. Compare com o que está no documento do item.",
 "Antes de mexer em código, me mostre um plano para [tarefa]: arquivos afetados, passos, riscos e como vamos testar. Não edite nada até eu aprovar.")

topic("Comandos com barra (/) mais úteis", ['commands'],
 "Atalhos para controlar a sessão sem ter que explicar em texto.",
 "- `/init`: cria o CLAUDE.md.\n- `/memory`: edita as memórias e instruções.\n- `/plan`: entra no modo plano.\n- `/clear`: começa do zero (use entre tarefas diferentes).\n- `/compact`: resume a conversa para liberar espaço.\n- `/context`: mostra o que está ocupando o contexto.\n- `/rewind`: volta a um ponto anterior.\n- `/model` e `/effort`: trocam o modelo e o quanto ele pensa.\n- `/code-review` e `/security-review`: revisão do que mudou.\n- `/usage`: mostra quanto você usou.\n- `/mcp`, `/hooks`, `/agents`, `/skills`: mostram o que está ligado.\n- `/help`: lista tudo.",
 "Terminou uma tarefa e vai começar outra? `/clear`. Conversa longa e ele começou a esquecer coisas? `/compact foque na tarefa da Agenda`.",
 ["Os comandos só funcionam no começo da mensagem.", "Na nuvem, alguns comandos funcionam diferente (ex.: `/model sonnet` com o nome, sem menu).", "Uma skill com o mesmo nome de um comando substitui o comando."],
 "Numa sessão, use `/context` antes e depois de `/compact` e anote a diferença.",
 "Liste os 10 comandos com / do Claude Code que mais ajudam um iniciante e dê uma situação real para cada um.")

topic("Skills: o que são e como funcionam", ['skills', 'skillsrepo'],
 "Ensinar ao Claude um **jeito de fazer** que você repete (uma receita) e que ele carrega **só quando precisa**. Economiza explicação e uso.",
 "- Uma skill é uma pasta com um arquivo `SKILL.md`: um cabeçalho (YAML) e as instruções em texto.\n- Onde ficam: `.claude/skills/<nome>/SKILL.md` (do projeto, vai para o Git) ou `~/.claude/skills/<nome>/SKILL.md` (suas, em todos os projetos).\n- O campo `description` diz **quando** usar: o Claude lê só as descrições e abre a skill inteira quando o pedido combina.\n- Você também chama direto: `/nome-da-skill`.\n- Campos úteis: `disable-model-invocation: true` (só você chama), `allowed-tools`, `argument-hint`.\n- `$ARGUMENTS` recebe o que você escreve depois do comando.\n- Arquivos de apoio (exemplos, scripts) ficam na mesma pasta.\n- Já vêm algumas prontas: `/code-review`, `/simplify`, `/loop`.",
 None,
 ["Descrição vaga = a skill nunca é usada sozinha. Diga quando usar.", "Campo com nome errado é ignorado em silêncio.", "Sessões na nuvem (web e celular) não leem as skills do seu computador: as do projeto precisam estar no Git."],
 "Abra o repositório de exemplos de skills da Anthropic, escolha uma e explique o cabeçalho e as instruções.",
 "Me explique como as skills do Claude Code são carregadas (descrição primeiro, conteúdo só quando usada) e por que isso economiza contexto. Compare skill, CLAUDE.md e comando com /.")

topic("Criar sua primeira skill", ['skills'],
 "Transformar um pedido que você faz sempre num comando seu.",
 "1. Crie a pasta `.claude/skills/nova-versao/`.\n2. Crie o `SKILL.md` com o cabeçalho e as instruções.\n3. Use com `/nova-versao` (não precisa reiniciar).\n4. Ajuste a descrição até ele usar sozinho na hora certa.",
 "```\n---\ndescription: Fecha um item da Central. Use quando o Leonardo disser que um item foi testado e aprovado.\ndisable-model-invocation: true\nargument-hint: [id do item]\n---\nPara o item $ARGUMENTS:\n1. Mova-o para Feito em docs/CENTRAL.md com a versão e o PR.\n2. Atualize o README.md e o documento do item.\n3. Rode npm test e npm run build.\n```",
 ["Uma skill, uma tarefa.", "Escreva como para uma pessoa nova no projeto: passos claros e o que é \"pronto\".", "Teste com um caso real antes de confiar."],
 "Escreva (no notebook) uma skill para uma tarefa sua do dia a dia no projeto. Depois peça ao Claude para revisar.",
 "Quero criar uma skill do Claude Code para [tarefa]. Me ajude a escrever o SKILL.md: descrição que dispare na hora certa, passos, critério de pronto e o que ela não deve fazer.")

topic("Subagentes: ajudantes com contexto próprio", ['agents'],
 "Mandar uma parte do trabalho para um ajudante que trabalha **em separado** e volta só com o resumo. A conversa principal fica limpa.",
 "- Cada subagente tem as próprias instruções, ferramentas e modelo.\n- Prontos: **Explore** (busca no código, só leitura), **Plan** (pesquisa para o plano), **general-purpose** (tarefas com várias etapas).\n- Os seus: arquivos `.md` em `.claude/agents/` (projeto) ou `~/.claude/agents/`, com `name`, `description` e, se quiser, `tools` e `model`.\n- Use dizendo \"use o agente X para...\" ou com `@agent-nome`.",
 "```\n---\nname: revisor\ndescription: Revisa mudanças de código procurando bugs e regras do CLAUDE.md quebradas\ntools: Read, Glob, Grep\nmodel: sonnet\n---\nVocê é um revisor de código. Aponte problemas concretos, com arquivo e linha.\n```",
 ["Subagentes também gastam uso: use quando o trabalho é grande ou paralelo.", "Eles não veem a sua conversa: escreva o pedido completo.", "Sem `name` ou `description` o arquivo é ignorado."],
 "Escreva um subagente \"testador\" para o Central Pessoal (só leitura e rodar testes). Quais ferramentas ele deve ter?",
 "Explique quando vale usar um subagente no Claude Code e quando é melhor fazer na conversa principal, com 3 exemplos de um projeto React.")

topic("Hooks: o que deve acontecer sempre", ['hooks'],
 "Rodar algo **automaticamente** em momentos certos (antes ou depois de uma edição, ao terminar), sem depender de o Claude lembrar.",
 "- Ficam em `.claude/settings.json`, no bloco `hooks`.\n- Momentos (eventos): `PreToolUse` (antes de uma ação), `PostToolUse` (depois), `Stop` (ao terminar a resposta), `SessionStart`, `Notification`, entre outros.\n- `matcher` escolhe a ferramenta (ex.: `Edit|Write`).\n- O hook recebe os dados da ação em JSON. Se sair com código **2**, a ação é **bloqueada** e o motivo volta para o Claude.\n- `/hooks` mostra os hooks ligados.\n- Nestas conversas do Central Pessoal, um hook avisa ao terminar se ficou algo sem enviar (push) para o GitHub.",
 "```\n{\"hooks\": {\"PostToolUse\": [{\n  \"matcher\": \"Edit|Write\",\n  \"hooks\": [{\"type\": \"command\", \"command\": \"npx prettier --write \\\"$(jq -r '.tool_input.file_path')\\\"\"}]\n}]}}\n```\nFormata cada arquivo logo depois que ele edita.",
 ["CLAUDE.md orienta; hook garante.", "Teste o hook com cuidado: um hook com erro pode travar o trabalho.", "O JSON das configurações não aceita comentários."],
 "Pense em uma regra do `CLAUDE.md` do Central Pessoal que deveria ser um hook. Descreva o evento, o matcher e o que o comando faria.",
 "Quero um hook do Claude Code que impeça editar arquivos .env e outro que rode os testes ao terminar. Escreva os dois, explique linha por linha e os riscos.")

topic("MCP: conectar o Claude a outras ferramentas", ['mcp', 'mcpsite'],
 "Dar ao Claude acesso a serviços de fora (GitHub, Notion, Figma, bancos de dados, Google...) de um jeito padronizado.",
 "- MCP (Model Context Protocol) é um padrão aberto: cada **servidor MCP** oferece ferramentas que aparecem para o Claude.\n- Adicionar: `claude mcp add --transport http notion https://mcp.notion.com/mcp`.\n- Servidor local: `claude mcp add --transport stdio nome -- npx -y pacote`.\n- `claude mcp list` lista; `/mcp` mostra a situação e faz o login.\n- Para o projeto todo: arquivo `.mcp.json` na raiz.\n- Nestas conversas do Central Pessoal, o GitHub chega pelo MCP: é por ele que eu crio e mesclo PRs.",
 None,
 ["Só conecte servidores em que você confia: o conteúdo que vem de fora pode tentar dar ordens ao Claude.", "Cada servidor ligado ocupa contexto: desligue o que não usa.", "Para bancos de dados, use um usuário só de leitura."],
 "Liste 3 serviços que você usa e que seriam úteis conectados ao Claude Code. Para um deles, procure se já existe servidor MCP.",
 "Explique o que é MCP com uma analogia simples, como um servidor MCP expõe ferramentas para o Claude e quais cuidados de segurança tomar.")

topic("Git, GitHub e PRs com o Claude", ['workflows', 'web'],
 "Trabalhar com segurança: cada mudança num branch, revisada num PR e só depois publicada.",
 "- **Commit:** um pacote de mudanças com uma mensagem.\n- **Branch:** uma linha de trabalho separada (aqui, um branch por conversa).\n- **PR:** pedido para juntar o branch ao `main`, com descrição e testes.\n- Ao mesclar no Central Pessoal, o GitHub Actions publica no GitHub Pages.\n- O Claude escreve commits e PRs, resolve conflitos e responde a comentários. `/code-review` revisa antes.\n- Regra deste projeto: sem force push e sem rebase. PR de código você mescla; de documentos, o Claude mescla.",
 None,
 ["Leia o resumo do PR antes de mesclar.", "Conflito = duas mudanças no mesmo lugar: peça para juntar sem perder nada dos dois lados.", "Nunca guarde senhas no repositório."],
 "Abra um PR antigo do Central Pessoal no GitHub e identifique: branch, commits, arquivos mudados e o resumo dos testes.",
 "Explique branch, commit, PR, merge e conflito usando o exemplo de duas pessoas editando a mesma receita, e depois o equivalente no Git.")

topic("Sessões na nuvem: web e celular", ['web'],
 "Programar pelo celular, como você faz no Central Pessoal: o Claude trabalha numa máquina na nuvem que continua rodando mesmo com o celular bloqueado.",
 "- Comece em claude.ai/code, na aba Code do app ou com `claude --cloud \"tarefa\"` no terminal.\n- A sessão clona o repositório do GitHub. O que ficou só no seu computador (sem push) não vai.\n- O resultado volta como commits num branch e um PR.\n- `claude --teleport` traz uma sessão da nuvem para o terminal do computador.\n- `/autofix-pr` faz o Claude acompanhar o PR e corrigir falhas de teste e comentários.",
 None,
 ["A nuvem não lê as skills e configurações só do seu computador: o que precisa valer lá deve estar no repositório.", "A máquina é recolhida depois de um tempo parada: o que importa precisa virar commit.", "Usa o mesmo limite do seu plano."],
 "Compare: o que você faz pelo celular hoje e o que faria no computador com o Claude Code no terminal. Quando cada um é melhor?",
 "Explique como funciona uma sessão do Claude Code na nuvem: de onde vem o código, onde ele roda, como o resultado volta e o que se perde quando a sessão termina.")

topic("Economizar uso e manter o contexto limpo", ['costs'],
 "Fazer mais com o seu limite. É o mesmo motivo do combinado de \"até 10% por dia\" na Central.",
 "- **Contexto** é tudo o que o Claude está \"vendo\": conversa, arquivos lidos, instruções. A cada mensagem, tudo isso é reenviado.\n- `/clear` entre tarefas diferentes; `/compact` para resumir uma conversa longa.\n- Escolha o modelo: os médios para o dia a dia e o maior só para problemas difíceis (`/model`). `/effort` diminui o quanto ele pensa.\n- CLAUDE.md curto e receitas em **skills** (só carregam quando precisa).\n- Desligue servidores MCP que não usa.\n- Modo plano evita trabalho jogado fora.\n- `/usage` mostra o gasto e dá dicas.",
 None,
 ["Sessão aberta o dia todo fica cara até para perguntas pequenas: comece uma nova para cada assunto.", "Prévias visuais e testes no navegador consomem bastante: peça só quando vale a pena.", "Subagentes e tarefas agendadas também contam."],
 "Olhe uma conversa longa sua e aponte 3 momentos em que um `/clear` ou uma conversa nova teria economizado.",
 "Me dê um checklist de 10 hábitos para usar o Claude Code gastando menos, do mais importante para o menos importante, explicando o porquê de cada um.")

topic("Configurações: settings.json", ['settings', 'permissions'],
 "Saber onde ficam e como mudar as configurações sem quebrar nada.",
 "- `~/.claude/settings.json`: suas, em todos os projetos.\n- `.claude/settings.json`: do projeto, vai para o Git.\n- `.claude/settings.local.json`: suas, só neste projeto.\n- Ordem de força: da empresa > linha de comando > local > projeto > suas.\n- Listas (como `permissions.allow`) se somam; valores únicos, o mais forte vence.\n- `/config` muda pelo menu; `/status` mostra quais arquivos foram lidos.",
 "```\n{\n  \"$schema\": \"https://json.schemastore.org/claude-code-settings.json\",\n  \"permissions\": {\"allow\": [\"Bash(npm run test *)\"], \"deny\": [\"Read(./.env)\"]}\n}\n```",
 ["JSON não aceita comentários nem vírgula sobrando: um erro invalida o arquivo.", "Na nuvem, só valem as configurações que estão no repositório.", "Prefira mudar pelo `/config` quando estiver começando."],
 "Desenhe (no mapa mental) os 3 arquivos de configuração e o que você colocaria em cada um.",
 "Explique os níveis de configuração do Claude Code (usuário, projeto, local, empresa) com um exemplo de conflito entre eles e qual valor vence.")

pack = {
 "formato": "central-pessoal/pacote-de-estudo", "versao": 1,
 "id": "curso-claude", "nome": "Curso de Claude para desenvolvimento",
 "area": {"nome": "Inteligência artificial", "catalogo": "ia"},
 "temas": [{"nome": "Curso de Claude para desenvolvimento", "trilhas": [{
   "nome": "Claude Code na prática",
   "descricao": "Usar o Claude Code de verdade: pedir bem, CLAUDE.md, permissões, modo plano, skills, subagentes, hooks, MCP, GitHub, nuvem e economia de uso.",
   "pagina": "## Sobre esta trilha\nO curso foi escrito como eu, o Claude, ensinaria uma pessoa a trabalhar comigo em projetos de software. Conferido com a documentação oficial em 15/11/2026.\n\nCada página tem: **para que serve**, **como funciona**, exemplo, **cuidados**, um **exercício** e um **prompt para praticar**.\n\n> As próximas trilhas (Fundamentos, Conversar bem, Construir com a API e Fluxo profissional) chegam pelo mesmo link. Importe de novo: só o que é novo entra.",
   "topicos": T}]}],
 "notebook": {"nome": "Curso de Claude", "descricao": "Como trabalhar com o Claude em desenvolvimento de software."},
 "fontes": [{"titulo": v[0], "url": v[1], "tipo": v[2], "nota": v[3]} for v in F.values()],
 "mapas": [{"nome": "Claude Code: as peças", "raiz": {"texto": "Claude Code", "filhos": [
   {"texto": "Onde usar", "filhos": [{"texto": "Terminal"}, {"texto": "VS Code e app"}, {"texto": "Web e celular (nuvem)"}]},
   {"texto": "Instruções", "filhos": [{"texto": "CLAUDE.md"}, {"texto": "Memória automática"}, {"texto": ".claude/rules"}]},
   {"texto": "Controle", "filhos": [{"texto": "Permissões"}, {"texto": "Modos: Manual, Edições, Plano, Auto"}, {"texto": "settings.json"}]},
   {"texto": "Extensões", "filhos": [{"texto": "Skills (receitas)"}, {"texto": "Subagentes (ajudantes)"}, {"texto": "Hooks (sempre acontece)"}, {"texto": "MCP (outras ferramentas)"}]},
   {"texto": "Trabalho", "filhos": [{"texto": "Explorar → planejar → fazer → conferir"}, {"texto": "Git, branch e PR"}, {"texto": "/clear, /compact, /usage"}]},
 ]}}],
 "ciclos": [{"nome": "Ciclo 1: Claude Code na prática", "trilha": "Claude Code na prática"}],
}
json.dump(pack, open(sys.argv[1], 'w'), ensure_ascii=False, indent=1)
