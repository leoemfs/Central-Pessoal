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
