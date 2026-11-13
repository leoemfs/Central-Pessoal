# M27 · Agenda: escrever do seu jeito

> Situação: **ideia** (13/11). Escolhida pelo Leonardo entre as "sugestões inteligentes".
> Tamanho: **M**. Afeta: Agenda (compromissos e tarefas), Google Agenda e Google Tarefas (N9.5 e N9.6, que já recebem o que for criado), Busca.

## A ideia
Você escreve uma frase, por exemplo **"dentista sexta 15h"**, e o app preenche sozinho o título, a data e a hora. Você confere e salva.

## Onde fica (recomendado)
- **Sem botão novo.** A linha "Escreva do seu jeito" fica no topo da folha de **novo compromisso** (e de **nova tarefa**), no botão + da Agenda.
- Enquanto você escreve, os campos de baixo vão sendo preenchidos e as partes que o app entendeu ficam **destacadas** ("sexta 15h").
- Ainda dá para mexer em qualquer campo antes de salvar. Nada é salvo sem você tocar em Salvar.

## O que o app entende (parte 1)
- **Dias:** hoje, amanhã, depois de amanhã; segunda a domingo (o próximo dia com esse nome); "sexta que vem"; "dia 20"; "20/11"; "20 de novembro".
- **Horas:** 15h, 15h30, 15:30, "às 3 da tarde", "9 da manhã", "meio-dia".
- **Local:** "no/na/em ..." depois da hora (ex.: "dentista sexta 15h na clínica Sorriso"). Na dúvida, fica no título.
- **Sem hora:** compromisso de dia todo (como já existe hoje). Na folha de tarefa, a data vira o prazo.
- O que sobrar vira o **título** ("Dentista", com a primeira letra maiúscula).

## Fica para depois
- "toda segunda", "todo dia 5" e aniversários: dependem do **M5** (repetição na Agenda).
- Escrever direto no Início ou na busca, e criar despesas ("uber 25 ontem"): só depois de testar a parte 1.
- Falar em vez de escrever (microfone do celular).

## Regras e testes
- Regra pura em `src/textoLivre.ts` (entra texto e a data de hoje; sai título, data, hora e local), com testes `node:test` cobrindo cada jeito de escrever acima, virada de mês e de ano e "sexta" quando hoje já é sexta.
- Não muda os dados: usa os campos que compromissos e tarefas já têm (`CalendarEvent`, `Task`), então não precisa mexer em `normalize()`.
