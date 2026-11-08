# Central de melhorias

> O único lugar para registrar, classificar, priorizar e acompanhar o desenvolvimento. Substitui o antigo `docs/futuro/ROADMAP.md`.
> As especificações detalhadas ficam em `docs/futuro/` (um documento por ideia). O manual do app é o `README.md`.

## Como usar
1. **Anotar:** qualquer ideia ou problema entra na **Caixa de entrada**, em uma linha, do jeito que foi dito.
2. **Classificar:** vira um item na tabela, com frente, tamanho, prioridade e situação.
3. **Especificar:** quando for a vez dele, ganha (ou atualiza) um documento em `docs/futuro/`.
4. **Aprovar:** só com o "aprovado" do Leonardo o item entra na **Fila aprovada**.
5. **Construir:** só o que está na fila, um PR por item. Ao terminar, vai para **Feito**.

**Frentes:** `EXP` Experiência e navegação · `MOD` Melhorias nos módulos existentes · `COR` Correções e estabilidade · `NOVO` Expansão e integração.
**Tamanho** (quanto do limite de uso consome): `P` pequeno (uma conversa curta) · `M` médio (uma sessão de construção) · `G` grande (várias sessões; dividir em partes).
**Prioridade:** `alta` · `média` · `baixa`.
**Situação:** `ideia` → `especificado` → `aprovado` → `construindo` → `pronto (vX)`.

## Mapa dos módulos
*O que cada módulo usa dos outros e o que entrega para eles. Serve para melhorar um módulo sem quebrar os demais.*

**Como usar o mapa:**
- Todo item da tabela que mexe em um módulo ganha, no documento dele, a linha **"Afeta:"** com os módulos ligados (pegue daqui).
- Antes de construir, conferir as ligações do módulo; depois, testar também os módulos ligados (não só o que mudou).
- Mudou uma ligação (nova, removida ou diferente)? Atualizar este mapa no mesmo PR.
- Todos os dados ficam num só lugar (`src/data.ts`); campo novo sempre com valor padrão em `normalize()`.

**Módulos** (9 que funcionam):

| Módulo | Dados dele | Usa de outros | Entrega para outros | Regras e testes |
|---|---|---|---|---|
| **Finanças** (despesas, receitas, cartões, vales, caixinhas, orçamento, relatórios) | despesas, séries, categorias, receitas, fontes, cartões, vales, caixinhas, orçamentos | Listas (despesa de "Concluir compra"), Você (caixinha sugerida) | Início, Agenda (contas e compras no cartão do dia), Revisão, Busca, Jornada, Listas (categoria Mercado) | `finance.ts`, `incomes.ts`, `boxes.ts`, `budget.ts` |
| **Agenda** (compromissos, tarefas, Próximos) | compromissos, tarefas | Finanças (contas e cartão), Núcleo (hábitos marcáveis), Diário (registros do dia), Você (compromissos sugeridos) | Início, Revisão, Busca, Jornada | `upcoming.ts` |
| **Diário** (registros, Humor, Revisão) | registros, humor do dia | Humor, Mente ("Três coisas boas") e Revisão viram registros | Início, Agenda, Revisão, Busca, Jornada | `mood.ts`, `review.ts` |
| **Núcleo pessoal** (rituais, hábitos, mente, corpo) | hábitos, práticas, última carga | Você (hábitos sugeridos), Mente e Corpo (marcam o hábito ligado) | Início, Agenda, Revisão, Jornada (atributos e XP), Humor (dias com treino) | `habits.ts`, `practices.ts` |
| **Listas** (listas, Preços, Compras) | categorias de listas, listas, produtos, marcas, lojas, preços, compras | Finanças (categorias) | Finanças (despesa "Mercado · loja"), Início (listas fixadas) | `lists.ts` |
| **Estudos e Carreira** | estudos (áreas, trilhas, ciclos, notebooks, fontes, mapas) | nada (isolado) | nada por enquanto (N7 vai ligar à Jornada) | `estudos.ts`, `estudosCatalogo.ts` |
| **Você** | perfil | Núcleo (hábitos) e Caixinhas (para sugerir) | Núcleo (hábito), Agenda (compromissos), Finanças (caixinha), Início | `profile.ts` |
| **Notas** | notas | nada | Busca | — |
| **Jornada** (bloqueada) | ajustes da Jornada | Finanças, Agenda, Diário, Núcleo (dias de uso, XP, ouro) | nada por enquanto | `journey.ts`, `jornada/` |

**Telas que juntam tudo** (mexeu num módulo, conferir estas): **Início** (quase todos), **Revisão semanal** (Finanças, Agenda, Diário, Núcleo, humor), **Busca** (Diário, Finanças, Agenda, Notas).
**Partes do app todo:** barra de baixo (`moduleBar.ts`), lápis dos cartões (`cardLayout.ts`), temas (`theme.ts`), backup (`data.ts`).
**Em breve** (sem código): Saúde, Objetivos, Foco, Banco de ideias.

## Caixa de entrada
*Ideias e problemas ainda sem classificar. Uma linha cada, com a data.*

- (vazia)

## Itens
| ID | Item | Frente | Tam. | Prior. | Situação | Documento |
|---|---|---|---|---|---|---|
| M8 | Cartão: escolher em qual fatura a compra entra e mostrar a fatura aberta no cartão (evita a confusão de "compra sumiu") | MOD | P | média | especificado | `futuro/correcao-fatura-cartao.md` |
| E8 | Navegação padronizada: regra abas × barra × botão +; Núcleo (Progresso · Núcleo · Histórico), Agenda (Hoje · Agenda · Próximos), Listas (Compras · Listas · Preços, sem abas); Orçamento/Relatórios sem botões repetidos em Finanças; Categorias de Listas no botão +; mês e abas num bloco que some e volta junto | EXP | M | alta | pronto (v0.19) | `futuro/navegacao-v2.md` |
| E9 | Barra: o módulo favorito **fica na mesma posição** ao entrar nele (Finanças 1º, Diário 2º, Agenda 3º); só os outros dois espaços viram as ferramentas do módulo, na ordem. Módulo que não é favorito entra no centro. | EXP | P | alta | pronto (v0.20.1) | `futuro/navegacao-v2.md` |
| C2 | Hábitos: nome do hábito aparecia uma letra por linha quando havia "Não falhe 2x" e "Iniciar" no cartão | COR | P | alta | pronto (v0.18) | — |
| M1 | Hábitos: pausar e arquivar | MOD | P | alta | especificado | `futuro/habitos-pausar-arquivar.md` |
| E1 | Favoritos e módulos: os 3 do meio da barra no Início são os favoritos (escolhidos pela pessoa); ocultar módulos; ordem no Mais; Orçamento e Relatórios saem do Mais; ritmo de cada módulo (Diário) | EXP | M | alta | parte pronta (v0.18): favoritos e Mais; falta ocultar módulos, ordem no Mais e ritmo do Diário | `futuro/modulos-personalizaveis.md`, `futuro/navegacao-v2.md` |
| E2 | Barra adaptativa: Início e Mais fixos; dentro do módulo, 3 ícones do próprio módulo (casa no centro); só ícones, um pouco maiores; topo mostra "Finanças / Orçamento"; segurar o ícone mostra o nome | EXP | M | alta | pronto (v0.18) | `futuro/navegacao-v2.md` |
| E3 | Personalizar cartões (lápis ao lado da lupa): no Início e nos módulos, ocultar e reordenar cartões; cartões principais fixos (🔒); Humor sempre no topo do Início; avisos importantes nunca ocultos, só mudam de posição | EXP | M | alta | parte pronta (v0.20): Início e Finanças; falta Agenda, Núcleo e Listas | `futuro/navegacao-v2.md` |
| E4 | Temas: escuro, claro e automático + cor de destaque (paleta com bom contraste). Padrão: escuro = preto e verde; claro = branco e azul escuro | EXP | M | média | pronto (v0.17) | `futuro/navegacao-v2.md` |
| E7 | Ícones: cada módulo com um ícone próprio e coerente (Núcleo = broto, Orçamento = medidor, Caixinha = cofrinho, Você = pessoa); antes Núcleo e Orçamento usavam o mesmo | EXP | P | média | pronto (v0.17) | — |
| E5 | Abas internas: deslizar o dedo para trocar de aba e abas presas no topo ao rolar | EXP | P | alta | pronto (v0.16) | `futuro/navegacao-v2.md` |
| E6 | Busca por módulo: a lupa pesquisa dentro do módulo aberto (ex.: nomes de despesas em Finanças); no Início, busca geral | EXP | P | média | ideia | `futuro/navegacao-v2.md` |
| M9 | Finanças: botão + com menu (despesa, receita, cartão, caixinha e, separado, Categorias); categorias passam a morar dentro de Finanças | MOD | P | alta | pronto (v0.16) | `futuro/navegacao-v2.md` |
| M10 | Finanças: "Já pago" e "Em aberto" clicáveis, abrindo a lista filtrada | MOD | P | alta | pronto (v0.16) | `futuro/navegacao-v2.md` |
| M2 | Preços 2.0, parte 1: a lista puxa os produtos de Preços e estima com faixa de preço, sem prender a uma loja | MOD | M | média | especificado | `futuro/precos-v2.md` (itens 2 e 3) |
| M3 | Preços 2.0, parte 2: "quanto custou aqui?" ao marcar o item e histórico de compras | MOD | M | média | especificado | `futuro/precos-v2.md` (item 4) |
| M4 | Preços 2.0, parte 3: tipos de loja e filtro; editar, excluir e juntar produtos, marcas e lojas | MOD | M | média | especificado | `futuro/precos-v2.md` (itens 1 e 4) |
| M5 | Agenda: repetição (toda semana, mês, ano) e aniversários | MOD | M | média | ideia | — (especificar antes) |
| M6 | Núcleo: fichas de treino próprias (exercícios, séries, descanso) | MOD | M | média | especificado | `futuro/nucleo-mente-corpo.md` |
| M7 | Revisão semanal mais completa: autocuidado, caixinhas e vales da semana | MOD | P | baixa | especificado | `futuro/nucleo-mente-corpo.md`, `futuro/caixinhas.md` |
| N1 | Módulo Saúde (água, sono, remédios, consultas, peso) | NOVO | G | média | especificado | `futuro/modulo-saude.md` |
| N2 | Jornada completa (pixel art): missões no ritmo da pessoa, recompensas por módulo, raridades (comum a místico), Forja e Codex por coleções | NOVO | G | baixa | especificado | `futuro/modulo-rpg.md`, `futuro/jornada-recompensas.md`, `futuro/jornada-raridades.md` |
| N3 | Notificações | NOVO | M | baixa | especificado | `futuro/notificacoes.md` |
| N4 | App Android | NOVO | G | baixa | especificado | `futuro/app-android.md` |
| N5 | Código de barras, base de produtos e nota fiscal | NOVO | G | baixa | ideia | `futuro/precos-v2.md` ("Mais adiante") |
| N6 | Módulo Estudos e Carreira: Biblioteca (áreas, trilhas, tópicos de referência), Ciclos pessoais, Meus notebooks, Fontes, Mapas mentais e Roadmaps | NOVO | G | média | pronto (v0.21), em teste por 3 dias | `futuro/modulo-estudos.md` |
| M11 | Estudos no dia a dia: cartão "Estudando agora" no Início e "O que estudei" na Revisão semanal. Afeta: Início, Revisão | MOD | P | alta | ideia | `futuro/modulo-estudos.md` |
| M12 | Estudos: lápis para subir, descer e ocultar cartões (como no Início e em Finanças). Afeta: só Estudos | MOD | P | média | ideia | `futuro/modulo-estudos.md`, `futuro/navegacao-v2.md` |
| M13 | Estudos: busca dentro do módulo (tópicos, notebooks, fontes); parte do E6. Afeta: Busca | MOD | P | média | ideia | `futuro/modulo-estudos.md`, `futuro/navegacao-v2.md` |
| M14 | Estudos: anexar PDF ou imagem no notebook (hoje só link). Afeta: backup (arquivos pesados) | MOD | M | baixa | ideia | `futuro/modulo-estudos.md` |
| M15 | Estudos: editor de mapas mentais (arrastar e ligar ideias). Afeta: só Estudos | MOD | M | baixa | ideia | `futuro/modulo-estudos.md` |
| N7 | Estudos × Jornada: XP, ouro e INT por tópico, ciclo e constância; selos, Coruja e missões | NOVO | M | baixa | especificado (só documento) | `futuro/estudos-jornada.md` |

**Depende de outra coisa:** N3 fica melhor junto com N4 (notificações de verdade no Android). N2 e N5 dependem de decisões e integrações.

## Fila aprovada
*O que pode ser construído, na ordem. Vazia = nada para construir.*

- (vazia: aguardando aprovação)

**Semana de Estudos (09 a 13/11), sugerida, aguardando aprovação:** um item por dia, dentro do limite de 10%.
| Dia | Item | Tam. |
|---|---|---|
| Seg 09/11 | M11: Estudos no Início e na Revisão | P |
| Ter 10/11 | M12: lápis em Estudos | P |
| Qua 11/11 | M13: busca em Estudos | P |
| Qui 12/11 | N7, parte 1: XP e ouro por tópico e ciclo na Jornada | M |
| Sex 13/11 | Folga ou ajustes do que você notar no uso (M14 e M15 ficam para depois) | — |

**Pacotes** (cada um numa sessão, porque mexem nas mesmas partes):
- **B, Finanças:** M9 + M10 + E5 (pequeno). **Pronto na v0.16.**
- **A, Navegação:** E2 + E1 + E3 (médio a grande; prévia visual antes). **A1 (E2 + favoritos do E1) pronto na v0.18. A2 (E3, lápis) no Início e em Finanças na v0.20.** Falta o lápis nos outros módulos e o resto do E1.
- **D, Temas:** E4 (+ E7, ícones). **Pronto na v0.17.**
- **Depois:** E6.

**Ordem sugerida** (quando aprovar): M1 → resto do E1 → lápis nos outros módulos → E6 → M2 → M3 → M4 → M5 → M6 → M7 → M8 → N1.

## Feito
| Versão | O que entrou | PR |
|---|---|---|
| v0.21 | N6: módulo Estudos e Carreira (Biblioteca com 5 áreas e 45 trilhas, ciclos, notebooks, fontes, mapas mentais e roadmaps; barra Ciclos · Estudos · Roadmaps). Integração com a Jornada só documentada (N7) | #23 |
| v0.20.1 | E9: o módulo favorito fica na mesma posição da barra ao entrar nele; as ferramentas ocupam os outros dois espaços | — |
| v0.20 | A2: lápis ao lado da lupa para subir, descer e ocultar cartões no Início e em Finanças (Humor e resumo do mês fixos; avisos nunca somem) | #20 |
| v0.19 | Navegação padronizada (E8): telas Progresso, Histórico, Próximos e Compras; Preços como tela; Categorias de Listas no +; cabeçalho mês + abas em bloco | #19 |
| v0.18 | A1: barra de baixo só com ícones, favoritos do Início, barra própria em cada módulo, topo "Módulo / Aba", tela de Humor, Orçamento e Relatórios fora do Mais; abas que somem e voltam com a barra de cima | #17 |
| v0.17 | Pacote D: Temas com cor de destaque (8 cores; padrão verde no escuro e azul no claro; cores de situação fixas) e ícones sem repetição entre módulos | #16 |
| v0.16 | Pacote B: menu do + em Finanças com Categorias (saíram de Configurações), "Já pago" e "Em aberto" clicáveis, abas presas no topo e trocar de aba deslizando (Finanças, Núcleo, Agenda, Listas) | #15 |
| v0.15 | Vale (VR/VA) em Cartões: saldo, recarga mensal e pagar com vale | #13 |
| v0.14 | Listas com categorias, Preços, humor do dia, orçamento por categoria e relatórios | — |
| v0.13 | Caixinhas em Finanças | — |
| v0.12 | Você (entrevista e sugestões) e Núcleo Mente/Corpo | — |
| até v0.11 | Finanças, Agenda, Diário, Núcleo, Receitas, revisão semanal, atributos e Jornada bloqueada (14 dias) | ver PRs no GitHub |

Documentos sem código: Mapa dos módulos (08/11), módulos personalizáveis, pausar e arquivar, ROADMAP e Central (#14 e seguintes).

**Descartado:** C1 "compra no cartão novo some da fatura" (08/11): não era problema do app, a compra estava sendo marcada na fatura errada. A parte útil virou o item M8.

## Prévias visuais guardadas
| Prévia | Link |
|---|---|
| App: Você, Núcleo Mente/Corpo e entrevista | https://claude.ai/artifact/H2ZUAVPQtyuFoCqBAE7yRk |
| Orçamento, relatórios, listas, preços e humor | https://claude.ai/artifact/3PiFTWyQaBYrgfScRRFxsj |
| Jornada (pets, Codex, acessórios, visitas) | https://claude.ai/artifact/LDdQDmTYY3j56etqqMc9Qc |
| Jornada RPG (avatar, arsenal, forja) | https://claude.ai/artifact/62xbF4H9CfYjaz7RaX554h |
| Navegação 2.0: barra só com ícones, favoritos e lápis (E1, E2, E3) | https://claude.ai/artifact/4hm9BrHkSWd1nEwLz5p2j7 |
| Estudos e Carreira (N6.0): Biblioteca, trilhas, ciclos, notebooks, fontes, mapas e roadmaps | https://claude.ai/artifact/WJ3kw4zvwtdDKTiUVUB3rD |
| Central Pessoal (prévia geral antiga) | https://claude.ai/artifact/WHbDkKXN4LArCQ8sjuQqVt |

## Regras para construir
- Uma versão por item (v0.15.1, v0.16…), com testes das regras, teste no navegador (celular) e documentação atualizada.
- Conferir o **Mapa dos módulos**: testar também os módulos ligados e atualizar o mapa se uma ligação mudar.
- Nada muda para quem já usa o app sem aviso: dados antigos continuam valendo, e o que for novo começa como hoje.
- Português simples nas telas. Visual igual ao do app: preto, verde e cartões.
