# Hábitos: pausar e arquivar

> **Status: PRONTO na v0.32** (11/11/2026). Item M1 da Central.

Hoje, para tirar um ritual ou hábito da frente, a única saída é **excluir**, e o histórico vai junto. A vida muda (viagem, lesão, outra rotina), e o hábito precisa poder esperar ou terminar sem se perder.

## Pausar
- **"Pausar"** no detalhe do hábito, com o prazo **até uma data** (ex.: "até voltar de viagem, 20/12") ou **sem data**.
- **Enquanto pausado:**
  - não aparece em Hoje, no Início, no dia da Agenda nem na Revisão;
  - não conta como falta: a sequência **congela**, sem zerar, e a consistência ignora os dias pausados;
  - o aviso "não falhe duas vezes" fica desligado;
  - a Jornada não tira nada (ela nunca tira).
- **Retomar:** automático na data escolhida ("Ler 10 min voltou hoje") ou manual, com "Retomar agora".
- No Núcleo, uma seção recolhida **"Pausados (2)"** mostra cada um com "volta em 20/12" e o botão Retomar.
- **Hábito a abandonar:** pausar não faz sentido (os "dias sem" continuam contando), então ele só tem a opção de arquivar.

## Arquivar
- **"Arquivar"** para o que terminou ou não faz mais parte da rotina:
  - um hábito que virou natural e não precisa mais ser marcado;
  - um projeto que acabou;
  - um hábito a abandonar já vencido ("90 dias sem refrigerante").
- **O arquivado sai de tudo**, mas o **histórico fica**: mapa de 12 semanas, sequência máxima, total de dias e recaídas.
- No Núcleo, **"Arquivados"** fica no fim, recolhido, com "Restaurar" e "Excluir de vez".
- **Ao arquivar um hábito a abandonar com uma boa marca**, o app comemora: "Você ficou 92 dias sem refrigerante".

## Dados (rascunho)
```ts
interface Habit {
  // …
  /** Períodos pausados (o último pode estar em aberto: to = null). */
  pauses: { from: string; to: string | null }[];
  archivedAt: string | null;
}
```
- `isScheduled` passa a responder "não" nos dias pausados. Assim a sequência, a consistência, o "não falhe 2x", a Revisão e a Agenda se ajustam sozinhos.
- Retomar = fechar o período aberto (`to` = ontem).

## Como ficou (v0.32)
- Regras em `src/habits.ts` (`isPaused`, `isArchived`, `pauseHabit`, `resumeHabit`, `archiveHabit`, `activeHabits`), com testes em `src/habitPause.test.ts`.
- `isScheduled` responde "não" nos dias pausados e depois do arquivamento. Por isso sequência, consistência, "não falhe 2x", Hoje, Início, Agenda, Revisão e o marcar automático das práticas se ajustam sozinhos.
- "Pausar" no detalhe do hábito: até uma data (volta sozinho nesse dia, com o selo "Voltou hoje") ou sem data. "Retomar agora" fecha a pausa ontem; se ela começou hoje, é desfeita.
- "Arquivar" em qualquer tipo. No hábito a abandonar, os "dias sem" congelam na data e o app comemora a marca (7 dias ou mais).
- No Núcleo: seção "Pausados (n)" aberta, com Retomar, e "Arquivados (n)" recolhida, com Restaurar. No detalhe do arquivado aparece "Excluir de vez".
- Progresso ignora os arquivados; a Revisão mostra o hábito a abandonar até a semana em que foi arquivado.
