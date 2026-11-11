/**
 * Núcleo › Corpo › Treino em casa (M21): catálogo de exercícios, treinos prontos por parte do corpo e nível,
 * meta semanal e link de vídeo. As fichas A, B e C continuam em `practices.ts`.
 */
import type { PracticeSession } from './types.ts';
import { addDays, todayISO } from './utils.ts';
import { weekStart } from './review.ts';

export type Equip = 'sem' | 'com';
export type Part = 'pernas' | 'gluteos' | 'peito' | 'costas' | 'ombros' | 'bracos' | 'antebracos' | 'abdome';
export type Level = 'ini' | 'int' | 'ava';

export const EQUIPS: { value: Equip; label: string }[] = [
  { value: 'sem', label: 'Sem equipamento' },
  { value: 'com', label: 'Com equipamento' },
];

/** Partes do corpo, com uma explicação simples de onde fica cada uma. */
export const PARTS: { value: Part; label: string; hint: string }[] = [
  { value: 'pernas', label: 'Pernas', hint: 'Coxas (frente e trás) e panturrilhas (batata da perna).' },
  { value: 'gluteos', label: 'Glúteos', hint: 'O bumbum. Ajuda a postura e protege a lombar.' },
  { value: 'peito', label: 'Peito', hint: 'O peitoral, na frente do tronco. Trabalha junto com ombros e tríceps.' },
  { value: 'costas', label: 'Costas', hint: 'Meio e parte de baixo das costas. Bom para quem passa o dia sentado.' },
  { value: 'ombros', label: 'Ombros', hint: 'A parte redonda no alto do braço.' },
  { value: 'bracos', label: 'Braços', hint: 'Bíceps (frente do braço) e tríceps (parte de trás).' },
  { value: 'antebracos', label: 'Antebraços', hint: 'Do cotovelo ao punho. Deixa a pegada mais firme.' },
  { value: 'abdome', label: 'Abdome', hint: 'Barriga e cintura. Dá firmeza ao tronco.' },
];

export const LEVELS: { value: Level; label: string; rounds: number; mult: number; rest: number; max: number }[] = [
  { value: 'ini', label: 'Iniciante', rounds: 2, mult: 0.75, rest: 25, max: 4 },
  { value: 'int', label: 'Intermediário', rounds: 3, mult: 1, rest: 20, max: 5 },
  { value: 'ava', label: 'Avançado', rounds: 3, mult: 1.3, rest: 15, max: 6 },
];

export interface Exercise {
  id: string;
  name: string;
  part: Part;
  equip: Equip;
  /** O que é preciso ter (só "com equipamento"). */
  tool?: string;
  /** Repetições ou segundos. */
  kind: 'reps' | 'tempo';
  /** Quantidade no nível intermediário. */
  base: number;
  how: string[];
  /** Boneco (`bonecos.ts`). */
  fig: string;
}

const ex = (id: string, name: string, part: Part, equip: Equip, kind: Exercise['kind'], base: number, fig: string, how: string[], tool?: string): Exercise => ({ id, name, part, equip, kind, base, fig, how, ...(tool ? { tool } : {}) });

/** Em cada parte, do mais fácil para o mais difícil (o iniciante pega os primeiros). */
export const EXERCISES: Exercise[] = [
  // Sem equipamento
  ex('agachamento', 'Agachamento', 'pernas', 'sem', 'reps', 15, 'agachamento', ['Pés na largura dos ombros.', 'Desça como se fosse sentar numa cadeira, peito aberto.', 'Joelhos na direção dos pés. Suba empurrando o chão.']),
  ex('parede', 'Sentar na parede', 'pernas', 'sem', 'tempo', 30, 'parede', ['Costas apoiadas na parede.', 'Desça até as coxas ficarem retas, como numa cadeira.', 'Fique parado(a), respirando.']),
  ex('panturrilha', 'Elevação de panturrilha', 'pernas', 'sem', 'reps', 20, 'panturrilha', ['Em pé, apoie a mão na parede se precisar.', 'Suba na ponta dos pés.', 'Desça devagar.']),
  ex('afundo', 'Afundo alternado', 'pernas', 'sem', 'reps', 12, 'afundo', ['Dê um passo grande à frente.', 'Desça até o joelho de trás quase tocar o chão.', 'Volte e troque de perna.']),
  ex('agachamento-sumo', 'Agachamento sumô', 'pernas', 'sem', 'reps', 15, 'agachamento-sumo', ['Pés bem afastados, pontas para fora.', 'Desça com o tronco reto.', 'Suba apertando o bumbum.']),
  ex('ponte', 'Ponte de glúteo', 'gluteos', 'sem', 'reps', 15, 'ponte', ['Deitado(a), joelhos dobrados e pés no chão.', 'Suba o quadril apertando o bumbum.', 'Desça devagar.']),
  ex('abertura-lateral', 'Abertura lateral deitado', 'gluteos', 'sem', 'reps', 15, 'abertura-lateral', ['Deitado(a) de lado, pernas esticadas.', 'Suba a perna de cima sem girar o quadril.', 'Desça devagar. Faça dos dois lados.']),
  ex('coice', 'Coice de quatro apoios', 'gluteos', 'sem', 'reps', 12, 'coice', ['De quatro apoios, costas retas.', 'Leve um pé em direção ao teto, joelho dobrado.', 'Volte e troque de perna.']),
  ex('ponte-unilateral', 'Ponte com uma perna', 'gluteos', 'sem', 'reps', 10, 'ponte-unilateral', ['Como a ponte, mas com uma perna esticada.', 'Suba o quadril sem deixar cair para o lado.', 'Faça dos dois lados.']),
  ex('flexao-joelhos', 'Flexão com joelhos no chão', 'peito', 'sem', 'reps', 12, 'flexao-joelhos', ['Mãos um pouco mais abertas que os ombros.', 'Joelhos no chão, corpo reto dos joelhos à cabeça.', 'Desça o peito e empurre o chão.']),
  ex('flexao', 'Flexão', 'peito', 'sem', 'reps', 10, 'flexao', ['Mãos no chão, corpo reto como uma tábua.', 'Desça o peito perto do chão.', 'Empurre o chão para subir.']),
  ex('flexao-aberta', 'Flexão aberta', 'peito', 'sem', 'reps', 10, 'flexao', ['Como a flexão, com as mãos bem abertas.', 'Desça devagar, cotovelos para os lados.', 'Suba empurrando o chão.']),
  ex('superman', 'Super-homem', 'costas', 'sem', 'reps', 12, 'superman', ['Deitado(a) de barriga para baixo, braços à frente.', 'Tire braços, peito e pernas do chão.', 'Segure 1 segundo e desça.']),
  ex('bom-dia', 'Bom dia', 'costas', 'sem', 'reps', 12, 'bom-dia', ['Em pé, mãos atrás da cabeça.', 'Incline o tronco à frente com as costas retas.', 'Volte apertando o bumbum.']),
  ex('circulos', 'Círculos com os braços', 'ombros', 'sem', 'tempo', 30, 'circulos', ['Braços abertos na altura dos ombros.', 'Faça círculos pequenos.', 'Na metade do tempo, mude o sentido.']),
  ex('pike', 'Flexão pike', 'ombros', 'sem', 'reps', 8, 'pike', ['Corpo em "V" de cabeça para baixo, quadril alto.', 'Dobre os cotovelos levando a cabeça perto do chão.', 'Empurre para voltar.']),
  ex('mergulho', 'Tríceps no chão', 'bracos', 'sem', 'reps', 12, 'mergulho', ['Sentado(a), mãos no chão atrás do corpo.', 'Suba o quadril esticando os braços.', 'Dobre os cotovelos para descer.']),
  ex('flexao-diamante', 'Flexão fechada', 'bracos', 'sem', 'reps', 8, 'flexao', ['Como a flexão, com as mãos juntas embaixo do peito.', 'Cotovelos perto do corpo.', 'Pode apoiar os joelhos.']),
  ex('maos', 'Abrir e fechar as mãos', 'antebracos', 'sem', 'tempo', 40, 'maos', ['Braços esticados à frente.', 'Abra e feche as mãos com força, rápido.', 'Sinta o antebraço trabalhar.']),
  ex('prancha', 'Prancha', 'abdome', 'sem', 'tempo', 30, 'prancha', ['Antebraços no chão, corpo reto.', 'Barriga firme, sem deixar o quadril cair.', 'Respire normalmente.']),
  ex('abdominal', 'Abdominal', 'abdome', 'sem', 'reps', 15, 'abdominal', ['Deitado(a), joelhos dobrados.', 'Suba só os ombros, olhando para o teto.', 'Desça devagar.']),
  ex('elevacao-pernas', 'Elevação de pernas', 'abdome', 'sem', 'reps', 12, 'elevacao-pernas', ['Deitado(a), mãos ao lado do corpo.', 'Suba as pernas esticadas.', 'Desça devagar, sem encostar no chão.']),
  ex('bicicleta', 'Abdominal bicicleta', 'abdome', 'sem', 'reps', 20, 'bicicleta', ['Deitado(a), mãos atrás da cabeça.', 'Leve um joelho ao peito e estique a outra perna.', 'Alterne, como pedalando.']),
  ex('escalador', 'Escalador', 'abdome', 'sem', 'tempo', 30, 'escalador', ['Na posição de flexão.', 'Traga um joelho ao peito e volte.', 'Alterne rápido.']),
  ex('prancha-lateral', 'Prancha lateral', 'abdome', 'sem', 'tempo', 25, 'prancha-lateral', ['De lado, apoiado(a) no antebraço.', 'Suba o quadril, corpo reto.', 'Faça dos dois lados.']),
  // Com equipamento (o que dá para ter em casa)
  ex('agachamento-halter', 'Agachamento com halteres', 'pernas', 'com', 'reps', 12, 'agachamento-halter', ['Um halter em cada mão, braços soltos.', 'Desça como no agachamento.', 'Suba empurrando o chão.'], 'Halteres'),
  ex('afundo-halter', 'Afundo com halteres', 'pernas', 'com', 'reps', 10, 'afundo-halter', ['Halteres nas mãos.', 'Passo à frente e desça.', 'Volte e troque de perna.'], 'Halteres'),
  ex('stiff', 'Stiff com halteres', 'pernas', 'com', 'reps', 12, 'stiff', ['Joelhos levemente dobrados.', 'Incline o tronco levando os halteres perto das pernas.', 'Sinta atrás da coxa e volte.'], 'Halteres'),
  ex('ponte-halter', 'Ponte com halter', 'gluteos', 'com', 'reps', 15, 'ponte-halter', ['Deitado(a), halter apoiado no quadril.', 'Suba o quadril.', 'Desça devagar.'], 'Halter'),
  ex('swing', 'Swing com kettlebell', 'gluteos', 'com', 'reps', 15, 'swing', ['Kettlebell entre as pernas, joelhos levemente dobrados.', 'Empurre o quadril à frente e deixe o peso subir até o peito.', 'Os braços só acompanham.'], 'Kettlebell'),
  ex('supino-chao', 'Supino no chão', 'peito', 'com', 'reps', 12, 'supino-chao', ['Deitado(a), halteres acima do peito.', 'Desça até os cotovelos tocarem o chão.', 'Empurre para cima.'], 'Halteres'),
  ex('pullover', 'Pullover com halter', 'peito', 'com', 'reps', 12, 'pullover', ['Deitado(a), halter acima do peito com as duas mãos.', 'Leve-o para trás da cabeça, braços quase retos.', 'Volte devagar.'], 'Halter'),
  ex('remada', 'Remada curvada', 'costas', 'com', 'reps', 12, 'remada', ['Tronco inclinado, costas retas.', 'Puxe os halteres até a cintura.', 'Desça devagar.'], 'Halteres'),
  ex('remada-elastico', 'Remada com elástico', 'costas', 'com', 'reps', 15, 'remada-elastico', ['Sentado(a), elástico preso nos pés.', 'Puxe os cotovelos para trás.', 'Volte devagar.'], 'Elástico'),
  ex('elevacao-lateral', 'Elevação lateral', 'ombros', 'com', 'reps', 12, 'elevacao-lateral', ['Em pé, halteres ao lado do corpo.', 'Suba os braços abertos até a altura dos ombros.', 'Desça devagar.'], 'Halteres'),
  ex('desenvolvimento', 'Desenvolvimento', 'ombros', 'com', 'reps', 10, 'desenvolvimento', ['Halteres na altura dos ombros.', 'Empurre para cima até esticar os braços.', 'Desça devagar.'], 'Halteres'),
  ex('rosca', 'Rosca direta', 'bracos', 'com', 'reps', 12, 'rosca', ['Em pé, palmas para a frente.', 'Dobre os cotovelos subindo os halteres.', 'Cotovelos parados ao lado do corpo.'], 'Halteres'),
  ex('rosca-martelo', 'Rosca martelo', 'bracos', 'com', 'reps', 12, 'rosca', ['Palmas viradas uma para a outra.', 'Suba os halteres dobrando os cotovelos.', 'Desça devagar.'], 'Halteres'),
  ex('triceps-frances', 'Tríceps francês', 'bracos', 'com', 'reps', 12, 'triceps-frances', ['Halter acima da cabeça, com as duas mãos.', 'Dobre os cotovelos levando-o atrás da cabeça.', 'Estique os braços.'], 'Halter'),
  ex('rosca-punho', 'Rosca de punho', 'antebracos', 'com', 'reps', 15, 'rosca-punho', ['Antebraço apoiado na coxa ou na mesa, palma para cima.', 'Suba e desça só o punho.', 'Movimento curto e devagar.'], 'Halter'),
  ex('rosca-punho-inversa', 'Rosca de punho inversa', 'antebracos', 'com', 'reps', 15, 'rosca-punho', ['Como a rosca de punho, com a palma para baixo.', 'Suba e desça só o punho.', 'Use menos peso.'], 'Halter'),
  ex('fazendeiro', 'Caminhada do fazendeiro', 'antebracos', 'com', 'tempo', 40, 'fazendeiro', ['Um halter pesado em cada mão.', 'Caminhe com o corpo reto, ombros para trás.', 'Aperte bem a pegada.'], 'Halteres'),
  ex('abdominal-halter', 'Abdominal com halter', 'abdome', 'com', 'reps', 12, 'abdominal-halter', ['Deitado(a), halter no peito.', 'Suba os ombros.', 'Desça devagar.'], 'Halter'),
  ex('torcao-russa', 'Torção russa', 'abdome', 'com', 'reps', 16, 'torcao-russa', ['Sentado(a), tronco inclinado para trás.', 'Leve o halter de um lado para o outro.', 'Barriga firme.'], 'Halter'),
];

export const exerciseById = (id: string) => EXERCISES.find((e) => e.id === id);
export const partLabel = (p: string) => PARTS.find((x) => x.value === p)?.label ?? p;
export const levelInfo = (l: string) => LEVELS.find((x) => x.value === l) ?? LEVELS[1];

/** Partes que têm exercício para este tipo de equipamento. */
export const partsFor = (equip: Equip) => PARTS.filter((p) => EXERCISES.some((e) => e.equip === equip && e.part === p.value));

export interface HomeStep {
  ex: Exercise;
  /** Repetições ou segundos. */
  amount: number;
}
export interface HomeWorkout {
  key: string;
  title: string;
  equip: Equip;
  part: Part;
  level: Level;
  rest: number;
  steps: HomeStep[];
  /** Exercícios diferentes. */
  count: number;
  seconds: number;
}

export const homeKey = (equip: Equip, part: Part, level: Level) => `${equip}:${part}:${level}`;
const SECS_PER_REP = 3;

/** Monta o treino pronto: os exercícios da parte, em voltas, com a quantidade do nível. */
export function homeWorkout(key: string): HomeWorkout | null {
  const [equip, part, level] = key.split(':') as [Equip, Part, Level];
  const lv = LEVELS.find((x) => x.value === level);
  const exs = EXERCISES.filter((e) => e.equip === equip && e.part === part).slice(0, lv?.max ?? 0);
  if (!lv || !exs.length) return null;
  const steps: HomeStep[] = [];
  for (let r = 0; r < lv.rounds; r++) for (const e of exs) steps.push({ ex: e, amount: Math.max(e.kind === 'tempo' ? 10 : 4, Math.round((e.base * lv.mult) / (e.kind === 'tempo' ? 5 : 1)) * (e.kind === 'tempo' ? 5 : 1)) });
  const seconds = steps.reduce((a, s) => a + (s.ex.kind === 'tempo' ? s.amount : s.amount * SECS_PER_REP), 0) + lv.rest * (steps.length - 1);
  return { key, title: `${partLabel(part)} · ${lv.label}`, equip, part, level, rest: lv.rest, steps, count: exs.length, seconds };
}

export const amountText = (s: HomeStep) => (s.ex.kind === 'tempo' ? `00:${String(s.amount).padStart(2, '0')}` : `×${s.amount}`);

/** Os 7 dias da semana (segunda a domingo) e se houve treino em cada um. */
export function weekTrainDays(sessions: PracticeSession[], today: string = todayISO()) {
  const start = weekStart(today);
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(start, i);
    return { day, done: sessions.some((s) => s.type === 'treino' && s.date === day), today: day === today };
  });
}

/** Link de vídeo: aceita com ou sem "https://"; devolve "" se não parecer um endereço. */
export function cleanVideoUrl(raw: string): string {
  const s = raw.trim();
  if (!s) return '';
  const url = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const u = new URL(url);
    return u.hostname.includes('.') && !/\s/.test(s) ? u.href : '';
  } catch {
    return '';
  }
}

export const youtubeSearch = (name: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} exercício como fazer`)}`;

export const clampGoal = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? Math.min(7, Math.max(1, Math.round(n))) : 3);
