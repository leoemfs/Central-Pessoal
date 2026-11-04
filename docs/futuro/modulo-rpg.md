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

## 6. Regras de recompensa

O sistema deverá possuir regras próprias para distribuição de XP e Gold.

Requisitos:

- Cada conclusão válida deverá gerar sua recompensa.
- A mesma conclusão não poderá gerar recompensas duplicadas.
- O usuário deverá conseguir consultar o histórico de recompensas.
- Atividades recorrentes deverão gerar novas oportunidades de recompensa conforme sua frequência.
- Recompensas deverão ser calculadas de acordo com a configuração da atividade.

**Regra importante:** não deverá existir perda automática de XP por deixar de cumprir hábitos.

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
- **Raridades:** comum (cinza), raro (azul), épico (roxo) e místico (dourado).

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
- Os 6 artefatos raros dão **+10% de XP** nos hábitos do atributo correspondente (Pena → AGI, Bracelete → FOR, Grimório → INT, Gota → RES, Lanterna → SAB, Ampulheta → DIS). Também podem sair em baús, ou ser liberados com o atributo em 40.

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

- **Pets:** Gatinho e Cãozinho (nível 3, escolhe um), Cavalinho (nível 12 + AGI 50). O pet passeia na cena e fica feliz nos dias com registro; **nunca fica triste nem some**. Para o futuro: raposa, coruja e um dragãozinho místico.
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
  equipped: { elmo?: string; armadura: string; botas: string; arma?: string; artefato?: string; artefato2?: string; pet?: string; morada: string };
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
| 7 | Castelo do Caos | Tudo junto | 14 dias com 5 ou mais missões | **Senhor do Caos** (2 semanas) | Lâmina da ordem (mística) · morada Castelo · Senhor(a) da Ordem · baú de cristal |

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
