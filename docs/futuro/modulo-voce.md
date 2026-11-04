# Você (perfil e sugestões)

> **Status: IDEIA PARA IMPLEMENTAÇÃO FUTURA.** Testada na "Prévia do app" (sem a Jornada). Sem desenvolvimento no app.

Uma página onde a pessoa conta quem é, o que quer e o que atrapalha. O app usa essas respostas para **sugerir hábitos, trocas de hábito, práticas, compromissos na Agenda e caixinhas**. Funciona **sem a Jornada**. Com a Jornada ligada, a entrevista da Mestra Lume já começa com estas respostas (ver `modulo-rpg.md`, Anexo D).

## Onde fica
- **Mais › Você**, e também pelo botão redondo com a inicial no topo de todas as telas.
- **Início › "Para você":** as 2 sugestões mais importantes, com o botão "Ver todas".
- **Núcleo › Rotina › "Sugeridos para você":** só as sugestões de hábito.
- **Indicador de perfil completo** (anel com %): incentiva a preencher, mas nada é obrigatório. Conta 8 partes: nome, dia a dia, áreas, metas curtas, metas longas, hábitos a largar, limitações e preferências.

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
- **"Agora não"** esconde a sugestão para sempre. Em Configurações haverá "Mostrar sugestões dispensadas".
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
| Dinheiro + meta com "R$", "juntar", "guardar" ou "viagem" | Criar a caixinha da meta |
| Dinheiro + orçamento apertado | Revisar os gastos todo domingo (Agenda) |
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
  dismissed: string[];         // ids de sugestões dispensadas
  updatedAt: string;
}
interface Goal { id: string; text: string; when: string; doneAt: string | null; }
```
- Fica em `AppData.profile`, criado vazio na migração (nada muda para quem já usa o app).
- O motor é uma função pura `suggestions(profile, data)`, testada como o resto da lógica.
- Hábitos criados por sugestão guardam `link` (ex.: `alongamento:lombar`), usado pelo Núcleo para marcar o hábito sozinho quando a prática termina (ver `nucleo-mente-corpo.md`).
