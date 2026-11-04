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
