# Módulo Estudos e Carreira (N6)

> Situação: **ideia, especificando** (08/11). Documento original do Leonardo recebido na conversa; aqui fica o resumo e as decisões.
> **Layout ainda não definido:** será decidido junto com o Leonardo. Nada aqui é desenho de tela.

## Para que serve
Um espaço pessoal para organizar, explorar e desenvolver conhecimentos. **Não é** plataforma de cursos, escola nem sistema de exercícios.
Mistura de: biblioteca de conhecimentos, trilhas de referência, ciclos pessoais de estudo, caderno digital e central de fontes.

**Princípio:** o app dá uma estrutura inicial; a pessoa escolhe o que estudar, em que ordem e em que ritmo.

## As peças (cada uma é uma coisa diferente)
| Peça | O que é | De quem é |
|---|---|---|
| **Biblioteca** | Catálogo: Área → Tema → Nível/percurso → Trilha → Tópicos. Flexível (nem toda área tem níveis). | Do app (referência) |
| **Roadmaps** | Os roteiros de referência da Biblioteca, vistos juntos. | Do app (referência) |
| **Ciclos** | Seleção pessoal de tópicos de uma trilha para um período, com ordem, estados e progresso. | Da pessoa |
| **Meus notebooks** | Caderno digital: assuntos/seções com anotações, links, vídeos, PDFs, fontes, mapas, projetos, histórico. Pode existir sem trilha. | Da pessoa |
| **Fontes** | Acervo de referências (título, endereço, categoria), ligáveis a um ou mais notebooks/assuntos. | Da pessoa |
| **Mapas mentais** | Organização visual dos assuntos. Primeira versão sem editor gráfico complexo. | Da pessoa |

Fluxo exemplo: Biblioteca → Idiomas → Inglês → A1 → Trilha "Primeiros contatos" → escolher tópicos → Ciclo → Notebook → anotações e fontes. Também dá para começar direto por um notebook.

## Regras (o que já está decidido pelo documento)
- Escolher tópicos para um ciclo **não remove, não altera e não reordena** a trilha original.
- Recomendações ("estude pronomes antes de perguntas com to be") são **avisos, nunca bloqueios**.
- Ciclos sucessivos: ao terminar, criar outro com tópicos ainda não estudados, revisar, trocar de trilha.
- Progresso do ciclo conta só os tópicos do ciclo (não confundir com o progresso da biblioteca).
- Estados dos tópicos: disponível, selecionado, em andamento, concluído.
- A pessoa pode adicionar áreas e temas, ocultar ou arquivar áreas. **Arquivar não apaga** o conteúdo original; o catálogo do app fica separado da organização pessoal.
- Evitar a palavra "matérias" e tudo com cara de escola, painel ou loja de cursos.
- Áreas iniciais: Idiomas, Desenvolvimento de software, Inteligência artificial, Produtividade (só Inglês A1 bem preenchido como exemplo).

## Recomendação técnica (para quando construir)
- **Catálogo** (áreas, trilhas, tópicos recomendados) vem num arquivo do app, só leitura. **Camada pessoal** (áreas criadas, ocultas/arquivadas, ciclos, notebooks, fontes, mapas) no IndexedDB, com padrões em `normalize()`. Assim, atualizar o catálogo nunca mexe no que é da pessoa.
- Ligações por ID (fonte ↔ notebook/assunto, ciclo ↔ trilha), para uma fonte servir a vários estudos.
- Depois, pode dar XP de INT na Jornada (N2). Fora do escopo agora.

## Barra de baixo (proposta pela regra de navegação, a confirmar)
- Casa no centro: **Estudos** (página principal: Biblioteca e Meus notebooks).
- Esquerda: **Ciclos** (planejar: o que estou estudando agora).
- Direita: **Roadmaps** (olhar a referência de outro jeito).
- **Fontes** e **Mapas mentais**: atalhos na página principal (cada coisa num lugar só; o que vai para a barra sai dos atalhos).
- **Botão +:** novo notebook, nova fonte, novo mapa, novo ciclo, nova área; por último, separado, **Categorias** (de fontes).

Pontos abertos:
1. Roadmaps e Biblioteca mostram as mesmas trilhas por dois caminhos. Decidir se Roadmaps é uma visão própria (barra) ou só um jeito de ver a Biblioteca.
2. Biblioteca e Meus notebooks: duas áreas na página principal ou abas no topo?
3. Nome curto no app (topo e barra): "Estudos"?

## Tamanho e divisão
Total: **G**. Dividir em partes, uma versão cada:
| Parte | O que entra | Tam. |
|---|---|---|
| N6.0 | Prévia visual navegável (`estudos_e_carreira.html`, Artifact) para decidir o layout juntos | M |
| N6.1 | Página principal, Biblioteca (catálogo + áreas pessoais, ocultar/arquivar), trilhas e Roadmaps | M |
| N6.2 | Ciclos: escolher tópicos, ordem, estados, progresso, ciclos seguintes | M |
| N6.3 | Meus notebooks: assuntos, anotações, links e materiais | M |
| N6.4 | Fontes (ligadas a notebooks) e Mapas mentais simples | M |

## Fora do escopo
Exercícios, provas e avaliações; integração com serviços externos; mudar o resto do app.
