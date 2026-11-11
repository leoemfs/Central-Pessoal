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
