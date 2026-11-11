/**
 * Núcleo › Mente e Corpo: o catálogo das práticas e as regras de registro.
 * Ao concluir uma prática, os hábitos ligados a ela são marcados sozinhos.
 */
import type { AppData, Habit, PracticeSession, PracticeType, Profile } from './types.ts';
import { isArchived, isPaused, isQuantity } from './habits.ts';
import { addDays, todayISO, uid } from './utils.ts';
import { weekStart } from './review.ts';

export interface Guided { title: string; minutes: number; steps: string[] }
export const GUIDED: Record<string, Guided> = {
  consciente: { title: 'Respiração consciente', minutes: 5, steps: ['Sente-se de um jeito confortável. Se quiser, feche os olhos.', 'Perceba o ar entrando pelo nariz…', '…e saindo devagar, sem forçar.', 'Se a mente fugir, tudo bem. Volte para a respiração.', 'Conte cinco respirações, sem pressa.', 'Agora perceba o corpo inteiro respirando.', 'Quando o sino tocar, abra os olhos devagar.'] },
  corpo: { title: 'Escaneamento do corpo', minutes: 10, steps: ['Deite ou sente-se com as costas apoiadas.', 'Leve a atenção aos pés. Só perceba, sem mudar nada.', 'Suba para as pernas e os joelhos.', 'Perceba a barriga subindo e descendo.', 'Agora os ombros. Deixe que fiquem pesados.', 'Solte o rosto: testa, olhos, mandíbula.', 'Sinta o corpo inteiro de uma vez.', 'Respire fundo e volte quando o sino tocar.'] },
  sons: { title: 'Atenção aos sons', minutes: 5, steps: ['Fique parado(a) e escute.', 'Repare no som mais distante que consegue ouvir.', 'Agora no mais perto.', 'Não dê nome aos sons. Só escute.', 'Volte ao som da sua respiração.'] },
  dormir: { title: 'Antes de dormir', minutes: 10, steps: ['Deite de um jeito confortável e apague a luz.', 'Expire mais devagar do que inspira.', 'Pense em uma coisa boa do seu dia.', 'Solte o peso do corpo no colchão.', 'Se vier um pensamento, deixe passar como uma nuvem.', 'Continue respirando devagar até pegar no sono.'] },
};

/** Fase: [texto, segundos, a esfera cresce?] */
export interface Breath { title: string; sub: string; phases: [string, number, boolean][] }
export const BREATH: Record<string, Breath> = {
  '478': { title: 'Respiração 4-7-8', sub: 'para relaxar e dormir', phases: [['Inspire', 4, true], ['Segure', 7, true], ['Expire', 8, false]] },
  caixa: { title: 'Respiração em caixa', sub: '4-4-4-4 · foco e calma', phases: [['Inspire', 4, true], ['Segure', 4, true], ['Expire', 4, false], ['Segure', 4, false]] },
  coerencia: { title: 'Coerência', sub: '5-5 · equilibra o ritmo', phases: [['Inspire', 5, true], ['Expire', 5, false]] },
};
/** Cada respiração dura cerca de 2 minutos (no mínimo 3 ciclos). */
export const breathRounds = (b: Breath) => Math.max(3, Math.round(120 / b.phases.reduce((a, p) => a + p[1], 0)));

/** Movimento: [nome, segundos, instrução] */
export interface Stretch { title: string; minutes: number; moves: [string, number, string][] }
export const STRETCH: Record<string, Stretch> = {
  acordar: { title: 'Acordar', minutes: 5, moves: [['Espreguiçar', 40, 'Braços para cima, estique o corpo inteiro.'], ['Gato e vaca', 45, 'De quatro apoios, arredonde e afunde as costas devagar.'], ['Rotação de ombros', 30, 'Gire os ombros para trás, círculos grandes.'], ['Inclinação lateral · direita', 30, 'Braço direito por cima da cabeça, incline para a esquerda.'], ['Inclinação lateral · esquerda', 30, 'Agora o outro lado.'], ['Torção sentado', 40, 'Sentado(a), gire o tronco devagar para cada lado.'], ['Respirar fundo', 30, 'Três respirações longas antes de começar o dia.']] },
  ombros: { title: 'Pescoço e ombros', minutes: 5, moves: [['Cabeça à direita', 30, 'Orelha em direção ao ombro direito. Ombros soltos.'], ['Cabeça à esquerda', 30, 'Agora para o outro lado.'], ['Queixo ao peito', 30, 'Deixe o peso da cabeça alongar a nuca.'], ['Rotação de ombros', 40, 'Círculos lentos para trás.'], ['Braço cruzado · direito', 30, 'Puxe o braço direito na frente do peito.'], ['Braço cruzado · esquerdo', 30, 'Agora o esquerdo.'], ['Mãos atrás das costas', 40, 'Entrelace os dedos e abra o peito.']] },
  lombar: { title: 'Lombar', minutes: 6, moves: [['Joelhos ao peito', 45, 'Deitado(a), abrace os joelhos e balance de leve.'], ['Torção deitado · direita', 40, 'Joelhos para a direita, olhar para a esquerda.'], ['Torção deitado · esquerda', 40, 'Agora para o outro lado.'], ['Postura da criança', 60, 'Sente nos calcanhares e estenda os braços à frente.'], ['Gato e vaca', 45, 'Arredonde e afunde as costas, bem devagar.'], ['Ponte', 40, 'Deitado(a), suba o quadril e desça devagar.']] },
  pos: { title: 'Depois do treino', minutes: 6, moves: [['Quadríceps · direito', 30, 'Segure o pé direito atrás, joelhos juntos.'], ['Quadríceps · esquerdo', 30, 'Agora o esquerdo.'], ['Posterior da coxa', 45, 'Perna estendida, incline o tronco à frente.'], ['Panturrilha · direita', 30, 'Mãos na parede, perna direita atrás esticada.'], ['Panturrilha · esquerda', 30, 'Agora a esquerda.'], ['Peitoral', 40, 'Mão na parede, gire o corpo para o lado oposto.'], ['Respirar', 30, 'Respire fundo e solte os ombros.']] },
};

/** Exercício: [nome, séries, repetições, carga inicial em kg (0 = sem carga)] */
export interface Workout { title: string; sub: string; rest: number; ex: [string, number, number, number][] }
export const WORKOUTS: Record<string, Workout> = {
  A: { title: 'Treino A', sub: 'Peito e tríceps', rest: 60, ex: [['Supino reto', 3, 10, 20], ['Supino inclinado com halteres', 3, 10, 12], ['Crucifixo', 3, 12, 8], ['Tríceps na corda', 3, 12, 15], ['Tríceps francês', 3, 10, 10]] },
  B: { title: 'Treino B', sub: 'Costas e bíceps', rest: 60, ex: [['Puxada frente', 3, 10, 35], ['Remada baixa', 3, 10, 30], ['Remada unilateral', 3, 10, 14], ['Rosca direta', 3, 10, 10], ['Rosca martelo', 3, 12, 8]] },
  C: { title: 'Treino C', sub: 'Pernas', rest: 60, ex: [['Agachamento', 3, 10, 30], ['Leg press', 3, 12, 80], ['Cadeira extensora', 3, 12, 25], ['Mesa flexora', 3, 12, 20], ['Panturrilha em pé', 3, 15, 30]] },
  casa: { title: 'Circuito em casa', sub: 'Sem equipamento · 20 min', rest: 45, ex: [['Agachamento livre', 3, 15, 0], ['Flexão (pode ser com joelho no chão)', 3, 10, 0], ['Ponte de glúteo', 3, 15, 0], ['Prancha (segundos)', 3, 30, 0], ['Afundo alternado', 3, 10, 0]] },
};

export const MED_DURATIONS = [3, 5, 10, 15, 20];

/** Práticas que combinam com o perfil (aparecem com "indicada para você"). */
export function recommended(p: Profile) {
  const has = (list: 'day' | 'limits' | 'likes', k: string) => p[list].includes(k);
  return {
    guided: has('limits', 'sono') ? 'dormir' : has('limits', 'ansiedade') ? 'consciente' : '',
    breath: has('limits', 'ansiedade') || has('limits', 'sono') ? '478' : p.areas.includes('mente') ? 'caixa' : '',
    stretch: has('day', 'sentado') ? 'ombros' : has('limits', 'costas') ? 'lombar' : p.areas.includes('corpo') ? 'acordar' : '',
    workout: has('limits', 'semacademia') || has('likes', 'casa') ? 'casa' : p.areas.includes('corpo') ? 'A' : '',
  };
}

/** O hábito está ligado a esta prática? ("treino" pega qualquer ficha; "alongamento:lombar" só a lombar.) */
export function linkMatches(link: string, type: string, sub: string): boolean {
  if (!link) return false;
  const [t, s] = link.split(':');
  return t === type && (!s || !sub || s === sub);
}

/** Hábitos que serão marcados ao concluir a prática hoje (ainda não marcados). */
export function linkedToMark(habits: Habit[], type: string, sub: string, day: string): Habit[] {
  return habits.filter((h) => h.kind !== 'abandonar' && !isQuantity(h) && !h.checks.includes(day) && !isPaused(h, day) && !isArchived(h, day) && linkMatches(h.link, type, sub));
}

/** Marca os hábitos ligados (sem desmarcar nada). */
export function markLinked(type: string, sub: string, day: string = todayISO()) {
  return (d: AppData): AppData => {
    const ids = new Set(linkedToMark(d.habits, type, sub, day).map((h) => h.id));
    if (!ids.size) return d;
    return { ...d, habits: d.habits.map((h) => (ids.has(h.id) ? { ...h, checks: [...h.checks, day].sort() } : h)) };
  };
}

export interface NewSession {
  /** Opcional: para registrar depois "como você está". */
  id?: string;
  type: PracticeType;
  sub: string;
  title: string;
  minutes: number;
  km?: number | null;
  sets?: number | null;
  volume?: number | null;
  /** Treino: cargas usadas nos exercícios feitos. */
  loads?: Record<string, number>;
}

/** Guarda a sessão concluída e marca os hábitos ligados. */
export function recordSession(s: NewSession, day: string = todayISO()) {
  return (d: AppData): AppData => {
    const session: PracticeSession = {
      id: s.id ?? uid(), date: day, type: s.type, sub: s.sub, title: s.title, minutes: Math.max(1, Math.round(s.minutes)),
      km: s.km ?? null, sets: s.sets ?? null, volume: s.volume ?? null, feel: null, createdAt: new Date().toISOString(),
    };
    const next: AppData = { ...d, sessions: [...d.sessions, session].slice(-2000), lastLoads: s.loads ? { ...d.lastLoads, ...s.loads } : d.lastLoads };
    return markLinked(s.type, s.sub, day)(next);
  };
}

/** "Como você está agora?" depois da sessão. */
export function setFeel(id: string, feel: PracticeSession['feel']) {
  return (d: AppData): AppData => ({ ...d, sessions: d.sessions.map((x) => (x.id === id ? { ...x, feel } : x)) });
}

/** Números da semana (segunda a domingo) para o Início e a Revisão. */
export function weekPractice(sessions: PracticeSession[], today: string = todayISO(), start: string = weekStart(today)) {
  const end = addDays(start, 6);
  const week = sessions.filter((x) => x.date >= start && x.date <= end);
  return {
    mindMinutes: week.filter((x) => x.type === 'meditacao' || x.type === 'respiracao').reduce((a, x) => a + x.minutes, 0),
    workouts: week.filter((x) => x.type === 'treino').length,
    moves: week.filter((x) => x.type === 'alongamento' || x.type === 'caminhada').length,
    total: week.length,
  };
}

/** Ligações que o formulário de hábito oferece. */
export const LINK_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Nenhuma' },
  { value: 'meditacao', label: 'Meditação' },
  { value: 'respiracao', label: 'Respiração' },
  { value: 'gratidao', label: 'Três coisas boas' },
  { value: 'alongamento', label: 'Alongamento' },
  { value: 'treino', label: 'Treino' },
  { value: 'caminhada', label: 'Caminhada ou corrida' },
];
export const linkLabel = (link: string) => LINK_OPTIONS.find((o) => o.value === link.split(':')[0])?.label ?? '';
