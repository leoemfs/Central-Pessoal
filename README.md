# Central Pessoal

Aplicativo pessoal para organizar a vida num lugar só: **finanças, diário, agenda, tarefas, hábitos e anotações**.
O usuário registra; o app organiza, calcula e mostra o que importa no Início.

- Feito primeiro para o celular, mas funciona também no computador.
- Pode ser instalado na tela inicial (PWA) e funciona sem internet.
- **Os dados ficam só no aparelho** (IndexedDB do navegador): sem cadastro e sem servidor.

## Módulos

| Módulo | O que faz |
| --- | --- |
| **Início** | "Seu dia" (agenda, contas, diário, tarefas, Núcleo e Jornada), resumo do mês com receitas e sobra prevista (total, já pago, em aberto), contas a vencer nos próximos 7 dias, compromissos, tarefas, últimos registros do diário e hábitos do dia. |
| **Finanças** | Despesas **avulsas**, **contas fixas** (todo mês, sem fim) e **parceladas** (01/12, 02/12…). Pagamento com data e valor reais. Editar ou excluir **somente esta / esta e as próximas / todas**. Categorias com ícone e cor, criadas sem sair do formulário. O **botão +** abre um menu: nova despesa, receita, cartão, caixinha e **Categorias** (despesa e fontes de receita, que agora moram em Finanças). Tocar em **Já pago** ou **Em aberto** mostra só essas contas na lista. |
| **Receitas** | Aba própria em Finanças (**Despesas · Receitas · Cartões**): salário, freelance, bônus, vale-alimentação etc., avulsas ou **mensais**, previstas ou recebidas (com data e valor reais). **Balanço do mês**: previsto (entradas − despesas) e até agora (o que entrou − o que foi pago). Fontes de receita personalizáveis. |
| **Caixinhas** | Aba própria em Finanças (**Despesas · Receitas · Cartões · Caixinhas**): metas de dinheiro guardado (viagem, reserva…), com meta opcional, prazo e **plano** ("R$ 100 toda semana" ou todo mês). Guardar e tirar com data; ao tirar, o motivo (**realizei o objetivo**, emergência, outro). Barra de progresso, quanto falta e em quanto tempo, avisos nos marcos de 25/50/75/100%, caixinhas realizadas no histórico. "Dia de guardar" no Início e as linhas **Caixinhas** e **Livre para usar** no balanço do mês. O app não mexe no dinheiro: só anota. |
| **Orçamento** | Limite por mês em cada categoria de despesa: quanto já foi, quanto sobra por dia e a cor da barra (verde, laranja aos 80%, vermelho ao passar). Contas fixas contam inteiras e não disparam aviso aos 80%. Do dia 10 em diante, mostra a previsão de fechamento do mês. "Usar a média dos últimos 3 meses" preenche os limites. O Início avisa as categorias em alerta. |
| **Relatórios** | Gastos do mês por categoria (barra dividida e lista), comparação com o mês anterior, os últimos 6 meses em colunas e "o que chama atenção" (categoria acima da média, contas fixas por ano, maior categoria). |
| **Listas** | Listas por **categoria personalizável** (Mercado, Receitas, Roupas, Casa, Viagem e as que você criar), cada uma com seu jeito: **mercado** (itens por corredor, quanto sai em cada mercado, melhor preço de cada item e "Concluir compra", que lança a despesa), **compras** (valor de cada item, total e "Lançar em Finanças"), **receita** (porções que recalculam as quantidades, preparo e "mandar para a lista de mercado") e **checklist**. Listas fixadas aparecem no Início. |
| **Preços** | Aba de Listas: anote preços no mercado (produto, marca, tamanho e preço) com sugestão enquanto digita e aviso de preço alto. Compara por unidade (R$/kg, R$/L, R$/un) e mostra o mais barato, a tabela marcas × mercados e como o preço mudou. |
| **Humor do dia** | No Início, um toque: 😞 a 😄. Se quiser, o que pesou ou ajudou e uma anotação, que vira registro no Diário (etiqueta Humor). A Revisão semanal mostra o humor da semana e o que o app percebe (dias com treino × sem treino, etiquetas dos dias bons e difíceis). |
| **Cartões** | Cadastro com fechamento, vencimento, limite e cor. Cada compra cai sozinha na fatura certa. Faturas com total, situação e pagamento; limite disponível. **Vales (VR/VA)** no mesmo lugar: saldo, recarga mensal automática (entra como receita), compras pagas com o vale já entram pagas e descontam do saldo, "dá uns R$ X por dia até a recarga" e aviso de saldo baixo no Início. |
| **Diário** | Feed privado: o registro mais novo no topo, os anteriores recolhidos, data e hora automáticas, etiqueta opcional, busca e histórico por ano e mês. |
| **Agenda** | Calendário com pontos para compromissos, tarefas e contas. Ao tocar num dia, abre tudo daquele dia: compromissos, tarefas, contas que vencem, compras no cartão, pagamentos feitos, rituais/hábitos (marcáveis) e registros do diário. Aba de tarefas. |
| **Você** | Na **primeira abertura**, a entrevista "Vamos nos conhecer?": 7 perguntas rápidas (nome e horários, dia a dia, o que quer melhorar em ordem de prioridade, metas, dinheiro, hábitos a largar, limitações e preferências). Dá para pular tudo, pular uma pergunta ou parar no meio; quem pula vê só um cartão discreto no Início. A página **Você** guarda o perfil (só no aparelho) e mostra **sugestões** de hábitos, trocas, práticas e compromissos, sempre dizendo o porquê; aceitar cria o hábito ou o compromisso com um toque. Especificação em [docs/futuro/modulo-voce.md](docs/futuro/modulo-voce.md). |
| **Núcleo pessoal** | Abas **Rituais · Hábitos · Mente · Corpo**. **Mente**: meditação livre (3 a 20 min) e guiada, respiração 4-7-8, em caixa e coerência, e "Três coisas boas" que vão para o Diário. **Corpo**: fichas de treino com descanso automático e a carga da última vez, alongamentos guiados e cronômetro de caminhada e corrida. Hábitos **ligados a uma prática** ganham o botão "Iniciar" e são marcados sozinhos ao concluir. **Rituais** (rotinas fixas, por dias da semana, período e horário, com gatilho "depois de…"), **hábitos a construir** (progresso até virar ritual — meta padrão de 66 dias) e **hábitos a abandonar** (dias sem, recorde e recaídas). **Atributos** que cada hábito treina (Força, Agilidade, Inteligência, Resistência, Sabedoria, Disciplina), sugeridos pelo nome e somados na revisão semanal — só aparecem quando a Jornada desbloqueia, mas já são guardados desde o início. Metas com quantidade (ex.: 2.000 ml, com anel de progresso e +incremento), aviso de **"não falhe duas vezes"**, sequência que não quebra em dias fora da rotina, consistência de 30 dias e mapa das últimas 12 semanas. |
| **Revisão semanal** | Semana de segunda a domingo: rotina (% feito e o que precisa de atenção), gastos e onde mais gastou, contas da semana seguinte, agenda, diário — e uma reflexão (o que funcionou, o que não, o que ajustar) salva no diário. Aparece no Início aos domingos e segundas. |
| **Jornada** | **Bloqueada até 14 dias de uso dentro de 3 semanas** (um dia conta quando você registra algo; faltar não zera). O app também registra, em silêncio, os dias em que foi aberto (base da sequência de visitas). Ao desbloquear, mostra o XP, o nível e o ouro que você teria ganhado com os seus dados reais — e pergunta se a Jornada completa vale a pena ou fica para depois. Especificação completa em [docs/futuro/modulo-rpg.md](docs/futuro/modulo-rpg.md). |
| **Barra de baixo** | Só ícones (segurar o dedo mostra o nome). **Início** e **Mais** ficam fixos. No Início, os 3 do meio são os seus **favoritos** (padrão: Finanças, Diário e Agenda; troque em Mais › Favoritos do Início). Dentro de um módulo, os 3 do meio são do próprio módulo, com a casa dele no centro: Finanças (Orçamento · Finanças · Relatórios), Diário (Humor · Diário · Revisão), Agenda (Tarefas · Agenda · Hoje), Núcleo (Mente · Núcleo · Corpo) e Listas (Receitas · Listas · Preços). O topo mostra onde você está: "Finanças / Orçamento". |
| **Abas dos módulos** | Em Finanças, Núcleo, Agenda e Listas, as abas ficam **presas logo abaixo da barra de cima**: somem ao rolar para baixo e voltam ao rolar para cima, e dá para **deslizar o dedo para o lado** em qualquer parte da tela para trocar de aba. |
| **Mais** | Você, Núcleo pessoal, Notas e Configurações (**Temas**: escuro, claro ou automático e **cor de destaque** entre 8 cores com bom contraste; padrão verde no escuro e azul no claro. As cores de situação não mudam: pago verde, pendente laranja, atrasado vermelho. Também backup e dados; as categorias ficam em Finanças). |

**Navegação:** barras superior e inferior que somem ao rolar para baixo e voltam ao rolar para cima (a superior mostra o nome da aba; no Início, a data); 🔍 no topo (no Diário, busca no diário); atalhos inferiores (Início, Finanças, Diário, Agenda, Mais); menu ☰ com todos os módulos agrupados (Geral, Organização pessoal, Financeiro, Bem-estar, Planejamento); 🔍 **busca em tudo** (diário, despesas, agenda e anotações); botão **+** que adiciona na aba aberta (no Início, pergunta o quê); o **voltar** do celular fecha a janela ou o menu aberto antes de sair da página. Lembretes, Metas, Saúde, Estudos, Foco e Banco de ideias aparecem como "em breve".

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
npm test           # testes das regras financeiras
npm run build      # versão de produção em dist/
```

## Publicar (GitHub Pages)

O workflow `.github/workflows/deploy.yml` publica o app a cada push na branch `main`.
Para ativar: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
O endereço fica `https://<usuario>.github.io/Central-Pessoal/`. Para instalar no celular, abra o endereço e escolha **Adicionar à tela inicial**.

## Dados e backup

- Os dados ficam no IndexedDB do navegador. O app pede ao navegador armazenamento persistente.
- Cada aparelho tem os seus próprios dados. Use **Ajustes → Exportar / Importar** para backup ou para levar os dados a outro aparelho. O Início avisa quando o último backup tem mais de 30 dias.
- Os registros guardam a data de criação, e as exclusões ficam marcadas (`deleted`). Isso prepara uma futura sincronização entre aparelhos.
- Dados do primeiro protótipo (localStorage) são migrados automaticamente.

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
  practices.test.ts  testes das práticas
  boxes.ts           Caixinhas: saldo, plano, marcos e balanço
  budget.ts          Orçamento por categoria e relatórios
  theme.ts           Cores de destaque (paleta, contraste e o CSS gerado)
  lists.ts           Listas por categoria e Preços
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
    Voce.tsx         Você e a entrevista da primeira abertura
    Notas.tsx        Arquivo geral
    Ajustes.tsx, Mais.tsx
```

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
- [Hábitos: pausar e arquivar](docs/futuro/habitos-pausar-arquivar.md): pausar até uma data sem quebrar a sequência, e arquivar mantendo o histórico, em vez de excluir.
- [Notificações](docs/futuro/notificacoes.md): avisos de contas, faturas, rituais no horário, compromissos, dia de guardar e revisão semanal, com horário de silêncio e sem culpa. Ficam para o app Android (notificações locais, sem servidor).
- [App Android](docs/futuro/app-android.md): empacotar o mesmo app com Capacitor, sem reescrever. Ganha notificações locais, tela ligada nas práticas, vibração, backup em arquivo, câmera e, depois, widget.

Ideias, problemas, prioridades, o que está aprovado para construir e o histórico de versões ficam na [Central de melhorias](docs/CENTRAL.md). As instruções de trabalho para o Claude ficam em [CLAUDE.md](CLAUDE.md).

Feito com React, TypeScript e Vite.
