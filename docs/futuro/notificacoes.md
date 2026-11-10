# Notificações (lembretes)

> **Status: IDEIA PARA IMPLEMENTAÇÃO FUTURA.** Guardada para quando o app virar app Android (ver `app-android.md`). Sem desenvolvimento no app.

## Por que ainda não existe
Hoje o app é um site (PWA) que guarda tudo só no aparelho, sem servidor. Um site só consegue avisar com o app **fechado** se um servidor mandar o aviso na hora certa (Web Push). Sem servidor, o aviso só sai com o app aberto, e aí não serve como lembrete.

Os caminhos avaliados:
| Caminho | Como funciona | Prós | Contras |
|---|---|---|---|
| **App Android (escolhido)** | Notificações locais agendadas pelo próprio aparelho | Hora exata, funciona offline, nada sai do celular | Precisa empacotar o app (ver `app-android.md`) |
| Web Push com servidor pequeno | Um servidor gratuito guarda horários e dispara o aviso | Funciona no navegador (Android e iPhone instalado) | Algo sai do aparelho; conta num serviço externo |
| Adicionar à agenda do celular (.ics) | Botão "Lembrar no celular" cria o evento no calendário | Rápido, sem servidor | O lembrete fica fora do app; mudar o horário exige adicionar de novo |
| Sincronização periódica (Android) | O navegador acorda o app de vez em quando | Sem servidor | Sem hora certa; só Chrome no Android |

**Decisão (nov/2026):** esperar o app Android e usar **notificações locais**. Se precisar antes, o caminho mais rápido é o botão "Lembrar no celular" (.ics).

## Quais avisos
| Aviso | Quando | Texto (exemplo) | Toque leva para |
|---|---|---|---|
| Conta vencendo | Na véspera, 9h (e no dia, se não paga) | "Luz vence amanhã · R$ 180,00" | Finanças, na conta |
| Fatura do cartão | 3 dias antes do vencimento | "Fatura do Nubank vence sexta" | A fatura |
| Ritual ou hábito com horário | No horário marcado | "Hora de: Meditar 5 min" | Núcleo; com prática ligada, abre a prática |
| Compromisso | 30 min antes (ajustável) | "Dentista às 15h" | O dia na Agenda |
| Dia de guardar | No dia do plano, 10h | "Hoje é dia de guardar R$ 100 em Viagem" | Caixinhas |
| Revisão semanal | Domingo, 19h | "Como foi a semana? 3 minutos de revisão" | Revisão semanal |
| Não falhe duas vezes | 20h, só quando o hábito falhou ontem e está pendente | "Ontem ficou faltando Ler 10 min. Hoje é o dia." | O hábito |
| Jornada (com o Modo Jornada) | 1 por dia, no máximo | "Seu presente do dia está esperando" | A Jornada |

## Regras
- **Cada tipo de aviso liga e desliga** em Configurações › Notificações, com o horário padrão ajustável.
- **Horário de silêncio:** nada entre a hora de dormir e a de acordar (os horários de Você).
- **No máximo 1 aviso de cada tipo por dia**; vários do mesmo tipo viram um só ("3 contas vencem amanhã").
- **Nada de culpa:** o texto nunca cobra nem fala de sequência perdida. "Não falhe duas vezes" é um convite.
- **Privacidade:** por padrão, o texto não mostra valores na tela bloqueada ("Uma conta vence amanhã"). Mostrar valores é uma opção.
- **Marcar direto no aviso:** os avisos de ritual e de "dia de guardar" têm o botão "Feito" (o de guardar usa o valor do plano).
- **Reagendar sozinho:** ao abrir o app e quando algo muda (nova conta, horário de ritual), o app reprograma os avisos dos próximos 7 dias.

## Dados
```ts
interface NotificationSettings {
  enabled: boolean;
  types: Record<'conta' | 'fatura' | 'ritual' | 'compromisso' | 'guardar' | 'revisao' | 'naoFalhe' | 'jornada', { on: boolean; time: string | null; minutesBefore: number | null }>;
  showAmounts: boolean;
}
```
Fica em `AppData.settings.notifications`. Os avisos agendados não são guardados: são recalculados a partir dos dados.

## Níveis de frequência (pedido em 10/11/2026)
Em **Configurações › Notificações**, a pessoa escolhe um nível. Cada nível é um conjunto pronto das regras abaixo; em **Personalizado**, cada tipo liga e desliga à parte.

| Tipo de aviso | Baixa (só o que dói esquecer) | Média (o essencial com hora) | Alta (tudo avisa) |
|---|---|---|---|
| **Contas** | Véspera e no dia (se ainda aberta), juntas num aviso | Igual à baixa | + 3 dias antes |
| **Fatura do cartão** | Véspera | 3 dias antes e véspera | 5 e 3 dias antes, véspera e no dia |
| **Compromissos da Agenda** | Só os marcados com **"Me lembrar"** (30 min antes) | Só os marcados com "Me lembrar" | **Todos**: na noite anterior (um aviso com os de amanhã) e 30 min antes |
| **Reuniões** (Carreira) | Só as marcadas com "Me lembrar" | **Todas**, 15 min antes | Todas: noite anterior e 15 min antes |
| **Rituais e hábitos** | — | Só os que têm o **sino** ligado (escolhido ao criar o hábito), no horário | **Todos** os que têm horário; os sem horário entram no resumo do período |
| **Não falhe duas vezes** | — | Só nos hábitos com sino, às 20h | Todos, às 20h |
| **Tarefas com prazo** | — | Só as marcadas com "Me lembrar" | Todas, às 9h do dia (juntas num aviso) |
| **Entregas de projeto** (Carreira) | — | Véspera, 9h | Véspera e no dia |
| **Cronograma de estudos** | — | — | No horário de estudo de cada ciclo; "ciclo parado há 3 dias" |
| **Treinos** | — | Só se o hábito de treino tiver sino | Nos dias de treino, no horário |
| **Dia de guardar** (Caixinhas) | — | No dia do plano, 10h | Igual |
| **Vale** | — | Saldo baixo | Saldo baixo e "recarga caiu" |
| **Revisão semanal** | — | Domingo, 19h | Igual |
| **Diário** (no ritmo escolhido) | — | — | No horário preferido, se ainda não escreveu |
| **Humor do dia** | — | — | 21h30, se ainda não marcou |
| **Vagas** (Carreira) | — | Próximo passo com data (vira compromisso) | + "sem resposta há 7 dias" |
| **Resumo da manhã** | Opcional (desligado) | Um aviso ao acordar: "Hoje: 2 contas, 1 reunião, 5 rituais" | Igual |
| **Jornada** | — | — | Presente do dia (no máximo 1 por dia) |

**"Me lembrar" e o sino:** são marcações novas, feitas na hora de criar. Compromisso e tarefa ganham a opção "Me lembrar" (com "quanto tempo antes"); hábito e ritual ganham o **sino**. É isso que separa a média da alta.

### Regras que valem em todos os níveis
- **Já fez, não avisa:** marcou o ritual, pagou a conta ou escreveu no Diário antes da hora → o aviso é cancelado.
- **Silêncio:** entre a hora de dormir e a de acordar (de Você), nada toca. O que cairia nesse período vai para a hora de acordar. Exceção: lembretes com hora marcada (reunião às 7h).
- **Juntar:** avisos do mesmo tipo na mesma hora viram um só ("3 contas vencem amanhã").
- **Teto por dia** (ajustável): baixa 5, média 12, alta 30. O que passar do teto entra no próximo resumo.
- **Botões no aviso:** "Feito" (hábito, guardar), "Paguei" (conta), "Adiar 1 hora".
- **Sem culpa** e **sem valores na tela bloqueada** por padrão (regras que já estavam acima).
- **Canais do Android:** cada tipo é um canal (Contas, Agenda, Hábitos, Estudos…). Assim a pessoa também pode silenciar um tipo pelas configurações do próprio Android, e escolher som e vibração de cada um.

### Simulação (10/11/2026)
Simulei 28 dias de avisos para dois perfis. "Agendados" são os alarmes que o app precisa deixar programados no celular.

| Perfil | Nível | Avisos por dia (média) | Pior dia | Agendados em 7 dias | Agendados em 14 dias |
|---|---|---|---|---|---|
| **Típico** (6 rituais, 3 hábitos, 14 contas/mês, 1 cartão, 3 compromissos e 2 reuniões por semana) | Baixa | 0,6 | 4 | 13 | 22 |
| | Média | 3,6 | 8 | 42 | 78 |
| | Alta | 11,5 | 19 | 125 | 244 |
| **Intenso** (15 rituais, 8 hábitos, 30 contas/mês, 3 cartões, 7 compromissos e 6 reuniões por semana) | Baixa | 1,1 | 3 | 20 | 39 |
| | Média | 7,6 | 11 | 82 | 161 |
| | Alta | 23,9 | 30 | 263 | **523** |

**O que a simulação mostrou:**
1. **A alta é dominada pelos hábitos:** de 6 a 14 avisos por dia só de rituais. Por isso a alta ganha a opção **"Juntar hábitos por período"** (manhã, tarde, noite), que corta para 3 avisos por dia sem perder nada.
2. **Limite do celular:** o Android aceita no máximo **500 alarmes** por app (o iPhone, 64). A alta do perfil intenso passa disso em 14 dias (523). **Decisão técnica:** o app programa os próximos **7 dias** e, além disso, nunca mais de **300 alarmes**; se faltar espaço, encurta a janela.
3. **Quem não abre o app:** os alarmes são reprogramados cada vez que o app abre e cada vez que algo muda. Sem abrir por mais de 7 dias, os avisos acabam. Para isso não ser um susto, o último aviso da janela é "Abra a Central para continuar recebendo os lembretes".
4. **A baixa quase não incomoda** (menos de 1 por dia) e a média fica em 4 a 8, que é o que a maioria dos apps bem avaliados usa.

### O que os módulos precisam ganhar (dados novos)
| Módulo | Já tem | Falta |
|---|---|---|
| Finanças (contas, faturas, vale, caixinhas) | Datas de vencimento, plano da caixinha | Nada |
| Agenda (compromissos) | Data e hora | Opção **"Me lembrar"** e "quanto antes" |
| Agenda (tarefas) | Prazo (só o dia) | "Me lembrar" e hora opcional |
| Carreira (reuniões, vagas, entregas) | Data e hora da reunião, data do próximo passo e das entregas | "Me lembrar" na reunião (para o nível baixa) |
| Núcleo (rituais e hábitos) | Horário e dias da semana | O **sino** |
| Núcleo (treinos) | Hábito ligado ao treino | **Dias e horário de treino** (ou usar o hábito ligado) |
| Estudos | Ciclos e tópicos, **sem datas** | **Cronograma do ciclo:** dias da semana e horário de estudo |
| Diário | — | Ritmo e horário preferido (já previsto no E1) |
| Você | Hora de acordar e de dormir | Nada |

### Dados (atualiza o rascunho acima)
```ts
interface NotificationSettings {
  enabled: boolean;
  level: 'baixa' | 'media' | 'alta' | 'personalizado';
  /** Só no personalizado: cada tipo liga/desliga e ajusta o horário. */
  types: Record<NotificationType, { on: boolean; time: string | null; minutesBefore: number | null }>;
  groupHabits: boolean;        // juntar hábitos por período
  dailyCap: number;            // teto por dia
  morningSummary: boolean;
  showAmounts: boolean;
  quiet: { from: string; to: string } | null;   // null = usa dormir/acordar de Você
}
// Marcações novas nos itens:
CalendarEvent.remind?: { minutesBefore: number } | null;
Task.remind?: { time: string } | null;
Meeting.remind?: boolean;
Habit.bell: boolean;
StudyCycle.schedule?: { days: number[]; time: string } | null;
```

### Ordem de construção sugerida
1. **Agora, sem Android (P):** as marcações "Me lembrar" e o sino já podem existir no app, junto com a regra pura que calcula a lista de avisos dos próximos 7 dias (com testes). Com isso, a tela "Próximos" e o resumo do Início já mostram o que seria avisado, e o N3.1 ("Lembrar no celular") usa a mesma lista.
2. **Com o app Android (M):** ligar a lista ao plugin de notificações locais, canais, permissões e botões.
3. **Depois:** tela "Os avisos não estão chegando?" e ajustes por fabricante.

### Alarmes exatos (decisão pendente)
- **Sem permissão especial:** o Android pode atrasar um aviso em alguns minutos (até uns 10 com economia de bateria). Serve para contas, hábitos e resumos.
- **Com a permissão "Alarmes e lembretes":** hora exata, mas a pessoa precisa liberar numa tela do sistema, e a Play Store só aceita essa permissão em apps de agenda ou alarme.
- **Recomendação:** pedir só se a pessoa ligar lembretes de compromisso ou reunião, explicando o motivo. O resto usa o modo comum.

## Decisões do Leonardo (10/11/2026)
1. **Contas e faturas em todos os níveis** (baixa, média e alta): sim.
2. **Juntar hábitos por período** (manhã, tarde, noite) na alta: sim, como opção que liga e desliga.
3. **Estudos:** cada ciclo ganha um cronograma (dias da semana e horário). **Treinos:** o aviso usa o hábito ligado ao treino (sem plano próprio).
4. **Hora exata:** pedir a permissão de "Alarmes e lembretes" só para compromissos e reuniões. O resto pode atrasar alguns minutos.
