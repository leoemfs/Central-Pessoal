# Jornada: o que cada módulo dá (XP, ouro e atributos)

> **Status: RASCUNHO PARA O FUTURO.** É uma noção básica, para ajustar quando a Jornada completa for construída (`modulo-rpg.md`). Os valores de rituais, hábitos, tarefas, contas, diário e revisão já existem na prévia da Jornada (`src/journey.ts`).

## Como funciona, em uma frase
Cada coisa feita na vida real dá **XP** (sobe o nível), **ouro** (compra itens na loja da Jornada) e **pontos de atributo** (mostram em que área você está evoluindo).

## Os 6 atributos
| Atributo | O que representa | Vem principalmente de |
|---|---|---|
| **FOR** Força | corpo forte | treinos de força |
| **AGI** Agilidade | corpo que se mexe | caminhada, corrida, alongamento, esportes |
| **RES** Resistência | saúde do dia a dia | sono, água, alimentação, cardio, Saúde |
| **INT** Inteligência | aprender e conhecer | leitura, estudo, cursos, pesquisar preços |
| **SAB** Sabedoria | mente e reflexão | Diário, humor, meditação, respiração, gratidão, Revisão |
| **DIS** Disciplina | organização e palavra cumprida | contas em dia, tarefas, caixinhas, orçamento, listas |

Nos hábitos e rituais, a pessoa escolhe os atributos (o app sugere pelo nome). Um atributo só: **+3** por dia cumprido. Mais de um: **+2 em cada**.

## Por módulo
| Módulo | Ação | XP | Ouro | Atributo |
|---|---|---|---|---|
| **Núcleo** | Ritual cumprido no dia | 10 | 5 | os escolhidos no ritual |
| | Hábito em construção cumprido no dia | 20 | 10 | os escolhidos no hábito |
| | Semana inteira sem recaída (hábito a abandonar) | 30 | 15 | os escolhidos no hábito |
| **Mente** | Meditação ou respiração guiada | 15 | 8 | SAB +3 |
| | Três coisas boas (gratidão) | 10 | 5 | SAB +2 |
| **Corpo** | Treino concluído | 25 | 12 | FOR +2, RES +2 |
| | Alongamento | 10 | 5 | AGI +3 |
| | Caminhada ou corrida | 15 | 8 | AGI +2, RES +2 |
| **Diário** | Registro do dia | 10 | 5 | SAB +3 |
| **Humor** | Humor do dia marcado | 5 | 2 | SAB +1 |
| **Agenda** | Tarefa concluída | 15 | 8 | DIS +2 |
| **Finanças** | Conta paga até o vencimento | 20 | 10 | DIS +3 |
| | Fatura do cartão paga até o vencimento | 30 | 15 | DIS +3 |
| | Lançar um gasto (até 5 por dia) | 2 | 1 | DIS +1 |
| **Orçamento** | Mês fechado dentro do orçamento | 100 | 50 | DIS +5, SAB +3 |
| **Caixinhas** | Guardar no ritmo combinado (por semana ou mês) | 20 | 10 | DIS +2 |
| | Caixinha chegou na meta | 100 | 50 | DIS +5 + conquista |
| **Listas** | Compra concluída | 10 | 5 | DIS +1 |
| **Preços** | Preço cadastrado (até 10 por dia) | 2 | 1 | INT +1 |
| **Revisão** | Revisão semanal feita | 40 | 20 | SAB +3, DIS +2 |
| **Você** | Entrevista completa (uma vez) | 50 | 25 | todos +1 |
| **Saúde** (futuro) | Meta de água do dia | 10 | 5 | RES +2 |
| | Sono na meta | 10 | 5 | RES +2 |
| | Remédio tomado no horário | 10 | 5 | DIS +2 |
| | Consulta ou exame feito | 30 | 15 | RES +3 |
| | Registrar o peso | 5 | 2 | — |

**Missões da semana:** além das ações, cada módulo tem uma missão no ritmo que a pessoa escolheu, com bônus de 10 XP por vez combinada (ex.: Diário 3 vezes na semana = 30 XP). Detalhes em `modulo-rpg.md`, 5.4.

## Recompensa de entrada: ícone da Jornada (decidido em 12/11)
- Ao **desbloquear a Jornada e aceitar o desafio**, a pessoa ganha a escolha do **ícone do app em pixel art**, como recompensa pelo aceite.
- São **4 estilos aprovados**, todos com o formato e os cantos arredondados do ícone de hoje, sempre na cor de destaque escolhida: **A** pixels por dentro, **B** borda pixelada com cantos redondos, **C** mosaico, **D** selo 8-bit. Prévia: https://claude.ai/artifact/UYe1Nhm59RYRVKnuojcTXN
- Depois dá para trocar o estilo (ou voltar ao ícone tradicional) em Personalização. Jornada desligada = ícone tradicional.
- Só funciona no **app Android** (ponto A11 de `app-android.md`); no app do navegador, o ícone da tela inicial é fixo.

## Regras para ser justo
- **Nada se ganha gastando dinheiro.** Comprar não dá ponto.
- **Vale o hábito, não o valor:** guardar R$ 20 ou R$ 2.000 na caixinha dá o mesmo ponto. Quem ganha menos não fica para trás.
- **Peso não dá ponto por subir ou descer**, só por registrar. A Jornada não incentiva emagrecer a qualquer custo.
- **Uma vez por dia** no que é diário (Diário, humor, ritual), e limite por dia no que é fácil de repetir (lançar gastos, cadastrar preços).
- **Desfez, devolve:** desmarcar um hábito ou apagar um registro tira o ponto que ele deu. Isso não é castigo, só correção.
- **Nunca se perde XP** por deixar de fazer algo (regra da seção 6 de `modulo-rpg.md`).
- **Módulo oculto não gera nada**, nem missão. Reapareceu, volta a contar.
- **Conta paga atrasada** não dá ponto, mas também não tira.

## Nível
Do nível N para o N+1 são necessários **100 × N XP** (nível 2 com 100 XP, nível 3 com mais 200…). Uma semana tranquila (3 rituais por dia, 3 registros no Diário, algumas tarefas e contas em dia) dá por volta de 400 a 500 XP.
