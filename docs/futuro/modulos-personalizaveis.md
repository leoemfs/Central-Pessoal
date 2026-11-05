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

## Para quem está começando
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
}
```
Fica em `AppData.settings.modules`. A navegação (`App.tsx`, `nav.ts`, `Mais.tsx`, `Dashboard.tsx`) passa a ler estas preferências.
