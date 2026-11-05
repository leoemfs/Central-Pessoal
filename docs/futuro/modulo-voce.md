# Você (perfil e sugestões)

> **Status: IMPLEMENTADO na v0.12** (entrevista, página Você e sugestões). Diferenças em relação a este texto:
> - as sugestões de **caixinha** ainda não aparecem, porque as Caixinhas não existem em Finanças (ver `caixinhas.md`). A resposta "Quero juntar para…" já fica guardada e mostra o prazo em Você;
> - sugestões de Agenda criam os próximos compromissos (a Agenda ainda não tem repetição); as rotinas semanais, como "Revisar os gastos todo domingo", viram hábitos;
> - "Mostrar de novo as dispensadas" fica no fim da lista de sugestões, em Você, e não em Configurações.
> - código: `src/profile.ts` (regras, com testes em `profile.test.ts`) e `src/modules/Voce.tsx` (telas).

Uma página onde a pessoa conta quem é, o que quer e o que atrapalha. O app usa essas respostas para **sugerir hábitos, trocas de hábito, práticas, compromissos na Agenda e caixinhas**. Funciona **sem a Jornada**. Com a Jornada ligada, a entrevista da Mestra Lume já começa com estas respostas (ver `modulo-rpg.md`, Anexo D).

## Primeira abertura: a entrevista
Na primeira vez que o app abre, aparece **"Vamos nos conhecer?"**: 7 perguntas rápidas (uns 2 minutos), uma por tela.
- **Dois caminhos, os dois valem:**
  - **"Pular e usar o app":** para quem quer só o prático. O app funciona inteiro, sem perfil, e não insiste;
  - **"Começar":** para quem quer se engajar. Quanto mais a pessoa conta, melhores as sugestões.
- **As 7 perguntas:**
  1. nome e horários de acordar e dormir;
  2. dia a dia e tempo livre por dia;
  3. o que quer melhorar, em ordem de prioridade;
  4. uma meta para os próximos meses e uma para daqui a um ano ou mais, com exemplos de um toque;
  5. dinheiro: como está hoje e se quer juntar para algo (e quanto, opcional);
  6. hábitos que quer largar ("sem julgamento");
  7. limitações e preferências.
- **Cada pergunta tem "Pular"**, e o topo tem "Voltar", a barra de progresso e **"Terminar depois"**, que guarda o que já foi respondido.
- **No fim:** "Pronto, Ana!", quantas sugestões o app preparou e as 3 principais. Nada é adicionado sem a pessoa tocar.
- **Quem pulou ou parou no meio** vê no Início o cartão **"Conte um pouco sobre você"**, com o anel de % e "Responder agora" (ou "Continuar", com quantas perguntas faltam). "Agora não" esconde o cartão por 7 dias. Depois de 2 dispensas, ele só volta pela página Você.
- **Em Você,** o botão "Responder a entrevista", "Continuar a entrevista" ou "Refazer a entrevista" abre as mesmas perguntas, já preenchidas.
- **Quem já usa o app** (atualização) não vê a entrevista na abertura, só o cartão no Início.

## Onde fica
- **Mais › Você**, e também pelo botão redondo com a inicial no topo de todas as telas.
- **Início › "Para você":** as 2 sugestões mais importantes, com o botão "Ver todas".
- **Núcleo › Rotina › "Sugeridos para você":** só as sugestões de hábito.
- **Indicador de perfil completo** (anel com %): incentiva a preencher, mas nada é obrigatório. Conta 9 partes: nome, dia a dia, áreas, metas curtas, metas longas, dinheiro, hábitos a largar, limitações e preferências.

## O que a pessoa preenche
| Seção | Campos | Tipo |
|---|---|---|
| Sobre você | Como quer ser chamada(o); horário em que acorda e em que dorme | texto, hora |
| Meu dia a dia | Trabalho sentado, Trabalho em pé, Estudo, Cuido de alguém, Trabalho à noite | vários |
| Tempo livre por dia | 10 min, 20 min, 30 min, 1 hora | um |
| Prefiro | Ao ar livre, Em casa, Sozinho, Em grupo | vários |
| O que quero melhorar | Corpo e saúde, Rotina e organização, Mente e estudo, Dinheiro, Largar hábitos, Bem-estar e calma. **A ordem do toque é a prioridade** (1, 2, 3…) | vários, ordenado |
| Metas de curto prazo | até 3 meses: texto + prazo opcional | lista |
| Metas de longo prazo | 1 ano ou mais: texto + prazo opcional | lista |
| Dinheiro | Como está hoje: Contas atrasando, Gasto mais do que devia, Não sei quanto entra e sai, Está sob controle. Quero juntar para: Viagem, Reserva de emergência, Casa, Carro, Estudo, Nada agora. Quanto, mais ou menos (opcional) | um, um, valor |
| Hábitos que quero largar | Redes sociais à noite, Doce, Cigarro, Refrigerante, Procrastinar, Roer unha (+ "Outro", escrito) | vários |
| Limitações e cuidados | Dor no joelho, Dor nas costas, Pouco tempo, Ansiedade, Sono ruim, Sem academia perto, Orçamento apertado | vários |
| Algo mais | observações livres (ex.: "tenho dois filhos pequenos") | texto |

## Motor de sugestões
- **Regras fixas, sem internet e sem IA.** Cada regra lê o perfil e, se combinar, gera uma sugestão.
- **Toda sugestão diz o porquê,** citando o que a pessoa contou: "Você marcou **dor nas costas**. A sequência Lombar tem 6 minutos e é leve."
- **Cada sugestão tem um tipo** (Hábito, Prática, Ritual, Troca, Abandonar, Agenda, Finanças, Dica) e **uma ação de um toque:**
  - "Adicionar ao Núcleo" cria o hábito já com dias e horário;
  - "Pôr na Agenda" cria os compromissos;
  - "Criar caixinha" cria a caixinha com a meta (ver `caixinhas.md`);
  - "Anotado", para as dicas.
- **"Agora não"** esconde a sugestão para sempre. No fim da lista, "Mostrar de novo as dispensadas" traz todas de volta.
- **Não repete:** some quando o hábito já existe, quando os compromissos já estão na Agenda ou quando a caixinha já foi criada.
- **Ordem:** pela prioridade das áreas escolhidas; depois, pela ordem padrão.
- **Pouco tempo livre** (10 min ou "Pouco tempo") encurta as sugestões: meditar 3 min, treino de 10 min.

### Regras da primeira versão
| Se o perfil tem… | Sugestão |
|---|---|
| Trabalho sentado | Alongar pescoço e ombros às 15h (seg a sex), ligado ao alongamento "Pescoço e ombros" |
| Dor nas costas | Alongamento da lombar 3× por semana, ligado ao alongamento "Lombar" |
| Ansiedade | Respiração 4-7-8 vinte minutos antes de dormir |
| Sono ruim | Desligar as telas 30 min antes de dormir |
| Corpo + dor no joelho | Bike ou natação 3× por semana |
| Corpo + sem academia ou prefere casa | Treino em casa 3× por semana |
| Corpo (demais casos) | Academia 3× por semana com as fichas A, B e C |
| Meta com "correr" ou "5 km" | Agendar 3 corridas leves na semana (ou caminhadas rápidas, se tiver dor no joelho) |
| Bem-estar, sem hábito de meditar | Meditar 5 min ao acordar |
| Bem-estar | Três coisas boas do dia, à noite (vai para o Diário) |
| Mente, sem hábito de ler | Ler 10 min antes de dormir |
| Rotina | Planejar o dia em 5 min no horário em que acorda |
| Dinheiro + meta com "R$", "juntar", "guardar" ou "viagem" | Criar a caixinha da meta. O valor sai do texto ("R$ 3.000", "R$ 10 mil") |
| Dinheiro + orçamento apertado, ou "Gasto mais do que devia" | Revisar os gastos todo domingo (Agenda) |
| "Contas atrasando" | Conferir as contas do mês todo dia 1º (Agenda) |
| "Não sei quanto entra e sai" | Anotar os gastos do dia, por 2 semanas (hábito) |
| "Quero juntar para…" | Criar a caixinha (ex.: "Reserva de emergência"). Com o valor, diz o prazo: "guardando R$ 100 por semana, você chega a R$ 6.000 em uns 14 meses" |
| Largar redes sociais à noite | Celular fora do quarto às 22h30; trocar o scroll por 10 min de leitura |
| Largar doce | Fruta depois do almoço |
| Largar cigarro | Respirar 1 minuto quando der vontade (ligado à respiração) |
| Largar refrigerante | Garrafa de água por perto (hábito "Beber 2 L de água", com quantidade) |
| Largar procrastinação | Primeira tarefa do dia antes de abrir o celular |
| Largar roer unha | Bolinha antiestresse por perto |
| Pouco tempo | Dica: comece por um hábito só |
| Cuido de alguém | Bloquear 15 min só seus por dia (Agenda) |

Novas regras entram como dados (uma lista), sem mudar as telas.

## Privacidade
- Tudo fica **só no aparelho**, como o resto do app, e entra no backup.
- O perfil nunca é enviado para lugar nenhum. A página diz isso logo no topo.
- Limitações de saúde servem só para **evitar sugestões ruins** (ex.: corrida com dor no joelho). O app não diagnostica nada.

## Com a Jornada
- A entrevista da Mestra Lume abre **já preenchida** com as áreas, as prioridades, o hábito a largar e o horário. A pessoa só confirma ou ajusta.
- O que mudar na entrevista também muda em Você (é o mesmo dado).
- Metas de curto prazo podem virar objetivos da campanha; metas de longo prazo aparecem no mapa como o "destino final".

## Dados
```ts
interface Profile {
  name: string;
  wake: string;                // "06:30"
  sleep: string;               // "23:00"
  day: string[];               // 'sentado' | 'empe' | 'estudo' | 'cuido' | 'noite'
  free: 10 | 20 | 30 | 60;
  likes: string[];             // 'fora' | 'casa' | 'sozinho' | 'grupo'
  areas: string[];             // em ordem de prioridade
  shortGoals: Goal[];
  longGoals: Goal[];
  quits: string[];             // chaves fixas ou texto livre
  limits: string[];
  notes: string;
  money: { challenge: '' | 'atraso' | 'gasto' | 'naosei' | 'ok'; saveFor: string; amount: number | null };
  onboarding: { state: 'novo' | 'pulou' | 'feito'; step: number; askHiddenUntil: string | null; askDismissals: number };
  dismissed: string[];         // ids de sugestões dispensadas
  updatedAt: string;
}
interface Goal { id: string; text: string; when: string; doneAt: string | null; }
```
- Fica em `AppData.profile`, criado vazio na migração. Quem já usa o app entra com `onboarding.state = 'pulou'`, para não ver a entrevista de surpresa.
- O motor é uma função pura `suggestions(profile, data)`, testada como o resto da lógica.
- Hábitos criados por sugestão guardam `link` (ex.: `alongamento:lombar`), usado pelo Núcleo para marcar o hábito sozinho quando a prática termina (ver `nucleo-mente-corpo.md`).
