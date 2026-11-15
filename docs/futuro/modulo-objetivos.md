# Módulo Objetivos (N10)

> Situação: **N10.1 pronto (v0.56, 15/11)**. Falta o N10.2 (objetivos grandes). Tamanho **G**, dividido em N10.1 e N10.2.

## Para que serve
Ser a **central de todas as metas do app**: ver, criar e gerenciar num lugar só, e juntar metas em **objetivos grandes** (ex.: "Viajar em julho").

## Regra principal: a meta continua morando no módulo dela
Objetivos não copia nada. Mudar a meta da caixinha em Objetivos muda em Finanças (é a mesma informação). Assim nada fica duplicado nem desencontrado ("cada coisa em um lugar só").

## Metas que aparecem (N10.1)
| Meta | Mora em | O que dá para fazer em Objetivos |
|---|---|---|
| Meta e prazo de cada caixinha | Finanças › Caixinhas | ver progresso, editar meta e prazo, guardar |
| Meta de cada hábito (66 dias, quantidade como 2.000 ml) | Núcleo | ver progresso, editar, pausar (depois do M1) |
| Ciclos de estudo | Estudos | ver progresso, abrir o ciclo |
| Metas de carreira (antigo N8.4) | **Objetivos, área Carreira** | criar, editar, concluir |
| Limites do orçamento | Finanças › Orçamento | ver quanto foi, editar o limite |
| Metas da entrevista | Você | transformar em objetivo |

Filtros por área (Finanças, Corpo e mente, Estudos, Carreira…) e por situação (andando, atrasada, concluída).

## Objetivos grandes (N10.2)
Nome, prazo opcional e as metas ligadas (de qualquer módulo). A barra de progresso soma as metas ligadas. Ao concluir, vai para o histórico. Depois pode virar missão especial na Jornada (N2).

## Afeta
Finanças (caixinhas, orçamento), Núcleo, Estudos, Carreira, Você, Início (cartão "Objetivos"), Jornada (no futuro).

## Divisão
| Parte | O que entra | Tam. |
|---|---|---|
| N10.0 | Prévia visual (Artifact) | P |
| N10.1 | Central de metas: ver e gerenciar todas as metas existentes + metas de carreira | M |
| N10.2 | Objetivos grandes que juntam várias metas | M |

## Prévia N10.0 (feita em 11/11/2026)
https://claude.ai/artifact/TEPSkVaKWYhuxBcoZvkZA4

- **Objetivos** (casa do módulo): todas as metas; abas por área (Todas, Finanças, Corpo e mente, Estudos, Carreira); chips por situação (andando, atrasadas); resumo (andando, atrasadas, concluídas no ano). Cada meta mostra onde mora e abre a ação do módulo (Guardar, Marcar hoje, Abrir ciclo) e "Editar meta".
- **Grandes:** objetivos que juntam metas de vários módulos, com anel de progresso e "Ligar uma meta".
- **Concluídos:** histórico do que foi alcançado.
- **Botão +:** nova meta escolhendo onde ela mora (caixinha, hábito, estudo, carreira, limite de gasto) ou novo objetivo grande.
- **Início:** cartão Objetivos (atrasadas e próximos prazos), que pode ser movido ou ocultado com o lápis.

## Decisões do Leonardo (11/11/2026)
1. **Orçamento conta como meta:** os limites de cada categoria aparecem em Objetivos (sem chave para esconder). "Tudo deve ser contabilizado; isso motiva."
2. **Barra:** Grandes · Objetivos · Concluídos.
3. **Favorito:** quem escolher metas na entrevista inicial (E14) ganha Objetivos nos favoritos.

## Como ficou o N10.1 (v0.56, 15/11/2026)
- **Objetivos** (`#/objetivos`): resumo (andando, atrasadas, concluídas no ano; tocar em andando/atrasadas filtra), chips por área (só as áreas que têm metas, Carreira sempre) e a lista: atrasadas primeiro, depois prazo mais perto. Cada meta mostra progresso, valor, prazo e onde mora.
- Tocar numa meta: **Guardar** (caixinha), **Marcar hoje** (hábito), **Concluir/Reabrir** (Você), **Abrir no módulo** e **Editar meta** (meta e prazo da caixinha, limite do orçamento, dias do hábito a construir ou quantidade por dia). A mudança vale no módulo de origem.
- **Atrasada** = caixinha ou meta de carreira com prazo vencido, hábito que falhou no último dia (regra "não falhar duas vezes"), limite do orçamento estourado no mês.
- **Concluída** = caixinha cheia (ou realizada), hábito que chegou aos dias para virar ritual, ciclo com todos os tópicos feitos, meta de carreira ou do Você concluída.
- **Metas de carreira** moram em `career.goals` (nome, prazo, anotação, passos com check, concluída em). Aparecem também em Carreira › Metas (mesma lista).
- **Botão +:** meta de carreira, caixinha (abre Finanças › nova caixinha), hábito, ciclo de estudo, limite de gasto; "Objetivo grande" aparece como em breve.
- **Grandes** (`#/grandes`): por enquanto avisa "em breve" (N10.2). **Concluídos** (`#/concluidos`): histórico por ano.
- **Início:** cartão Objetivos com atrasadas e prazos dos próximos 30 dias (some se não houver); pode ser movido ou ocultado no lápis.
- **Montagem:** área nova "Metas e objetivos"; quem marca ganha o módulo e o favorito.
- Regras em `src/objetivos.ts` (testes em `src/objetivos.test.ts`); tela em `src/modules/Objetivos.tsx`.
