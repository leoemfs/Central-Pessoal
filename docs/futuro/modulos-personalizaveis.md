# Módulos personalizáveis

> **Status: OBJETIVO PARA O FUTURO.** Sem desenvolvimento.

## Por quê
O app já tem muitos módulos: Finanças, Agenda, Diário, Núcleo, Listas, Preços, Notas, Orçamento, Relatórios, Caixinhas, Você, Revisão e Jornada. Para quem chega agora, isso pode **sufocar e travar**. Cada pessoa escolhe o que quer ver; o resto fica guardado, sem atrapalhar.

## Como funciona
- **Configurações › Módulos:** a lista de todos os módulos, cada um com um interruptor **Mostrar / Ocultar**.
  - **Oculto não é apagado:** o módulo some do menu ☰, do Mais, do Início ("Seu dia" e cartões) e da busca, mas os dados ficam guardados e entram no backup.
  - **Mostrar de novo** devolve tudo como estava.
- **Barra de baixo (guia rápida):** Início e Mais ficam fixos, e você escolhe **os 3 do meio** (hoje: Finanças, Diário e Agenda). Dá para trocar e reordenar.
  - Exemplos: Listas no lugar de Diário, Núcleo no lugar de Agenda.
- **O resto fica no Mais**, na ordem que você escolher. Módulos ocultos aparecem no fim do Mais, recolhidos ("3 módulos ocultos · mostrar"), para nada se perder.
- **Cartões do Início:** escolher quais aparecem (humor do dia, Para você, orçamento, listas fixadas, caixinhas, autocuidado da semana…). Os avisos importantes, como conta vencendo e saldo baixo do vale, continuam sempre.
- **Dependências:** ocultar Finanças oculta junto Orçamento, Relatórios, Caixinhas e Vales. Ocultar Listas oculta Preços. O app avisa antes.

## Ritmo de cada módulo (começando pelo Diário)
Escolher um módulo não pode virar obrigação. Junto com "Mostrar", o módulo pergunta **com que frequência** a pessoa quer usá-lo, e o app cobra só isso.

### Diário
- Pergunta ao escolher o Diário (e depois em Configurações › Módulos › Diário): **"Você quer escrever com que frequência?"**
  - **Todo dia**
  - **Algumas vezes na semana**: 2, 3, 4 ou 5 vezes
  - **Em dias certos**: escolher os dias (ex.: ter, qui e dom)
  - **Quando der**: sem meta e sem lembrete
- Opcional: **horário preferido** (manhã, tarde ou noite), para o convite aparecer na hora certa no Início.
- **Como o app usa isso:**
  - **Todo dia / dias certos:** o convite "Escrever hoje" aparece no Início só nesses dias, e some quando já escreveu.
  - **Algumas vezes na semana:** o Início mostra o andamento, "Diário: 1 de 3 nesta semana", e só convida enquanto a meta da semana não foi batida. Bateu a meta, o convite some até segunda.
  - **Quando der:** nenhum convite. O cartão do Diário mostra só o último registro, como hoje.
  - **Nunca conta como falta:** sem sequência quebrada, sem "você não escreveu ontem". A Revisão da semana mostra "Você escreveu 3 vezes (sua meta era 3)" em tom de conquista, nunca de cobrança.
  - O humor do dia com nota e as "Três coisas boas" também contam como registro no Diário.
- **Padrão:** quem já usa o app fica com **"Quando der"**, que é exatamente o comportamento de hoje.
- **Na Jornada:** as missões do Diário seguem esse ritmo ("quando der" = escrever 1 vez na semana, valendo menos pontos). Detalhes em `modulo-rpg.md`, 5.4.

### Outros módulos (mais adiante, mesma ideia)
- **Hábitos e rituais:** a frequência já é escolhida em cada hábito (dias da semana ou X vezes por semana). Não precisa de nada novo.
- **Humor:** "todo dia" ou "só quando eu quiser" (some o cartão de pergunta do Início).
- **Revisão semanal:** "toda semana", "a cada 2 semanas" ou "só quando eu abrir".
- **Caixinhas:** já tem o ritmo de cada caixinha (guardar por semana ou por mês).


- Na **entrevista da primeira abertura** (ou no "Pular e usar o app"), uma pergunta rápida: **"O que você quer usar agora?"**, com os módulos em botões.
  - Já vêm marcados: Finanças, Agenda e Diário, mais os que combinam com as áreas escolhidas (Corpo → Núcleo; Dinheiro → Orçamento e Caixinhas).
  - Todo o resto começa oculto e aparece no Mais como "Descobrir mais módulos".
- Quem já usa o app continua vendo tudo como hoje. Nada some numa atualização.

## Dados (rascunho)
```ts
interface ModuleSettings {
  hidden: string[];          // caminhos dos módulos ocultos: 'listas', 'jornada'…
  tabs: [string, string, string];   // os 3 do meio da barra de baixo
  moreOrder: string[];       // ordem no Mais
  homeCards: Record<string, boolean>;  // cartões do Início
  /** Ritmo de cada módulo. Sem valor = "quando der" (como hoje). */
  rhythm: {
    diario?: {
      mode: 'todo-dia' | 'semana' | 'dias' | 'livre';
      perWeek?: number;      // 2 a 5, no modo 'semana'
      days?: number[];       // 0 = domingo, no modo 'dias'
      time?: 'manha' | 'tarde' | 'noite' | null;
    };
    humor?: { mode: 'todo-dia' | 'livre' };
    revisao?: { mode: 'semanal' | 'quinzenal' | 'livre' };
  };
}
```
Fica em `AppData.settings.modules`. A navegação (`App.tsx`, `nav.ts`, `Mais.tsx`, `Dashboard.tsx`) passa a ler estas preferências.
- Regra pura `journalPrompt(data, hoje)` → `{ show, done, target }` decide o convite do Diário no Início (com testes: cada modo, meta batida, semana virando, humor com nota contando).
