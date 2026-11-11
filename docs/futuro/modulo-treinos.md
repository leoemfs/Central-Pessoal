# Treino em casa (Núcleo › Corpo)

> Situação: **pronto na v0.29** (11/11, PR #37). Aprovado em 11/11 ("implemente em partes: telas, bonecos"). Inspiração: prints do app "Treino em casa" enviados pelo Leonardo.
> **Afeta:** Núcleo (aba Corpo; o treino marca o hábito ligado), Início (cartão da semana), Revisão semanal, Humor (dias com treino), Jornada (Força e XP), backup (`data.ts`).

## Decisões (09/11)
- **Não vira módulo próprio.** Fica dentro do Núcleo, na aba **Corpo**. O relatório usa o **Progresso** e o **Histórico** que o Núcleo já tem.
- **As fichas A, B e C continuam** como estão.
- **Foco agora: Treino em casa.**
- **Duas abas:** Sem equipamento · Com equipamento.
- **Em cada aba, filtros:** Pernas · Peito · Abdome (dá para incluir outros depois).
- **Cada exercício tem um campo para link de vídeo** (abre o YouTube; precisa de internet).

## Como fica
- Na aba Corpo, um cartão **"Treino em casa"** (com a meta semanal, ex.: 0/3) abre a tela do treino em casa.
- Tela do treino em casa: abas **Sem equipamento · Com equipamento**; filtros **Pernas · Peito · Abdome**; treinos em Iniciante, Intermediário e Avançado (tempo e nº de exercícios).
- Tocar num treino: nome, nível, tempo, introdução curta, lista de exercícios (×15 ou 00:40) e **Iniciar**.
- Tocar num exercício: imagem animada, como fazer, músculos e **link do vídeo** (pode trocar o link).
- Durante o treino: um exercício por vez, com contagem de repetições ou anel de tempo, descanso, Pausar, Pular e o próximo exercício.
- **Com equipamento** = o que se tem em casa: halteres, elástico e kettlebell. Academia continua nas fichas A, B e C.

## Imagens e GIFs (verificado em 09/11)
| Fonte | Pode usar? | Observação |
|---|---|---|
| App "Treino em casa" e outros apps | **Não** | Imagens e GIFs têm dono |
| ExerciseDB e bancos de GIF parecidos | **Não** (sem pagar) | Licença comercial |
| *free-exercise-db* (GitHub) | **Com dúvida** | Diz ser domínio público (Unlicense) e tem 876 exercícios com 2 fotos cada (início e fim). Para casa: sem equipamento, 34 de pernas, 14 de peito e 42 de abdome; com halter, 14, 15 e 2. **Mas os textos e as fotos parecem vir de um site comercial antigo**, então a origem é incerta |
| *wger* (banco aberto) | Sim, dando crédito | Licença aberta (CC-BY-SA), com o autor de cada imagem. Tem menos imagens. Não consegui abrir o site daqui para conferir a quantidade |
| **Desenhos próprios (bonecos animados)** | **Sim, são nossos** | Leves, funcionam sem internet e combinam com o visual do app |

**Recomendação:** **bonecos animados feitos para o app**, um por exercício (cerca de 25 a 30 para começar). Fazem o papel do GIF, sem risco de direitos e sem pesar. Antes de fazer todos, uma **prévia com 3 exercícios** (agachamento, flexão e abdominal) para ver se ficam bons. Se não ficarem, plano B: fotos do *wger*, com crédito.

## O que foi feito (v0.29)
- **Telas:** cartão "Treino em casa" na aba Corpo (dias da semana e meta, que se muda no lápis; conta qualquer treino do Núcleo); tela com as abas **Sem equipamento · Com equipamento**; filtros pelas **8 partes do corpo**, cada uma com uma explicação simples (Pernas, Glúteos, Peito, Costas, Ombros, Braços, Antebraços, Abdome); 3 níveis (Iniciante: 2 voltas e até 4 exercícios; Intermediário: 3 voltas e até 5; Avançado: 3 voltas, até 6 e mais repetições); tela do treino com a lista e **Iniciar**; treino guiado (prepare-se, exercício com "Feito" ou tempo, descanso com +10 s e pular, "Terminar e salvar").
- **Exercícios:** 43 (25 sem equipamento, 18 com halteres, elástico ou kettlebell). Tocar abre o passo a passo, o boneco e o **link do vídeo** (colar o link; sem link, "Procurar no YouTube").
- **Bonecos:** 47 desenhos próprios animados (`src/bonecos.ts`), também nos movimentos dos **alongamentos guiados**.
- O treino é salvo como treino do Núcleo (entra no Histórico, no Progresso, no Início e na Revisão) e marca o hábito ligado a "Treino".
- A ficha antiga "Treino em casa" (sem equipamento, 20 min) passou a se chamar **"Circuito em casa"**, para não confundir.
- Dados novos: `workoutGoal` (padrão 3) e `exerciseVideos` (padrão vazio), com valor padrão em `normalize()`.

## Depois
- Desafio de 28 dias e "crie o seu próprio" (M6).
- Ajustar bonecos que ficarem estranhos no uso (é só mudar os ângulos em `bonecos.ts`).
