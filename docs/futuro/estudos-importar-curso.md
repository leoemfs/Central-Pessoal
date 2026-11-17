# Estudos: importar um curso feito por IA (M36) e exportar em PDF (M37)

> Situação: **especificado (17/11), prioridade alta** a pedido do Leonardo ("priorizar importação de cursos"). Aguardando o "pode fazer".
> Base que já existe: o importador de pacotes do **M31** (`src/studyPack.ts`, formato `central-pessoal/pacote-de-estudo`, v0.63), usado nos cursos M31, M32 e M33.

## O pedido
1. Uma área clara **"Deseja importar um curso?"** em Estudos.
2. Um **prompt padrão** para a pessoa colar numa IA (Claude, ChatGPT, Gemini…). A IA devolve o curso pronto: área, temas, trilhas, tópicos com texto, notebook com páginas e subpáginas, fontes (links) e mapas mentais.
3. A pessoa **cola a resposta** da IA no app e importa.
4. Na Biblioteca, **"Gerenciar cursos"** para ver e excluir cursos importados.
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

## O que falta construir (M36, tamanho M)
1. **"Deseja importar um curso?"**: cartão em Estudos (abaixo do bloco principal) e na Biblioteca. Abre a tela de importar, em 3 passos:
   1. **Copiar o prompt**: campo "Sobre o que é o curso?" (ex.: "Excel do básico ao avançado"), nível (iniciante, intermediário, avançado) e tamanho (curto, médio, completo). O app monta o prompt e mostra **Copiar**.
   2. **Colar a resposta**: caixa de texto grande. Aceita a resposta inteira da IA, mesmo com texto antes ou depois e com as crases de bloco de código: o app acha o JSON sozinho.
   3. **Conferir e importar**: resumo do que vai entrar (temas, trilhas, tópicos, páginas, fontes e mapas). Se der erro, explica em português o que faltou, com o botão "Copiar pedido de correção" (manda a mensagem de erro para a IA corrigir).

   Continuam valendo "Escolher arquivo" e "Endereço", como hoje.
2. **Mapa ligado a uma página**: `mapas[].pagina` (opcional) = nome de uma trilha ou tópico; o mapa aparece em "Mapas desta página".
3. **Gerenciar cursos** (Biblioteca, botão "Gerenciar"): lista os cursos importados com data e o que trouxeram (trilhas, páginas, mapas). **Excluir curso** pergunta:
   - **"Só o curso"** (padrão): sai da Biblioteca a área (se for do curso), os temas e trilhas, os ciclos dessas trilhas e os mapas que vieram com ele. O **notebook continua**, porque tem as anotações da pessoa. As páginas dele perdem a ligação com a trilha, mas o texto fica.
   - **"Tudo, inclusive o notebook e as anotações"**: pede confirmação com o número de páginas.

   Fontes usadas em outros notebooks nunca são apagadas.
4. **Registro dos cursos**: `study.packs` guarda `{ id, nome, importadoEm, partes }` a cada importação, com padrão vazio em `normalize()`. Cursos importados antes disso são reconhecidos pelo notebook `pk-<id>-nb`.
5. Testes: achar o JSON no meio do texto, erros explicados, excluir "só o curso" × "tudo", fonte compartilhada preservada, importar de novo depois de excluir.

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
