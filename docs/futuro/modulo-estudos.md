# Módulo Estudos e Carreira (N6)

> Situação: **pronto na v0.21 (08/11)**, para testar por pelo menos 3 dias antes de novos ajustes. Documento original do Leonardo recebido na conversa; aqui fica o resumo e as decisões.
> Nome: **Estudos e Carreira** (antes pensado como "Estudos e trabalho").
> **Prévia N6.0 (08/11):** https://claude.ai/artifact/WJ3kw4zvwtdDKTiUVUB3rD. Aprovada: abas e telas, cartões Biblioteca/Notebooks/Fontes/Mapas, "Estudando agora", ciclos e o caminho de navegação descrito no topo.
> Integração com a Jornada: só documentada, em `estudos-jornada.md`.

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

## Barra de baixo (aprovada e construída)
- Casa no centro: **Estudos** (página principal: Biblioteca e Meus notebooks).
- Esquerda: **Ciclos** (planejar: o que estou estudando agora).
- Direita: **Roadmaps** (olhar a referência de outro jeito).
- **Fontes** e **Mapas mentais**: atalhos na página principal (cada coisa num lugar só; o que vai para a barra sai dos atalhos).
- **Botão +:** novo notebook, nova fonte, novo mapa, novo ciclo, nova área; por último, separado, **Categorias** (de fontes).

Decidido:
1. Roadmaps é uma visão própria, na barra: todas as trilhas por área, com filtro e progresso. A Biblioteca é o caminho de explorar.
2. Biblioteca, Meus notebooks, Fontes e Mapas mentais formam o **bloco principal fixo** da página de Estudos, sempre no topo. Não há abas.
3. Nome curto na barra: "Estudos". No topo: "Estudos e Carreira" na casa e "Estudos / Ciclos" nas outras telas.
4. Botão + (em todas as telas de Estudos, menos na trilha, que tem a barra "Montar ciclo"): novo ciclo, notebook, fonte, mapa e trilha sua. Por último, separado, **Áreas e temas** (as "categorias" da Biblioteca). Dentro de um notebook, ele também oferece "Novo assunto" e "Anotação neste assunto".
5. O caminho ("Biblioteca › Idiomas › Inglês › A1") aparece no alto de cada tela, e cada parte leva até ela.

## O que foi construído (v0.21)
- **Biblioteca** com 5 áreas, 27 temas, 45 trilhas e 205 tópicos: Idiomas (Inglês A1 a C1, Espanhol A1 e A2, Outros idiomas vazio), Desenvolvimento de software, Inteligência artificial, Produtividade e **Carreira** (área nova, pelo nome do módulo). Tem fontes sugeridas em várias trilhas e 6 mapas sugeridos para copiar.
- A pessoa cria áreas, temas e trilhas suas (tópicos um por linha) e arquiva ou traz de volta áreas.
- **Trilha:** marcar tópicos; aviso de recomendação com "Incluir"; situação de cada tópico (estudado, estudando, no ciclo); fontes sugeridas com "Guardar"; notebooks da trilha.
- **Ciclos:** montar (nome, ordem, notebook novo, existente ou nenhum); a situação do tópico muda com um toque; finalizar, encerrar, reabrir, renomear e excluir; montar o próximo com os tópicos livres.
- **Notebooks:** assuntos (abas que rolam para o lado e Anterior/Próximo), blocos de anotação, termos ("termo = significado") e fontes; mapas, ciclos ligados e histórico.
- **Fontes:** cadastro (título, endereço, tipo, observação, notebooks), filtro por tipo e sugestões da Biblioteca.
- **Mapas mentais:** desenho radial; editar a ideia central, os ramos e os detalhes; ligar a um notebook.
- Dados em `AppData.study` (com padrão em `normalize()`; entra no backup). Catálogo em `src/estudosCatalogo.ts`, regras em `src/estudos.ts` (7 testes), telas em `src/modules/estudos/`.

## Ideias do Leonardo (08/11, para especificar depois dos testes)
- **N8 · Cronograma de estudos:** calendário dentro de Estudos (quando estudar cada tópico ou ciclo), sincronizado com a Agenda principal do app.
- **N9 · Carreira vira um módulo próprio (decidido em 08/11):** Estudos e Carreira passam a ser **dois módulos independentes**, cada um com sua barra, desenvolvidos um de cada vez, cada um focado no que se propõe. O módulo **Carreira** terá projetos, apresentações e o acompanhamento da carreira atual e da carreira que está sendo construída. A ideia anterior, de duas abas com a barra mudando junto, foi descartada.
  - A decidir quando especificar: o módulo atual passa a se chamar só "Estudos"? A área Carreira da Biblioteca (trilhas de currículo, entrevistas…) fica em Estudos e aparece como atalho no módulo Carreira?

## Fica para depois (anotar na Central quando aparecer)
- Editor gráfico de mapas (arrastar e ligar ideias).
- Anexar PDF ou imagem dentro do app (hoje, só o link).
- Lápis para personalizar os cartões de Estudos e cartão "Estudando agora" no Início.
- Busca dentro do módulo (item E6).
- "O que estudei" na Revisão semanal (ver `estudos-jornada.md`).

## Tamanho e divisão
Total: **G**. Dividir em partes, uma versão cada:
| Parte | O que entra | Tam. |
|---|---|---|
| N6.0 | Prévia visual navegável (`estudos_e_carreira.html`, Artifact) para decidir o layout juntos | M · feito |
| N6.1 a N6.4 | Página principal, Biblioteca, Roadmaps, Ciclos, Notebooks, Fontes e Mapas | construídos juntos na v0.21, a pedido do Leonardo |

## Fora do escopo
Exercícios, provas e avaliações; integração com serviços externos; mudar o resto do app.
