# Estudos e Carreira × Jornada (plano de integração)

> **Situação: SÓ DOCUMENTADO (08/11).** Nada disso está construído. Vale quando a Jornada completa existir (`modulo-rpg.md`).
> Segue as regras de `jornada-recompensas.md`: tudo é **calculado a partir dos dados** (desmarcar tira a recompensa junto; faltar não tira nada; não se ganha nada repetindo ações à toa).

## Ideia em uma frase
Estudar é a principal fonte de **INT (Inteligência)**. O módulo Estudos recompensa **aprender de verdade** (tópicos concluídos, ciclos terminados, constância), não o número de cliques.

## O que já está pronto nos dados (v0.21)
Não é preciso guardar nada novo para a Jornada. Tudo sai de `AppData.study`:
- `cycles[].topics[].status` e `doneAt`: quando cada tópico foi concluído;
- `cycles[].finishedAt`: ciclo finalizado;
- `notebooks[].log[].at`: dias com anotação ou edição no notebook;
- `maps[].updatedAt` e `sources[].createdAt`: mapas e fontes;
- `library()` (em `src/estudos.ts`) diz a área de cada trilha (Idiomas, Dev, IA, Produtividade, Carreira ou da pessoa).

## Recompensas (rascunho)
| Ação | XP | Ouro | Atributo | Limite e regra |
|---|---|---|---|---|
| Tópico concluído num ciclo | 15 | 8 | INT +2 | Conta **uma vez por tópico** na vida. Concluir de novo num ciclo de revisão dá metade. Até 5 por dia. |
| Tópico da área **Carreira** concluído | 15 | 8 | INT +1, SAB +1 | Autoconhecimento também é sabedoria. |
| Ciclo finalizado com tudo concluído | 60 | 30 | INT +5, DIS +2 | Encerrar sem terminar não dá bônus (os tópicos concluídos já contaram). |
| Trilha inteira estudada (somando ciclos) | 100 | 50 | INT +5 | + conquista "Trilha completa" e um baú raro. |
| Dia com anotação no notebook | 5 | 2 | INT +1 | Uma vez por dia, qualquer notebook. |
| Mapa mental criado ou editado | 5 | 2 | INT +1, SAB +1 | Uma vez por dia. |
| Fonte guardada | 2 | 1 | INT +1 | Até 3 por dia. |
| Semana de estudo (3 dias ou mais com tópico ou anotação) | 30 | 15 | DIS +2 | Recompensa a constância, não o volume. |

**Para ser justo:** desmarcar um tópico tira o que ele deu. Marcar e desmarcar várias vezes não soma. Criar ciclos ou notebooks vazios não dá nada.

## Na Jornada
- **Campanha (Anexo C):** missões como "Conclua 3 tópicos esta semana" ou "Termine um ciclo". O chefe semanal da região do conhecimento perde vida a cada tópico concluído.
- **Codex (`jornada-raridades.md`):** coleção **Biblioteca**, com um selo por área estudada (Idiomas, Desenvolvimento, IA, Produtividade, Carreira e as áreas da pessoa). Selo comum no primeiro tópico, raro no primeiro ciclo finalizado e épico na primeira trilha completa.
- **Itens temáticos:** Grimório (épico, +10% XP em INT, já citado em raridades), Pena de escriba (anotações), Luneta (mapas mentais).
- **Pet:** Coruja, liberada no primeiro ciclo finalizado.
- **"Desde a sua última visita":** "+2 tópicos estudados, ciclo Inglês A1 · Ciclo 1 em 75%".

## Revisão semanal (pode vir antes da Jornada)
Mostrar "O que estudei nesta semana": tópicos concluídos, ciclo em andamento e dias com anotação. Não depende da Jornada, então pode ser um item pequeno (P) separado.

## Como construir (quando chegar a vez)
1. Em `src/jornada/rules.ts`: função `studyRewards(data, desde, ate)` que lê `study.cycles` e `study.notebooks` e devolve XP, ouro e atributos por dia, aplicando os limites acima.
2. Somar no total da Jornada e em `attributeTotals`.
3. Testes: tópico desmarcado tira a recompensa, limite por dia, tópico contado uma vez só, semana de estudo.
4. Ajustar os valores depois de alguns dias de uso real.
