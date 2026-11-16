# Módulo RPG — Gamificação da Vida Pessoal

> **Status: DOCUMENTADO PARA IMPLEMENTAÇÃO FUTURA.**
> Não iniciar o desenvolvimento completo antes da consolidação da estrutura principal da Central Pessoal.
> Decisão pendente: avaliar se vale mudar o tom do app (de mais sério para mais casual e atraente a diferentes públicos), pensando numa possível comercialização.

| | |
|---|---|
| **Projeto** | Central Pessoal — Meu Caos |
| **Módulo** | Jornada / RPG |
| **Status** | Planejado — implementação futura |
| **Referência conceitual** | Habitica, jogos RPG e estética pixel art |

---

## 1. Visão geral

O módulo RPG tem como objetivo transformar a organização pessoal em uma experiência gamificada.

A proposta é integrar hábitos, tarefas, objetivos, estudos e autocuidado a um sistema de progressão de personagem, no qual as atividades realizadas geram recompensas virtuais.

O usuário terá um personagem personalizável que evolui conforme sua participação nas atividades cadastradas na aplicação.

O módulo não deverá funcionar como um aplicativo independente. Ele será integrado à Central Pessoal, compartilhando informações com os demais módulos.

**Conceito central:** transformar atividades da vida real em missões, conquistas e progressão dentro de um universo virtual em pixel art.

## 2. Identidade visual

Toda a identidade visual do módulo deverá seguir uma estética RPG em pixel art.

Referências:

- Jogos RPG clássicos em 16 bits.
- Personagens com sprites personalizáveis.
- Cenários e ambientes pixelados.
- Inventário visual.
- Loja de equipamentos.
- Ícones de itens, moedas e conquistas.
- Animações simples de evolução e recompensas.

A estética deverá ser consistente com a identidade visual geral da aplicação.

A interface deve continuar funcional e legível, especialmente nos dispositivos móveis.

## 3. Personagem do usuário

O sistema deverá possuir um personagem principal associado à conta do usuário.

### Informações do personagem

- Nome personalizável.
- Aparência.
- Nível atual.
- Experiência acumulada (XP).
- Gold disponível.
- Título equipado.
- Equipamentos e acessórios.

### Personalização

O usuário poderá modificar a aparência do personagem utilizando itens adquiridos ou desbloqueados.

Possibilidades futuras:

- Cabelos.
- Roupas.
- Armaduras.
- Calçados.
- Acessórios.
- Armas decorativas.
- Companheiros e animais de estimação.

Os equipamentos poderão alterar exclusivamente a aparência do personagem, sem necessariamente oferecer vantagens funcionais.

## 4. Sistema de progressão

O sistema terá quatro elementos principais.

### 4.1. Experiência (XP)

A experiência será utilizada para determinar a evolução do personagem.

Cada atividade concluída poderá conceder uma quantidade de XP, conforme sua dificuldade e importância.

Exemplo inicial de distribuição:

| Atividade | XP sugerido |
|---|---|
| Hábito simples | 10 XP |
| Hábito intermediário | 20 XP |
| Hábito difícil | 30 XP |
| Tarefa semanal | 40 XP |
| Objetivo especial | 100 XP |

Os valores serão configuráveis e poderão ser ajustados durante os testes.

### 4.2. Níveis

O personagem deverá evoluir automaticamente conforme acumular experiência.

Cada nível exigirá uma quantidade progressiva de XP.

Ao subir de nível:

- Exibir uma animação de evolução.
- Mostrar o nível alcançado.
- Apresentar a experiência acumulada.
- Possibilitar desbloqueio de recompensas.

A curva de experiência deverá ser configurável, evitando que os níveis iniciais sejam difíceis demais ou que os níveis avançados sejam alcançados rapidamente.

### 4.3. Gold

Gold será a moeda virtual do sistema.

O usuário receberá Gold ao concluir atividades e poderá utilizá-lo para adquirir itens na loja.

O Gold deverá possuir um saldo independente da experiência.

A experiência não poderá ser utilizada como moeda, e a compra de itens não deverá diminuir o nível ou a experiência do personagem.

### 4.4. Títulos

O sistema deverá permitir conquistar e equipar títulos especiais.

Exemplos:

- Aventureiro Iniciante.
- Disciplina em Construção.
- Explorador.
- Mestre dos Hábitos.
- Guardião da Consistência.

Os títulos poderão ser desbloqueados por nível, quantidade de atividades concluídas ou conquistas específicas.

## 5. Sistema de missões e hábitos

Este será o principal mecanismo de integração com o núcleo pessoal.

As atividades cadastradas nos módulos existentes poderão gerar missões e recompensas.

### 5.1. Hábitos diários

Exemplos:

- Arrumar a cama.
- Fazer autocuidado.
- Beber água.
- Organizar o ambiente.
- Realizar exercícios.

Cada hábito poderá possuir:

- Nome.
- Descrição.
- Frequência.
- Dificuldade.
- Recompensa em XP.
- Recompensa em Gold.
- Histórico de conclusão.

### 5.2. Missões semanais

Atividades que não precisam ser realizadas diariamente.

Exemplos:

- Organizar a casa.
- Estudar durante determinado período.
- Revisar o planejamento semanal.
- Organizar documentos.

### 5.3. Objetivos especiais

Objetivos de médio e longo prazo poderão funcionar como grandes missões.

Exemplos:

- Concluir um curso.
- Finalizar um projeto pessoal.
- Atingir uma meta de economia.
- Completar determinado período de um hábito.

Essas atividades poderão oferecer recompensas maiores e conquistas exclusivas.

### 5.4. Missões no ritmo da pessoa

As missões seguem o **ritmo que a pessoa escolheu** para cada módulo (ver `modulos-personalizaveis.md`, "Ritmo de cada módulo"). Ninguém recebe a missão "escreva todos os dias" só porque ligou o Diário.

| Ritmo escolhido no Diário | Missão da semana | Bônus da missão |
|---|---|---|
| Todo dia | Escrever 7 dias nesta semana | 70 XP |
| 5 vezes na semana | Escrever 5 vezes | 50 XP |
| 3 vezes na semana | Escrever 3 vezes | 30 XP |
| Dias certos (ex.: ter, qui, dom) | Escrever nesses 3 dias | 30 XP |
| Quando der | Escrever 1 vez nesta semana | 10 XP |

- **Tudo equivalente:** cada registro vale o mesmo XP para todo mundo, e o bônus da missão é **10 XP por vez combinada**. Quem combina mais ganha mais, mas quem combina pouco não fica para trás por cumprir o que prometeu.
- **Cumprir a própria meta é o que conta:** a conquista de constância ("4 semanas cumprindo o combinado") vale igual para quem escreve 1 ou 7 vezes.
- **Passar da meta:** cada registro a mais ainda dá o XP normal do registro, sem bônus extra (para não virar pressão).
- **Não cumpriu:** a missão só some no fim da semana, sem perder nada (regra da seção 6).
- **A missão se ajusta com a pessoa:**
  - 2 semanas seguidas sem cumprir → o app sugere, com carinho, uma meta menor ("Que tal 2 vezes por semana?");
  - 3 semanas seguidas cumprindo → oferece subir a meta, com mais pontos. A pessoa sempre decide.
- **Mesma regra nos outros módulos:** hábitos usam a frequência de cada hábito; Humor, Revisão e Caixinhas usam o ritmo escolhido. Módulo oculto não gera missão.

## 6. Regras de recompensa

O sistema deverá possuir regras próprias para distribuição de XP e Gold.

Requisitos:

- Cada conclusão válida deverá gerar sua recompensa.
- A mesma conclusão não poderá gerar recompensas duplicadas.
- O usuário deverá conseguir consultar o histórico de recompensas.
- Atividades recorrentes deverão gerar novas oportunidades de recompensa conforme sua frequência.
- Recompensas deverão ser calculadas de acordo com a configuração da atividade.

**Regra importante:** não deverá existir perda automática de XP por deixar de cumprir hábitos.

Tabela de XP, ouro e atributos por módulo: `jornada-recompensas.md`.

O objetivo é incentivar a consistência, não criar punições ou transformar o aplicativo em uma fonte adicional de pressão.

O sistema poderá registrar períodos de inatividade, mas sem retirar conquistas ou progressos já obtidos.

## 7. Loja virtual

O módulo deverá possuir uma loja interna para utilização do Gold acumulado.

### Categorias de itens

- Roupas.
- Armaduras.
- Acessórios.
- Cabelos.
- Companheiros.
- Decorações.
- Títulos.
- Itens especiais.

Cada item deverá possuir:

- Nome.
- Imagem em pixel art.
- Descrição.
- Categoria.
- Preço em Gold.
- Condições de desbloqueio, quando aplicável.

### Regras da loja

- O usuário poderá comprar itens com Gold.
- O sistema deverá verificar o saldo antes da compra.
- Itens adquiridos deverão ser armazenados no inventário.
- Itens exclusivos poderão ser desbloqueados por conquistas.
- O histórico de compras deverá ser preservado.

## 8. Inventário

O inventário reunirá todos os itens adquiridos e desbloqueados.

Funcionalidades:

- Visualizar itens disponíveis.
- Equipar e desequipar itens.
- Alterar a aparência do personagem.
- Consultar itens especiais.
- Identificar itens ainda não desbloqueados.

A personalização deverá atualizar visualmente o personagem.

## 9. Conquistas

O sistema deverá possuir uma área dedicada às conquistas.

Exemplos:

- Primeiro hábito concluído.
- 7 dias de consistência.
- 30 dias de acompanhamento.
- Primeiro objetivo finalizado.
- Primeiro nível alcançado.
- Primeira compra na loja.
- 100 missões concluídas.

As conquistas deverão possuir:

- Nome.
- Descrição.
- Condição de desbloqueio.
- Recompensa, quando aplicável.
- Ilustração em pixel art.
- Data de desbloqueio.

As conquistas já obtidas deverão permanecer permanentemente registradas.

## 10. Integração com os demais módulos

O RPG deverá funcionar como uma camada de gamificação da aplicação.

| Módulo existente | Integração planejada |
|---|---|
| Hábitos | Gerar missões e recompensas |
| Diário | Registrar a jornada pessoal |
| Autocuidado | Gerar missões de autocuidado |
| Tarefas | Permitir conclusão e recompensa |
| Objetivos | Criar missões especiais |
| Estudos e cursos | Registrar progresso e conquistas |
| Projetos pessoais | Criar desafios de longo prazo |
| Finanças | Recompensar organização e cumprimento de metas |

### Integração financeira

A integração financeira deverá ser cuidadosa.

Não conceder recompensas simplesmente por gastar dinheiro ou cadastrar despesas.

Possíveis atividades recompensáveis:

- Revisar o orçamento mensal.
- Pagar contas dentro do prazo.
- Cumprir uma meta de economia.
- Organizar as despesas.
- Concluir uma revisão financeira.

O módulo RPG não deverá modificar valores financeiros nem interferir nos cálculos do módulo de despesas.

## 11. Interface principal do RPG

Criar uma área chamada **Jornada**, acessível pelo menu principal.

A tela deverá apresentar:

1. Personagem em destaque.
2. Nível atual.
3. Barra de experiência.
4. Saldo de Gold.
5. Missões disponíveis.
6. Progresso diário.
7. Atalho para inventário.
8. Atalho para loja.
9. Atalho para conquistas.

A página inicial geral da aplicação também poderá apresentar um resumo do personagem e das missões do dia.

## 12. Estrutura técnica e armazenamento

O desenvolvimento deverá respeitar a arquitetura principal da aplicação.

Requisitos:

- Separar a lógica do RPG dos módulos funcionais.
- Manter os dados do personagem persistentes.
- Registrar movimentações de XP e Gold.
- Manter histórico de conquistas e compras.
- Impedir recompensas duplicadas.
- Permitir ajustes futuros nas regras de progressão.
- Preservar os dados durante atualizações da aplicação.

O sistema deverá registrar as recompensas como eventos individuais, permitindo reconstruir o histórico do personagem.

Exemplo de evento:

- Identificador da atividade.
- Tipo de atividade.
- Data de conclusão.
- XP recebido.
- Gold recebido.
- Identificador da recompensa.

A arquitetura deverá permitir futura expansão sem exigir reconstrução dos módulos já existentes.

## 13. Desenvolvimento por etapas

A implementação deverá ser dividida em fases para evitar que o RPG aumente excessivamente a complexidade do projeto principal.

**Fase 1 — Fundação**

- Criar personagem.
- Implementar XP.
- Implementar níveis.
- Implementar Gold.
- Integrar recompensas aos hábitos.

**Fase 2 — Progressão visual**

- Criar personagem em pixel art.
- Implementar barra de experiência.
- Criar animações de evolução.
- Implementar títulos.

**Fase 3 — Loja e inventário**

- Criar catálogo de itens.
- Implementar compras com Gold.
- Criar inventário.
- Implementar personalização do personagem.

**Fase 4 — Conquistas**

- Criar sistema de conquistas.
- Integrar objetivos especiais.
- Criar recompensas exclusivas.

**Fase 5 — Integração ampliada**

- Integrar tarefas.
- Integrar estudos.
- Integrar autocuidado.
- Integrar objetivos de longo prazo.
- Integrar metas financeiras.

## 14. Diretrizes importantes

1. O módulo RPG não deverá ser prioridade antes da consolidação dos módulos principais da Central Pessoal.
2. Não desenvolver funcionalidades que dupliquem os controles existentes de hábitos e tarefas.
3. O RPG deverá consumir os dados dos módulos existentes, respeitando suas responsabilidades.
4. O sistema deverá ser simples de utilizar, especialmente no celular.
5. Evitar mecânicas excessivamente punitivas.
6. Não tornar recompensas dependentes de compras reais.
7. Não permitir que erros ou alterações em uma atividade gerem recompensas indevidas.
8. Preservar todo o histórico de progressão.
9. Manter a identidade visual em pixel art.
10. Permitir expansão gradual do sistema.

## 15. Visão final do módulo

A proposta é transformar a Central Pessoal em uma experiência de evolução contínua.

O usuário organiza sua vida, desenvolve hábitos, cumpre tarefas, acompanha objetivos e, paralelamente, evolui dentro de um universo virtual.

O personagem representa sua jornada dentro da aplicação.

O RPG não substitui a organização pessoal. Ele torna o processo de organização mais interessante, visual e recompensador.

**Status: DOCUMENTADO PARA IMPLEMENTAÇÃO FUTURA.**

Não iniciar o desenvolvimento completo antes da consolidação da estrutura principal da Central Pessoal.

---

## Anexo — Notas técnicas sobre o encaixe no app atual

*Acrescentado na hora de arquivar o documento (v0.7). Não faz parte da especificação original: é só um ponto de partida para quando a decisão for tomada.*

**O que o app já tem e o RPG poderia aproveitar sem mudar os módulos:**

| Fonte no app (v0.7) | Evento de recompensa possível |
|---|---|
| Ritual/hábito marcado num dia (`habits[].checks`) | Hábito concluído no dia |
| Meta com quantidade atingida | Mesmo evento acima (o dia só conta ao atingir a meta) |
| Sequência e consistência (`habitStreak`, `consistency`) | Conquistas de 7/30 dias de consistência |
| Hábito a construir que virou ritual (`graduate`) | Objetivo especial / título |
| Dias sem um hábito a abandonar (`cleanDays`) | Conquistas de marcos (7, 30, 90 dias) |
| Tarefa concluída (`tasks[].doneAt`) | Tarefa concluída |
| Conta paga até o vencimento (`paidAt <= dueDate`, fatura paga) | Pagar contas dentro do prazo |
| Reflexão da revisão semanal salva no diário | Concluir uma revisão (inclusive financeira) |
| Registro no diário | Registrar a jornada pessoal |

**Como cumprir as regras de "sem duplicar" e "sem recompensa indevida":**

- Gerar cada recompensa com uma chave determinística a partir do dado de origem, por exemplo `habito:<id>:<dia>`, `tarefa:<id>` ou `conta:<id>`. A mesma conclusão sempre gera a mesma chave, então não há como duplicar.
- O saldo de XP e de Gold é sempre **recalculado a partir dos dados**, não somado à parte. Se o usuário desmarcar um hábito marcado por engano, a recompensa some junto, e um erro corrigido não deixa recompensa indevida. A regra "não perder XP por deixar de cumprir" continua valendo: só uma marcação desfeita remove o evento, nunca a falta.
- Compras, itens, títulos e conquistas desbloqueadas ficam guardados como eventos permanentes, com data. Isso é o que precisa de histórico próprio.
- Lógica isolada em `src/rpg.ts` (no mesmo padrão de `finance.ts`, `habits.ts` e `review.ts`), lendo os dados sem alterá-los, com testes unitários.

**Sobre o tom (sério × casual):** uma forma de não precisar escolher é deixar a Jornada **opcional**, ativada em Configurações e desligada por padrão. O app continua sóbrio para quem quer só organização, e quem gosta de gamificação liga a camada RPG. Isso também facilita testar a aceitação antes de mudar a identidade do produto.

**Pontos a decidir antes de começar:** origem dos sprites em pixel art (feitos à mão, gerados ou um pacote com licença comercial, o que importa caso o app seja vendido); a curva de níveis; e se a dificuldade (simples, intermediário, difícil) será um campo novo nos rituais e hábitos.

---

## Anexo B — Jornada v2 e v3: regras e artes já decididas

*Acrescentado em novembro de 2026. Junta o que foi decidido nas prévias v2 (avatar, baús, céu, atributos) e v3 (arsenal, pets, moradas, tela cheia, títulos, forja mística e classes). O objetivo é que, quando a Jornada desbloquear, as regras e a maior parte das artes já estejam prontas.*

**Prévias visuais:** quadro "Prévia — Jornada RPG" (linhas v2 e v3). As artes da v3 foram desenhadas como dados (linhas de texto + paleta de cores), então podem ser copiadas para o app sem redesenhar.

### B.1. O que já existe no app (v0.9)

- Desbloqueio após **14 dias de uso dentro de 21** (`journey.ts`), com XP, nível e ouro calculados a partir dos dados reais.
- **Atributos** nos rituais e hábitos (FOR, AGI, INT, RES, SAB, DIS), sugeridos pelo nome e **guardados em silêncio** até o desbloqueio (`habits.ts`: `suggestAttributes`, `attributeTotals`).
- Tudo o que está abaixo ainda **não** foi programado.

### B.2. Avatar e equipamentos

- Avatar em pixel art 16×24, **mulher ou homem**, com pele e cabelo escolhidos na criação.
- **Espaços de equipamento:** elmo, roupa/armadura, botas, arma (espada **ou** cajado), artefato, pet e morada. Um segundo espaço de artefato abre no **nível 20**.
- Os equipamentos são **camadas** desenhadas por cima do corpo (elmo e ombreiras), ou **trocas de cor** (roupa e botas), ou peças na mão (arma). Isso permite qualquer combinação sem desenhar cada uma.
- **Raridades:** comum (cinza), raro (azul), épico (roxo), lendário (laranja) e místico (dourado, só da Forja). Bônus por raridade, formas de liberar e Codex por coleções: `jornada-raridades.md`.

| Espaço | Comum | Raro | Épico | Místico |
|---|---|---|---|---|
| Elmo | Capuz de couro | Elmo de ferro | Chapéu de mago | Coroa de cristal |
| Roupa | Túnica de aprendiz (inicial), Gibão de couro | Cota de malha, Manto arcano | Armadura de placas | Armadura de cristal |
| Botas | Sapatos simples (inicial), Botas de couro | Botas de ferro | — | Botas aladas |
| Espada | Espada de madeira (inicial) | Espada de ferro | Lâmina rubi | Espada da aurora |
| Cajado | Cajado de galho | Cajado de cristal | — | Cajado estelar |
| Artefato | — | Pena do vento, Bracelete do titã, Grimório, Amuleto da gota, Lanterna da sabedoria, Ampulheta | — | Coração de cristal, Olho do oráculo, Pena da fênix, Estrela polar |

### B.3. Como cada item é obtido

- **Comum e raro:** loja, com ouro. Preços de referência: comum 120–200 ouro; raro 500–700 ouro. Com a tabela de recompensas atual, um dia ativo rende cerca de 50 ouro, ou seja, um item raro custa de 2 a 3 semanas de rotina.
- **Épico:** baús (prata, dourado e cristal) **ou** um atributo alto (ex.: Chapéu de mago com INT 50, Armadura de placas com FOR 80). O que vier primeiro.
- **Místico:** só na **Forja mística** (B.5). Não se compra.
- Os 6 artefatos de atributo passam a ser **épicos** (os bônus começam no épico) e dão **+10% de XP** nos hábitos do atributo correspondente (Pena → AGI, Bracelete → FOR, Grimório → INT, Gota → RES, Lanterna → SAB, Ampulheta → DIS). Saem em baús, ou são liberados com o atributo em 60.

### B.4. Baús e cristais

| Baú | Como ganha | Conteúdo |
|---|---|---|
| Bronze | 7 dias seguidos de rituais ou hábitos | ouro + item comum |
| Prata | 30 dias de consistência · revisão semanal com 80% da rotina | ouro + item raro |
| Dourado | a cada 5 níveis · mês com todas as contas em dia | item raro ou épico garantido |
| Cristal | hábito a abandonar: 7, 14, 30 e 60 dias sem | o melhor conteúdo: garante épico + **1 a 3 cristais** |

**Cristais** (◆) são a moeda da Forja mística. Fontes: baús de cristal, **1 por título conquistado** e alguns efeitos de artefatos. Abandonar um hábito ruim é o caminho mais forte para os itens místicos, porque é o mais difícil.

### B.5. Forja mística (itens que exigem aprimorar os atributos)

Os pontos de atributo **nunca diminuem** e vêm de:
- **hábitos cumpridos:** +3 por dia quando o hábito treina um só atributo, ou +2 em cada um quando treina mais de um. Num hábito a abandonar, conta cada dia sem;
- **Disciplina:** também +2 por conta paga no prazo e +3 por revisão semanal;
- **Sabedoria:** também +1 por dia com registro no diário.

Com um hábito por dia num atributo, ele sobe cerca de 60 a 90 pontos por mês.

| Item místico | Requisitos | Cristais | Efeito |
|---|---|---|---|
| Coroa de cristal (elmo) | DIS 100 | 3 | +1 cristal por mês com todas as contas pagas no prazo |
| Botas aladas | AGI 100 | 3 | +10% de XP em caminhadas; o pet acompanha mais rápido |
| Armadura de cristal | RES 150 | 5 | 1× por semana, um dia perdido não quebra a sequência **da Jornada** |
| Espada da aurora | FOR 150 + DIS 60 | 5 | Subir de nível dá um baú raro extra |
| Cajado estelar | INT 150 + SAB 60 | 5 | Estudo/leitura registrados dão +1 ouro extra |
| Coração de cristal | RES 100 + DIS 100 | 4 | Recaída não zera o progresso do baú de cristal |
| Olho do oráculo | SAB 100 + INT 100 | 4 | Cada revisão semanal dá +1 cristal |
| Pena da fênix | AGI 80 + 30 dias sem recaída num hábito a abandonar | 4 | Depois de uma recaída, os 7 dias seguintes valem XP em dobro |
| Estrela polar | todos os atributos em 60 | 6 | +10% de XP e ouro em tudo; o céu noturno ganha uma constelação |

**Regras da forja:**
- O item aparece com 🔒 e barras de progresso de cada requisito. Quando todos os requisitos estão cumpridos e há cristais suficientes, o cartão brilha ("Pronto para forjar").
- Forjar gasta os cristais; os atributos **não** são gastos.
- Os efeitos valem só dentro da Jornada. **Nunca alteram os dados reais** (sequência, consistência, finanças).

### B.6. Títulos

O título escolhido aparece embaixo do nome, na cena e na tela cheia. Cada título conquistado vale **1 cristal**. Os títulos têm forma feminina e masculina, conforme o avatar.

| Título | Como conquistar |
|---|---|
| Aprendiz | Começar a Jornada |
| Guardiã(o) das Contas | 3 meses com todas as contas pagas no prazo |
| Tesoureira(o) | 3 meses seguidos com sobra positiva (receitas − despesas) |
| Madrugador(a) | 30 dias de rituais da manhã cumpridos |
| Inquebrável | Sequência de 30 dias num hábito |
| Mestra(e) do Tempo | 12 revisões semanais feitas |
| Cronista | 100 registros no diário |
| Fênix | 30 dias limpo depois de uma recaída |
| Titã · Ventania · Erudita(o) · Muralha · Sábia(o) · Inabalável | Força · Agilidade · Inteligência · Resistência · Sabedoria · Disciplina em 100 |
| Lendária(o) | Todos os atributos em 100 |

### B.7. Classes

- A classe vem do **atributo mais alto** e muda sozinha se a rotina mudar: FOR → Guerreira(o), AGI → Andarilha(o), INT → Maga(o), RES → Guardiã(o), SAB → Druida, DIS → Paladina(o).
- **Classe híbrida** quando os dois mais altos ficam a menos de 10% um do outro: FOR+DIS Cavaleira(o), INT+SAB Arquimaga(o), AGI+FOR Bárbara(o), RES+DIS Sentinela, AGI+SAB Xamã, INT+DIS Alquimista.
- Empate exato: vale o atributo que subiu mais nos últimos 30 dias.

### B.8. Pets e moradas

- **Pets:** Gatinho e Cãozinho (nível 3, escolhe um), Cavalinho (nível 12 + AGI 50). O pet passeia na cena e fica feliz nos dias com registro; **nunca fica triste nem some**. Para o futuro: raposa, coruja e um dragãozinho lendário.
- **Moradas** (fundo da cena): Barraca de viajante (início), Casinha (nível 5), Casa de pedra (nível 15 + 600 ouro), Torre do mago (nível 25 + INT 100), Castelinho (nível 30 + 2.000 ouro), Castelo (nível 50 + todos os atributos em 100).
- Todas as moradas têm versão de dia, tarde e noite (janelas acesas à noite).

### B.9. Céu, estrelas e chuva

- O céu segue o **relógio do celular**: manhã (até 16h), tarde (16h–18h30), noite (depois disso).
- **Estrelas:** à noite aparece **uma estrela por dia com registro nos últimos 30 dias** (no máximo 30). A rotina "acende" o céu.
- **Estrela cadente** na noite em que você sobe de nível ou ganha um título.
- **Chuva às vezes:** cerca de 1 dia a cada 5, numa faixa de horário. O sorteio usa a data, então o dia de chuva é o mesmo sempre que você abre o app. Depois da chuva, aparece um arco-íris por 1 hora. Em Configurações: "Clima: às vezes chove / sempre limpo".
- Futuro opcional: usar o clima real da cidade. Precisa de internet e de permissão de localização, então fica desligado por padrão.

### B.10. Tela cheia do avatar

- Tocar no cartão do avatar abre a **cena em tela cheia**: céu, morada, árvore, pet passeando, artefato flutuando com brilho da cor do atributo e o avatar grande, "respirando".
- No topo: nome, nível, **título em uso** e classe. À noite, a contagem de estrelas.
- Embaixo: os 7 espaços de equipamento; tocar num deles troca o item (só entre os que você já tem).
- O botão **voltar** do celular fecha a tela cheia, como já acontece com as janelas do app.

### B.11. Dados a guardar (o resto é calculado)

XP, ouro ganho, nível e atributos continuam **calculados a partir dos dados** (como hoje em `journey.ts`). Só precisa ser guardado o que é escolha ou gasto do usuário:

```ts
interface JourneyState {
  avatar: { gender: 'f' | 'm'; skin: 'clara' | 'media' | 'escura'; hair: string };
  owned: string[];                 // ids dos itens, pets e moradas que você tem
  equipped: { elmo?: string; armadura: string; botas: string; arma?: string; anel?: string; anel2?: string; colar?: string; magico?: string; pet?: string; morada: string }; // v0.88: anel/colar/mágico no lugar de artefato ×2
  goldSpent: number;               // ouro disponível = ouro ganho (calculado) − goldSpent
  crystalsSpent: number;           // cristais disponíveis = cristais ganhos (calculado) − crystalsSpent
  title: string | null;            // título em uso
  openedChests: string[];          // chaves determinísticas, ex.: "cristal:<habitId>:30"
  weather: 'aleatorio' | 'limpo';
}
```

### B.12. Ordem de implementação

1. `src/jornada/items.ts`: catálogo de itens, pets, moradas, raridades e as artes (linhas + paletas), copiado das prévias. Testes: todo item tem arte válida e 16 colunas.
2. `src/jornada/rules.ts`: classes, títulos, requisitos da forja, cristais e baús calculados a partir de `AppData`. Testes no mesmo padrão de `journey.test.ts`.
3. `src/jornada/sky.ts`: horário → céu, estrelas por dias de uso e chuva determinística por data. Testes.
4. Componente `<PixelSprite>` (SVG gerado das linhas, como nas prévias) e a cena.
5. Telas: Jornada, tela cheia, Arsenal com provador, Títulos/Forja/Classes. Ficam visíveis **só depois do desbloqueio**.

**Status (v0.10):** os passos 1 a 3 estão **feitos**, em `src/jornada/` (`art.ts`, `artData.ts`, `catalog.ts`, `rules.ts`, `sky.ts`), com testes em `src/jornada.test.ts`. É lógica pura e invisível: nenhuma tela usa ainda, e nada muda no app em uso. Faltam os passos 4 e 5 (telas), que só aparecem depois do desbloqueio.

**Ainda não programado (depende das telas e de registrar quando cada item foi equipado):** os efeitos dos místicos que mexem com o tempo — escudo semanal da Armadura de cristal, XP em dobro depois da recaída (Pena da fênix), cristal por revisão (Olho do oráculo), cristal por mês em dia (Coroa), baú extra por nível (Espada da aurora) e ouro extra por estudo (Cajado estelar). Os bônus de +10% dos artefatos já estão em `equipmentBonus`.

---

### B.13. Partes da construção (revisto em 15/11)

A Jornada desbloqueia em 16/11. Até aqui existiam só as regras e as artes (passos 1 a 3 do B.12); a tela do desbloqueio mostra nível, XP, ouro, "De onde veio" e a escolha "Quero a Jornada" ou "Agora não". A construção segue em partes, **da mais simples à conclusão**, uma por dia conforme o uso. Cada parte só aparece com a Jornada desbloqueada e no Modo Jornada ligado.

| Parte | O que entrega | Tamanho |
|---|---|---|
| **N2.1** Personagem e cena (**feito: v0.55 simples, v0.57 seguindo a prévia**) | `<PixelSprite>`; avatar com os itens iniciais na cena; céu pelo horário, estrelas pelos dias de uso e chuva pela data (B.9); nível, XP e ouro; **Ficha** com os 6 atributos e a classe (B.7) | M |
| **N2.2** Cartão no Início e Modo Jornada (**feito: v0.58**; novidades e chefe na linha de status entram com a N2.3 e a campanha) | cartão compacto no Início (E.1); Configurações: "Mostrar a Jornada no Início" e "Modo Jornada" (F.1); "Agora não" deixa tudo guardado em silêncio | P |
| **N2.3** Baús e "Desde a sua última visita" (**feito: v0.59**; os acontecimentos guardados depois do resumo, como títulos e chefe, entram com a N2.5 e a campanha) | baús de rotina e cristais (B.4) com abertura animada; resumo da diferença desde a última visita (E.2) | M |
| **N2.4** Arsenal e loja (**feito: v0.60**; os místicos ficam para a Forja, N2.5; pets e moradas, N2.6) | inventário, provador, vestir e tirar, comprar com ouro (B.2, B.3); avatar em tela cheia (B.10) | M |
| **N2.5** Títulos, forja e classes (**feito, v0.82**) | lista de títulos e título em uso (B.6); forja mística com requisitos de atributo (B.5); classes e híbridas (B.7) | M |
| **N2.6** Pets, moradas e visitas (**feito, v0.83**) | pets e moradas (B.8, F.3); presentes por sequência de visitas (F.2) | M |
| **N2.7** Codex e raridades (**feito, v0.86**; bônus por raridade e conquistas dos jogos ficam para N2.8 e N2.16b) | **tudo o que existe**, por coleção (itens, pets, casas, títulos, conquistas dos mini games): o que tem colorido, o que falta em silhueta com a dica e o progresso; místicos com "Forja: faltam X"; bônus por raridade (`jornada-raridades.md`); títulos de visitas (30, 100, 365 dias); "Perto de desbloquear" leva para cá. Sai o cadeado da barra | M |
| **N2.8** Efeitos dos místicos | escudo semanal, XP em dobro depois da recaída, cristal por revisão e por mês em dia, baú extra por nível, ouro extra por estudo (ver "Ainda não programado" no B.12) | M |
| **N2.9a** Missões (**feito, v0.73**) | missões de hoje (os próprios hábitos, tarefas, contas e diário; marcar ali é marcar no módulo) e da semana (Diário no ritmo, bônus de 10 XP por vez combinada desde o desbloqueio; revisão semanal), sem punição | M |
| **N2.9b** Entrevista da Mestra Lume (**feito, v0.74**) | perguntas do Anexo D; cria os hábitos que faltam no Núcleo e guarda as respostas para a campanha (N2.10) e a caixinha | M |
| **N2.10** Campanha | em 3 partes: **N2.10a** (**feito, v0.96**) mapa com as regiões da entrevista, Vila do Começo com a Mestra Lume e objetivos por região (lidos dos dados reais); **N2.10b** chefe da semana com barra de vida (cada missão cumprida é um golpe; ritmo da entrevista define a vida), vitórias, baús e pets de região (Lobo, Sapinho, Golem, Dragão); **N2.10c** entrada animada de cada região (A, C, D e E da prévia "Entrada na Jornada") e pote da caixinha na cena | G |
| **N2.11** Barra própria do jogo (**feito, v0.79**) | barra em pixel art dentro da Jornada; cadeado no que falta; puxar abre o menu | M |
| **N2.12** Personagem em tela cheia (**feito, v0.80 e v0.83.1**) | cena na tela toda, título em placa, céu para escolher, espaços com moldura de raridade; tocar troca, segurar abre o Arsenal | P |
| **N2.13** Tela principal completa (**feito, v0.81**) | sequência, baús prontos, seu dia em números, perto de desbloquear, festa ao subir de nível, como ganhar XP | M |
| **N2.14** Entrada animada (**feito, v0.84**: opção B padrão) | portal em degraus ao entrar; as outras opções ficam para as regiões (N2.10c) | P |
| **N2.15** Barra em duas fileiras e telas reorganizadas (**feito, v0.85**) | barra 5 + 5 (Jornada · Campanha · Arsenal · Baús · Ficha / Pet · Casa · Codex · Mini games · Loja); **Arsenal, Pet e Casa só com o que você tem** (o que acabou de ser liberado aparece com "Novo! Pegar"); **Loja** nova com tudo o que se compra com ouro, inclusive o que ainda não dá (apagado, com "faltam X de ouro"); Arsenal fica só para vestir | M |
| **N2.16** Mini games (**N2.16a feito, v0.87**) | **N2.16a** Fliperama (partidas premiadas do dia, recordes) + **Corrida do pet** + **Respira com o pet** (pode contar como prática de Mente); **N2.16b** **Memória do Arsenal** + **Pescaria** + conquistas dos jogos no Codex | M + M |


### B.15. Decisões de 16/11 e plano para terminar a Jornada

**Decidido pelo Leonardo (16/11):**
- **Cada lugar com uma função:** Arsenal, Pet e Casa mostram **só o que você tem** (e o que acabou de liberar, com "Novo! Pegar"); a **Loja** mostra o que se compra com ouro, **inclusive o que ainda não dá, apagado e com "faltam X de ouro"** (instiga a meta); o **Codex** mostra **tudo o que existe**, com silhuetas, dicas e progresso. "Perto de desbloquear" continua na tela principal e leva ao Codex. A Forja continua na Ficha.
- **Barra em duas fileiras de 5** (N2.15), aprovada como na prévia (https://claude.ai/artifact/XGMxQUaM9TCWtunRUnV6dz).
- **Mini games aprovados (N2.16), os 4:** Corrida do pet, Memória do Arsenal, Pescaria e Respira com o pet. Regras: partidas de 30 a 60 s, em pixel art, sem internet; **prêmio pequeno** (5 a 20 de ouro) e **até 3 partidas premiadas por dia** (depois joga sem prêmio); recorde pessoal, sem ranking; Respira com o pet pode contar como prática de Mente no Núcleo. **Conquistas dos jogos** entram no Codex.
- **Entrada animada:** B padrão (feito, v0.84); A, C, D (espiral noturna) e E (estrela) para as regiões da campanha.

**Ordem para terminar** (uma parte por vez, testando no uso):
1. ~~**N2.15** barra em duas fileiras e telas reorganizadas (Arsenal, Pet, Casa, Loja)~~ (v0.85). M
2. ~~**N2.7** Codex~~ (v0.86). M
3. ~~**N2.16a** Fliperama, Corrida do pet e Respira com o pet~~ (v0.87). M
4. **N2.16b** Memória do Arsenal, Pescaria e conquistas dos jogos. M
5. **N2.8** efeitos dos itens místicos. M
6. **N2.10a → N2.10b → N2.10c** Campanha. G (3 partes)

Depois da Jornada: **N7** (Estudos × Jornada).

### B.16. A "Prévia da Jornada" é o modelo (decidido em 16/11)

O Leonardo comparou o app com a prévia jogável "Prévia da Jornada" (https://claude.ai/artifact/LDdQDmTYY3j56etqqMc9Qc; código em `app.js`, `sprites.js`, `styles.css`) e decidiu: **ela é o modelo da Jornada**. A **barra fica como está** (duas fileiras, N2.15). **Antes de cada mudança, ele escolhe entre o atual e a prévia**, parte por parte. **Todos os itens e todas as raridades da prévia** entram no app.

**Como cada parte é feita daqui para frente:** abrir o código da prévia daquela parte, mostrar "atual × prévia" para a escolha, e então copiar o comportamento escolhido, só adaptando aos dados reais.

**O que a prévia tem a mais (conferido no código e nas imagens de 16/11):**
- **Catálogo:** 49 itens (o app tem 31): 4 arcos (curto, longo de teixo, élfico, do vento), 4 anéis (bracelete do titã, bracelete do mercador, anel de ferro, de foco, da aurora), colares (gota, coração de cristal, pérola, dente de lobo), mágicos (pena, grimório, lanterna, ampulheta, olho, fênix, estrela polar, lanterna da calma, grimório das estrelas) e itens de região (manto da floresta, armaduras da montanha e da arena, botas do pântano, cajado do saber, lâmina da ordem). Espaços de equipamento: elmo, roupa, botas, arma, **anel, colar e mágico** (o app usa "artefato" ×2).
- **Topo fixo** em todas as telas: rosto, nome, nível e classe, 🔥 dias seguidos abrindo o app, ouro, cristais, barra de XP até o próximo nível.
- **Tela principal:** cena com relógio e botão de ampliar, título em placa abaixo da cena, **presente do dia** (caixa de presente, "N presentes esperando", tira 1 a 7), **cartão da campanha**, **cartão da caixinha**, **avisos** ("Liberado: Ampulheta", "pronta para forjar", baús esperando), missões com "Tive uma recaída", "Quase lá".
- **Baús:** número na barra, "Abrir todos os N baús", cartões na cor de cada baú, "Como ganhar" com o que cada um dá, "o próximo vem com X dias".
- **Recompensas animadas:** moedas voando para o topo, confete, telas de título novo, nível, vitória e objetivo realizado; **Resumo da semana** ("Que semana!") com "Abrir os baús".
- **Caixinha na Jornada:** criar com meta e plano, pote na cena, guardar com recompensa (+20 XP, +10 ouro, +3 DIS na data do plano), marcos 25/50/75/100% com baús, "Guardar" nas missões, "Realizei o objetivo".
- **Chegada:** entrevista dentro da chegada; Mestra Lume apresenta a Vila do Começo; dica "a seta volta ao app".
- **Pet:** editor com as cores em cartões com o desenho; Codex com "Editar nome e cor".
- **Campanha:** mapa com capítulos e chefes (N2.10).

**Partes (N2.17), cada uma com a escolha "atual × prévia" antes:**
1. **N2.17a Catálogo e espaços:** os 49 itens e as artes da prévia; espaços anel, colar e mágico. M — **feito (v0.88)**. Escolhas de 16/11: espaços da prévia (Anel, Colar e Mágico; segundo anel no nível 20) e todos os itens agora, os de região no Codex ("Campanha: <região> · ou em baús"; não se compram nem se forjam). As artes vêm do arquivo da prévia (`src/jornada/px.ts`); artefatos salvos migram para o espaço novo em `normalizeJourney`.
2. **N2.17b Topo fixo e tela principal:** topo com 🔥, ouro, cristais e XP; presente do dia, avisos, cartão da caixinha e da campanha como na prévia. M — **feito (v0.89)**. Escolhas de 16/11: faixa da prévia presa no topo em todas as telas da Jornada (`JornadaHud`, no bloco do `PageHeader`) e a tela principal na ordem da prévia: cena, placa do título, presente, avisos (`Notices`: baús, liberado, forja), missões, semana, 3 números e "Quase lá" (`quaseLa` em `home.ts`). Cartões da caixinha e da campanha ficam para N2.17e e N2.17g. **v0.91:** a faixa ocupava muito espaço; prévia "Barra que encolhe" (https://claude.ai/artifact/DxARTt4Vp2HcchxRkS9hBB), escolhido o jeito A: ao rolar para baixo a faixa vira uma linha (sobe com `transform`, sem mudar a altura da página, para a rolagem não travar) e a barra do jogo mostra só a fileira da tela atual, sem nomes (`jn-compact`).
3. **N2.17c Baús como na prévia:** cores por tipo, abrir todos, "Como ganhar", número na barra. P — **feito (v0.90)**: escolha de 16/11 "prévia completa" (`JornadaBaus.tsx`: `BausView`, `ChestOpen` em tela cheia com Vestir, `OpenAll`; `openChests` em `rules.ts`). O número na barra já existia.
4. **N2.17d Recompensas animadas e Resumo da semana.** M — **feito (v0.92)**. Escolhas de 16/11: recompensas da prévia (`jornadaFx.ts`: números que sobem, moedas que voam até o ouro; `notify` ganhou ícone e botão) e "os dois" no resumo: `JornadaEventos.tsx` avisa as novidades na hora (`journeyNews`/`newsDiff` em `home.ts`), mostra a tela de título novo e o Resumo da semana 1x por semana (`weekSummary`, `weekSeen` no estado); o cartão "Desde a sua última visita" fica.
5. **N2.17e Caixinha na Jornada.** M — **feito (v0.93)**: escolha de 16/11 "prévia", usando as Caixinhas de Finanças (sem tela repetida). XP/ouro em `journey.ts` (`caixinha`, `realizar`), +3 DIS em `attributes`, missão `b:<id>` em `missions.ts` (folha de valor em `JornadaMissoes.tsx`), baús dos marcos em `earnedChests`, títulos `poupadora` e `realizadora`, cartão `BoxCard`, "Quase lá" (`boxGoal`) e telas de meta/realizado em `JornadaEventos.tsx` (`boxSeen` guarda o que já foi comemorado).
6. **N2.17f Pet e Codex como na prévia** (cores em cartões, editar pelo Codex). P — **feito (v0.94)**: escolha de 16/11 "prévia". `PetEditor` (exportado em `JornadaPets.tsx`) com cartões de cor; `CodexDetail` com "Editar nome e cor"; tela "Novo companheiro!" (`PetScreen` em `JornadaEventos.tsx`).
7. **N2.17g Chegada completa** (entrevista na chegada, Mestra Lume apresentando), junto com o começo da Campanha (N2.10a). M — dividida em duas (16/11). **g1 feita (v0.95)**: entrevista entre criar personagem e o presente (`JornadaHome`, passo `interview`), boas-vindas da Mestra Lume em balões (`NpcDialog` em `JornadaFala.tsx`), dica da seta e `weekSeen` marcado na chegada. **g2 feita (v0.96)** = N2.10a: `src/jornada/campaign.ts` (regiões pela entrevista e pelo ritmo, objetivos contados dos dados desde a abertura da região, `camp` no estado com regiões concluídas, falas ouvidas e "vestiu"), `JornadaCampanha.tsx` (mapa, detalhe da região, cartão, tela de região concluída), títulos das regiões e baú ao concluir. Região com chefe fica em "chefe em breve" até a N2.10b.

Depois: N2.16b (Memória e Pescaria), N2.8 e o resto da Campanha.

**N2.9b, como ficou (v0.74):** convite da Mestra Lume na Jornada até a entrevista ser feita (para quem já entrou na Jornada; não entra no meio da chegada). Respostas em `journey.profile` (`src/jornada/interview.ts`); o que ela cria fica em `src/jornada/interviewApply.ts`. Treino: 2× ter/qui, 3× seg/qua/sex, 4× seg/ter/qui/sex, 5× seg a sex. Terapia: quarta. Refazer não apaga nem duplica hábitos; a caixinha só é criada se não houver uma aberta com o mesmo nome. O desafio de dinheiro (ex.: "gastar demais") fica guardado para a campanha (Mercado de Ouro) e ainda não vira missão.

**N2.11, barra própria do jogo (v0.79, pedido em 16/11):** dentro da Jornada em uso (desbloqueada, "Quero a Jornada" e personagem criado), a barra de baixo vira a barra do jogo em pixel art: **Jornada** (cena, "Desde a sua última visita", Mestra Lume e missões) · **Arsenal** · **Baús** · **Ficha** (atributos, de onde veio o XP e Personagem). **Codex** (N2.7) e **Campanha** (N2.10) aparecem apagados, com cadeado, e dizem "em breve" ao tocar; quando ficarem prontos, é só tirar o cadeado em `src/jornada/tabs.ts`. O menu ao puxar a barra para cima continua o do app (decidido pelo Leonardo: só a barra muda).

### B.14. O que as prévias têm e o app ainda não (conferido em 16/11)

O Leonardo notou que as prévias não estavam sendo aproveitadas por inteiro. **Regra daqui para frente:** antes de construir cada parte, abrir a prancha da prévia que corresponde a ela (tabela abaixo) e seguir o visual e os detalhes dela; o que mudar tem que ser dito antes.

Prévias: **"Jornada RPG"** (https://claude.ai/artifact/62xbF4H9CfYjaz7RaX554h, 19 pranchas v1 a v3) e **"Prévia da Jornada"** (https://claude.ai/artifact/LDdQDmTYY3j56etqqMc9Qc, jogável).

| O que a prévia tem | Onde (prancha) | Situação no app | Parte |
|---|---|---|---|
| Tela principal: **dias de sequência**, cartão **"Baús para abrir · 2 prontos · Abrir"**, **"Seu dia em números"** (XP hoje, ouro hoje, missões 5/6), **"Perto de desbloquear"** e **"Quase lá"** | v2 · Jornada de dia/noite; Prévia da Jornada (tela principal) | feito (v0.81) | **N2.13** |
| **Subiu de nível** em tela de festa ("LEVEL UP! NÍVEL 8", recompensas, Continuar) | v1 · Subiu de nível | feito (v0.81) | **N2.13** |
| **Personagem em tela cheia** que ocupa a tela, título em placa dourada, relógio, céu para escolher, espaços com moldura de raridade, Pet e Casa | v3 · Avatar em tela cheia | feito (v0.80); tocar no espaço troca o item ali mesmo, segurar abre o Arsenal (v0.83.1) | **N2.12** |
| **Tocar no personagem e no pet** na tela cheia (corações, reação) | Prévia da Jornada | feito (v0.80): personagem pula, pet solta coração | **N2.12** |
| **Artefato flutuando** ao lado do personagem; cristais (◆) no topo do Arsenal; efeito do item (✦) | v3 · Arsenal com provador | artefato flutuando na tela cheia feito (v0.80); cristais e efeito no Arsenal ainda não | **N2.12** / **N2.13** |
| **Conquistas** (medalhas com data; "Próximas" com barra de progresso) | v1 · Conquistas | feito (v0.82) como **Títulos** (a prancha v3 substituiu as conquistas da v1: medalhas, progresso dos que faltam) | **N2.5** |
| **Título em uso** embaixo do nome, escolher título, **forja mística**, classes e **híbridas** explicadas | v3 · Títulos, forja mística e classes | feito (v0.82) | **N2.5** |
| **Desbloqueios por atributo** na Ficha ("Força 40 → Bracelete do titã") | v2 · Atributos do avatar | feito (v0.82), com o ganho da semana e de onde vem cada atributo | **N2.5** |
| **Pets e moradas** (escolher, editar nome e cor do pet) | v3 · Pets e moradas; Prévia da Jornada (Arsenal › Pets) | feito (v0.83): 16 pets com cores, nome, casas | **N2.6** |
| **Presente do dia** por abrir o app, chama de dias seguidos com 1 folga por semana | Prévia da Jornada (F.2) | feito (v0.83): tira de 7 dias e chama; os títulos de visita (30, 100, 365 dias) ficam para a N2.7 | **N2.6** |
| **Coleção / Codex** (9 de 19; silhuetas com dica) | v2 · Coleção; Prévia da Jornada (Arsenal › Codex) | feito (v0.86) | **N2.7** |
| **"Como ganhar XP e ouro"** (regras justas, por módulo) | v2 · Como ganha XP e ouro | feito (v0.81), na Ficha | **N2.13** |
| **Pote da caixinha** na cena e "Guardar" nas missões | Prévia da Jornada | falta | **N2.10** |
| **Campanha**: mapa, Mestra Lume apresentando a Vila do Começo, chefe semanal com barra de vida, regiões | Prévia da Jornada | falta (cadeado na barra) | **N2.10** |
| Hábito novo com **"Treina quais atributos?"** sugerido pelo nome | v2 · Hábito que treina atributos | já existe no Núcleo | — |
| **Modo Jornada** nas Configurações, cartão no Início | v1 · Configurações; Início com a Jornada | já existe (v0.58) | — |

**N2.14, entrada na Jornada (v0.84):** a opção B da prévia "Entrada na Jornada" (https://claude.ai/artifact/8aDRvyPSSCfYjFkbZpNpbH) é a padrão, em `src/modules/JornadaPortal.tsx`. As opções A, C, D (espiral noturna) e E (estrela) ficam para as regiões da campanha; a proposta de qual região usa qual está na Central (N2.14).

Depois: N7 (Estudos × Jornada, `estudos-jornada.md`).

**N2.1 refeita seguindo a prévia (feita em 15/11, v0.57).** A primeira versão (PR #87) ficou simples demais: não seguiu a prévia "Jornada (pets, Codex, acessórios, visitas)" (`app.js`: telas `unlock`, `create`, `welcome`). A nova N2.1 é uma chegada em **tela cheia**, com a fonte Pixelify Sans e animações (com "menos movimento", sem elas):
1. **Desbloqueio animado:** os dias de uso acendem um a um no calendário; XP, nível e ouro sobem contando; promessas (faltar não tira nada; gastar não dá pontos; dá para desligar).
2. **Criar personagem (passo 1 de 2):** pedestal com céu e nuvens, avatar que pula a cada escolha, corpo, pele, cabelo e **nome** ("Como quer ser chamada/chamado?"), com o nome numa plaquinha.
3. **Presente de boas-vindas (passo 2 de 2):** baú dourado "TOQUE!", treme, abre com brilho e solta Botas de couro, +50 ouro e +1 cristal, um por um.
4. **Escolha do pet:** gato ou cão, cada um no seu campinho; botão "Começar a Jornada com o gato".
5. **Cena** com o pet passeando, mais o que já existe na v0.55 (classe, título, nível, XP, ouro, cristais, Ficha).
- A **entrevista da Mestra Lume** fica para a N2.9 (missões), porque as respostas montam missões, campanha e caixinha.
- Trazer da prévia as artes que faltam no app: baú (fechado e aberto), moeda e cristal (`sprites.js`), e o nome do personagem nos dados (`journey.avatar.name`, padrão vazio).
- Tamanho: M puxando para G.

**Correção do que foi dito em 15/11:** o aviso "+XP" **não** aparece fora da Jornada (regra do Anexo E). As recompensas aparecem juntas no "Desde a sua última visita" (N2.3).

## Anexo C — Modo campanha

*Acrescentado em novembro de 2026. Prévia jogável na "Prévia da Jornada" (aba Campanha).*

A campanha dá um **rumo** à Jornada: uma história com começo, meio e fim que avança com a rotina real. **Ela não cria tarefas de jogo.** Os objetivos só leem o que a pessoa já faz no app (hábitos, contas, diário, revisões).

### C.1. Estrutura

Um mapa em pixel art com 7 regiões que se abrem uma por vez. Cada região é um capítulo ligado a uma parte do app:

| # | Região | Tema no app | Objetivos | Chefe | Recompensas |
|---|---|---|---|---|---|
| 1 | Vila do Começo | Conhecer o app (tutorial) | Marcar um ritual · escrever no diário · pagar uma conta no prazo · completar todas as missões de um dia · vestir um item | — | Título Viajante · baú de prata |
| 2 | Floresta da Rotina | Rituais e hábitos | 7 dias seguidos com algum ritual ou hábito · 25 rituais/hábitos | Lobo da Preguiça | Manto da floresta · título Caçador(a) de Lobos · baú dourado |
| 3 | Mercado de Ouro | Finanças | 3 contas pagas no prazo · cadastrar o salário em Receitas | Goblin dos Juros | Bracelete do mercador (+5% de ouro) · Mestre(a) do Mercado · baú dourado |
| 4 | Pântano das Tentações | Hábitos a abandonar | 14 dias sem o hábito | Serpente do Vício | Botas do pântano · Domador(a) de Serpentes · baú de cristal |
| 5 | Torre do Saber | Leitura, estudo e diário | Ler em 10 dias diferentes · 7 registros no diário | Guardião do Esquecimento | Cajado do saber (+10% de XP em leitura) · Guardiã(o) do Saber · baú dourado |
| 6 | Montanha da Disciplina | Revisão semanal | 2 revisões semanais | Gigante da Desordem | Armadura da montanha · Escalador(a) · baú dourado |
| 7 | Castelo do Caos | Tudo junto | 14 dias com 5 ou mais missões | **Senhor do Caos** (2 semanas) | Lâmina da ordem (lendária) · morada Castelo · Senhor(a) da Ordem · baú de cristal |

- Os contadores dos objetivos começam do zero quando o capítulo abre.
- Os itens da campanha são **exclusivos**: não saem em baús nem na loja, e aparecem no Arsenal como "recompensa do capítulo N".
- Cada título de capítulo vale 1 cristal, como os outros títulos.

### C.2. Chefes

- O chefe aparece quando os objetivos do capítulo terminam.
- **Vida** = 80% das missões previstas para os próximos 7 dias (14 no Senhor do Caos). Assim a dificuldade acompanha a rotina de cada pessoa, seja ela de 3 ou de 15 hábitos.
- **Cada missão cumprida tira 1 de vida.** Desmarcar devolve 1. O que já tinha sido feito no dia antes de ele aparecer não conta.
- **Sem castigo:** se o prazo acabar, o chefe foge e volta com a vida cheia numa nova semana. Nada é perdido.
- Na tela da Jornada, durante a luta, um cartão mostra o chefe, a barra de vida e os dias restantes. Cada golpe faz o chefe piscar e mostra "−1 HP".

### C.3. História e personagens

- Três personagens fixos, com retrato em pixel art e falas curtas (de 2 a 3 por capítulo), no estilo de caixa de diálogo de RPG:
  - **Mestra Lume**, a guia;
  - **Nina, a mercadora**, no Mercado de Ouro;
  - **Tork, o ferreiro**, na Montanha da Disciplina.
- As falas se adaptam ao gênero do avatar ("Bem-vinda/Bem-vindo").
- Ordem das falas: apresentação ao abrir o capítulo, provocação do chefe ao aparecer, despedida ao vencer, e logo depois a apresentação do capítulo seguinte. Dá para ouvir de novo pelo mapa.

### C.4. Depois do Castelo

A campanha dura cerca de 3 meses no ritmo normal. Depois vêm as **temporadas**: uma região nova por estação, com chefe e item próprios. Isso evita o "zerei, acabou".

### C.5. Dados a guardar

```ts
interface CampaignState {
  chapter: number;                 // capítulo atual (0–6)
  stage: 'objetivos' | 'chefe' | 'fim';
  chapterStart: string;            // dia em que o capítulo abriu (os contadores contam a partir daqui)
  boss: { hp: number; max: number; start: string; days: number } | null;
  cleared: number[];               // capítulos concluídos
  introSeen: number[];             // falas de abertura já mostradas
}
```

Os contadores dos objetivos (rituais, contas no prazo, dias limpos, revisões etc.) são **calculados a partir dos dados**, contando desde `chapterStart`. A vida do chefe também: missões cumpridas entre `boss.start` e hoje. Assim, desmarcar algo marcado por engano corrige tudo sozinho.

---

## Anexo D — Entrevista e campanha personalizada

*Acrescentado em novembro de 2026. Testada na "Prévia da Jornada".*

Uma campanha fixa não serve para todo mundo. Por exemplo, "14 dias sem refrigerante" é fácil demais para quem não toma refrigerante. Por isso, logo depois de criar o avatar, a **Mestra Lume faz uma entrevista curta** (cerca de 1 minuto, quase tudo com um toque) e monta a campanha com as respostas.

### D.1. Perguntas
1. **O que você mais quer melhorar agora?** Até 3, em ordem de prioridade:
   - Corpo e saúde
   - Rotina e organização
   - Mente e estudo
   - Dinheiro
   - Largar um hábito
   - Bem-estar
2. **Uma pergunta de detalhe por área escolhida:**
   - corpo: atividade (academia, corrida, caminhada, natação) e quantas vezes por semana (2 a 5);
   - rotina: o ritual (arrumar a cama, acordar no mesmo horário, organizar a casa, planejar o dia);
   - mente: o quê (ler, idioma, curso) e quanto por dia (10, 20 ou 30 min);
   - dinheiro: o maior desafio (contas atrasando, gastar demais, não saber quanto entra) e se quer juntar para algo (viagem, reserva, carro, outro). Se quiser, também a meta e quanto dá para guardar. Isso cria uma **caixinha** (ver `caixinhas.md`);
   - largar: qual hábito (redes sociais à noite, doce, cigarro, refrigerante ou outro, escrito pela pessoa);
   - bem-estar: meditar, respirar, gratidões ou terapia semanal.
3. **Melhor horário** para os rituais: manhã, tarde ou noite.
4. **Ritmo:** tranquilo, equilibrado ou desafiador. Multiplica o tamanho dos objetivos (0,7 / 1 / 1,3) e a vida dos chefes (60% / 80% / 95% das missões).
5. **Resumo:** as regiões da campanha, as missões do dia que serão criadas e a caixinha. Tem "Voltar" para mudar qualquer resposta.

### D.2. Como a campanha se monta
- **Sempre no começo:** Vila do Começo, o tutorial.
- **Sempre no final:** Montanha da Disciplina (revisão semanal) e Castelo do Caos.
- **No meio:** uma região por área escolhida, **na ordem das prioridades**. São duas regiões novas mais as que já existiam:

| Área | Região | Chefe | Objetivos (ritmo equilibrado) |
|---|---|---|---|
| Rotina | Floresta da Rotina | Lobo da Preguiça | 7 dias seguidos · 20 rituais |
| Corpo | **Arena de Ferro** (nova, com o Tork) | **Ogro do Sofá** | treinos = 2 semanas na frequência escolhida |
| Mente | Torre do Saber | Guardião do Esquecimento | estudar em 10 dias · 7 registros no diário |
| Dinheiro | Mercado de Ouro | Goblin dos Juros | com caixinha: criar e guardar 4 vezes; e conforme o desafio: contas no prazo, anotar gastos em 10 dias ou cadastrar o salário |
| Largar | Pântano das Tentações | Serpente do Vício (cita o hábito da pessoa) | 14 dias sem o hábito |
| Bem-estar | **Jardim da Calma** (nova) | **Sombra da Ansiedade** | a prática escolhida em 10 dias (ou 3 sessões semanais) · 5 registros no diário |

- **Poucas áreas:** com só 1 área, a Floresta da Rotina entra para a campanha ter pelo menos 3 regiões antes da Montanha.
- **Hábitos que faltam:** se a pessoa escolhe algo que ainda não tem cadastrado, a entrevista cria o hábito no Núcleo, com o nome, a frequência e o horário respondidos. A campanha só lê dados reais.
- **Falas personalizadas:** usam as respostas, como "Você disse 4 vezes por semana de academia…" ou "Sssó um pouquinho de doce…".
- **Itens exclusivos das regiões novas:** Armadura da arena e Lanterna da calma.
- **Refazer a entrevista** em Configurações da Jornada: as regiões já vencidas ficam, e só as próximas mudam.

---

## Anexo E — Onde a Jornada aparece (sem poluir o app)

*Acrescentado em novembro de 2026. Testado na "Prévia da Jornada" (seta no topo da Jornada → Início do app).*

**Regra:** fora da Jornada, o app continua sóbrio. A camada de jogo fica **num cartão só, no Início**, e o resto acontece dentro da Jornada.

### E.1. No app principal
- **Início:** um cartão compacto, depois de "Seu dia":
  - o rosto do avatar;
  - "Jornada · nome · nível N";
  - uma barra fina de XP;
  - **uma linha de status**, que mostra só a coisa mais importante, nesta ordem:
    1. novidades desde a última visita ("Novidades: +80 XP · 3 golpes no Ogro"), com um ponto verde;
    2. chefe em luta ("Ogro do Sofá: 12/35 de vida");
    3. baús esperando;
    4. quanto falta para o próximo nível.
- **Tocar no cartão** abre a Jornada em tela cheia, com navegação própria (Jornada, Campanha, Arsenal, Baús, Ficha). A seta no topo volta ao app.
- **Nenhum elemento de jogo no resto do app:** marcar hábito, pagar conta, escrever no diário e guardar na caixinha funcionam como hoje. Não aparece "+XP", ouro, janela de nível nem chefe.
- **Caixinhas:** são um recurso de Finanças, com saldo, meta e barra. O pote de moedas aparece só dentro da Jornada.
- **Configurações:** "Mostrar a Jornada no Início" e "Desligar a Jornada".

### E.2. Ao entrar na Jornada: "Desde a sua última visita"
- Ao sair da Jornada, o app guarda um retrato do momento: XP, ouro, cristais, atributos, vida do chefe e baús.
- Ao voltar, um resumo animado mostra a diferença:
  - XP, ouro e cristais contando;
  - os atributos que subiram;
  - **os golpes no chefe**, com a barra de vida caindo golpe por golpe;
  - os baús novos;
  - os dias que passaram.
- **Depois do resumo** vêm, em ordem, os acontecimentos que ficaram guardados: subidas de nível, títulos, chefe que apareceu, vitória, marcos de caixinha. Assim a recompensa fica toda junta, e o resumo vira o motivo para abrir a Jornada.

---

## Anexo F — Visitas, dois modos do app, pets e Codex

*Acrescentado em novembro de 2026. Testado na "Prévia da Jornada".*

### F.1. Os dois modos do app
- **Modo Jornada desligado:** é o app básico, com tudo o que foi definido desde o início (Finanças com receitas, cartões e caixinhas; Núcleo; Diário; Agenda; Notas; Revisão semanal). Não aparece XP, atributo, pixel art, cartão nem presente.
- **Modo Jornada ligado:** a experiência imersiva. No app principal continua só o cartão no Início (Anexo E).
- **Como escolher:** no desbloqueio ("Quero a Jornada" ou "Agora não") e a qualquer momento em **Configurações › Modo Jornada**.
- **Desligar não apaga nada.** Visitas, atributos e registros continuam guardados em silêncio, e a Jornada volta inteira se religada.

### F.2. Sequência de visitas: abrir o app já conta
É um terceiro contador, separado dos outros dois:
- **Visitas:** basta abrir o app, mesmo sem registrar nada.
- **Dias com registro:** acendem as estrelas do céu.
- **Sequência de cada hábito:** rende os baús de rotina.

**No app (já programado, v0.11):** a lista `settings.visitDays` guarda os dias em que o app foi aberto (os últimos 400). A regra fica em `visitStats` (`src/jornada/rules.ts`).

**Regras:**
- **Uma folga por semana** (segunda a domingo): um dia sem abrir não quebra a sequência se for o único daquela semana.
- **Hoje ainda sem visita** não quebra a sequência.
- **O recorde e o total nunca diminuem.**

**Presente do dia, numa tira de 7 dias:**
- dias 1 a 6: 10, 15, 20, 25, 30 e 40 de ouro;
- dia 7: baú de bronze. Depois a tira recomeça.

**Marcos:**
- 7 dias: comemoração;
- 14 dias: baú de prata;
- 30 dias: baú dourado e o título **Assídua/Assíduo**;
- 100 dias: título **Centenária/Centenário**;
- 365 dias: título **Lenda da Constância**.

**Mais detalhes:**
- **Presentes acumulam:** os dias em que você abriu o app sem entrar na Jornada ficam esperando. A linha do cartão no Início avisa ("3 presentes esperando").
- **Recaída:** num dia com recaída registrada, o presente vem com a mensagem *"Recaída acontece. Você voltou no mesmo dia, e isso é o que conta."* O botão "Tive uma recaída" fica na linha do hábito a abandonar: zera o contador daquele hábito e não tira nada da Jornada.
- **Na Jornada:** uma chama no topo com o número de dias seguidos e o cartão "Presente do dia", com a tira e a animação de abrir.

### F.3. Pets
- **No começo,** a escolha continua simples: gato ou cão. O outro chega no nível 7.
- **Editar o pet** (Arsenal › Pets, ou pelo Codex): **nome**, que aparece na cena e nos balões, e **cor/pelagem**, de 2 a 6 opções por pet. Pelagens raras são prêmios de sequência de visitas (30, 100 e 365 dias).
- **Os outros pets chegam por conquistas,** ligadas a cada parte do app. Cada um chega com a animação "Novo companheiro!":

| Raridade | Pet | Como conquistar |
|---|---|---|
| Raro | Coelho | 150 missões cumpridas |
| Raro | Coruja | 80 registros no diário |
| Raro | Beija-flor | 20 tarefas e compromissos da Agenda |
| Raro | Esquilo | uma caixinha chegar a 50% |
| Raro | Tartaruga | 30 dias seguidos de rotina |
| Raro | Raposa | 30 dias seguidos abrindo o app |
| Raro | Cavalinho | nível 12 e Agilidade 50 |
| Épico | Lobo filhote | vencer o Lobo da Preguiça (ou nível 15) |
| Épico | Sapinho do pântano | vencer a Serpente do Vício (ou 60 dias de visitas) |
| Épico | Golem de pedra | vencer o Gigante da Desordem |
| Épico | Fênix filhote | 30 dias limpo depois de uma recaída |
| Lendário | Dragãozinho | vencer o Senhor do Caos (ou nível 50) |
| Lendário | Grifo | 365 dias abrindo o app |
| Lendário | Unicórnio | todos os atributos em 100 |

- **Pets que voam** (coruja, beija-flor, fênix, dragão) passeiam no céu da cena.
- **Regiões fora da campanha:** os pets ligados a elas têm um caminho alternativo, para nenhum ficar impossível.

### F.4. Armas e acessórios
- **Arcos:** arco curto (comum), arco longo de teixo (raro), arco élfico (épico, Agilidade 80) e **arco do vento** (místico, da Forja). A personagem segura o arco e leva uma **aljava com flechas nas costas**, com a cor das flechas acompanhando o arco.
- **Acessórios em espaços próprios,** no lugar do "artefato" genérico:
  - **Colar:** amuleto da gota, coração de cristal, colar de pérola, colar de dente de lobo. Aparece no peito do avatar.
  - **Anel:** anel de ferro, anel do foco, braceletes e o **anel da aurora** (místico, da Forja). O segundo anel abre no nível 10.
  - **Item mágico:** grimório, **grimório das estrelas** (místico, da Forja), lanterna, ampulheta, penas, olho do oráculo e estrela polar. Flutua ao lado da personagem.

### F.5. Codex
- **Onde fica:** no Arsenal, em duas abas: **"Vestir e comprar"** e **"Codex"**.
- **O que mostra:** tudo o que existe (itens, pets e moradas), por categoria, com o contador de cada uma ("Pets 7/16").
- **O que você tem** aparece colorido, com uma frase curta de história.
- **O que falta** aparece em **silhueta, com a dica de como conquistar**.
- **Marcos de descoberta:**
  - 25%: baú de prata;
  - 50%: baú dourado;
  - 75%: baú de cristal;
  - 100%: título **Lenda do Codex**.
