# Central Pessoal

Aplicativo pessoal para organizar a vida num lugar só: **finanças, diário, agenda, tarefas, hábitos e anotações**.
O usuário registra; o app organiza, calcula e mostra o que importa no Início.

- Feito primeiro para o celular, mas funciona também no computador.
- Pode ser instalado na tela inicial (PWA) e funciona sem internet.
- **Os dados ficam só no aparelho** (IndexedDB do navegador): sem cadastro e sem servidor.

## Módulos

| Módulo | O que faz |
| --- | --- |
| **Início** | "Seu dia" (agenda, contas, diário, tarefas, Núcleo e Jornada), **Estudando agora** (ciclos de Estudos em andamento e o tópico da vez), resumo do mês com receitas e sobra prevista (total, já pago, em aberto), contas a vencer nos próximos 7 dias, compromissos, tarefas, últimos registros do diário e hábitos do dia. |
| **Finanças** | Despesas **avulsas**, **contas fixas** (todo mês, sem fim) e **parceladas** (01/12, 02/12…). Pagamento com data e valor reais. Editar ou excluir **somente esta / esta e as próximas / todas**. Categorias com ícone e cor, criadas sem sair do formulário. O **botão +** abre um menu: nova despesa, receita, cartão, caixinha e **Categorias** (despesa e fontes de receita, que agora moram em Finanças). Tocar em **Já pago** ou **Em aberto** mostra só essas contas na lista. |
| **Receitas** | Aba própria em Finanças (**Despesas · Receitas · Cartões**): salário, freelance, bônus, vale-alimentação etc., avulsas ou **mensais**, previstas ou recebidas (com data e valor reais). **Balanço do mês**: previsto (entradas − despesas) e até agora (o que entrou − o que foi pago). Fontes de receita personalizáveis. |
| **Caixinhas** | Aba própria em Finanças (**Despesas · Receitas · Cartões · Caixinhas**): metas de dinheiro guardado (viagem, reserva…), com meta opcional, prazo e **plano** ("R$ 100 toda semana" ou todo mês). Guardar e tirar com data; ao tirar, o motivo (**realizei o objetivo**, emergência, outro). Barra de progresso, quanto falta e em quanto tempo, avisos nos marcos de 25/50/75/100%, caixinhas realizadas no histórico. "Dia de guardar" no Início e as linhas **Caixinhas** e **Livre para usar** no balanço do mês. O app não mexe no dinheiro: só anota. |
| **Orçamento** | Limite por mês em cada categoria de despesa: quanto já foi, quanto sobra por dia e a cor da barra (verde, laranja aos 80%, vermelho ao passar). Contas fixas contam inteiras e não disparam aviso aos 80%. Do dia 10 em diante, mostra a previsão de fechamento do mês. "Usar a média dos últimos 3 meses" preenche os limites. O Início avisa as categorias em alerta. |
| **Relatórios** | Gastos do mês por categoria (barra dividida e lista), comparação com o mês anterior, os últimos 6 meses em colunas e "o que chama atenção" (categoria acima da média, contas fixas por ano, maior categoria). |
| **Listas** | Listas por **categoria personalizável** (Mercado, Receitas, Roupas, Casa, Viagem e as que você criar), cada uma com seu jeito: **mercado** (itens por corredor, quanto sai em cada mercado, melhor preço de cada item e "Concluir compra", que lança a despesa), **compras** (valor de cada item, total e "Lançar em Finanças"), **receita** (porções que recalculam as quantidades, preparo e "mandar para a lista de mercado") e **checklist**. Listas fixadas aparecem no Início. |
| **Preços** | Aba de Listas: anote preços no mercado (produto, marca, tamanho e preço) com sugestão enquanto digita e aviso de preço alto. Compara por unidade (R$/kg, R$/L, R$/un) e mostra o mais barato, a tabela marcas × mercados e como o preço mudou. |
| **Humor do dia** | No Início, um toque: 😞 a 😄. Se quiser, o que pesou ou ajudou e uma anotação, que vira registro no Diário (etiqueta Humor). A Revisão semanal mostra o humor da semana e o que o app percebe (dias com treino × sem treino, etiquetas dos dias bons e difíceis). |
| **Cartões** | Cadastro com fechamento, vencimento, limite e cor. Cada compra cai sozinha na fatura certa. Faturas com total, situação e pagamento; limite disponível. **Vales (VR/VA)** no mesmo lugar: saldo, recarga mensal automática (entra como receita), compras pagas com o vale já entram pagas e descontam do saldo, "dá uns R$ X por dia até a recarga" e aviso de saldo baixo no Início. |
| **Estudos** | Espaço pessoal para aprender, sem cara de escola. **Biblioteca** (catálogo do app): Idiomas, Desenvolvimento de software, Inteligência artificial, Produtividade e Carreira, organizadas em área › tema › nível (quando faz sentido) › trilha › tópicos, com fontes sugeridas. Você cria suas áreas, temas e trilhas e **arquiva** áreas sem apagar nada. Na trilha, você marca os tópicos que quer estudar agora e **monta um ciclo** (nome, ordem e notebook opcional). A trilha nunca muda, e as recomendações ("estude X antes") são só avisos com o botão "Incluir". **Ciclos** mostram cada tópico como a estudar, estudando ou concluído, o progresso e a opção de montar o próximo ciclo com os tópicos livres. **Meus notebooks**: cadernos com **páginas e subpáginas**. Cada página tem um **editor de texto** (títulos 1 a 3, listas, checklist, citação, divisor, alternante que recolhe e expande, negrito, itálico, sublinhado, destaque, cores, link e imagem; subir e descer blocos; salva sozinho) e fontes ligadas. No celular a barra mostra o essencial e "Mais" abre o resto; no computador aparece tudo. O conteúdo é o mesmo nos dois, descrição, mapas e histórico. Na trilha, "Notebook" leva os tópicos marcados para um notebook existente ou novo; um notebook pode juntar tópicos de várias áreas, cada página guarda de onde veio e a Biblioteca nunca muda. "Organizar" sobe, desce e muda páginas de lugar. **Fontes**: sites, vídeos, livros, PDFs e cursos, cada um usável em vários notebooks. **Mapas mentais** em árvore: ideia central, ramos e sub-ramos (até 6 níveis), em dois lados. Tocar numa ideia abre o painel: editar o texto, criar dentro ou ao lado, subir, descer, mudar de ramo, recolher, cor e excluir (pede confirmação se tiver ideias dentro). Arrastar move o mapa, dois dedos ou a rodinha aproximam, "Ajustar" mostra tudo; no teclado, Enter cria ao lado e Tab cria dentro. Salva a cada mudança. Um mapa pode ser de um notebook ou de uma página. 6 sugestões para copiar. **Roadmaps**: todas as trilhas por área, com quanto você já estudou. O caminho ("Biblioteca › Idiomas › Inglês › A1") aparece em cima de cada tela. Especificação em [docs/futuro/modulo-estudos.md](docs/futuro/modulo-estudos.md). |
| **Carreira** | Módulo próprio (barra: Metas · **Carreira** · Vagas). **Vagas**: cada candidatura com cargo, empresa, salário, link e **etapa** (Interesse → Enviei → Entrevista → Proposta), com contador por etapa que filtra a lista. **Próximo passo** com data e hora, atrasados em laranja, e o aviso "sem resposta há X dias" quando a vaga está em Enviei há 7 dias sem passo marcado. O passo aparece sozinho na **Agenda**. Encerrar: contratado, não passei ou desisti; a vaga vai para **Encerradas** e pode ser reaberta. Histórico das etapas e anotações. **Trabalho atual** na casa: cargo, empresa, tempo de casa e salário (escondido até tocar); "Registrar mudança" (entrada, promoção, aumento, novo emprego) monta o histórico de **cargos e salários** com a variação em %, e pergunta antes de atualizar a receita de Salário em Finanças a partir da data. **Reuniões** (reunião, 1:1, apresentação, feedback, avaliação): dia e hora, com quem, pauta e anotações, link dos slides, **combinados** com check, repetição (toda semana, a cada 2 ou 4 semanas); "Marcar a próxima" cria a seguinte levando os combinados não feitos. **Combinados em aberto** de todas as reuniões ficam na casa. **Projetos do trabalho**: nome, área, prazo, situação (andando, parado, concluído), **entregas** com data e check, anotações e link; a reunião pode ser ligada a projetos e mostra as entregas em aberto deles. **Agenda automática**: reuniões, passos das vagas, prazos e entregas abertas aparecem sozinhos na Agenda (marcados "Carreira"), se atualizam quando mudam e saem quando são excluídos ou concluídos; tocar no compromisso abre a ficha em Carreira. Currículo e Metas chegam nas próximas versões. Especificação em [docs/futuro/modulo-carreira.md](docs/futuro/modulo-carreira.md). |
| **Diário** | Feed privado: o registro mais novo no topo, os anteriores recolhidos, data e hora automáticas, etiqueta opcional, busca e histórico por ano e mês. |
| **Agenda** | Calendário com pontos para compromissos, tarefas e contas. Ao tocar num dia, abre tudo daquele dia: compromissos, tarefas, contas que vencem, compras no cartão, pagamentos feitos, rituais/hábitos (marcáveis) e registros do diário. Aba de tarefas. |
| **Você** | A entrevista "Vamos nos conhecer?" (convite no Início depois da montagem do app): 7 perguntas rápidas (nome e horários, dia a dia, o que quer melhorar em ordem de prioridade, metas, dinheiro, hábitos a largar, limitações e preferências). Dá para pular tudo, pular uma pergunta ou parar no meio; quem pula vê só um cartão discreto no Início. A página **Você** guarda o perfil (só no aparelho) e mostra **sugestões** de hábitos, trocas, práticas e compromissos, sempre dizendo o porquê; aceitar cria o hábito ou o compromisso com um toque. Especificação em [docs/futuro/modulo-voce.md](docs/futuro/modulo-voce.md). |
| **Núcleo pessoal** | Abas **Rituais · Hábitos · Mente · Corpo**. **Mente**: meditação livre (3 a 20 min) e guiada, respiração 4-7-8, em caixa e coerência, e "Três coisas boas" que vão para o Diário. **Corpo**: **Treino em casa** (meta de dias por semana; abas Sem equipamento · Com equipamento; 8 partes do corpo — pernas, glúteos, peito, costas, ombros, braços, antebraços e abdome — em Iniciante, Intermediário e Avançado; treino guiado exercício por exercício com descanso; cada exercício com **boneco animado**, passo a passo e **link de vídeo**), fichas de treino com descanso automático e a carga da última vez, alongamentos guiados (agora com boneco animado em cada movimento) e cronômetro de caminhada e corrida. Hábitos **ligados a uma prática** ganham o botão "Iniciar" e são marcados sozinhos ao concluir. **Rituais** (rotinas fixas, por dias da semana, período e horário, com gatilho "depois de…"), **hábitos a construir** (progresso até virar ritual — meta padrão de 66 dias) e **hábitos a abandonar** (dias sem, recorde e recaídas). **Atributos** que cada hábito treina (Força, Agilidade, Inteligência, Resistência, Sabedoria, Disciplina), sugeridos pelo nome e somados na revisão semanal — só aparecem quando a Jornada desbloqueia, mas já são guardados desde o início. **Pausar** um ritual ou hábito (até uma data, quando volta sozinho, ou sem data): some de Hoje, do Início, da Agenda e da Revisão, e a sequência fica congelada, sem contar falta. **Arquivar** (qualquer tipo): sai de tudo e o histórico fica; no hábito a abandonar, o app comemora a marca. Seções **Pausados** e **Arquivados** no fim das abas. Metas com quantidade (ex.: 2.000 ml, com anel de progresso e +incremento), aviso de **"não falhe duas vezes"**, sequência que não quebra em dias fora da rotina, consistência de 30 dias e mapa das últimas 12 semanas. |
| **Revisão semanal** | Semana de segunda a domingo: rotina (% feito e o que precisa de atenção), gastos e onde mais gastou, contas da semana seguinte, agenda, **o que estudei** (tópicos concluídos, dias com anotação e ciclos), diário — e uma reflexão (o que funcionou, o que não, o que ajustar) salva no diário. Aparece no Início aos domingos e segundas. |
| **Jornada** | **Bloqueada até 14 dias de uso dentro de 3 semanas** (um dia conta quando você registra algo; faltar não zera). O app também registra, em silêncio, os dias em que foi aberto (base da sequência de visitas). Ao desbloquear, mostra o XP, o nível e o ouro que você teria ganhado com os seus dados reais — e pergunta se a Jornada completa vale a pena ou fica para depois. Especificação completa em [docs/futuro/modulo-rpg.md](docs/futuro/modulo-rpg.md). |
| **Montagem do app** | Na **primeira abertura**, uma entrevista só de toques monta o app: nome (opcional), **o que você quer organizar** (Dinheiro, Rotina e hábitos, Mente e corpo, Compromissos, Registrar o dia, Casa e compras, Estudos, Trabalho e carreira), **módulos à vista** (já marcados pelas escolhas; pelo menos 3; os desligados ficam **guardados no Mais**, sem apagar nada), **3 favoritos** na ordem dos toques (com a barra mostrada ao vivo), **ritmo do Diário** (todo dia, 2 a 5 vezes na semana, dias certos ou quando der), **jeito da barra e cor** e **Jornada** (quero / agora não). Depois, o **tutorial da barra** em 6 passos, que avança quando você faz de verdade (tocar num favorito, numa ferramenta, voltar, trocar de módulo, segurar para ver o nome, o Mais). Dá para pular tudo. Quem já usava recebe **uma vez** no Início o cartão "Monte o app do seu jeito", com tudo preenchido, ou só o tutorial. Refazer em Configurações › Personalização; tutorial também em Mais › **Como usar a barra**. O **ritmo do Diário** vira um cartão no Início ("Diário: 1 de 3 nesta semana"), que só convida e nunca conta falta. Especificação em [docs/futuro/primeira-abertura.md](docs/futuro/primeira-abertura.md). |
| **Barra de baixo** | Só ícones (segurar o dedo mostra o nome). **Início** e **Mais** ficam fixos. No Início, os 3 do meio são os seus **favoritos** (padrão: Finanças, Diário e Agenda; troque em Configurações › Personalização). Dentro de um módulo, os 3 do meio são do próprio módulo. **Se o módulo é favorito, ele fica na mesma posição** (ex.: Finanças continua em 1º) e as ferramentas ocupam os outros dois espaços; se não é favorito, ele vai para o centro.  **Voltar** (do celular): numa ferramenta leva à casa do módulo; de novo, ao Início. **Para trocar de módulo direto, toque de novo no módulo em que você está:** a barra mostra os favoritos ("Escolha o módulo"). Ferramentas de cada módulo: Finanças (Orçamento · Finanças · Relatórios), Diário (Humor · Diário · Revisão), Agenda (Hoje · Agenda · Próximos), Núcleo (Progresso · Núcleo · Histórico) Listas (Compras · Listas · Preços) e Estudos (Ciclos · Estudos · Roadmaps). O topo mostra onde você está: "Finanças / Orçamento". Regra: abas no topo = partes do mesmo conteúdo; barra = planejar, analisar ou atalho do dia; botão + = criar e, por último, Categorias; cada coisa num lugar só. |
| **Telas da barra** | **Progresso** (Núcleo): constância de 30 dias, sequências, "dias sem" e atributos. **Histórico** (Núcleo): meditações, respirações, alongamentos, treinos e caminhadas, com totais do mês. **Próximos** (Agenda): compromissos, tarefas com prazo e contas dos próximos 30 dias, com os atrasados à parte. **Compras** (Listas): as compras concluídas pelas listas, com total e loja (as anteriores vêm das despesas "Mercado · loja"). **Preços** virou tela própria. |
| **Personalizar cartões** | O **lápis** ao lado da lupa deixa subir, descer e ocultar cartões no Início, em Finanças › Despesas, na Agenda (calendário), no Núcleo › Rituais (cada período é um cartão), em Listas (cada categoria é um cartão), em Estudos e em Carreira. O Humor (Início), o resumo do mês (Finanças), o calendário, o "Hoje" do Núcleo, o bloco principal de Estudos e o Trabalho atual ficam fixos no topo; os avisos importantes (Seu dia, contas a vencer, orçamento, vale, backup) nunca somem, só mudam de lugar. Os ocultos ficam no fim, com "Mostrar"; "Restaurar padrão" volta tudo. A ordem fica guardada e entra no backup. |
| **Abas dos módulos** | O **mês (ou a semana) e as abas formam um bloco** preso logo abaixo da barra de cima: some ao rolar para baixo e volta ao rolar para cima, em todos os módulos, e dá para **deslizar o dedo para o lado** em qualquer parte da tela para trocar de aba. |
| **Mais** | Todos os módulos à vista, "Como usar a barra" e, separados, os **Guardados** (módulos desligados, que continuam abrindo normalmente). Configurações (**Personalização**: módulos à vista, ritmo do Diário, refazer a montagem do app, favoritos do Início; jeito da barra dentro do módulo — favorito no mesmo lugar, ao lado do Início ou no centro; tocar de novo no módulo mostra os favoritos; esconder as barras ao rolar. **Temas**: escuro, claro ou automático e **cor de destaque** entre 8 cores com bom contraste; padrão verde no escuro e azul no claro. As cores de situação não mudam: pago verde, pendente laranja, atrasado vermelho. Também backup e dados; as categorias ficam em Finanças). |

**Navegação:** barras superior e inferior que somem ao rolar para baixo e voltam ao rolar para cima (a superior mostra o nome da aba; no Início, a data); 🔍 no topo (no Diário, busca no diário); atalhos inferiores (Início, Finanças, Diário, Agenda, Mais); menu ☰ com todos os módulos agrupados (Geral, Organização pessoal, Financeiro, Bem-estar, Estudos, Carreira, Planejamento); 🔍 **busca**: no Início, em tudo; dentro de um módulo, só nele (com "Em tudo" a um toque). Acha diário, despesas, receitas, cartões, caixinhas, agenda, hábitos, listas e itens, produtos, notebooks e páginas, fontes, mapas, trilhas e tópicos, vagas, reuniões, projetos e notas; botão **+** que adiciona na aba aberta (no Início, pergunta o quê); o **voltar** do celular fecha a janela ou o menu aberto antes de sair da página. Lembretes, Metas, Saúde, Foco e Banco de ideias aparecem como "em breve".

## Regras financeiras

- **Fatura do cartão:** compra feita **antes** do dia de fechamento entra na fatura que está fechando. Compra feita **no dia do fechamento ou depois** entra na fatura seguinte. Datas que não existem no mês (ex.: dia 31 em fevereiro) usam o último dia do mês.
- **Resumo do mês:** cada fatura entra como **uma** conta (pelo vencimento). As compras do cartão contam nos gastos por categoria.
- **Parcelas:** quando o valor é informado pelo total, os centavos que sobram vão para a última parcela (R$ 100 em 3x = 33,33 + 33,33 + 33,34).
- **Editar "todas":** descrição e categoria mudam em todas. Valor e vencimento mudam só nas que ainda não foram pagas.
- **Conta fixa de valor variável:** ao pagar com outro valor (ex.: conta de luz), esse valor vira a previsão dos próximos meses.
- **Contas fixas:** ficam geradas até 2 meses à frente, e o app gera as seguintes conforme o tempo passa.
- **Limite do cartão:** desconta as compras em faturas não pagas, inclusive as parcelas futuras. Mensalidades futuras só contam depois de cobradas.

Tudo isso está em `src/finance.ts`, testado em `src/finance.test.ts`.

## Como rodar

Requer [Node.js](https://nodejs.org) 22 ou superior.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # testes das regras (todos os módulos)
npm run build      # versão de produção em dist/
```

## Publicar (GitHub Pages)

O workflow `.github/workflows/deploy.yml` publica o app a cada push na branch `main`, **só se os testes passarem** (`npm test` antes de compilar).
O workflow `.github/workflows/testes.yml` roda os testes e a compilação em todo PR: se algo quebrar, o PR mostra um ❌ antes de mesclar.
Para ativar: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
O endereço fica `https://<usuario>.github.io/Central-Pessoal/`. Para instalar no celular, abra o endereço e escolha **Adicionar à tela inicial**.

## Dados e backup

- Os dados ficam no IndexedDB do navegador. O app pede ao navegador armazenamento persistente.
- Cada aparelho tem os seus próprios dados. Use **Ajustes → Exportar / Importar** para backup ou para levar os dados a outro aparelho. O Início avisa quando o último backup tem mais de 30 dias.
- Os registros guardam a data de criação, e as exclusões ficam marcadas (`deleted`). Isso prepara uma futura sincronização entre aparelhos.
- Dados do primeiro protótipo (localStorage) são migrados automaticamente.
- **Proteção contra dados com defeito** (`src/sanitize.ts`): ao abrir os dados (ou importar um backup), cada despesa, série, cartão, receita, nota, registro do diário, tarefa, compromisso e categoria é conferido. O que dá para consertar ganha valores padrão; o que não tem o essencial (ex.: despesa sem valor ou sem data) fica guardado à parte em `legacy.descartados` (vai no backup, não some), e Configurações › Backup avisa quantos são.
- **Tela de erro com saída** (`src/ErrorScreen.tsx`): se uma tela der erro, aparece "Algo deu errado" com **Exportar backup**, **Recarregar** e **Abrir Configurações**, e a barra de baixo continua funcionando.
- **Desfazer importação:** antes de importar um backup (ou de "apagar tudo"), o app guarda uma cópia dos dados atuais; em Backup aparece **Desfazer importação de dd/mm**.

## Estrutura

```
src/
  finance.ts         regras financeiras (faturas, parcelas, séries, resumo)
  finance.test.ts    testes das regras
  habits.ts          regras do Núcleo pessoal (sequência, consistência, dias sem)
  habits.test.ts     testes do Núcleo
  profile.ts         Você: perfil e motor de sugestões
  profile.test.ts    testes das sugestões
  practices.ts       Núcleo › Mente e Corpo: catálogo e registro das práticas
  treinos.ts         Treino em casa: exercícios, treinos prontos, meta da semana, link de vídeo
  bonecos.ts         Bonecos animados dos exercícios e alongamentos (desenho próprio)
  practices.test.ts  testes das práticas
  boxes.ts           Caixinhas: saldo, plano, marcos e balanço
  budget.ts          Orçamento por categoria e relatórios
  theme.ts           Cores de destaque (paleta, contraste e o CSS gerado)
  moduleBar.ts       Barra de baixo: favoritos e a barra de cada módulo
  setup.ts           Montagem do app: módulos à vista, áreas, favoritos e ritmo do Diário
  sanitize.ts        Conferência dos registros ao abrir os dados (C3)
  ErrorScreen.tsx    Tela de erro com saída (C3)
  upcoming.ts        Agenda › Próximos (compromissos, tarefas e contas por dia)
  cardLayout.ts      Ordem e cartões ocultos de cada tela (lápis)
  Cards.tsx          Tela com cartões personalizáveis e o modo de edição
  lists.ts           Listas por categoria e Preços
  estudosCatalogo.ts Estudos: catálogo da Biblioteca (áreas, trilhas, tópicos, fontes e mapas sugeridos)
  carreira.ts        Carreira: vagas e etapas, trabalho atual e salários (com Finanças), reuniões e combinados
  estudos.ts         Estudos: biblioteca + itens da pessoa, ciclos, progresso e notebooks
  estudos.test.ts    testes de Estudos
  mood.ts            Humor do dia
  boxes.test.ts      testes das caixinhas
  review.ts          revisão semanal (junta todos os módulos)
  review.test.ts     testes da revisão
  journey.ts         desbloqueio da Jornada e XP/nível/ouro a partir dos dados
  journey.test.ts    testes da Jornada
  jornada/           Jornada completa, ainda sem telas: artes em pixel art (art, artData, catalog),
                     regras de atributos, classes, títulos, baús, loja e forja (rules) e céu (sky)
  jornada.test.ts    testes dessas regras e das artes
  incomes.ts         receitas, recorrência e balanço do mês
  incomes.test.ts    testes das receitas
  data.ts            formato dos dados, categorias padrão e migração
  db.ts              IndexedDB
  store.tsx          estado global e salvamento automático
  router.ts          navegação por #endereço
  ui.tsx             ícones e componentes (janelas, campo de valor, status…)
  nav.ts             menu agrupado de módulos
  Search.tsx         busca em todos os módulos
  App.tsx            barra inferior, barra lateral e botão +
  modules/
    Dashboard.tsx    Início
    financas/        Finanças, cartões, faturas e formulários
    Diario.tsx       Diário
    Agenda.tsx       Agenda (+ Tarefas.tsx)
    Habitos.tsx      Núcleo pessoal
    Praticas.tsx     Mente e Corpo: meditação, respiração, treinos, alongamentos
    TreinoCasa.tsx   Treino em casa: cartão da semana, catálogo e como fazer
    Boneco.tsx       Desenha o boneco animado
    Voce.tsx         Você e a entrevista do perfil
    Montagem.tsx     Montagem do app, tutorial da barra e convite do Diário
    Notas.tsx        Arquivo geral
    Carreira.tsx     Carreira: casa (trabalho atual, reuniões, combinados), Vagas e Metas (em breve)
    estudos/         Estudos: início, Biblioteca, Ciclos, Roadmaps, notebooks, fontes e mapas
    Ajustes.tsx, Mais.tsx
```

## Análises

- [Análise profunda de novembro de 2026](docs/auditoria-2026-11.md): código, segurança, testes de gargalo com 1 a 10 anos de dados, limpeza e ressalvas. As correções estão na Central (C3 a C9, M18 a M20).

## Implementações futuras

Documentos de funcionalidades planejadas, ainda **sem desenvolvimento**:

- [Módulo RPG — Gamificação da Vida Pessoal](docs/futuro/modulo-rpg.md): Jornada com personagem em pixel art, XP, níveis, ouro, loja, inventário e conquistas, consumindo os dados dos módulos existentes. O Anexo B reúne as regras já decididas: equipamentos, baús e cristais, forja mística por atributos, títulos, classes, pets, moradas, céu com estrelas e chuva, e a tela cheia do avatar. O Anexo F traz a sequência de visitas com presente do dia, os dois modos do app (com e sem Jornada), os pets com nome, cor e conquistas, arcos e acessórios, e o Codex. O Anexo E define que, no app principal, a Jornada é só um cartão no Início, com as recompensas mostradas ao entrar ("Desde a sua última visita"). O Anexo D descreve a entrevista que personaliza a campanha. O Anexo C descreve o modo campanha: 7 regiões num mapa, objetivos ligados aos módulos do app e chefes semanais que perdem vida a cada missão cumprida.
- [Jornada: o que cada módulo dá](docs/futuro/jornada-recompensas.md): tabela básica de XP, ouro e atributos por ação em cada módulo, e as regras para ser justo (nada se ganha gastando, vale o hábito e não o valor).
- [Jornada: raridades e Codex](docs/futuro/jornada-raridades.md): comum, raro, épico, lendário e místico (só da Forja) em itens, pets e moradas; bônus a partir do épico (+10% a +25% de XP, com teto); formas de liberar (loja, nível, atributo, missão, conquista, baú, visitas e Forja) e o Codex dividido em coleções para crescer.
- [Você](docs/futuro/modulo-voce.md) (**feito na v0.12**; sugestões de caixinha na v0.13): perfil com rotina, áreas a melhorar (em ordem de prioridade), metas de curto e longo prazo, hábitos a largar e limitações. Um motor de regras transforma essas respostas em sugestões de hábitos, trocas, práticas, compromissos e caixinhas, sempre dizendo o porquê. Funciona sem a Jornada; com ela, a entrevista já começa preenchida.
- [Núcleo: Mente e Corpo](docs/futuro/nucleo-mente-corpo.md) (**feito na v0.12**): o Núcleo ganha as abas Mente (meditação livre e guiada, respiração, gratidão) e Corpo (fichas de treino com descanso e carga anterior, alongamentos guiados, caminhada e corrida). Hábitos ligados a uma prática são marcados sozinhos.
- [Saúde](docs/futuro/modulo-saude.md): módulo separado para acompanhar água, sono, remédios, consultas e exames, peso e medidas.
- [Caixinhas](docs/futuro/caixinhas.md) (**feito na v0.13**, menos a parte da Jornada): metas de dinheiro guardado em Finanças, com plano ("R$ 100 toda semana"), guardar e tirar com motivo. Na Jornada, recompensa o hábito de guardar e comemora quando o dinheiro é usado para o objetivo.
- [Listas](docs/futuro/modulo-listas.md) (**feito na v0.14**): listas de compras, listas gerais e receitas de cozinha, reutilizáveis e ligadas a Finanças e Preços.
- [Comparação de preços](docs/futuro/modulo-precos.md) (**feito na v0.14**, menos código de barras e nota fiscal): anotar preços no mercado e comparar por mercado, marca e unidade (R$/kg, R$/L), com o histórico de cada produto. No futuro, leitura de código de barras e de etiquetas.
- [Preços 2.0](docs/futuro/precos-v2.md): tipos de loja (mercado, departamento, roupas…), lista que puxa os produtos cadastrados em Preços enquanto você digita, estimativa por loja com faixa de preço para os itens que não têm preço ali (sem prender a lista a uma loja), "quanto custou aqui?" ao marcar o item na compra, e editar ou juntar produtos.
- [Módulos personalizáveis](docs/futuro/modulos-personalizaveis.md): mostrar ou ocultar módulos (sem apagar nada), escolher os 3 atalhos do meio da barra de baixo e os cartões do Início, para o app não sufocar quem está começando.
- [Carreira](docs/futuro/modulo-carreira.md) (**Vagas na v0.22, Trabalho e Reuniões na v0.23, Projetos e Agenda automática na v0.24**; faltam Currículo e Metas).
- [Estudos](docs/futuro/modulo-estudos.md) (**feito na v0.21**) e [a integração com a Jornada](docs/futuro/estudos-jornada.md) (só documentada).
- [Hábitos: pausar e arquivar](docs/futuro/habitos-pausar-arquivar.md): pausar até uma data sem quebrar a sequência, e arquivar mantendo o histórico, em vez de excluir.
- [Notificações](docs/futuro/notificacoes.md): avisos de contas, faturas, rituais no horário, compromissos, dia de guardar e revisão semanal, com horário de silêncio e sem culpa. Ficam para o app Android (notificações locais, sem servidor).
- [App Android](docs/futuro/app-android.md): empacotar o mesmo app com Capacitor, sem reescrever. Ganha notificações locais, tela ligada nas práticas, vibração, backup em arquivo, câmera e, depois, widget.

Ideias, problemas, prioridades, o que está aprovado para construir e o histórico de versões ficam na [Central de melhorias](docs/CENTRAL.md). As instruções de trabalho para o Claude ficam em [CLAUDE.md](CLAUDE.md).

Feito com React, TypeScript e Vite.
