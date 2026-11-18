# Projeto Enxuto: menos repetição, app mais coerente

> **Status: APROVADO em 18/11/2026**, em pacotes (um por sessão). **E1 feito na v0.137.0. E2 feito na v0.139.0.**
> Objetivo: limpar o app, tirar entradas repetidas e integrar o que hoje está espalhado. **Cada coisa num lugar só, com um caminho só.**

## Decisões do Leonardo (18/11)
- **Sem a tela Mais:** o app fica só com o **menu deslizante** (puxar a barra para cima).
- **Uma entrevista só:** a da primeira abertura (montagem do app) é suficiente. Você e Jornada (Mestra Lume) só **complementam**, sem repetir perguntas.
- De acordo com todas as outras sugestões da análise de sobreposições.

## Os pacotes
Custo em **% do limite semanal**, estimado pela experiência das versões anteriores. É um chute educado: o número real vem do medidor.

| Pacote | O que muda | Tam. | Custo estimado |
|---|---|---|---|
| **E1 Nomes claros** ✅ v0.137.0 | "Receitas" de Listas vira **Cozinha** (categoria e textos; Finanças continua com Receitas = dinheiro). Ferramenta "Hoje" da Saúde vira **Rotina**. Ferramenta "Histórico" do Núcleo vira **Práticas**. Revisão sai dos favoritos e do menu de módulos (mora no Diário). "Montar o app" fica só em Configurações | P | 1 a 2% |
| **E2 Sem a tela Mais** ✅ v0.139.0 | Some a tela Mais e a opção "Botão Mais na barra". O que só existia no Mais vai para a **gaveta**: Guardados (módulos desligados), Como usar a barra e Configurações. Endereço antigo `#/mais` abre a gaveta. Tutorial e montagem do app atualizados | M | 3 a 5% |
| **E3 Tarefas num lugar só** | Agenda › Tarefas mostra **todas** as coisas a fazer, com o selo de origem: tarefas, combinados das reuniões, entregas de projetos (Carreira) e passos das metas (Objetivos). Marcar ali marca na origem. As checklists de Listas continuam em Listas (são listas, não tarefas) | M | 4 a 6% |
| **E4 Uma entrevista só** | A montagem do app vira a entrevista base (já pergunta áreas e prioridades). **Você** passa a "Completar o perfil": só as perguntas que faltam (horários, dinheiro, limitações e preferências), reaproveitando as respostas. **Mestra Lume** só pergunta o que é da Jornada (ritmo e região) e usa as áreas já respondidas. Nada é criado em dobro (hábitos e caixinhas conferem antes) | M | 4 a 6% |
| **E5 Metas num lugar só** | Carreira › Metas deixa de ser uma tela própria: a ferramenta abre **Objetivos já filtrado em Carreira**. As metas curtas e longas do Você viram metas de Objetivos (movidas uma vez, sem perder nada) | M | 3 a 5% |
| **E6 Listas e Preços integrados** | É o **M43** que já estava anotado: uma categoria só para Listas e Preços (Mercado, Roupas, Casa, Viagem); item de lista de compras vira produto em Preços. E cada compra de Listas › Compras **abre a despesa** em Finanças (e a despesa mostra "veio da lista") | M | 4 a 6% |
| **E7 Ajustes de escopo (só documento)** | O **M6** (fichas próprias) amplia as fichas que já existem no Núcleo › Corpo, sem tela nova. O **M17** (Banco de ideias) continua dentro de Notas | — | 0 |

**Total estimado:** de 19 a 30% do limite semanal, ou seja, uns **2 a 3 dias de construção** no ritmo combinado (10% por dia).

**Ordem recomendada:** E1 → E2 → E3 → E4 → E5 → E6. Os mais baratos e visíveis vêm primeiro. E2 e E4 mexem no tutorial da barra e na montagem; por isso não devem rodar em sessões paralelas.

## Cuidados (valem para todos os pacotes)
- **Nada se perde:** dados antigos continuam valendo (`normalize`). O que muda de lugar é movido uma vez, com teste.
- **Endereços antigos** (`#/mais`, `#/carreira/metas`…) levam ao lugar novo.
- **README, Central e a estrutura do app** (`docs/estrutura-do-app.md`) são atualizados a cada pacote.
- Testes de regra e teste no celular (Pixel 7), como sempre.

## Como acionar numa sessão nova
Uma sessão por pacote, uma de cada vez (mesclar o PR antes de abrir a próxima). Mensagem para colar:

> **Projeto Enxuto, pacote E1.** Leia `docs/futuro/app-enxuto.md` e construa só esse pacote. Hoje já usamos **X%**.

Troque **E1** pelo próximo pacote (E2, E3…). Se quiser dois pacotes pequenos na mesma sessão: *"Projeto Enxuto, pacotes E1 e E2"*.

## Aviso de troca e de mesclagem (pedido em 18/11)
Ao terminar cada pacote, a resposta do Claude **sempre** termina com:
1. **"Mescle agora:"** + o link do PR (PR com código é você quem mescla).
2. **"Depois de mesclar, abra uma sessão nova"** + a mensagem pronta do próximo pacote, já com o nome dele (ex.: *"Projeto Enxuto, pacote E2. Leia docs/futuro/app-enxuto.md e construa só esse pacote. Hoje já usamos X%."*).
3. Se for o último pacote (E6): avisar que o Projeto Enxuto terminou.

Se o limite do dia (10%) estiver perto, o Claude avisa **antes** de começar o próximo pacote e sugere deixar para o dia seguinte.
