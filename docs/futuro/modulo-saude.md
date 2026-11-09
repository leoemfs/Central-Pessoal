# Saúde (N1)

> **Situação: em documentação (09/11).** Sem código. Aparece como "em breve" no app. Não foi adiantado na fila: continua no item 10 da fila sugerida.
> **Tamanho:** G, dividido em partes (abaixo). Cada parte é uma sessão de construção, só depois de aprovada.

Um módulo separado do Núcleo. A diferença:
- **Núcleo:** o que a pessoa **pratica** (meditar, treinar, alongar);
- **Saúde:** o que a pessoa **acompanha** (água, sono, alimentação, remédios, consultas, peso).

**Afeta** (pelo Mapa dos módulos): Agenda (consultas, exames e horários de remédio), Listas (ingredientes da dieta), Você (horários de dormir e acordar), Núcleo (hábito de água, se existir), Início (cartão do dia), Revisão semanal, Busca, backup (`normalize()`), Jornada (só depois, N2).

## Partes
| Parte | O que registra | Ligações |
|---|---|---|
| **Água** | copos por dia, com meta (ex.: 2 L) e um toque para somar | pode usar o hábito com quantidade que já existe |
| **Sono** | hora de dormir e de acordar, e como acordou (bem · mais ou menos · cansado) | usa os horários de Você; alimenta as sugestões de sono |
| **Dieta** | plano alimentar (refeições e o que comer em cada uma) e o dia a dia: "segui", "segui em parte", "fugi" | ingredientes viram lista de compras em Listas; horários das refeições podem ir para a Agenda |
| **Remédios** | nome, dose, horários e "tomei", com lembrete | lembretes pelo mesmo sistema da Agenda |
| **Consultas e exames** | data, especialidade, local e anotações | entram na Agenda sozinhos (como Carreira); o resultado pode virar nota |
| **Peso e medidas** | peso, cintura e outras medidas, com gráfico de evolução | opcional; nunca aparece no Início sem a pessoa pedir |

## Dieta (pedido do Leonardo, 09/11)
A ideia é ter a dieta **dentro** do módulo, para seguir no dia a dia.

**Plano alimentar**
- Um ou mais planos (ex.: "Dieta da nutricionista", "Semana de treino"); só um fica **em uso**.
- Cada plano tem **refeições** (café da manhã, lanche, almoço, lanche da tarde, jantar, ceia), com horário e o que comer.
- Cada refeição pode ter **opções** ("ou isto, ou aquilo"), como as dietas de nutricionista costumam ter.
- Campo de anotação livre (orientações, substituições, o que evitar).
- Pode ser diferente por dia da semana (opcional; o padrão é igual todos os dias).

**No dia a dia**
- Tela "Hoje": as refeições do plano em ordem, com um toque para marcar **segui · em parte · fugi**, e a opção escolhida.
- Campo rápido para anotar o que comeu fora do plano (sem contar calorias por padrão).
- Resumo da semana: quantas refeições seguidas, em parte e fora do plano.

**Ligações**
- **Listas:** botão "Gerar lista de compras" junta os ingredientes do plano da semana numa lista de Mercado (parte opcional, pode vir depois).
- **Agenda:** horários das refeições podem aparecer como lembrete (desligado por padrão).
- **Revisão semanal:** linha "Dieta: X de Y refeições seguidas".

**Cuidados da Dieta**
- O app **não monta dieta nem dá conselho**: a pessoa escreve o plano (o dela ou o da nutricionista).
- Calorias e macros (proteína, carboidrato, gordura) ficam **fora da primeira versão**; se entrarem depois, ficam escondidos por padrão, como o peso.
- "Fugi" não tem cor de erro nem aviso: é só registro.

**A decidir antes de construir** (perguntar ao Leonardo):
1. A dieta vem de nutricionista (copiar o plano pronto) ou é montada por você?
2. Precisa de dias diferentes (ex.: dia de treino × dia de descanso) já na primeira versão?

## Divisão para construir
Ordem sugerida (cada parte com versão, testes e PR próprios):
1. **N1.0 Prévia visual:** telas do módulo, barra de baixo e cartão no Início (só prévia, sem código).
2. **N1.1 Água e Sono:** registros do dia e meta de água (P a M).
3. **N1.2 Dieta:** plano alimentar e "Hoje" com segui · em parte · fugi (M).
4. **N1.3 Remédios:** horários, "tomei" e lembrete (M).
5. **N1.4 Consultas e exames na Agenda:** entram e se atualizam sozinhos, como Carreira (P a M).
6. **N1.5 Peso e medidas:** com gráfico, escondido por padrão (P).
7. **Depois:** lista de compras da dieta em Listas; ligação com a Jornada.

**Navegação** (regra do app): abas no topo para as partes do mesmo conteúdo; barra de baixo com ferramentas do módulo (ideia: **Hoje · Saúde · Histórico**); botão + para criar (registro, refeição, remédio, consulta, medida) e, por último, Categorias se houver.

## Ligação com Hábitos e Treinos (09/11)
**Regra:** cada dado mora em **um lugar só**; os outros módulos **mostram e marcam** esse mesmo dado. Ninguém precisa trocar de módulo nem registrar duas vezes. É o mesmo jeito que já funciona hoje entre Hábitos e Mente/Corpo (hábito ligado a uma prática é marcado sozinho).

| Hábito (Núcleo) | Dado mora em | Como se ligam |
|---|---|---|
| Beber água (meta em ml) | Saúde › Água | o mesmo número: tocar "+250 ml" no cartão do hábito soma em Saúde, e somar em Saúde enche o anel do hábito |
| Dormir no horário | Saúde › Sono | marcado sozinho quando o sono registrado começa até o horário do hábito |
| Tomar remédio | Saúde › Remédios | marcado sozinho quando todos os "tomei" do dia estão feitos |
| Seguir a dieta | Saúde › Dieta | marcado sozinho quando as refeições "segui" chegam à meta do dia (ex.: 4 de 5) |
| Treinar | Núcleo › Corpo (fichas) | já é assim: concluir a ficha marca o hábito. Saúde só **mostra** os dias com treino no resumo, sem guardar nada |

**Como fica para quem usa:**
- No hábito, o campo **"Ligado a"** (hoje: prática de Mente/Corpo) ganha as opções de Saúde: Água, Sono, Remédios, Dieta.
- No cartão do hábito aparece um selo pequeno (ex.: "💧 Saúde"); tocar no selo abre a parte certa de Saúde, mas marcar funciona dali mesmo.
- Em Saúde, cada parte mostra "hábito ligado: Beber água · 12 dias seguidos", sem duplicar a sequência.
- Treinos continuam no Núcleo (Corpo e, depois, fichas próprias do M6). Saúde não ganha aba de treino; só um cartão "Treinos da semana" que lê do Núcleo.

**Dados antigos:** quem já tem um hábito de água com quantidade recebe **uma pergunta** ao abrir Saúde pela primeira vez: "Ligar o hábito Beber água à Saúde?". Se sim, o histórico do hábito vira o histórico de água (nada se perde). Se não, tudo fica como está.

**Mapa dos módulos (ao construir):** Saúde passa a entregar para Núcleo (marca hábitos ligados) e a usar de Núcleo (dias com treino).

## Cuidados
- **Nada de diagnóstico** nem conselho médico. O app só registra.
- **Peso e medidas ficam escondidos por padrão,** para não pesar em quem não quer ver esses números.
- Tudo fica **só no aparelho** e entra no backup.

## Com a Jornada
- Tomar o remédio na hora e beber a meta de água contam como missões do dia (+**Resistência**).
- Seguir as refeições do plano pode contar como missão, mas **"fugi" nunca tira pontos**.
- Peso e medidas **não dão recompensa**, para não incentivar metas pouco saudáveis.
