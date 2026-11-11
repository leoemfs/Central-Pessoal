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

**Módulos** (10 que funcionam):

| Módulo | Dados dele | Usa de outros | Entrega para outros | Regras e testes |
|---|---|---|---|---|
| **Finanças** (despesas, receitas, cartões, vales, caixinhas, orçamento, relatórios) | despesas, séries, categorias, receitas, fontes, cartões, vales, caixinhas, orçamentos | Listas (despesa de "Concluir compra"), Você (caixinha sugerida), Carreira (salário após aumento) | Início, Agenda (contas e compras no cartão do dia), Revisão, Busca, Jornada, Listas (categoria Mercado) | `finance.ts`, `incomes.ts`, `boxes.ts`, `budget.ts` |
| **Agenda** (compromissos, tarefas, Próximos) | compromissos, tarefas | Finanças (contas e cartão), Núcleo (hábitos marcáveis), Diário (registros do dia), Você (compromissos sugeridos), Carreira (reuniões, passos das vagas, prazos e entregas, automático) | Início, Revisão, Busca, Jornada | `upcoming.ts` |
| **Diário** (registros, Humor, Revisão) | registros, humor do dia | Humor, Mente ("Três coisas boas") e Revisão viram registros | Início, Agenda, Revisão, Busca, Jornada | `mood.ts`, `review.ts` |
| **Núcleo pessoal** (rituais, hábitos, mente, corpo, treino em casa) | hábitos, práticas, última carga, meta de treinos da semana, links de vídeo dos exercícios | Você (hábitos sugeridos), Mente e Corpo (marcam o hábito ligado) | Início, Agenda, Revisão, Jornada (atributos e XP), Humor (dias com treino) | `habits.ts`, `practices.ts` |
| **Listas** (listas, Preços, Compras) | categorias de listas, listas, produtos, marcas, lojas, preços, compras | Finanças (categorias) | Finanças (despesa "Mercado · loja"), Início (listas fixadas) | `lists.ts` |
| **Estudos** | estudos (áreas, trilhas, ciclos, notebooks, fontes, mapas) | nada (isolado) | Início ("Estudando agora"), Revisão ("O que estudei"), Carreira (ciclos concluídos viram curso no currículo); N7 vai ligar à Jornada | `estudos.ts`, `estudosCatalogo.ts` |
| **Carreira** (vagas, trabalho atual, reuniões, projetos, currículo) | carreira (vagas, cargos, salários, reuniões, projetos, currículo) | Estudos (ciclos concluídos, só leitura) | Agenda (tudo com data entra sozinho e se atualiza), Finanças (aumento atualiza o salário, se você quiser) | `carreira.ts` |
| **Você** | perfil | Núcleo (hábitos) e Caixinhas (para sugerir) | Núcleo (hábito), Agenda (compromissos), Finanças (caixinha), Início | `profile.ts` |
| **Notas** | notas | nada | Busca | — |
| **Jornada** (bloqueada) | ajustes da Jornada | Finanças, Agenda, Diário, Núcleo (dias de uso, XP, ouro) | nada por enquanto | `journey.ts`, `jornada/` |

**Telas que juntam tudo** (mexeu num módulo, conferir estas): **Início** (quase todos), **Revisão semanal** (Finanças, caixinhas, vales, Agenda, Diário, Núcleo e práticas, humor, Estudos), **Busca** (todos os módulos; dentro de um módulo, busca só nele).
**Partes do app todo:** barra de baixo (`moduleBar.ts`), lápis dos cartões (`cardLayout.ts`), temas (`theme.ts`), backup (`data.ts`).
**Em breve** (sem código): Saúde (N1, módulo próprio) e Objetivos (N10, módulo próprio). Lembretes, Foco e Banco de ideias **não viram módulos**: Lembretes = Agenda + Notificações (N3); Foco = Núcleo › Mente (M16); Ideias = Notas (M17).

## Caixa de entrada
*Ideias e problemas ainda sem classificar. Uma linha cada, com a data.*

- 08/11: anexar os slides das apresentações (sexta sim, sexta não: avanços do setor de repasse e gestão de contratos de prestadores) dentro da reunião. Hoje só dá para guardar o link. Junta com "anexar PDF ou imagem" de Estudos. Entra no **N9.3** (anexos guardados no Drive).
- 08/11: Estudos: cronograma de estudos com calendário dentro do módulo, sincronizado com a Agenda do app.
- 08/11: Você: perguntas de carreira (emprego atual, carreira desejada, melhorias na atual, caminhos até a desejada) para a carreira desejada orientar os tópicos sugeridos em Estudos. Conferir com N10 (Objetivos) e N8.

## Itens
| ID | Item | Frente | Tam. | Prior. | Situação | Documento |
|---|---|---|---|---|---|---|
| M8 | Cartão: escolher em qual fatura a compra entra e mostrar a fatura aberta no cartão (evita a confusão de "compra sumiu") | MOD | P | média | pronto (v0.36) | `futuro/correcao-fatura-cartao.md` |
| E8 | Navegação padronizada: regra abas × barra × botão +; Núcleo (Progresso · Núcleo · Histórico), Agenda (Hoje · Agenda · Próximos), Listas (Compras · Listas · Preços, sem abas); Orçamento/Relatórios sem botões repetidos em Finanças; Categorias de Listas no botão +; mês e abas num bloco que some e volta junto | EXP | M | alta | pronto (v0.19) | `futuro/navegacao-v2.md` |
| E9 | Barra: o módulo favorito **fica na mesma posição** ao entrar nele (Finanças 1º, Diário 2º, Agenda 3º); só os outros dois espaços viram as ferramentas do módulo, na ordem. Módulo que não é favorito entra no centro. | EXP | P | alta | pronto (v0.20.1) | `futuro/navegacao-v2.md` |
| E10 | Barra: **escolha em Configurações** de como o módulo aparece ao entrar nele: "favorito no mesmo lugar" (v0.20.1) ou "módulo ao lado do Início" (e talvez "no centro"). Padrão a definir depois de ~3 dias de teste. Comparar na prévia "Três jeitos da barra". | EXP | P | média | pronto (v0.25) | `futuro/navegacao-v2.md` |
| E11 | Botão **voltar** (do celular): numa ferramenta da barra (ex.: Finanças / Orçamento), voltar leva para a **casa do módulo** (Finanças); voltar de novo leva para o **Início**. Não percorre todo o caminho de telas já abertas. | EXP | P | alta | pronto (v0.25) | `futuro/navegacao-v2.md` |
| E12 | Trocar de módulo sem passar pelo Início: tocar de novo no módulo em que você está mostra os favoritos na barra | EXP | P | alta | pronto (v0.25) | `futuro/navegacao-v2.md` |
| E13 | Configurações › **Personalização**: tema e cor, favoritos do Início, jeito da barra (favorito no mesmo lugar, ao lado do Início ou no centro), "tocar de novo mostra os favoritos" e "esconder as barras ao rolar" | EXP | P | alta | pronto (v0.25) | `futuro/navegacao-v2.md` |
| E15 | Configurações: tirar os atalhos "Categorias de Finanças" e "Categorias de Listas" (11/11). Elas já ficam no botão + de cada módulo; segue a regra "cada coisa em um lugar só" | EXP | P | média | pronto (v0.43.1) | — |
| C2 | Hábitos: nome do hábito aparecia uma letra por linha quando havia "Não falhe 2x" e "Iniciar" no cartão | COR | P | alta | pronto (v0.18) | — |
| C10 | **Telas quebradas no computador** (10/11, prints): botão + vira uma faixa oval na largura toda (Estudos › notebook); Início com cartões esticados na tela inteira; Listas com título e chips desalinhados do conteúdo; Finanças com o bloco mês + abas mais estreito que os cartões. No celular está ok | COR | P | alta | pronto (v0.27.1) | — |
| C12 | **Telas quebradas no celular** (11/11, prints): "Monte o app do seu jeito" com os botões Começar e Agora não altos e estreitos; Configurações com "Como usar a barra" estourando o cartão (a tela dava zoom e rolava para o lado); zoom com dois dedos desligado no app (o mapa mental de Estudos continua com o zoom dele) | COR | P | alta | pronto (v0.38.1) | — |
| C3 | **Registro defeituoso deixa o app em branco**: conferir os campos ao abrir os dados, tela de erro com saída (exportar, recarregar, Configurações) e "desfazer importação" | COR | M | **alta** | pronto (v0.30) | `auditoria-2026-11.md` |
| C4 | Salvamento de reserva pode perder dados em silêncio (avisar e usar a cópia mais nova) | COR | P | média | ideia | `auditoria-2026-11.md` |
| C5 | Rodar os testes em todo PR e antes de publicar (hoje só compila) | COR | P | média | pronto (v0.29.1) | `auditoria-2026-11.md` |
| C6 | Sequência de hábitos lenta para quem nunca falha (86 ms com 5 anos e 25 hábitos) | COR | P | média | ideia | `auditoria-2026-11.md` |
| C7 | Gravar por coleção, só o que mudou (hoje regrava o banco inteiro a cada toque) | COR | M | média | ideia | `auditoria-2026-11.md` |
| C8 | Faturas agrupadas numa passada só (Início, Agenda, Próximos) | COR | P | baixa | ideia | `auditoria-2026-11.md` |
| C9 | Segurança: política de conteúdo (CSP), conferir links, bloqueio do app (PIN/digital) e backup com senha | COR | M | média | ideia | `auditoria-2026-11.md` |
| M18 | Início mais leve: cada cartão só recalcula quando o seu dado muda | MOD | M | baixa | ideia | `auditoria-2026-11.md` |
| M19 | Carregar Estudos, Carreira e Jornada só ao abrir (app inicial menor) | MOD | P | baixa | ideia | `auditoria-2026-11.md` |
| M20 | Limpeza: tirar 6 funções e 8 estilos sem uso, dividir arquivos grandes e os estilos por módulo, trocar `confirm()` por confirmação do app | MOD | M | baixa | ideia | `auditoria-2026-11.md` |
| N3.3 | **Níveis de notificação** (baixa, média, alta, personalizado) com "Me lembrar" e sino; parte 1 sem Android: marcações + lista de avisos dos próximos 7 dias | NOVO | M | média | especificado (simulado) | `futuro/notificacoes.md` |
| M1 | Hábitos: pausar e arquivar | MOD | P | alta | pronto (v0.32) | `futuro/habitos-pausar-arquivar.md` |
| E14 | **Primeira abertura**: entrevista de toque (áreas → módulos à vista → 3 favoritos → ritmo do Diário → barra e cor → **Jornada: o que é e se quer ou não**) e **tutorial interativo da barra** (6 passos); quem já usa recebe uma vez o convite "Monte o app do seu jeito" (entrevista já preenchida com o que usa hoje, ou só o tutorial) e pode refazer em Personalização; Mais › Como usar a barra. Junta com o resto do E1 (ocultar módulos e ritmo do Diário) | EXP | M | **1ª** | pronto (v0.31) | `futuro/primeira-abertura.md` |
| E1 | Favoritos e módulos: os 3 do meio da barra no Início são os favoritos (escolhidos pela pessoa); ocultar módulos; ordem no Mais; Orçamento e Relatórios saem do Mais; ritmo de cada módulo (Diário) | EXP | M | alta | quase pronto: favoritos e Mais (v0.18), ocultar módulos e ritmo do Diário (v0.31); falta só a ordem no Mais | `futuro/modulos-personalizaveis.md`, `futuro/navegacao-v2.md` |
| E2 | Barra adaptativa: Início e Mais fixos; dentro do módulo, 3 ícones do próprio módulo (casa no centro); só ícones, um pouco maiores; topo mostra "Finanças / Orçamento"; segurar o ícone mostra o nome | EXP | M | alta | pronto (v0.18) | `futuro/navegacao-v2.md` |
| E3 | Personalizar cartões (lápis ao lado da lupa): no Início e nos módulos, ocultar e reordenar cartões; cartões principais fixos (🔒); Humor sempre no topo do Início; avisos importantes nunca ocultos, só mudam de posição | EXP | M | alta | pronto: Início e Finanças (v0.20); Agenda, Núcleo, Listas, Estudos e Carreira (v0.34) | `futuro/navegacao-v2.md` |
| E4 | Temas: escuro, claro e automático + cor de destaque (paleta com bom contraste). Padrão: escuro = preto e verde; claro = branco e azul escuro | EXP | M | média | pronto (v0.17) | `futuro/navegacao-v2.md` |
| E7 | Ícones: cada módulo com um ícone próprio e coerente (Núcleo = broto, Orçamento = medidor, Caixinha = cofrinho, Você = pessoa); antes Núcleo e Orçamento usavam o mesmo | EXP | P | média | pronto (v0.17) | — |
| E5 | Abas internas: deslizar o dedo para trocar de aba e abas presas no topo ao rolar | EXP | P | alta | pronto (v0.16) | `futuro/navegacao-v2.md` |
| E6 | Busca por módulo: a lupa pesquisa dentro do módulo aberto (ex.: nomes de despesas em Finanças); no Início, busca geral | EXP | P | média | pronto (v0.35) | `futuro/navegacao-v2.md` |
| M9 | Finanças: botão + com menu (despesa, receita, cartão, caixinha e, separado, Categorias); categorias passam a morar dentro de Finanças | MOD | P | alta | pronto (v0.16) | `futuro/navegacao-v2.md` |
| M10 | Finanças: "Já pago" e "Em aberto" clicáveis, abrindo a lista filtrada | MOD | P | alta | pronto (v0.16) | `futuro/navegacao-v2.md` |
| M2 | Preços 2.0, parte 1: a lista puxa os produtos de Preços e estima com faixa de preço, sem prender a uma loja | MOD | M | média | especificado | `futuro/precos-v2.md` (itens 2 e 3) |
| M3 | Preços 2.0, parte 2: "quanto custou aqui?" ao marcar o item e histórico de compras | MOD | M | média | especificado | `futuro/precos-v2.md` (item 4) |
| M4 | Preços 2.0, parte 3: tipos de loja e filtro; editar, excluir e juntar produtos, marcas e lojas | MOD | M | média | especificado | `futuro/precos-v2.md` (itens 1 e 4) |
| M5 | Agenda: repetição (toda semana, mês, ano) e aniversários | MOD | M | média | ideia | — (especificar antes) |
| M6 | Núcleo: fichas de treino próprias (exercícios, séries, descanso). Pode entrar depois no M21 ("crie o seu próprio") | MOD | M | média | especificado | `futuro/nucleo-mente-corpo.md` |
| M7 | Revisão semanal mais completa: autocuidado, caixinhas e vales da semana | MOD | P | baixa | pronto (v0.38) | `futuro/nucleo-mente-corpo.md`, `futuro/caixinhas.md` |
| N1 | Módulo Saúde (água, sono, remédios, consultas, peso) | NOVO | G | média | especificado | `futuro/modulo-saude.md` |
| N2 | Jornada completa (pixel art): missões no ritmo da pessoa, recompensas por módulo, raridades (comum a místico), Forja e Codex por coleções | NOVO | G | baixa | especificado | `futuro/modulo-rpg.md`, `futuro/jornada-recompensas.md`, `futuro/jornada-raridades.md` |
| N3 | Notificações e **lembretes** (tarefa ou compromisso com "me lembrar"; sai o "Lembretes, em breve" do menu). Afeta: Agenda, Carreira | NOVO | M | baixa | especificado | `futuro/notificacoes.md` |
| N3.1 | Notificações já no app (sem servidor): **"Lembrar no celular"** (a parte da agenda passa a ser o **N9.5**, pelo Google Agenda) (compromisso, conta, revisão → agenda do celular, hora certa, Android e iPhone) e **bolinha no ícone** do app com o que está pendente hoje | NOVO | P | média | ideia | `futuro/notificacoes.md` |
| N3.2 | **Resumo do dia** no Android (Chrome, app instalado): o celular acorda o app ~1 vez por dia e avisa "2 contas vencem amanhã" (sem hora certa) | NOVO | M | baixa | ideia | `futuro/notificacoes.md` |
| N4 | App Android (preparo conferido em 10/11: 10 pontos de adaptação, passo a passo da mudança e lista de testes) | NOVO | G | baixa | especificado | `futuro/app-android.md` |
| N5 | Código de barras, base de produtos e nota fiscal | NOVO | G | baixa | ideia | `futuro/precos-v2.md` ("Mais adiante") |
| N6 | Módulo Estudos e Carreira: Biblioteca (áreas, trilhas, tópicos de referência), Ciclos pessoais, Meus notebooks, Fontes, Mapas mentais e Roadmaps | NOVO | G | média | pronto (v0.21), em teste por 3 dias | `futuro/modulo-estudos.md` |
| N8.5 | Carreira × Agenda automática: tudo que tem data em Carreira (reuniões, passos das vagas e, depois, projetos) aparece sozinho na Agenda do app e se atualiza quando muda; some se for excluído. Sem botão "Pôr na Agenda" | NOVO | P | alta | pronto (v0.24) | `futuro/modulo-carreira.md` |
| N8.6 | Carreira: **Projetos do trabalho** (ex.: repasse, contratos de prestadores) com prazo, entregas com data, situação e ligação com as reuniões; prazos e entregas na Agenda | NOVO | M | alta | pronto (v0.24) | `futuro/modulo-carreira.md` |
| M11 | Estudos no dia a dia: cartão "Estudando agora" no Início e "O que estudei" na Revisão semanal. Afeta: Início, Revisão | MOD | P | alta | pronto (v0.33) | `futuro/modulo-estudos.md` |
| M12 | Estudos: lápis para subir, descer e ocultar cartões (como no Início e em Finanças). Afeta: só Estudos | MOD | P | média | pronto (v0.34) | `futuro/modulo-estudos.md`, `futuro/navegacao-v2.md` |
| M13 | Estudos: busca dentro do módulo (tópicos, notebooks, fontes); parte do E6. Afeta: Busca | MOD | P | média | pronto (v0.35) | `futuro/modulo-estudos.md`, `futuro/navegacao-v2.md` |
| M14 | Estudos: anexar PDF ou imagem no notebook (hoje só link). Afeta: backup (arquivos pesados). Feito junto com o **N9.3** | MOD | M | baixa | ideia | `futuro/modulo-estudos.md` |
| M15 | Estudos: editor de mapas mentais (arrastar e ligar ideias). Afeta: só Estudos | MOD | M | baixa | pronto na N11.3 (v0.28) | `futuro/modulo-estudos.md` |
| N9 | Sincronizar com o Google Drive: pasta escondida do app, tudo sincroniza sozinho entre computador e celular, fotos no Diário, anexos PDF/imagem, exportar para pasta visível. Partes N9.0 (preparar dados, absorve N11.6) a N9.4. Não depende mais do N4. *Na conversa do Android foi anotado como N8; o código certo é N9.* | NOVO | G | alta | em andamento: N9.0 (v0.39) e N9.1 (v0.40) prontos; ID do cliente Google configurado (v0.40.1); login testado pelo Leonardo em 11/11; N9.2 pronto (v0.41), no ar e conferido em 11/11; **N9.3a fotos no Diário pronto (v0.42)**; próximo N9.3b (PDFs anexados) | `futuro/sincronizar-google.md` |
| N9.5 | **Lembretes pelo Google Agenda** (11/11): o app cria a agenda "Central Pessoal" no Google e põe compromissos (com Carreira), contas a pagar e tarefas com data, com aviso; muda no app → muda no Google; só de ida. O celular avisa pelo app Google Agenda enquanto não há notificações (substitui o .ics do N3.1). Afeta: Agenda, Finanças, Carreira, Configurações | NOVO | M | alta | pronto (v0.43); falta o Leonardo ativar a API e a permissão no Google Cloud | `futuro/google-agenda.md` |
| N10 | Módulo **Objetivos**: central de **todas as metas do app** (caixinhas, hábitos, ciclos de estudo, carreira, orçamento, metas do Você), com criar, editar e concluir dali; a meta continua morando no módulo dela. Objetivos grandes juntam várias metas. Absorve as metas de carreira (N8.4). Partes: N10.0 prévia, N10.1 central de metas, N10.2 objetivos grandes. Afeta: Finanças, Núcleo, Estudos, Carreira, Você, Início, Jornada | NOVO | G | média | especificado (prévia antes) | `futuro/modulo-objetivos.md` |
| M16 | **Foco** no Núcleo › Mente: temporizador de foco (ex.: 25 min + pausa), com histórico; ligado a um tópico de Estudos conta tempo de estudo. Afeta: Núcleo, Estudos, Revisão | MOD | P | média | ideia | — |
| M17 | **Banco de ideias** em Notas: aba "Ideias" e o botão "transformar em" tarefa, objetivo ou notebook. Afeta: Notas, Agenda, Estudos | MOD | P | baixa | ideia | — |
| N11 | **Estudos 2.0**: notebooks com páginas e subpáginas e tópicos de várias áreas; editor de texto em blocos (completo no computador, simples no celular); mapas mentais em árvore com zoom; exportar/importar Estudos com tratamento de conflito; tutorial; conteúdo nos tópicos da Biblioteca. Partes N11.1 a N11.7. Absorve o M15. Afeta: Estudos, backup | MOD | G | alta | parte pronta: N11.1 páginas (v0.26), N11.2 editor (v0.27) e N11.3 mapas mentais (v0.28); faltam N11.4 a N11.7 | `futuro/estudos-v2.md` |
| C11 | Estudos, editor: as cores do texto ficavam paradas no meio da página ao rolar; agora ficam presas logo abaixo da barra de formatação e rolam junto | COR | P | alta | pronto (v0.28.1) | `futuro/estudos-v2.md` |
| M21 | Treino em casa (Núcleo › Corpo; fichas A, B e C continuam): meta da semana, abas Sem equipamento · Com equipamento, 8 partes do corpo em 3 níveis, treino guiado, link de vídeo em cada exercício; bonecos animados próprios nos exercícios e nos alongamentos. Afeta: Núcleo, Início, Revisão, Humor, Jornada | MOD | M | média | pronto (v0.29) | `futuro/modulo-treinos.md` |
| M22 | Carreira › Currículo: **gerar o currículo em PDF** (baixar, compartilhar e, com o N9, salvar no Drive). Não depende do Google; pedido em 11/11 junto com o N9. **Pode aguardar** (11/11) | MOD | P | baixa | ideia | `futuro/sincronizar-google.md` ("PDFs") |
| N7 | Estudos × Jornada: XP, ouro e INT por tópico, ciclo e constância; selos, Coruja e missões | NOVO | M | baixa | especificado (só documento) | `futuro/estudos-jornada.md` |
| N8 | Módulo Carreira (próprio, fora de Estudos): vagas e candidaturas, metas de carreira, currículo e conquistas, trabalho atual (cargos, salários, feedbacks). Dividido em N8.0 a N8.4 | NOVO | G | média | parte pronta: Vagas (v0.22), Trabalho e Reuniões (v0.23), Projetos e Agenda automática (v0.24), Currículo (v0.37); falta N8.4 Metas (agora dentro de Objetivos, N10) | `futuro/modulo-carreira.md` |

**Depende de outra coisa:** N3 fica melhor junto com N4 (notificações de verdade no Android). N2 e N5 dependem de decisões e integrações.

## Fila aprovada
*O que pode ser construído, na ordem. Vazia = nada para construir.*

**Aprovado em 11/11 ("pode fazer", fila toda).** Feito nesta sessão, tudo no PR #38: C5 (v0.29.1), C3 (v0.30), E14 + resto do E1 (v0.31), M1 (v0.32), M11 (v0.33), lápis E3 + M12 (v0.34), busca E6 + M13 (v0.35), M8 (v0.36), N8.3 Currículo (v0.37) e M7 (v0.38).

**O que continua aprovado, na ordem:**
0. **N9 Sincronizar com o Google Drive** (G, aprovado em 11/11: "pode começar"), em partes: ~~N9.0 preparar os dados~~ (v0.39) → ~~N9.1 conta Google e cópia na nuvem~~ (v0.40) → ~~N9.2 sincronizar~~ (v0.41) → N9.3 fotos e PDFs (~~N9.3a fotos no Diário~~ v0.42; N9.3b PDFs) → N9.4 exportar. Uma parte por vez, conforme o uso do dia. Ver `futuro/sincronizar-google.md`.
1. **N10 Objetivos** (G): primeiro a **prévia N10.0** (visual), depois N10.1 central de metas (inclui as metas de carreira, antigo N8.4). Precisa da prévia antes de construir.
2. **M2 → M3 → M4 Preços 2.0** (M cada, já especificados).
3. **M6** fichas de treino próprias (M).
4. **M5** Agenda com repetição e aniversários (especificar antes).
5. Resto do E1: ordem dos módulos no Mais (P).
6. Depois: N7, N1, N2, N3, N4, N5 (M14 vai junto com o N9.3).

**Pacotes** (histórico): B (Finanças) v0.16; A (Navegação) v0.18, v0.20, v0.31 e v0.34; D (Temas) v0.17; E6 na v0.35.

## Feito
| Versão | O que entrou | PR |
|---|---|---|
| v0.43.1 | E15: Configurações sem os atalhos de Categorias (ficam só no botão + de Finanças e de Listas). Tinha ficado de fora do #39, que foi mesclado antes | #45 |
| v0.43 | N9.5: lembretes no Google Agenda (agenda "Central Pessoal" com compromissos, contas e tarefas, aviso no celular, só de ida) + correção: a junção de configurações passa a ser campo a campo | #46 |
| v0.42 | N9.3a: fotos no Diário (até 6 por registro, tela cheia), guardadas no aparelho e sincronizadas pelo Drive; foto tirada ou registro excluído some nos dois aparelhos | #44 |
| v0.41 | N9.2: sincronização automática entre aparelhos (ao abrir, ao voltar, a cada 5 min e depois de cada mudança), juntando item por item: o que foi criado em cada aparelho fica nos dois, vale a alteração mais recente, exclusão não "ressuscita". Saiu a escolha de cópia | #43 |
| v0.40.1 | N9.1: ID do cliente Google configurado; o cartão "Conta Google" aparece em Configurações | #42 |
| v0.40 | N9.1: Configurações › Conta Google: entrar com Google, cópia automática dos dados na pasta escondida do Drive, "Salvar agora", "Trazer da nuvem", aviso quando outro aparelho salvou depois (usar a da nuvem ou manter a deste), "Continuar salvando" quando o acesso vence e aviso no Início se a cópia parar. Aparece quando o ID do cliente Google for configurado | #41 |
| v0.39 | N9.0: dados preparados para sincronizar (data de alteração e exclusões registradas em todos os módulos, num lugar só; ids estáveis para parcelas, contas fixas, receitas, recargas e categorias padrão). Nada muda na tela | #40 |
| v0.38.1 | C12: botões da "Monte o app do seu jeito" no tamanho certo, botões de Configurações › Personalização quebram linha em vez de estourar a tela, e zoom com dois dedos desligado (mapa mental mantém o zoom próprio) | #39 |
| v0.38 | M7: Revisão semanal com "Autocuidado e dinheiro guardado" (minutos de meditação e respiração, treinos, alongamentos e caminhadas; guardado e tirado das caixinhas; gasto e saldo dos vales) | #38 |
| v0.37 | N8.3 Carreira › Currículo: abas Trabalho · Currículo; experiências, formação, cursos e certificados, idiomas, habilidades e conquistas (com resultado); "Trazer de Estudos" põe ciclos concluídos como curso; "Item no currículo" no botão + | #38 |
| v0.36 | M8: ao lançar no cartão, "Entra na fatura de" com a fatura calculada já marcada e as vizinhas para trocar (também ao editar; parcelas e conta fixa seguem a escolhida); aviso ao salvar; o cartão mostra a fatura aberta (e a que vence no mês, se for outra); linha "No cartão este mês" na aba Mês | #38 |
| v0.35 | E6 + M13: a lupa busca dentro do módulo aberto ("Em Finanças" · "Em tudo"); a busca passou a achar também cartões, vales, caixinhas, hábitos, listas e itens, produtos, notebooks e páginas, fontes, mapas, trilhas e tópicos, vagas, reuniões e projetos | #38 |
| v0.34 | E3 + M12: lápis para subir, descer e ocultar cartões também na Agenda (calendário fixo), no Núcleo › Rituais (Hoje fixo; cada período é um cartão), em Listas (cada categoria é um cartão), em Estudos (bloco principal fixo) e em Carreira (Trabalho atual fixo) | #38 |
| v0.33 | M11: cartão "Estudando agora" no Início (ciclos em andamento, progresso e o tópico da vez) e "O que estudei" na Revisão semanal (tópicos concluídos, dias com anotação e ciclos) | #38 |
| v0.32 | M1: pausar hábitos (até uma data ou sem data; a sequência congela e não conta falta) e arquivar (sai de tudo, histórico fica; comemora a marca do hábito a abandonar), com seções Pausados e Arquivados no Núcleo | #38 |
| v0.31 | E14 + resto do E1: montagem do app na primeira abertura (áreas, módulos à vista, favoritos, ritmo do Diário, barra e cor, Jornada), tutorial da barra em 6 passos, convite "Monte o app do seu jeito" para quem já usa, módulos guardados no Mais e cartão do ritmo do Diário no Início | #38 |
| v0.30 | C3: dados com defeito não deixam mais o app em branco (cada registro é conferido ao abrir; o que não tem conserto fica guardado à parte), tela de erro com Exportar backup / Recarregar / Configurações, e "Desfazer importação" (também desfaz "apagar tudo") | #38 |
| v0.29.1 | C5: os testes rodam em todo PR (✅/❌ no PR) e antes de publicar; se falharem, nada é publicado | #38 |
| v0.29 | M21 Treino em casa no Núcleo › Corpo: meta da semana, Sem/Com equipamento, 8 partes do corpo × 3 níveis, treino guiado, link de vídeo; 47 bonecos animados próprios (exercícios e alongamentos). A ficha "Treino em casa" antiga passou a se chamar "Circuito em casa" | #37 |
| v0.28.1 | C11: paleta de cores do editor acompanha a barra ao rolar | #36 |
| v0.28 | N11.3 Estudos 2.0: mapas mentais em árvore (ramos e sub-ramos, editar, mover, mudar de ramo, recolher, cores, zoom, arrastar e pinça, salva sozinho), ligados a notebook ou página; mapas antigos convertidos | #35 |
| v0.27.1 | C10: telas alinhadas no computador (coluna central de 980 px para cabeçalho, cartões e chips) | — |
| v0.27 | N11.2a e b Estudos 2.0: editor de texto nas páginas dos notebooks (títulos, listas, checklist, citação, divisor, alternante, negrito, itálico, sublinhado, destaque, cores, link, imagem, mover blocos); barra simples no celular e completa no computador; anotações antigas convertidas | #33 |
| v0.26 | N11.1 Estudos 2.0, parte 1: notebooks com páginas e subpáginas, descrição, "Adicionar ao notebook" na trilha (tópicos de várias áreas no mesmo notebook, com a origem guardada), organizar páginas; os assuntos antigos viraram páginas | #32 |
| v0.25.1 | Personalização: o jeito escolhido da barra fica marcado ("✓ em uso") e aparece um aviso ao trocar | — |
| v0.25 | E10, E11 e E13: Personalização em Configurações (jeito da barra, favoritos, tocar de novo, esconder ao rolar) e o voltar do celular: ferramenta → casa do módulo → Início | — |
| v0.25 | E12: tocar de novo no módulo aberto mostra os favoritos, para trocar de módulo direto | — |
| v0.24 | N8.5 + N8.6: tudo de Carreira com data aparece sozinho na Agenda (e abre a ficha ao tocar); Projetos do trabalho com prazo, entregas e ligação com reuniões | #24 |
| v0.23 | N8.2: Trabalho atual (cargos, salários escondidos até tocar, aumento atualiza Finanças se você quiser) e Reuniões (pauta, combinados, link dos slides, Agenda, repetição a cada 2 semanas) | #24 |
| v0.22 | N8.1: módulo Carreira com Vagas (etapas, próximo passo, Agenda, encerradas e histórico); Estudos passa a se chamar só "Estudos" | #24 |
| v0.21 | N6: módulo Estudos e Carreira (Biblioteca com 5 áreas e 45 trilhas, ciclos, notebooks, fontes, mapas mentais e roadmaps; barra Ciclos · Estudos · Roadmaps). Integração com a Jornada só documentada (N7) | #23 |
| v0.20.1 | E9: o módulo favorito fica na mesma posição da barra ao entrar nele; as ferramentas ocupam os outros dois espaços | #22 |
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
| Carreira (N8.0): Trabalho, Currículo, Vagas com etapas, Metas, botão + e cartão no Início | https://claude.ai/artifact/3DxpiHU7f6merD3dk6Hqmp |
| Três jeitos da barra de baixo (centro, favorito fixo, ao lado do Início) — E9/E10 | https://claude.ai/artifact/BYyRT9QPSLYnNUJr2Ga5pN |
| Primeira abertura: entrevista, módulos, favoritos e tutorial da barra (E14, construído na v0.31) | https://claude.ai/artifact/Ky4NT9oh9tZQKv9FksYYCz |
| Central Pessoal (prévia geral antiga) | https://claude.ai/artifact/WHbDkKXN4LArCQ8sjuQqVt |

## Regras para construir
- Uma versão por item (v0.15.1, v0.16…), com testes das regras, teste no navegador (celular) e documentação atualizada.
- Conferir o **Mapa dos módulos**: testar também os módulos ligados e atualizar o mapa se uma ligação mudar.
- Nada muda para quem já usa o app sem aviso: dados antigos continuam valendo, e o que for novo começa como hoje.
- Português simples nas telas. Visual igual ao do app: preto, verde e cartões.
