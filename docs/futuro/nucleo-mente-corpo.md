# Núcleo pessoal: Mente e Corpo

> **Status: IMPLEMENTADO na v0.12.** Diferenças em relação a este texto:
> - o Núcleo tem 4 abas: **Rituais · Hábitos · Mente · Corpo** (Rotina = as duas primeiras);
> - o sino se liga e desliga no próprio botão de sino da prática, e não em Configurações;
> - criar e editar fichas de treino ficam para uma próxima versão (por enquanto, A, B, C e Em casa);
> - os minutos e treinos da semana aparecem no Início ("Autocuidado da semana") e, desde a v0.38 (M7), na Revisão semanal;
> - nada de XP por prática ainda: os hábitos ligados é que contam para os atributos.
> - código: `src/practices.ts` (catálogo e regras, com testes em `practices.test.ts`) e `src/modules/Praticas.tsx` (telas).

O Núcleo pessoal ganha práticas de autocuidado **dentro do app**, para a pessoa não precisar de outros apps para meditar, respirar, alongar ou seguir a ficha da academia. Tudo funciona sem internet.

O Núcleo passa a ter 3 abas:
- **Rotina:** o que já existe (rituais, construir e abandonar), mais "Sugeridos para você" (ver `modulo-voce.md`).
- **Mente:** meditação, respiração e gratidão.
- **Corpo:** treinos, alongamentos, caminhada e corrida.

## Regra geral das práticas
- **Tela cheia e calma,** com um só foco. O "X" no canto encerra a qualquer momento.
- **Sino suave** no começo, nas trocas e no fim (som gerado no aparelho, sem arquivo). O botão de sino, no canto da tela, liga e desliga.
- **No fim:** resumo, "Como você está agora?" (Mais calmo · Igual · Ainda agitado) e "Concluir".
- **Encerrar antes também conta:** "Cada minuto conta." Nada de culpa.
- **Hábitos ligados marcam sozinhos.** Um hábito pode ter um `link` com uma prática (ex.: "Meditar 5 min" → meditação). Ao concluir, ele é marcado como feito no dia, e a tela mostra "Marcado no Núcleo: Meditar 5 min". Na lista, esses hábitos têm o botão "Iniciar".
- **Indicadas para você:** as práticas que combinam com o perfil têm borda verde e o texto "indicada para você" (ex.: com ansiedade, a respiração 4-7-8).
- **Movimento reduzido:** com essa opção do sistema ligada, as animações viram trocas simples.

## Mente
### Meditar (livre)
- Duração: 3, 5, 10, 15 ou 20 min. Começa com 5.
- Uma esfera que "respira" devagar, o tempo restante e uma frase de apoio. Pausar e "Terminar agora".

### Meditações guiadas
Os passos aparecem um por vez, divididos no tempo total:
| Nome | Tempo | Passos | Indicada quando |
|---|---|---|---|
| Respiração consciente | 5 min | 7 | ansiedade |
| Escaneamento do corpo | 10 min | 8 | — |
| Atenção aos sons | 5 min | 5 | — |
| Antes de dormir | 10 min | 6 | sono ruim |

### Respiração
A esfera cresce ao inspirar, fica parada ao segurar e encolhe ao expirar, com a contagem de segundos e o ciclo atual.
Cada sessão dura cerca de 2 minutos (mínimo de 3 ciclos).
| Nome | Ritmo | Ciclos em 2 min | Uso |
|---|---|---|---|
| Respiração 4-7-8 | inspira 4, segura 7, expira 8 | 6 | relaxar e dormir |
| Respiração em caixa | 4-4-4-4 | 8 | foco e calma |
| Coerência | inspira 5, expira 5 | 12 | equilibrar o ritmo |

### Três coisas boas de hoje
Três campos curtos. "Salvar no Diário" cria uma entrada com a etiqueta **Gratidão** e marca o hábito ligado.

## Corpo
### Treinos (fichas)
- Fichas prontas: **A** (peito e tríceps), **B** (costas e bíceps), **C** (pernas) e **Em casa** (sem equipamento, 20 min). A ficha indicada para o perfil fica em primeiro.
- A pessoa poderá **criar e editar fichas** (nome, exercícios, séries, repetições, carga, descanso).
- **Durante o treino:**
  - cada série é um botão: tocar marca a série e começa o **descanso** (60 s), com barra, "+15 s" e "Pular". No fim, toca o sino e aparece "Próxima série!";
  - a carga se ajusta com − e + (2,5 kg);
  - **"Última vez: 22,5 kg"** mostra a carga do treino anterior. Só é guardada a carga dos exercícios que tiveram pelo menos uma série feita.
- **No fim:** séries feitas e o volume total ("2 séries · 450 kg levantados no total").

### Alongamentos guiados
Um movimento por vez, com nome, instrução, anel de tempo e o próximo movimento. Troca sozinho, com um sino curto. Botões: Voltar, Pausar e Pular.
| Sequência | Tempo | Movimentos | Indicada quando |
|---|---|---|---|
| Acordar | 5 min | 7 | — |
| Pescoço e ombros | 5 min | 7 | trabalho sentado |
| Lombar | 6 min | 6 | dor nas costas |
| Depois do treino | 6 min | 7 | — |

### Caminhada e corrida
- Cronômetro com a escolha Caminhada ou Corrida, Pausar e Parar.
- No fim, a **distância é opcional** (aceita vírgula: "2,5").
- As últimas 3 aparecem na aba Corpo. **GPS e mapa ficam para depois.**

## Resumo da semana
O Início ganha o cartão **"Esta semana"**: minutos de meditação e respiração, treinos, e alongamentos e caminhadas. Os mesmos números entram na Revisão semanal.

## Com a Jornada
Cada prática concluída vira atributo, pelas regras que já existem para os hábitos:
- meditação, respiração e gratidão → **Sabedoria**;
- treino → **Força**;
- alongamento e caminhada → **Agilidade**.

As práticas só dão XP uma vez por dia por tipo, para não incentivar repetir sessões curtas.

## Dados
```ts
interface Session {
  id: string;
  date: string;            // AAAA-MM-DD
  type: 'meditacao' | 'respiracao' | 'alongamento' | 'treino' | 'caminhada';
  sub: string | null;      // ex.: 'dormir', '478', 'lombar', 'A'
  minutes: number;
  km: number | null;       // caminhada e corrida
  sets: number | null;     // treino
  volume: number | null;   // treino, em kg
  feel: 'calmo' | 'igual' | 'agitado' | null;
}
interface WorkoutPlan { id: string; name: string; sub: string; rest: number; ex: { name: string; sets: number; reps: number; kg: number }[]; }
```
- Novos campos em `AppData`: `sessions`, `workoutPlans` e `lastLoads` (exercício → kg).
- Novo campo em `Habit`: `link` (ex.: `meditacao`, `alongamento:lombar`, `treino`).
- Gratidão usa o Diário que já existe (`JournalEntry`), com a etiqueta Gratidão.
