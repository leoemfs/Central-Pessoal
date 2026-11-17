# Estudos: importar um curso feito por IA (M36) e exportar em PDF (M37)

> Situação: **M36 pronto na v0.123 (17/11)**; M37 (PDF) é ideia para depois.
> Base que já existe: o importador de pacotes do **M31** (`src/studyPack.ts`, formato `central-pessoal/pacote-de-estudo`, v0.63), usado nos cursos M31, M32 e M33.

## O pedido
1. Uma área clara **"Deseja importar um curso?"** em Estudos.
2. Um **prompt padrão** para a pessoa colar numa IA (Claude, ChatGPT, Gemini…). A IA devolve o curso pronto: área, temas, trilhas, tópicos com texto, notebook com páginas e subpáginas, fontes (links) e mapas mentais.
3. A pessoa **cola a resposta** da IA no app e importa.
4. Na Biblioteca, cada curso importado tem os ícones de **arquivar** e **excluir** na própria linha (M38, v0.124; antes era "Gerenciar cursos").
5. Anotar para depois: **exportar o curso em PDF**, com as trilhas e o que a pessoa escreveu nos notebooks (M37).

## O que o importador já aceita (requisitos de entrada)
| Peça do curso | Onde entra no app | Obrigatório? |
|---|---|---|
| `id` | Base de todos os ids. Importar de novo o mesmo `id` só **acrescenta** o que falta | sim |
| `nome` | Nome do curso | sim |
| `area` (`nome`, `descricao`, `catalogo`) | Área nova na Biblioteca, ou dentro de uma área do app (`catalogo`: `idiomas`, `dev`, `ia`, `prod`, `carreira`) | sim (`nome`) |
| `temas[]` → `trilhas[]` → `topicos[]` | Biblioteca: tema › trilha › tópicos (pelo menos 1 tema, 1 trilha e 1 tópico) | sim |
| `trilhas[].descricao` | Frase curta na Biblioteca | não |
| `trilhas[].pagina` | **Página** do notebook com o nome da trilha (abertura) | não |
| `topicos[].pagina` | **Subpágina** dentro da página da trilha, com o texto do tópico | não |
| `topicos[].fontes[]` | Endereços (das `fontes` do curso) ligados àquela subpágina | não |
| `notebook` (`nome`, `descricao`) | Notebook do curso (uma página por trilha, uma subpágina por tópico) | não (usa o nome do curso) |
| `fontes[]` (`titulo`, `url`, `tipo`, `nota`) | Fontes; `tipo`: site, video, artigo, livro, pdf, doc, curso, podcast, outro | não |
| `mapas[]` (`nome`, `raiz` → `texto`, `filhos[]`) | Mapas mentais do notebook (árvore, até 6 níveis) | não |
| `ciclos[]` (`nome`, `trilha`) | Ciclo pronto com todos os tópicos daquela trilha | não |

**Texto das páginas:** markdown simples. Aceita `## título`, `### subtítulo`, `- lista`, `1. lista`, `> destaque`, blocos de código com três crases, `**negrito**` e `` `código` ``. Tabelas, imagens e links no meio do texto não são convertidos; os links vão em `fontes`.

**Regras que protegem a pessoa:**
- Importar nunca apaga nem muda o que já existe; só acrescenta.
- Uma fonte com o mesmo endereço de outra já guardada é reaproveitada.
- O ciclo só é criado se ainda não houver ciclo daquela trilha.

## O que foi construído (v0.123, M36)
- **Entrada:** cartão "Deseja importar um curso?" no Estudos (pelo lápis dá para mover ou ocultar) e na Biblioteca (com "Gerenciar (n)"). O + de Estudos › "Importar um curso" leva para a mesma tela. Tela em `#/estudos/importar-curso`.
- **Passo 1:** tema, nível (iniciante, intermediário, avançado) e tamanho (curto, médio, completo) → **Copiar prompt** (e "Ver prompt", que mostra o texto para copiar à mão se o navegador não deixar).
- **Passo 2:** **Escolher arquivo** (.md, .txt ou .json) ou **Colar o texto** (a resposta inteira da IA, até com as crases de bloco de código).
- **Passo 3:** conferir (área, temas, trilhas e quantidades; avisa quando é um curso que já existe, ou seja, uma Parte 2) e importar. Com erro, explica e oferece **Copiar pedido de correção para a IA**.
- **Meus cursos** (`#/estudos/cursos`): lista com trilhas, tópicos, páginas, mapas, data e partes; abrir o notebook; **Excluir** com duas opções: "Só o curso" (padrão; o notebook e as anotações ficam, só perdem a ligação com as trilhas) ou "Tudo, inclusive o notebook" (pede confirmação com o número de páginas; fontes usadas em outros notebooks ficam).
- **Por dentro:** `src/curso.ts` (`mdCourseToPack`, `readCourse`, `coursePrompt`, `fixRequest`, `listCourses`, `removeCourse`), 7 testes em `src/curso.test.ts`. O `.md` vira o mesmo pacote do M31 (`applyPack`). Registro em `study.packs` (padrão vazio em `normalize()`); cursos importados antes aparecem pelo notebook `pk-<id>-nb`. `mapas[].pagina` liga o mapa a uma página. Exclusões entram no registro de sincronização como qualquer outra.
- Linha "Antes:" do tópico é aceita e ignorada (as trilhas da pessoa não guardam recomendação).
- O teste confere que o exemplo dentro do próprio prompt é um curso válido.

## Plano original (M36)
1. **"Deseja importar um curso?"**: cartão em Estudos (abaixo do bloco principal) e na Biblioteca. Abre a tela de importar, em 3 passos:
   1. **Copiar o prompt**: campo "Sobre o que é o curso?" (ex.: "Excel do básico ao avançado"), nível (iniciante, intermediário, avançado) e tamanho (curto, médio, completo). O app monta o prompt e mostra **Copiar**.
   2. **Colar a resposta**: caixa de texto grande. Aceita a resposta inteira da IA, mesmo com texto antes ou depois e com as crases de bloco de código: o app acha o JSON sozinho.
   3. **Conferir e importar** (o arquivo `.md` é o caminho principal; colar texto é a alternativa): resumo do que vai entrar (temas, trilhas, tópicos, páginas, fontes e mapas). Se der erro, explica em português o que faltou, com o botão "Copiar pedido de correção" (manda a mensagem de erro para a IA corrigir).

   Continuam valendo "Escolher arquivo" e "Endereço", como hoje.
2. **Mapa ligado a uma página**: `mapas[].pagina` (opcional) = nome de uma trilha ou tópico; o mapa aparece em "Mapas desta página".
3. **Gerenciar cursos** (Biblioteca, botão "Gerenciar"): lista os cursos importados com data e o que trouxeram (trilhas, páginas, mapas). **Excluir curso** pergunta:
   - **"Só o curso"** (padrão): sai da Biblioteca a área (se for do curso), os temas e trilhas, os ciclos dessas trilhas e os mapas que vieram com ele. O **notebook continua**, porque tem as anotações da pessoa. As páginas dele perdem a ligação com a trilha, mas o texto fica.
   - **"Tudo, inclusive o notebook e as anotações"**: pede confirmação com o número de páginas.

   Fontes usadas em outros notebooks nunca são apagadas.
4. **Registro dos cursos**: `study.packs` guarda `{ id, nome, importadoEm, partes }` a cada importação, com padrão vazio em `normalize()`. Cursos importados antes disso são reconhecidos pelo notebook `pk-<id>-nb`.
5. Testes: achar o JSON no meio do texto, erros explicados, excluir "só o curso" × "tudo", fonte compartilhada preservada, importar de novo depois de excluir.

## Decidido em 17/11: a IA entrega um ARQUIVO .md (não texto para copiar)
Pedido do Leonardo: copiar um texto longo da conversa é fácil de cortar um pedaço e quebrar o curso.
- O prompt pede para a IA **criar um arquivo `curso.md` para baixar**. Claude, ChatGPT e Gemini conseguem gerar arquivos para baixar. Se a IA não conseguir, ela mostra o mesmo conteúdo num bloco único, que tem o botão de copiar inteiro.
- No app: **"Escolher arquivo"** aceita `.md` (novo) e `.json` (como hoje). Colar texto continua como alternativa.
- **Markdown em vez de JSON:** a IA escreve markdown com muito menos erro (não precisa escapar aspas nem quebras de linha), e a pessoa consegue ler e conferir o arquivo antes de importar.
- **Arquivo cortado não passa:** o arquivo termina com a linha `<!-- fim do curso -->`. Sem ela, o app avisa "o arquivo veio incompleto, peça para a IA gerar de novo" e não importa nada pela metade.
- Por dentro, o app converte o `.md` para o mesmo pacote do M31: o resto (importar, juntar partes, gerenciar) não muda.

### Formato do arquivo `curso.md`
```
---
formato: central-pessoal/curso
versao: 1
id: excel-basico-ao-avancado
nome: Excel do básico ao avançado
area: Planilhas
area_descricao: Organizar e analisar dados
catalogo: prod
notebook: Excel
parte: 1
---

# Tema: Fundamentos

## Trilha: Primeiros passos
Descrição: Conhecer a tela e fazer a primeira planilha.

Texto da página de abertura da trilha (markdown).

### Tópico: A tela do Excel
Fontes: https://support.microsoft.com/excel

#### Explicação
Texto…

#### Exercício
1. …

### Tópico: Fórmulas básicas
Antes: A tela do Excel
…

# Fontes
- [Suporte do Excel](https://support.microsoft.com/excel) | doc | Documentação oficial

# Mapa: Fundamentos do Excel
- Excel
  - Tela
    - Faixa de opções
  - Fórmulas
    - SOMA

# Ciclo: Começar pelo básico | Primeiros passos

<!-- fim do curso -->
```
**Regras do formato:**
- `# Tema:`, `## Trilha:` e `### Tópico:` marcam a estrutura.
- Dentro dos textos, os títulos usam `####` (vira título 2 no editor) e `#####` (vira título 3).
- `Descrição:` (na trilha), `Fontes:` e `Antes:` (no tópico) são opcionais.
- O mapa é uma lista com 2 espaços por nível.
- A seção `# Fontes` usa `- [título](endereço) | tipo | nota`.
- A seção `# Ciclo:` usa "nome | trilha".

O prompt abaixo (em JSON) fica como **referência do conteúdo**; na construção, o prompt do app pede o arquivo `.md` neste formato, com as mesmas regras 1 a 9 (conteúdo didático, links reais, um mapa por tema, Parte 1/Parte 2 com o mesmo `id`).

## Prompt padrão (o app monta com o tema, o nível e o tamanho)
```
Você vai criar um curso para eu importar no app "Central Pessoal" (módulo Estudos).

TEMA DO CURSO: {tema}
NÍVEL: {nível}
TAMANHO: {curto: 1 tema, 2 trilhas, 4 a 6 tópicos cada | médio: 2 temas, 3 trilhas cada, 5 a 8 tópicos | completo: 3 a 4 temas, 3 trilhas cada, 6 a 10 tópicos}
IDIOMA: português do Brasil, linguagem simples.

Responda SOMENTE com um JSON válido (sem texto antes ou depois), exatamente neste formato:

{
  "formato": "central-pessoal/pacote-de-estudo",
  "versao": 1,
  "id": "nome-curto-sem-acentos-com-hifens",
  "nome": "Nome do curso",
  "area": { "nome": "Nome da área", "descricao": "Uma frase", "catalogo": "" },
  "notebook": { "nome": "Nome do notebook", "descricao": "Uma frase" },
  "temas": [
    {
      "nome": "Tema",
      "trilhas": [
        {
          "nome": "Trilha",
          "descricao": "Uma frase curta sobre a trilha",
          "pagina": "## Para que serve\nTexto de abertura da trilha.\n\n## O que você vai aprender\n- item\n- item",
          "topicos": [
            {
              "nome": "Tópico",
              "pagina": "## Explicação\nTexto didático com exemplos.\n\n## Exemplo\n...\n\n## Exercício\n1. ...\n\n> Dica: ...",
              "fontes": ["https://endereco-de-uma-fonte-listada-abaixo"]
            }
          ]
        }
      ]
    }
  ],
  "fontes": [ { "titulo": "Nome da fonte", "url": "https://...", "tipo": "site", "nota": "Por que usar" } ],
  "mapas": [ { "nome": "Mapa do curso", "raiz": { "texto": "Ideia central", "filhos": [ { "texto": "Ramo", "filhos": [ { "texto": "Sub-ramo" } ] } ] } } ],
  "ciclos": [ { "nome": "Ciclo 1", "trilha": "Nome exato de uma trilha" } ]
}

REGRAS:
1. "catalogo": use "idiomas", "dev", "ia", "prod" ou "carreira" se o curso for dessas áreas; senão deixe "".
2. Cada tópico tem uma "pagina" com: explicação clara, um exemplo prático e um exercício curto.
3. Nas páginas use só este markdown: ## título, ### subtítulo, - lista, 1. lista, > destaque, **negrito**, `código` e blocos de código com três crases. Sem tabelas, imagens ou links no texto.
4. Links só em "fontes", com endereços reais e conhecidos (documentação oficial, sites educativos, vídeos de canais confiáveis). Não invente endereços. Em "fontes" dos tópicos, repita exatamente a "url" de uma fonte da lista.
5. "tipo" da fonte: site, video, artigo, livro, pdf, doc, curso, podcast ou outro.
6. Faça 1 mapa mental por tema (no máximo 4 níveis, até 6 ramos), resumindo as ideias principais.
7. Crie 1 ciclo para a primeira trilha (a que a pessoa deve começar).
8. Use \n para quebras de linha dentro dos textos e escape aspas com \".
9. Se o curso for grande demais para uma resposta, faça só os primeiros temas e avise no final do campo "descricao" da área: "Parte 1". Depois eu peço a Parte 2 com o MESMO "id".
```

**Por que assim:** o formato é o mesmo do importador que já funciona. Pedir "somente JSON" e dar o modelo completo é o que mais reduz erros nas IAs. Ensinar a pedir "Parte 2 com o mesmo id" aproveita a regra "importar de novo só acrescenta", porque cursos grandes não cabem numa resposta só.

## Exportar curso em PDF (M37, ideia; para depois)
- Gerar um PDF com: capa (nome do curso e data), sumário, cada trilha com seus tópicos e situação (estudado ou não) e **o que a pessoa escreveu** nas páginas e subpáginas do notebook (com a formatação do editor), mais as fontes no fim.
- Recomendação técnica: montar uma página de impressão no próprio app e usar "Imprimir › Salvar como PDF" do celular ou computador. Funciona sem biblioteca nova e mantém a formatação. Mapas entram como desenho.
- Tamanho estimado: M. Depende do M36 (registro dos cursos).

## M38 (v0.124): ações no próprio curso
- Saíram o botão "Gerenciar (n)" e a tela "Meus cursos" (`#/estudos/cursos` agora abre a Biblioteca).
- Biblioteca: "Meus cursos e áreas" (cursos importados e áreas da pessoa) · "Referência" (áreas do app) · "Arquivados". Cada linha: tocar entra; ícone arquivar/trazer de volta; lixeira (não aparece nas áreas do app).
- Arquivar um curso guarda `pk-<curso>` em `archived`: os temas e trilhas dele somem das listas (`isHidden` em `estudos.ts`).
- Excluir área, tema ou trilha da pessoa: `removeMine` em `curso.ts` (saem temas, trilhas e ciclos; notebooks ligados ficam ou vão junto, com mapas; fontes ficam). Lixeira também nos temas e trilhas da pessoa, dentro da área e do tema.

## Coleções na Biblioteca (M40, pronto na v0.126)
Pedido: vários cursos são do mesmo assunto e deveriam ficar juntos na Biblioteca, em listas que recolhem e expandem e que a pessoa pode editar.
- **Coleção** = um grupo com nome criado pela pessoa (ex.: "Desenvolvimento com IA"), que recolhe e expande. Dentro dela ficam áreas e cursos importados.
- **Editar:** criar, renomear, mudar a ordem das coleções e dos itens, pôr e tirar itens, excluir a coleção. Excluir a coleção nunca apaga os cursos: eles voltam para as listas da Biblioteca.
- **Cada coisa num lugar só:** um item fica em uma coleção por vez; o que não está em nenhuma continua nas listas da Biblioteca.
- A coleção lembra se está aberta ou recolhida.
- **Prévia (18/11):** https://claude.ai/artifact/LYbXyJApv1xnVPdJ5S7bSS

### O que foi construído (v0.126)
- Biblioteca: seção **Coleções** (Nova, Organizar) logo abaixo do cartão de importar, antes de "Meus cursos e áreas" e "Referência" (do M38). O que está numa coleção sai dessas listas (cada coisa num lugar só) e volta para elas quando sai da coleção ou a coleção é excluída.
- Itens: as mesmas linhas da Biblioteca do M38: áreas (pelo id) e cursos importados (`pk-<id>`, inclusive os que ficam dentro de áreas do app, como Claude, GitHub e Central Pessoal). Dentro da coleção, cada linha mantém o toque para entrar e os ícones de arquivar e excluir.
- Coleção recolhida mostra os nomes do que tem dentro; o estado aberto/recolhido fica guardado.
- ⋯: renomear, pôr ou tirar itens (marcar um item de outra coleção mostra "Sai de…" e ele muda), subir, descer, excluir (os itens voltam para as listas).
- Organizar: setas para a ordem das coleções e dos itens; a pasta muda o item de coleção, tira de todas ou cria uma coleção nova com ele.
- Item arquivado some da coleção, mas volta para o mesmo lugar ao ser trazido de volta.
- Dados em `study.collections` (padrão vazio em `normalize()`; item repetido fica só na primeira coleção). Regras em `src/colecoes.ts`, 3 testes em `src/colecoes.test.ts`.

## Exportar notebook ou curso em PDF e Word (M37, ideias de 18/11)
Pedido: exportar um notebook (ou o curso inteiro) em PDF ou Word, mantendo a formatação e a hierarquia, com capa, anexos e referências.

### Estrutura do documento
1. **Capa:** nome da pessoa (de Você; se estiver vazio, pergunta na hora), nome do curso ou notebook, descrição, data, na fonte do app.
2. **Sumário:** trilhas, páginas e subpáginas numeradas (1, 1.1, 1.2…), com a situação de cada tópico (estudado, estudando, a estudar), se houver ciclo.
3. **Conteúdo:**
   - curso → título de cada **trilha**;
   - **página** → seção;
   - **subpágina** → subseção.

   Os títulos 1, 2 e 3 do editor descem um degrau dentro da página, para não brigar com a hierarquia. Ficam mantidos negrito, itálico, sublinhado, destaque, cores, listas, checklist (☑/☐), citação, código, divisor, alternantes (sempre abertos no papel), imagens e links clicáveis.
4. **Anexos:** os mapas mentais do notebook e das páginas, um por página.
5. **Referências:** as fontes do notebook e das páginas, numa lista (título, tipo, endereço, observação e onde foi usada).

### Mapas que não cabem
- O app mede o mapa. Se, ao caber na largura da folha, o texto ficaria pequeno demais para ler (menor que ~7 pt), tenta a **folha deitada** (paisagem).
- Se ainda assim não couber legível, **avisa antes de exportar**: "O mapa X é grande demais para uma folha". Oferece duas saídas: recolher ramos e exportar só até o 2º nível, ou deixar o mapa fora e baixar a imagem do mapa à parte.

### Como fazer (recomendação)
- **PDF (M37a):** o app monta uma **página de impressão** com tudo isso (papel branco, A4, numeração de páginas no rodapé, quebra de página antes de cada trilha e dos anexos) e abre o "Imprimir › Salvar como PDF" do celular ou do computador. Fica idêntico à formatação do app e os mapas saem nítidos (desenho vetorial), **sem biblioteca nova**. Testar no Android instalado e no iPhone (no iPhone o PDF sai pelo "Compartilhar").
- **Word (M37b):** gerar o `.docx` com a biblioteca **docx** (carregada só na hora de exportar). Os títulos viram os **estilos de título do Word**, então o painel de navegação e o sumário automático do Word funcionam. Listas, negrito, destaque e links são mantidos; os mapas entram como imagem (PNG). Alternativa mais barata, não recomendada: um ".doc" feito de HTML, que o Word abre com avisos e perde parte da formatação.
- **Ficha "Exportar"** (na capa do notebook e no ⋯ do curso na Biblioteca):
  - formato: PDF ou Word;
  - o que exportar: tudo, ou só uma página com as subpáginas;
  - o que incluir: capa, sumário, situação dos tópicos, mapas, referências, páginas vazias (desligado);
  - nome na capa.
- **Ideias extras:** cabeçalho com o nome do curso; rodapé "página X de Y"; data de exportação nas referências; lembrar as últimas escolhas.
