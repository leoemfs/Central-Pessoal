# N9.5: Lembretes pelo Google Agenda

Pedido de 11/11: "Sincronização com Google Calendar? Como não tenho notificações ainda, podemos usar o Calendar."

**Ideia:** o app coloca no Google Agenda o que tem data e hora. O app Google Agenda do celular avisa na hora certa, sem esperar o app Android (N4) nem as notificações (N3). Substitui o "Lembrar no celular" com arquivo .ics do N3.1, com a vantagem de **se atualizar sozinho** quando algo muda no app.

## Como vai funcionar (para o Leonardo)
- Em **Configurações › Conta Google**, um interruptor **"Lembretes no Google Agenda"**.
- O app cria uma agenda própria chamada **"Central Pessoal"** dentro do seu Google Agenda, com cor própria. Ela não mistura com as suas outras agendas, e dá para escondê-la ou apagá-la lá no Google sem afetar o resto.
- **O que vai para lá** (cada um com o seu interruptor):

| O quê | Como aparece | Aviso padrão |
|---|---|---|
| **Compromissos** (Agenda e os automáticos de Carreira: reuniões, passos das vagas, prazos) | No dia e na hora; sem hora = dia todo | 30 min antes; dia todo: 9h |
| **Contas a pagar** (despesas em aberto e faturas do cartão) | No dia do vencimento, com o valor: "Pagar: Luz · R$ 120" | 9h do dia |
| **Tarefas com data** | Dia todo | 9h do dia |

- **Mudou no app, muda no Google:** mudar a hora, pagar a conta, concluir a tarefa ou excluir atualiza ou tira o evento na próxima sincronização.
- **Só de ida:** o que você mudar lá no Google Agenda não volta para o app. A descrição de cada evento diz "Criado pela Central Pessoal: mude pelo app".
- Vale para os próximos **60 dias**. O passado não vai.
- Para os avisos chegarem, o celular precisa do **app Google Agenda** com as notificações ligadas e a agenda "Central Pessoal" visível.

## O que o Leonardo precisa fazer (uma vez, ~3 min)
1. No Google Cloud (My First Project): **APIs e serviços › Biblioteca › Google Calendar API › Ativar**.
2. **Google Auth Platform › Acesso a dados › Adicionar escopo** `.../auth/calendar.app.created` › Salvar.
3. No app, ligar o interruptor: o Google pede a permissão nova uma vez.

A permissão `calendar.app.created` só deixa o app mexer na agenda que **ele mesmo criou**. Ele não lê nem muda as suas outras agendas.

## Regras
- O evento tem um **id fixo tirado do id do item** (ex.: compromisso `abc` → evento `cpabc…`). Com os dois aparelhos ligados, os dois mandam o mesmo evento e não duplica.
- A cada sincronização: monta a lista do que deveria estar no Google (regra pura, com testes), lê o que está na agenda "Central Pessoal" (60 dias) e cria, muda ou apaga só a diferença.
- A agenda "Central Pessoal" é achada pelo nome guardado em `settings` (o id dela), e é criada de novo se você apagá-la no Google.
- Desligar o interruptor pergunta: "Apagar a agenda Central Pessoal do Google?" (sim/não).

## Partes
| Parte | O que é | Tam. |
|---|---|---|
| **N9.5** | Interruptores, agenda "Central Pessoal", compromissos + contas + tarefas, avisos padrão, sincronização só de ida | M |
| Depois, se pedir | Escolher a antecedência de cada tipo; revisão semanal no domingo; aniversários (com o M5) | P |

## Notas técnicas
- API do Google Calendar v3, chamadas diretas do navegador com o mesmo login do N9.1 (`googleAuth` pede o escopo novo junto com `drive.appdata`).
- Regra pura em `src/calendarSync.ts`: `wantedEvents(data, hoje)` → lista `{ id, título, início, fim, diaTodo, aviso }`; `diffEvents(queremos, existem)` → criar, mudar, apagar. Testes `node:test`.
- Id do evento: base32hex (letras a-v e números), de 5 a 1024 caracteres. Converter o id do app para esse formato.
- Roda no fim do `syncNow` (`cloud.ts`), só se o interruptor estiver ligado. Erro na agenda não desfaz a sincronização dos dados.

## Como ficou (v0.43)
- Feito como especificado, com uma diferença: **contas, tarefas e compromissos sem hora** viram um evento curto **às 9h** (15 min) com aviso na hora, em vez de "dia todo". O Google não deixa avisar às 9h do próprio dia num evento de dia todo.
- Configuração em `settings.googleCalendar` (`on`, `events`, `bills`, `tasks`, `calendarId`), que vale para todos os aparelhos. A permissão da agenda é pedida em cada aparelho: sem ela, aparece "Dar acesso à agenda neste aparelho".
- Roda no fim de cada sincronização (`syncCalendar` em `cloud.ts`): lê os eventos da agenda nos próximos 61 dias (inclusive os excluídos no Google), compara pelo resumo guardado no evento (`extendedProperties.private.sig`) e só cria, muda, restaura ou apaga a diferença. Um erro na agenda não desfaz a sincronização dos dados.
- **Correção de junção encontrada no teste:** as configurações eram juntadas como um bloco só; como abrir o app marca a visita do dia nas configurações, um aparelho desfazia a configuração mudada no outro (ex.: desligava os lembretes). Agora cada campo tem a sua data (`@settings.campo`) e a junção escolhe campo a campo (vale para todas as partes que são objetos, como humor por dia).
- Testado no navegador com Google, Drive e Agenda de mentira: ligar cria a agenda e 3 eventos (aviso 30 min / 9h); desligar "Tarefas" tira a tarefa; excluir o compromisso no app tira do Google; outro aparelho sem permissão mostra "Dar acesso…"; desligar e apagar remove a agenda.

## Passo a passo do Google Cloud (Leonardo, uma vez)
1. Abrir **console.cloud.google.com/apis/library/calendar-json.googleapis.com** (projeto *My First Project*) e tocar em **Ativar**.
2. Abrir **console.cloud.google.com/auth/scopes** › **Adicionar ou remover escopos** › filtro `calendar.app.created` › marcar › **Atualizar** › **Salvar**.
3. No app: Configurações › Conta Google › ligar **Lembretes no Google Agenda** e aceitar a permissão nova (deixar marcada a opção da agenda).

## N9.6: Tarefas no Google Tarefas (pedido de 12/11; pronto na v0.48)
"A parte de tarefas acho melhor integrar com o Google Tasks."

- O app cria uma lista **"CP Hub"** no Google Tarefas e põe lá as tarefas **não concluídas** (com ou sem data). O interruptor "Tarefas com data" dos lembretes no Google Agenda sai, para cada coisa aparecer num lugar só.
- **Ida e volta (recomendado):** concluir no Google Tarefas conclui no app; criar, mudar, concluir ou excluir no app muda lá. Mudanças de título e data feitas no Google também voltam. A regra para conflito é a mesma da sincronização: vale a mudança mais recente.
- **Limite do Google:** a API do Google Tarefas guarda só a **data** da tarefa, não a hora. O aviso no celular segue o padrão do app Google Tarefas.
- **Permissão nova:** `tasks`. Ela dá acesso às listas de tarefas da conta, então o app passa a mexer só na lista "CP Hub". Precisa ativar a **Google Tasks API** e adicionar o escopo no Google Cloud (mesmo caminho do N9.5).
- **Técnico:** cada tarefa do app guarda o id da tarefa no Google; a junção é por item, usando `updated` do Google e as datas de alteração do app (`stamps`). A regra pura fica em `src/tasksSync.ts`, com testes.
- Tamanho **M**.

### Como ficou o N9.6 (v0.48)
- Interruptor "Tarefas no Google Tarefas" dentro de "Google Agenda e Tarefas" (Configurações › Conta Google). A lista "CP Hub" é achada pelo id guardado (`settings.googleCalendar.tasksList`) ou pelo nome, ou é criada.
- Ida e volta (`planTasks` + `applyToApp` em `src/tasksSync.ts`, com 9 testes): cria no Google as tarefas abertas; mesmo conteúdo dos dois lados não faz nada; conteúdo diferente vale o mais recente; excluir no app tira do Google (só se o id estiver nas exclusões, para não apagar a tarefa de outro aparelho que este ainda não conhece); excluir no Google tira do app; criada direto no Google entra no app e ganha a marca; duplicada (dois aparelhos) fica uma.
- O que vem do Google entra pela junção normal (`mergeData`), com a data de alteração do Google.
- As tarefas saíram do Google Agenda (o evento "☑️" some na próxima sincronização).
- Testado no navegador com Google Tarefas de mentira: ligar cria a lista com a tarefa (marca `CP Hub #t1`) e a agenda fica só com compromissos; concluir no Google concluiu no app; tarefa criada no Google entrou no app e ganhou a marca; nenhum erro.

### Passo a passo do Google Cloud (Leonardo, uma vez)
1. Abrir **console.cloud.google.com/apis/library/tasks.googleapis.com** (projeto *My First Project*) e tocar em **Ativar**.
2. Abrir **console.cloud.google.com/auth/scopes** › **Adicionar ou remover escopos** › filtro `auth/tasks` › marcar a linha `.../auth/tasks` › **Atualizar** › **Salvar**.
3. No app: Configurações › Conta Google › tocar em **"Dar acesso ao Google Agenda e Tarefas neste aparelho"** (ou desligar e ligar "Google Agenda e Tarefas") e aceitar a permissão nova.
