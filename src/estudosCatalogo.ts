/**
 * Estudos e Carreira: catálogo do app (Biblioteca). Só leitura.
 * Área → Tema → (Nível) → Trilha → Tópicos. Nível é opcional: cada área se organiza do seu jeito.
 * O que a pessoa escolhe (ciclos, notebooks, fontes, mapas) fica em `AppData.study` e nunca muda isto aqui.
 * Ids dos tópicos = id da trilha + nome do tópico simplificado: não renomeie tópicos sem necessidade.
 */
import type { SourceKind } from './types.ts';

export interface CatTopic {
  id: string;
  name: string;
  /** Tópico recomendado antes (só um aviso, nunca um bloqueio). */
  before?: string;
  why?: string;
}
export interface CatSource {
  title: string;
  url: string;
  kind: SourceKind;
}
export interface CatTrack {
  id: string;
  name: string;
  desc: string;
  topics: CatTopic[];
  sources: CatSource[];
}
export interface CatLevel {
  id: string;
  name: string;
  title: string;
  desc: string;
  tracks: CatTrack[];
}
export interface CatTheme {
  id: string;
  name: string;
  levels?: CatLevel[];
  tracks?: CatTrack[];
}
export interface CatArea {
  id: string;
  name: string;
  icon: string;
  desc: string;
  themes: CatTheme[];
}
export interface CatMap {
  id: string;
  name: string;
  areaId: string;
  center: string;
  branches: [string, string[]][];
}

export function slug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Tópico simples (texto) ou com recomendação: [nome, nome do tópico recomendado antes, motivo]. */
type T = string | [string, string, string];

function tr(id: string, name: string, desc: string, topics: T[], sources: CatSource[] = []): CatTrack {
  const tid = (n: string) => `${id}.${slug(n)}`;
  return {
    id,
    name,
    desc,
    sources,
    topics: topics.map((t) => (typeof t === 'string' ? { id: tid(t), name: t } : { id: tid(t[0]), name: t[0], before: tid(t[1]), why: t[2] })),
  };
}
const src = (title: string, url: string, kind: SourceKind): CatSource => ({ title, url, kind });

export const CATALOG: CatArea[] = [
  {
    id: 'idiomas',
    name: 'Idiomas',
    icon: 'globe',
    desc: 'Línguas para ler, ouvir, conversar e trabalhar.',
    themes: [
      {
        id: 'ingles',
        name: 'Inglês',
        levels: [
          {
            id: 'a1',
            name: 'A1',
            title: 'Iniciante',
            desc: 'Primeiras frases, apresentações e o básico do dia a dia.',
            tracks: [
              tr(
                'en-a1-contatos',
                'Primeiros contatos',
                'Apresentar-se, entender o básico e responder perguntas simples.',
                [
                  'Cumprimentos e apresentações',
                  'Alfabeto e pronúncia',
                  'Números, datas e horas',
                  'Pronomes e verbo to be',
                  'Vocabulário cotidiano',
                  ['Perguntas e respostas', 'Pronomes e verbo to be', 'Para fazer perguntas com o verbo to be, ajuda conhecer antes os pronomes pessoais.'],
                  ['Família e pessoas', 'Pronomes e verbo to be', 'Descrever pessoas usa os pronomes e o verbo to be.'],
                  ['Rotina e horários', 'Números, datas e horas', 'Falar da rotina usa horas e números.'],
                  'Lugares e direções',
                  ['Leitura e escuta básica', 'Vocabulário cotidiano', 'Fica mais fácil com um pouco de vocabulário do dia a dia.'],
                ],
                [
                  src('BBC Learning English', 'https://www.bbc.co.uk/learningenglish', 'site'),
                  src('Cambridge Dictionary (com áudio)', 'https://dictionary.cambridge.org', 'site'),
                  src('YouGlish: ouvir palavras em vídeos reais', 'https://youglish.com', 'video'),
                ],
              ),
              tr('en-a1-cotidiano', 'Inglês para o cotidiano', 'Situações do dia: mercado, transporte, restaurante e casa.', [
                'No mercado e nas compras',
                'Transporte e direções',
                'Restaurante e pedidos',
                'Em casa: cômodos e objetos',
                'Tempo e clima',
              ]),
              tr('en-a1-pronuncia', 'Compreensão e pronúncia', 'Os sons do inglês e a escuta de frases curtas.', [
                'Sons das vogais',
                'O som do "th"',
                'Ritmo e entonação',
                ['Ouvir frases curtas', 'Sons das vogais', 'Reconhecer as vogais ajuda a entender o que se ouve.'],
                'Ditado de palavras',
              ]),
              tr('en-a1-vocab', 'Vocabulário essencial', 'As palavras mais usadas, organizadas por tema.', ['Cores, formas e tamanhos', 'Comida e bebida', 'Roupas', 'Corpo e saúde', 'Trabalho e profissões']),
              tr('en-a1-comunicacao', 'Comunicação básica', 'Pedir ajuda, dizer do que gosta, agradecer e se desculpar.', [
                'Pedir e oferecer ajuda',
                'Gostos e preferências',
                'Pedir desculpas e agradecer',
                'Concordar e discordar',
              ]),
            ],
          },
          {
            id: 'a2',
            name: 'A2',
            title: 'Básico',
            desc: 'Contar o que aconteceu, fazer planos e viajar.',
            tracks: [
              tr('en-a2-passado', 'Contar o que aconteceu', 'O passado simples para falar do fim de semana, de viagens e da vida.', [
                'Was e were',
                'Passado dos verbos regulares',
                'Verbos irregulares mais comuns',
                'Marcadores de tempo (yesterday, last week)',
                ['Contar o fim de semana', 'Verbos irregulares mais comuns', 'Quase toda história usa verbos irregulares (went, saw, had).'],
              ]),
              tr('en-a2-futuro', 'Planos e futuro', 'Combinar, convidar e falar do que vai fazer.', ['Going to', 'Will para decisões na hora', 'Convites e combinados', 'Agenda da semana']),
              tr('en-a2-viagem', 'Inglês para viagem', 'Aeroporto, hotel e imprevistos.', ['Aeroporto e imigração', 'Hotel e hospedagem', 'Pedir informações na rua', 'Resolver problemas simples']),
            ],
          },
          {
            id: 'b1',
            name: 'B1',
            title: 'Intermediário',
            desc: 'Dar opinião, conversar com mais liberdade e usar no trabalho.',
            tracks: [
              tr('en-b1-opinar', 'Opinar e conversar', 'Defender ideias, comparar e manter uma conversa.', [
                'Dar opinião',
                'Comparar coisas',
                'Present perfect',
                ['Experiências de vida', 'Present perfect', '"Have you ever…?" usa o present perfect.'],
                'Conectores (because, although, however)',
              ]),
              tr('en-b1-trabalho', 'Inglês para o trabalho', 'E-mails, reuniões e conversas com colegas.', ['E-mails simples', 'Small talk', 'Apresentar o que você faz', 'Participar de reuniões'], [
                src('Grammarly Blog: escrita em inglês', 'https://www.grammarly.com/blog/', 'artigo'),
              ]),
            ],
          },
          {
            id: 'b2',
            name: 'B2',
            title: 'Intermediário superior',
            desc: 'Conversas longas, negociações e textos técnicos.',
            tracks: [
              tr('en-b2-fluencia', 'Fluência no trabalho', 'Ganhar segurança em situações profissionais.', [
                'Reuniões e negociações',
                'Escrita profissional',
                'Phrasal verbs comuns',
                'Entender podcasts e palestras',
              ]),
            ],
          },
          {
            id: 'c1',
            name: 'C1',
            title: 'Avançado',
            desc: 'Refinar o tom e entender nuances.',
            tracks: [tr('en-c1-refinar', 'Refinar o inglês', 'Expressões, tom e leitura longa.', ['Expressões idiomáticas', 'Formal × informal', 'Ler textos técnicos longos', 'Apresentações sem roteiro'])],
          },
        ],
      },
      {
        id: 'espanhol',
        name: 'Espanhol',
        levels: [
          {
            id: 'es-a1',
            name: 'A1',
            title: 'Iniciante',
            desc: 'Primeiros passos no espanhol.',
            tracks: [
              tr(
                'es-a1-passos',
                'Primeiros passos',
                'Cumprimentar, apresentar-se e o básico da gramática.',
                [
                  'Saludos y presentaciones',
                  'Alfabeto e pronúncia',
                  'Números e datas',
                  'Ser e estar',
                  ['Falar de si e dos outros', 'Ser e estar', 'Descrever pessoas usa ser e estar.'],
                ],
                [src('SpanishDict', 'https://www.spanishdict.com', 'site'), src('Dicionário da RAE', 'https://dle.rae.es', 'site')],
              ),
              tr('es-a1-falsos', 'Falsos amigos', 'Palavras parecidas com o português, mas com outro sentido.', ['O que são falsos amigos', 'Exquisito, embarazada, oficina', 'Como evitar confusões']),
            ],
          },
          {
            id: 'es-a2',
            name: 'A2',
            title: 'Básico',
            desc: 'Conversas do dia a dia.',
            tracks: [tr('es-a2-dia', 'Conversas do dia a dia', 'Rotina, restaurante e o passado.', ['Falar da rotina', 'Pedir no restaurante', 'Pretérito indefinido', 'Contar uma viagem'])],
          },
        ],
      },
      { id: 'outros-idiomas', name: 'Outros idiomas', tracks: [] },
    ],
  },
  {
    id: 'dev',
    name: 'Desenvolvimento de software',
    icon: 'code',
    desc: 'Programar, construir e manter sistemas.',
    themes: [
      {
        id: 'logica',
        name: 'Lógica de programação',
        tracks: [
          tr(
            'dev-logica',
            'Primeiros passos',
            'Pensar em passos antes de escrever código.',
            [
              'Algoritmos do dia a dia',
              'Variáveis e tipos',
              ['Condições (se, senão)', 'Variáveis e tipos', 'Condições comparam valores guardados em variáveis.'],
              ['Repetições', 'Condições (se, senão)', 'Repetições usam condições para saber quando parar.'],
              'Funções',
              'Listas e coleções',
            ],
            [src('Curso de lógica (freeCodeCamp)', 'https://www.freecodecamp.org', 'curso')],
          ),
        ],
      },
      {
        id: 'linguagens',
        name: 'Linguagens de programação',
        tracks: [
          tr(
            'dev-js',
            'Fundamentos de JavaScript',
            'A linguagem da web, do zero.',
            ['Sintaxe e console', 'Objetos e arrays', 'Funções e escopo', ['Promessas e async', 'Funções e escopo', 'Código assíncrono usa muitas funções.'], 'Módulos'],
            [src('MDN: Guia de JavaScript', 'https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide', 'doc'), src('javascript.info', 'https://javascript.info', 'site')],
          ),
          tr('dev-python', 'Python do zero', 'Uma linguagem simples para automatizar e analisar dados.', ['Instalar e rodar', 'Tipos e variáveis', 'Listas e dicionários', 'Funções', 'Ler e escrever arquivos'], [
            src('Tutorial oficial do Python', 'https://docs.python.org/pt-br/3/tutorial/', 'doc'),
          ]),
          tr('dev-ts', 'TypeScript na prática', 'JavaScript com tipos, para errar menos.', ['Por que tipos', 'Tipos básicos e interfaces', 'Funções tipadas', 'Generics', 'Configurar um projeto'], [
            src('Manual do TypeScript', 'https://www.typescriptlang.org/docs/handbook/intro.html', 'doc'),
          ]),
        ],
      },
      {
        id: 'web',
        name: 'Desenvolvimento web',
        tracks: [
          tr('dev-web', 'Como a web funciona', 'Do endereço digitado à página na tela.', ['Navegador, servidor e HTTP', 'Domínio e DNS', 'HTML: estrutura da página', 'CSS: estilo e layout', 'Publicar um site'], [
            src('MDN: Aprenda desenvolvimento web', 'https://developer.mozilla.org/pt-BR/docs/Learn', 'doc'),
          ]),
        ],
      },
      {
        id: 'front',
        name: 'Front-end',
        levels: [
          {
            id: 'front-ini',
            name: 'Iniciante',
            title: 'Base',
            desc: 'HTML e CSS bem feitos, para qualquer tela.',
            tracks: [
              tr('dev-htmlcss', 'HTML e CSS na prática', 'Páginas bonitas, acessíveis e que funcionam no celular.', ['HTML semântico', 'Flexbox', 'Grid', 'Responsivo (celular primeiro)', 'Acessibilidade básica'], [
                src('Guia de Flexbox (CSS-Tricks)', 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/', 'artigo'),
              ]),
            ],
          },
          {
            id: 'front-int',
            name: 'Intermediário',
            title: 'Aplicações',
            desc: 'Interfaces com React e componentes.',
            tracks: [
              tr(
                'dev-react',
                'React básico',
                'Construir telas com componentes.',
                ['Componentes', 'Props e estado', ['Efeitos', 'Props e estado', 'Efeitos reagem a mudanças de estado.'], 'Listas e formulários', 'Rotas'],
                [src('Aprenda React (oficial)', 'https://react.dev/learn', 'doc'), src('Roadmap de front-end', 'https://roadmap.sh/frontend', 'site')],
              ),
            ],
          },
        ],
      },
      {
        id: 'back',
        name: 'Back-end',
        tracks: [
          tr('dev-apis', 'APIs do zero', 'Como os sistemas conversam entre si.', [
            'O que é uma API',
            'REST e métodos HTTP',
            'JSON',
            ['Autenticação básica', 'REST e métodos HTTP', 'A autenticação viaja nas requisições HTTP.'],
            'Primeira API com Node.js',
          ]),
        ],
      },
      {
        id: 'arquitetura',
        name: 'Arquitetura de software',
        tracks: [
          tr('dev-arq', 'Fundamentos de arquitetura', 'Organizar sistemas para crescerem sem virar bagunça.', [
            'Separar responsabilidades',
            'Camadas',
            'Monólito × microsserviços',
            'Decisões e trade-offs',
            'Registrar decisões (ADR)',
          ]),
        ],
      },
      {
        id: 'bd',
        name: 'Banco de dados',
        tracks: [
          tr('dev-sql', 'SQL essencial', 'Guardar e consultar dados.', ['Tabelas e tipos', 'SELECT e filtros', ['JOIN', 'SELECT e filtros', 'JOIN junta resultados de SELECTs.'], 'Agrupar e somar', 'Índices'], [
            src('SQLBolt: exercícios no navegador', 'https://sqlbolt.com', 'curso'),
          ]),
        ],
      },
      {
        id: 'praticas',
        name: 'Metodologias e boas práticas',
        tracks: [
          tr('dev-git', 'Git e versionamento', 'Guardar o histórico do código e trabalhar em equipe.', ['Commits', 'Branches', 'Pull requests', ['Resolver conflitos', 'Branches', 'Conflitos aparecem ao juntar branches.']], [
            src('Livro Pro Git (em português)', 'https://git-scm.com/book/pt-br/v2', 'livro'),
          ]),
          tr('dev-limpo', 'Código limpo e testes', 'Código fácil de ler e de mudar.', ['Nomes claros', 'Funções pequenas', 'Testes automatizados', 'Revisão de código']),
        ],
      },
    ],
  },
  {
    id: 'ia',
    name: 'Inteligência artificial',
    icon: 'spark',
    desc: 'Entender e usar IA no trabalho e na vida.',
    themes: [
      {
        id: 'ia-fund',
        name: 'Fundamentos de IA',
        tracks: [
          tr('ia-oque', 'O que é IA', 'Os conceitos, sem matemática.', ['IA, aprendizado de máquina e dados', 'Como um modelo aprende', 'Limites e erros', 'Ética e privacidade'], [
            src('Elements of AI (curso gratuito)', 'https://www.elementsofai.com', 'curso'),
          ]),
        ],
      },
      {
        id: 'ia-llm',
        name: 'Modelos de linguagem',
        tracks: [
          tr('ia-llm', 'Como funcionam os LLMs', 'O que acontece quando você conversa com uma IA.', [
            'Tokens e contexto',
            'Treinamento e ajuste',
            ['Alucinações', 'Treinamento e ajuste', 'Entender o treinamento explica por que a IA inventa coisas.'],
            'Escolher o modelo certo',
          ]),
        ],
      },
      {
        id: 'ia-prompts',
        name: 'Engenharia de prompts',
        tracks: [
          tr(
            'ia-prompts',
            'Escrever bons pedidos',
            'Como pedir para a IA e conferir o resultado.',
            [
              'Contexto e objetivo',
              'Exemplos no pedido',
              'Formato da resposta',
              'Conferir e corrigir respostas',
              ['Pedidos em etapas', 'Contexto e objetivo', 'Dividir em etapas fica mais fácil com o objetivo bem claro.'],
            ],
            [src('Documentação da Anthropic (prompts)', 'https://docs.anthropic.com', 'doc')],
          ),
          tr('ia-prompts-av', 'Prompts avançados', 'Para tarefas maiores e respostas mais confiáveis.', [
            'Papéis e instruções de sistema',
            'Pensar passo a passo',
            'Saídas estruturadas (JSON)',
            'Avaliar respostas com critérios',
          ]),
        ],
      },
      {
        id: 'ia-agentes',
        name: 'Agentes de IA',
        tracks: [
          tr('ia-agentes', 'Primeiros agentes', 'IA que usa ferramentas e executa tarefas.', [
            'O que é um agente',
            'Ferramentas (tool use)',
            ['Planejamento e memória', 'Ferramentas (tool use)', 'O agente planeja em cima das ferramentas que tem.'],
            'Segurança e limites',
          ]),
        ],
      },
      {
        id: 'ia-auto',
        name: 'Automação',
        tracks: [tr('ia-auto', 'Automatizar o dia a dia', 'Tirar do caminho as tarefas repetitivas.', ['Mapear tarefas repetitivas', 'Gatilhos e ações', 'Planilhas com IA', 'Revisar automações'])],
      },
      {
        id: 'ia-ferramentas',
        name: 'Ferramentas e aplicações',
        tracks: [
          tr('ia-trabalho', 'IA no trabalho', 'Usos práticos para ganhar tempo.', ['Resumir e escrever', 'Pesquisar com fontes', 'Criar imagens', 'Programar com um assistente']),
        ],
      },
    ],
  },
  {
    id: 'prod',
    name: 'Produtividade',
    icon: 'target',
    desc: 'Organizar tempo, tarefas e projetos.',
    themes: [
      {
        id: 'prod-org',
        name: 'Organização pessoal',
        tracks: [
          tr(
            'prod-gtd',
            'Cabeça vazia (GTD básico)',
            'Tirar tudo da cabeça e confiar no seu sistema.',
            ['Capturar tudo', 'Esclarecer: o que é isso?', 'Organizar em listas', ['Revisar', 'Organizar em listas', 'Só dá para revisar o que está organizado.'], 'Fazer'],
            [src('Getting Things Done (site oficial)', 'https://gettingthingsdone.com', 'site'), src('Livro: A arte de fazer acontecer', '', 'livro')],
          ),
        ],
      },
      {
        id: 'prod-tempo',
        name: 'Gestão do tempo',
        tracks: [tr('prod-semana', 'Dominar a semana', 'Planejar a semana e proteger o tempo do que importa.', ['Revisão semanal', 'Blocos de tempo', 'Importante × urgente', 'Pausas e foco', 'Dizer não'])],
      },
      {
        id: 'prod-metodos',
        name: 'Métodos de produtividade',
        tracks: [
          tr('prod-pomodoro', 'Pomodoro', 'Trabalhar em blocos curtos com pausas.', ['Como funciona', 'Lidar com interrupções', 'Ajustar o tamanho do bloco'], [src('Livro: A técnica Pomodoro', '', 'livro')]),
          tr('prod-kanban', 'Kanban pessoal', 'Ver o trabalho num quadro: a fazer, fazendo, feito.', ['Montar o quadro', 'Limitar o que está em andamento', 'Revisar o quadro']),
        ],
      },
      {
        id: 'prod-planej',
        name: 'Planejamento',
        tracks: [
          tr('prod-metas', 'Metas que saem do papel', 'Do desejo ao plano com passos.', [
            'Metas SMART',
            ['Dividir em etapas', 'Metas SMART', 'Uma meta clara é mais fácil de dividir.'],
            'Hábitos que sustentam a meta',
            'Acompanhar e ajustar',
          ]),
        ],
      },
      {
        id: 'prod-projetos',
        name: 'Organização de projetos',
        tracks: [
          tr('prod-projeto', 'Projeto do início ao fim', 'Tirar uma ideia do papel com começo, meio e fim.', [
            'Objetivo e escopo',
            'Quebrar em entregas',
            'Prazos realistas',
            'Riscos',
            'Fechar e aprender',
          ]),
        ],
      },
    ],
  },
  {
    id: 'carreira',
    name: 'Carreira',
    icon: 'briefcase',
    desc: 'Conhecer seus pontos fortes, se apresentar bem e crescer no trabalho.',
    themes: [
      {
        id: 'car-auto',
        name: 'Autoconhecimento profissional',
        tracks: [
          tr('car-rumo', 'Onde estou e para onde vou', 'Clareza sobre o que você faz bem e o que quer.', ['Pontos fortes', 'O que me motiva', 'Valores no trabalho', 'Mapa de habilidades'], [
            src('Livro: Qual a cor do seu paraquedas?', '', 'livro'),
          ]),
        ],
      },
      {
        id: 'car-curriculo',
        name: 'Currículo e portfólio',
        tracks: [
          tr('car-cv', 'Currículo que chama atenção', 'Mostrar resultados, não só tarefas.', [
            'Estrutura do currículo',
            'Resultados em vez de tarefas',
            ['LinkedIn', 'Resultados em vez de tarefas', 'O perfil fica melhor com as mesmas frases de resultado do currículo.'],
            'Portfólio',
          ]),
        ],
      },
      {
        id: 'car-entrevistas',
        name: 'Entrevistas',
        tracks: [
          tr('car-entrevista', 'Preparar entrevistas', 'Chegar seguro e contar bem a sua história.', [
            'Pesquisar a empresa',
            'Contar sua história',
            ['Método STAR', 'Contar sua história', 'O STAR organiza as histórias que você já sabe contar.'],
            'Perguntas para fazer',
            'Negociar salário',
          ]),
        ],
      },
      {
        id: 'car-comunicacao',
        name: 'Comunicação e liderança',
        tracks: [tr('car-comunicar', 'Comunicar no trabalho', 'Ser entendido e entender os outros.', ['Escuta ativa', 'Dar e receber feedback', 'Apresentações', 'Escrita clara'])],
      },
      {
        id: 'car-transicao',
        name: 'Transição de carreira',
        tracks: [
          tr('car-mudar', 'Mudar de área', 'Planejar a mudança com passos pequenos.', [
            'Explorar áreas',
            'Habilidades transferíveis',
            'Plano de estudos em ciclos',
            'Networking',
          ]),
        ],
      },
    ],
  },
];

/** Mapas mentais sugeridos: a pessoa pode copiar para os seus e editar. */
export const SUGGESTED_MAPS: CatMap[] = [
  { id: 'sug-to-be', name: 'Verbo to be', areaId: 'idiomas', center: 'to be', branches: [['Afirmativa', ['I am', 'You are', 'He is']], ['Negativa', ['I am not', "isn't", "aren't"]], ['Pergunta', ['Am I?', 'Are you?', 'Is she?']], ['Usos', ['Idade', 'Lugar', 'Profissão']]] },
  { id: 'sug-tempos', name: 'Tempos verbais básicos', areaId: 'idiomas', center: 'Tempos', branches: [['Presente', ['Rotina', 'Fatos']], ['Passado', ['Was/were', 'Regulares', 'Irregulares']], ['Futuro', ['Going to', 'Will']], ['Perfect', ['Have + particípio']]] },
  { id: 'sug-prompt', name: 'Um bom pedido para a IA', areaId: 'ia', center: 'Pedido', branches: [['Contexto', ['Quem sou', 'Para quê']], ['Exemplos', ['Bom', 'Ruim']], ['Formato', ['Lista', 'Tabela', 'Curto']], ['Conferir', ['Fontes', 'Erros']]] },
  { id: 'sug-front', name: 'Caminho do front-end', areaId: 'dev', center: 'Front-end', branches: [['Base', ['HTML', 'CSS', 'JavaScript']], ['Ferramentas', ['Git', 'npm']], ['Framework', ['React', 'Rotas']], ['Qualidade', ['Testes', 'Acessibilidade']]] },
  { id: 'sug-semana', name: 'Minha semana ideal', areaId: 'prod', center: 'Semana', branches: [['Planejar', ['Domingo', '3 prioridades']], ['Foco', ['Blocos', 'Pausas']], ['Revisar', ['Sexta']], ['Descanso', ['Sem telas']]] },
  { id: 'sug-star', name: 'Resposta STAR', areaId: 'carreira', center: 'STAR', branches: [['Situação', ['Onde', 'Quando']], ['Tarefa', ['O desafio']], ['Ação', ['O que eu fiz']], ['Resultado', ['Números', 'Aprendizado']]] },
];
