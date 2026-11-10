# Estudos 2.0: notebooks com páginas, editor, mapas e sincronização (N11)

> Situação: **N11.1 pronta na v0.26 (10/11)**; as outras partes aguardam aprovação, uma de cada vez. Documento do Leonardo "Módulo Estudos: evolução funcional e experiência de uso" recebido na conversa; aqui ficam o resumo, as recomendações e a divisão em partes.
> Nada aqui está construído. Base atual: `modulo-estudos.md` (v0.21).

## Objetivo
Estudos vira um ambiente de **descobrir, escolher, estudar, registrar e organizar**. Inspirações (só o melhor de cada uma, sem copiar): Notion (edição livre em blocos), NotebookLM (notebooks com fontes) e GitMind (mapas mentais).

## Três regras que valem para tudo
1. **A Biblioteca não é do notebook.** O conteúdo do app é referência; usar não altera a fonte.
2. **O notebook é da pessoa.** Atualizar a Biblioteca nunca sobrescreve anotações.
3. **Sincronizar não é substituir um arquivo pelo outro.** Preserva dados e trata versões diferentes; em conflito, a pessoa escolhe.

E uma quarta, do editor: **o celular pode ter menos botões, nunca menos conteúdo.** Tudo o que é criado no computador aparece igual no celular.

## O que muda em relação ao que existe (v0.21)
| Hoje | Passa a ser |
|---|---|
| Notebook = assuntos, cada um com blocos de anotação, termos e fontes | Notebook = **páginas e subpáginas**, cada página com blocos de texto rico. Os assuntos atuais viram páginas (migração em `normalize()`, sem perda) |
| Notebook ligado a **uma** trilha | Notebook reúne tópicos de **várias áreas**; cada página guarda de onde veio (origem) |
| Na trilha: marcar tópicos → "Montar ciclo" | Na trilha: marcar tópicos → **"Adicionar ao notebook"** (existente ou novo) e, se quiser, "Montar ciclo" |
| Tópico da Biblioteca = só o nome | Tópico pode ter **conteúdo** (introdução, conceitos, exemplos, exercícios, referências), só leitura |
| Mapa = centro + ramos + detalhes, editado em formulário | Mapa = **árvore** com sub-ramos, zoom, arrastar, recolher, cores, edição direta |
| Backup geral em Configurações (substitui tudo) | **Exportar/importar Estudos** juntando os dois lados, com aviso de conflito |

## Partes (uma versão cada, na ordem recomendada pelo documento)
| Parte | O que entra | Tam. |
|---|---|---|
| **N11.1 Estrutura dos notebooks** | Páginas e subpáginas (1 nível de subpágina para começar); descrição do notebook; "Adicionar ao notebook" a partir de qualquer trilha (várias áreas no mesmo notebook); origem guardada em cada página; migração dos assuntos atuais; ciclos continuam funcionando | M |
| **N11.2a Editor, base** | Blocos: texto, H1/H2/H3, lista, lista numerada, checklist, citação, divisor; negrito, itálico, sublinhado, destaque, link; transformar um bloco em outro; mover blocos (botões no celular, arrastar no computador). Barra simples no celular, completa no computador | M |
| **N11.2b Editor, extras** | Alternantes (recolher/expandir), cores de texto, imagens (junto com M14, por causa do tamanho do backup) | M |
| **N11.3 Mapas mentais** (absorve o M15) | Árvore com sub-ramos, criar/editar/excluir/mover nós, recolher, cores por nível, zoom e arrastar (pinça no celular), "ajustar à tela", salvar sozinho, alvos de toque grandes; mapa dentro do notebook, ligado a páginas | M a G |
| **N11.4 Sincronização manual** | Exportar e importar só Estudos; juntar por item usando a data de alteração; lista de conflitos com "ficar com este aparelho / com o arquivo / com os dois"; registro do que foi excluído para não "ressuscitar" itens | M |
| **N11.5 Tutorial e testes de uso** | Tutorial contextual de 6 passos (reabrível); os 7 cenários de teste do documento, simulados em computador e celular; correções | M |
| **N11.6 Preparar a conta** | Só documento: garantir id, data de alteração e exclusões em tudo; junta com o N9 (conta Google) | P |
| **N11.7 Conteúdo da Biblioteca** | Textos dos tópicos (introdução, conceitos, exemplos, exercícios). Começar por uma trilha-piloto (Inglês A1 › Primeiros contatos) e crescer aos poucos | P por trilha |

## Recomendações técnicas
- **Editor:** usar uma biblioteca pronta e madura de edição em blocos (**Tiptap**, baseada em ProseMirror) em vez de escrever um editor do zero. Editor de texto rico feito à mão é a parte que mais dá defeito (cursor, colar, celular). Custo: será a **primeira biblioteca externa** do app além do React, e o app fica um pouco mais pesado; carregar só ao abrir uma página de notebook.
- **Formato guardado:** a página guarda a lista de blocos em JSON (o formato do editor), igual no computador e no celular. É isso que garante a regra "menos botões, nunca menos conteúdo" e a exportação sem perder formatação.
- **Mapas:** desenho próprio em SVG com arrastar e pinça; sem biblioteca de diagramas. Layout automático (a pessoa reorganiza a árvore, não posiciona pixel a pixel): mais simples e funciona no celular.
- **Sincronização:** cada notebook, página, mapa, fonte e ciclo com `updatedAt`; exclusões no registro `deleted` que o app já tem. Junta item a item; conflito = os dois lados mudaram depois da última sincronização.
- **Computador × celular:** a mesma tela, com a barra de ferramentas completa a partir de 900px de largura (o app já tem esse corte) e a barra simples abaixo disso.
- **Hierarquia da Biblioteca:** o documento pede Área → Assunto → Trilha → Tópico. Hoje existe um "nível" opcional (Inglês › A1 › trilha). Recomendo manter como está: o nível só aparece onde faz sentido e o caminho na tela já orienta.

## Decidido (10/11: "seguir as sugestões")
1. **Ciclos continuam.** A barra da trilha tem "Notebook" e "Montar ciclo".
2. **Editor com biblioteca pronta** (Tiptap), na N11.2.
3. **Subpáginas: um nível.**

## O que foi construído (v0.26, N11.1)
- Notebook com **descrição**, **páginas** e **subpáginas** (um nível). Capa do notebook: lista de páginas em árvore, ciclos ligados, fontes, mapas e histórico. Cada página tem sua tela, com caminho no topo, subpáginas e anterior/próxima.
- **Organizar:** subir e descer entre irmãs; editar para renomear, mudar de lugar (principal ou dentro de outra) e excluir (leva as subpáginas, com confirmação).
- **Trilha › "Notebook":** leva os tópicos marcados para um notebook existente ou novo, sem repetir. Um notebook junta tópicos de várias trilhas e áreas; a página mostra "Da Biblioteca: …" e a situação no ciclo.
- Ao montar um ciclo, o app sugere o notebook que já tem páginas daqueles tópicos.
- **Migração:** os "assuntos" antigos viram páginas principais em `normalize()`, com os mesmos blocos. Cada página tem `updatedAt` (base da sincronização da N11.4).
- Blocos continuam os de antes (anotação, termos, fontes); o editor rico entra na N11.2a.
- Regras em `src/estudos.ts` (`pageTree`, `movePage`, `setPageParent`, `removePage`, `addTopicsAsPages`), 2 testes novos.

## Fora do escopo agora
Sincronização automática por login (fica no N9), PDFs e documentos dentro do app (M14), colaboração, IA que lê as fontes.
