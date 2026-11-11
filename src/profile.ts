/**
 * Você: o perfil da pessoa e o motor de sugestões.
 * Regras fixas, sem internet e sem IA. Toda sugestão diz o porquê, citando o que a pessoa contou.
 */
import type { AppData, CalendarEvent, DayPeriod, Goal, Habit, MoneyChallenge, Onboarding, Profile } from './types.ts';
import { addDays, fromISO, todayISO, uid } from './utils.ts';
import { suggestAttributes } from './habits.ts';
import { BOX_COLORS, newBox } from './boxes.ts';

type Opt = [value: string, label: string];

export const AREAS: Opt[] = [['corpo', 'Corpo e saúde'], ['rotina', 'Rotina e organização'], ['mente', 'Mente e estudo'], ['dinheiro', 'Dinheiro'], ['largar', 'Largar hábitos'], ['bemestar', 'Bem-estar e calma']];
export const DAY: Opt[] = [['sentado', 'Trabalho sentado'], ['empe', 'Trabalho em pé'], ['estudo', 'Estudo'], ['cuido', 'Cuido de alguém'], ['noite', 'Trabalho à noite']];
export const FREE: [number, string][] = [[10, '10 min'], [20, '20 min'], [30, '30 min'], [60, '1 hora']];
export const LIKES: Opt[] = [['fora', 'Ao ar livre'], ['casa', 'Em casa'], ['sozinho', 'Sozinho(a)'], ['grupo', 'Em grupo']];
export const QUITS: Opt[] = [['redes', 'Redes sociais à noite'], ['doce', 'Doce'], ['cigarro', 'Cigarro'], ['refri', 'Refrigerante'], ['procrastinar', 'Procrastinar'], ['unha', 'Roer unha']];
export const LIMITS: Opt[] = [['joelho', 'Dor no joelho'], ['costas', 'Dor nas costas'], ['tempo', 'Pouco tempo'], ['ansiedade', 'Ansiedade'], ['sono', 'Sono ruim'], ['semacademia', 'Sem academia perto'], ['orcamento', 'Orçamento apertado']];
export const MONEY: [MoneyChallenge, string][] = [['atraso', 'Contas atrasando'], ['gasto', 'Gasto mais do que devia'], ['naosei', 'Não sei quanto entra e sai'], ['ok', 'Está sob controle']];
export const SAVE: Opt[] = [['viagem', 'Viagem'], ['reserva', 'Reserva de emergência'], ['casa', 'Casa'], ['carro', 'Carro'], ['estudo', 'Estudo'], ['nada', 'Nada agora']];
export const EX_SHORT = ['Correr 5 km', 'Ler 1 livro por mês', 'Dormir antes das 23h', 'Organizar a casa'];
export const EX_LONG = ['Juntar R$ 10 mil', 'Viajar para fora', 'Trocar de emprego', 'Aprender inglês'];

/** Quantas perguntas a entrevista tem (as telas ficam em Voce.tsx). */
export const INTERVIEW_STEPS = 7;
/** "Agora não" no cartão do Início esconde por estes dias; depois de 2 vezes, só pela página Você. */
export const ASK_SNOOZE_DAYS = 7;

export const labelOf = (list: Opt[] | [string, string][], v: string) => list.find((x) => x[0] === v)?.[1] ?? v;

export function emptyProfile(state: Onboarding['state'] = 'novo'): Profile {
  return {
    name: '', wake: '07:00', sleep: '23:00', day: [], free: 20, likes: [], areas: [], shortGoals: [], longGoals: [],
    quits: [], noQuit: false, limits: [], noLimit: false, notes: '',
    money: { challenge: '', saveFor: '', amount: null },
    onboarding: { state, step: 0, askHiddenUntil: null, askDismissals: 0 },
    dismissed: [], accepted: [], updatedAt: '',
  };
}

type Rec = Record<string, unknown>;
const isRec = (x: unknown): x is Rec => typeof x === 'object' && x !== null && !Array.isArray(x);
const strs = (x: unknown) => (Array.isArray(x) ? x.filter((i): i is string => typeof i === 'string') : []);
const str = (x: unknown, def = '') => (typeof x === 'string' ? x : def);
const hhmm = (x: unknown, def: string) => (typeof x === 'string' && /^\d{2}:\d{2}$/.test(x) ? x : def);
const goals = (x: unknown): Goal[] =>
  Array.isArray(x)
    ? x.filter((g): g is Rec => isRec(g) && typeof g.text === 'string').map((g) => ({ id: str(g.id) || uid(), text: g.text as string, when: str(g.when), doneAt: typeof g.doneAt === 'string' ? g.doneAt : null }))
    : [];

/**
 * Lê o perfil salvo. Sem perfil: quem já tinha dados (atualização ou backup antigo) entra como "pulou",
 * para não ver a entrevista de surpresa; quem está começando agora, como "novo".
 */
export function normalizeProfile(raw: unknown, existingUser: boolean): Profile {
  if (!isRec(raw)) return emptyProfile(existingUser ? 'pulou' : 'novo');
  const base = emptyProfile();
  const m = isRec(raw.money) ? raw.money : {};
  const o = isRec(raw.onboarding) ? raw.onboarding : {};
  const challenge = MONEY.some((x) => x[0] === m.challenge) ? (m.challenge as MoneyChallenge) : '';
  return {
    name: str(raw.name).slice(0, 30),
    wake: hhmm(raw.wake, base.wake),
    sleep: hhmm(raw.sleep, base.sleep),
    day: strs(raw.day),
    free: typeof raw.free === 'number' && raw.free > 0 ? raw.free : base.free,
    likes: strs(raw.likes),
    areas: strs(raw.areas),
    shortGoals: goals(raw.shortGoals),
    longGoals: goals(raw.longGoals),
    quits: strs(raw.quits),
    noQuit: raw.noQuit === true,
    limits: strs(raw.limits),
    noLimit: raw.noLimit === true,
    notes: str(raw.notes),
    money: { challenge, saveFor: str(m.saveFor), amount: typeof m.amount === 'number' && m.amount > 0 ? m.amount : null },
    onboarding: {
      state: o.state === 'pulou' || o.state === 'feito' ? o.state : o.state === 'novo' ? 'novo' : existingUser ? 'pulou' : 'novo',
      step: typeof o.step === 'number' ? Math.max(0, Math.min(INTERVIEW_STEPS - 1, o.step)) : 0,
      askHiddenUntil: typeof o.askHiddenUntil === 'string' ? o.askHiddenUntil : null,
      askDismissals: typeof o.askDismissals === 'number' ? o.askDismissals : 0,
    },
    dismissed: strs(raw.dismissed),
    accepted: strs(raw.accepted),
    updatedAt: str(raw.updatedAt),
  };
}

/** Quanto do perfil está preenchido (0–100). Nada é obrigatório. */
export function completeness(p: Profile): number {
  const parts = [
    p.name.trim(), p.day.length, p.areas.length, p.shortGoals.length, p.longGoals.length,
    p.money.challenge || p.money.saveFor, p.quits.length || p.noQuit, p.limits.length || p.noLimit, p.likes.length,
  ];
  return Math.round((parts.filter(Boolean).length / parts.length) * 100);
}

/** O cartão "Conte um pouco sobre você" aparece no Início? */
export function showAsk(p: Profile, today: string = todayISO()): boolean {
  const o = p.onboarding;
  if (o.state === 'feito' || o.state === 'novo') return false;
  if (completeness(p) >= 60) return false;
  if (o.askDismissals >= 2) return false;
  return !o.askHiddenUntil || o.askHiddenUntil <= today;
}

/** "R$ 3.000" → 3000 · "Juntar R$ 10 mil" → 10000 · "2,5 mil" → 2500 · sem número → 0. */
export function parseMoneyText(t: string): number {
  const m = String(t).match(/(\d[\d.]*(?:,\d+)?)\s*(mil)?/i);
  if (!m) return 0;
  const n = parseFloat(m[1].replace(/\./g, '').replace(',', '.')) || 0;
  return m[2] ? n * 1000 : n;
}

// ---------- Sugestões ----------

export type SuggestionKind = 'Hábito' | 'Prática' | 'Ritual' | 'Troca' | 'Abandonar' | 'Agenda' | 'Caixinha' | 'Dica';

export interface HabitSpec {
  name: string;
  kind: 'ritual' | 'construir';
  days: number[];
  period: DayPeriod;
  time: string;
  link: string;
  goal?: { amount: number; unit: string; step: number };
}

export interface Suggestion {
  id: string;
  kind: SuggestionKind;
  area: string;
  icon: string;
  title: string;
  /** Texto com **destaques** (o que a pessoa contou). */
  why: string;
  act:
    | { type: 'habit'; habit: HabitSpec }
    | { type: 'events'; events: { title: string; date: string; time: string }[] }
    | { type: 'box'; box: { name: string; target: number | null; planAmount: number } }
    | { type: 'none' };
}

const ALL = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS_ONLY = [1, 2, 3, 4, 5];
const MWF = [1, 3, 5];

/** "23:00" menos 30 min → "22:30". */
export function shiftTime(t: string, minutes: number): string {
  const [h, m] = t.split(':').map(Number);
  const x = (((h * 60 + m + minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`;
}

const periodOf = (t: string): DayPeriod => {
  const h = Number(t.slice(0, 2));
  return h < 12 ? 'manha' : h < 18 ? 'tarde' : 'noite';
};

const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Próximas datas (a partir de amanhã) que caem nestes dias da semana. */
function nextDates(today: string, weekdays: number[], n: number): string[] {
  const out: string[] = [];
  for (let d = addDays(today, 1); out.length < n; d = addDays(d, 1)) if (weekdays.includes(fromISO(d).getDay())) out.push(d);
  return out;
}

function nextFirstOfMonth(today: string): string {
  const d = fromISO(today);
  return d.getDate() === 1 ? today : `${d.getMonth() === 11 ? d.getFullYear() + 1 : d.getFullYear()}-${String(((d.getMonth() + 1) % 12) + 1).padStart(2, '0')}-01`;
}

/**
 * Lê o perfil (e o que já existe no app) e devolve as sugestões, da área mais importante para a menos.
 * Some o que foi dispensado ou aceito, e o que já existe com o mesmo nome ou a mesma prática ligada.
 */
export function suggestions(d: Pick<AppData, 'profile' | 'habits' | 'boxes'>, today: string = todayISO()): Suggestion[] {
  const p = d.profile;
  const out: Suggestion[] = [];
  const add = (s: Suggestion) => out.push(s);
  const has = (list: 'day' | 'limits' | 'quits' | 'likes', k: string) => p[list].includes(k);
  const area = (a: string) => p.areas.includes(a);
  const short = p.free <= 10 || has('limits', 'tempo');
  const habit = (name: string, days: number[], time: string, extra: Partial<HabitSpec> = {}): Suggestion['act'] => ({
    type: 'habit',
    habit: { name, kind: 'construir', days, time, period: time ? periodOf(time) : 'livre', link: '', ...extra },
  });
  const goalsText = plain([...p.shortGoals, ...p.longGoals].map((g) => g.text).join(' | '));

  // Corpo e cuidados
  if (has('day', 'sentado')) add({ id: 's-ombros', kind: 'Prática', area: 'corpo', icon: 'dumbbell', title: 'Alongar pescoço e ombros às 15h', why: 'Você contou que **trabalha sentado(a)**. 5 minutos à tarde aliviam o pescoço e as costas.', act: habit('Alongar pescoço e ombros', WEEKDAYS_ONLY, '15:00', { link: 'alongamento:ombros' }) });
  if (has('limits', 'costas')) add({ id: 's-lombar', kind: 'Prática', area: 'corpo', icon: 'dumbbell', title: 'Alongamento da lombar 3× por semana', why: 'Você marcou **dor nas costas**. A sequência "Lombar" tem 6 minutos e é leve.', act: habit('Alongamento da lombar', MWF, '', { link: 'alongamento:lombar' }) });
  if (has('limits', 'ansiedade')) add({ id: 's-478', kind: 'Prática', area: 'bemestar', icon: 'heart', title: `Respiração 4-7-8 às ${shiftTime(p.sleep, -20)}`, why: `Você marcou **ansiedade** e dorme por volta das ${p.sleep}. Dois minutos de respiração antes de deitar ajudam a desacelerar.`, act: habit('Respiração 4-7-8', ALL, shiftTime(p.sleep, -20), { link: 'respiracao:478' }) });
  if (has('limits', 'sono')) add({ id: 's-telas', kind: 'Ritual', area: 'bemestar', icon: 'phone', title: `Desligar as telas às ${shiftTime(p.sleep, -30)}`, why: 'Você marcou **sono ruim**. Meia hora sem tela antes de dormir é o ajuste mais simples.', act: habit('Desligar as telas', ALL, shiftTime(p.sleep, -30), { kind: 'ritual' }) });
  if (area('corpo')) {
    if (has('limits', 'joelho')) add({ id: 's-bike', kind: 'Hábito', area: 'corpo', icon: 'dumbbell', title: 'Bike ou natação 3× por semana', why: 'Você quer cuidar do **corpo** e tem **dor no joelho**. Bike e natação poupam a articulação.', act: habit('Bike ou natação', MWF, '', { link: 'caminhada' }) });
    else if (has('limits', 'semacademia') || has('likes', 'casa')) add({ id: 's-casa', kind: 'Hábito', area: 'corpo', icon: 'dumbbell', title: `Treino em casa 3× por semana (${short ? 10 : 20} min)`, why: `Você quer cuidar do **corpo** e ${has('limits', 'semacademia') ? 'não tem **academia perto**' : 'prefere **ficar em casa**'}. Não precisa de equipamento.`, act: habit('Treino em casa', MWF, '', { link: 'treino:casa' }) });
    else add({ id: 's-academia', kind: 'Hábito', area: 'corpo', icon: 'dumbbell', title: 'Academia 3× por semana (treinos A, B e C)', why: 'Você quer cuidar do **corpo**. As fichas A, B e C já estão no Núcleo, na aba Corpo.', act: habit('Academia', MWF, '', { link: 'treino' }) });
    if (/corr|5 ?km/.test(goalsText)) {
      const walk = has('limits', 'joelho');
      add({ id: 's-corrida', kind: 'Agenda', area: 'corpo', icon: 'calendar', title: walk ? 'Agendar 3 caminhadas rápidas' : 'Agendar 3 corridas leves', why: walk ? 'Sua meta é **correr**. Com o joelho, comece caminhando rápido e aumente aos poucos.' : 'Sua meta é **correr**. Alternar 2 min correndo e 1 min andando é um bom começo.', act: { type: 'events', events: nextDates(today, MWF, 3).map((date) => ({ title: walk ? 'Caminhada rápida (30 min)' : 'Corrida leve: 2 min correndo, 1 min andando', date, time: shiftTime(p.wake, 30) })) } });
    }
  }
  // Mente e bem-estar
  const hasMeditation = d.habits.some((h) => h.link.startsWith('meditacao') || plain(h.name).includes('medit'));
  if (area('bemestar') && !hasMeditation) add({ id: 's-meditar', kind: 'Prática', area: 'bemestar', icon: 'heart', title: `Meditar ${short ? 3 : 5} min ao acordar`, why: 'Você quer mais **calma**. Poucos minutos todo dia valem mais do que muito de vez em quando.', act: habit(`Meditar ${short ? 3 : 5} min`, ALL, p.wake, { kind: 'construir', link: 'meditacao' }) });
  if (area('bemestar')) add({ id: 's-gratidao', kind: 'Prática', area: 'bemestar', icon: 'journal', title: 'Três coisas boas do dia, à noite', why: 'Você quer mais **bem-estar**. Escrever 3 coisas boas leva 2 minutos e vai direto para o Diário.', act: habit('Três coisas boas', ALL, shiftTime(p.sleep, -60), { link: 'gratidao' }) });
  if (area('mente')) add({ id: 's-ler', kind: 'Hábito', area: 'mente', icon: 'book', title: 'Ler 10 min antes de dormir', why: 'Você quer cuidar da **mente**. Dez páginas por noite dão uns 12 livros por ano.', act: habit('Ler 10 min', ALL, shiftTime(p.sleep, -40)) });
  if (area('rotina')) add({ id: 's-planejar', kind: 'Ritual', area: 'rotina', icon: 'tasks', title: `Planejar o dia em 5 min às ${shiftTime(p.wake, 15)}`, why: 'Você quer mais **organização**. Escolher as 3 tarefas do dia logo cedo evita o "não sei por onde começar".', act: habit('Planejar o dia', WEEKDAYS_ONLY, shiftTime(p.wake, 15)) });
  // Dinheiro
  const tight = area('dinheiro') && has('limits', 'orcamento');
  if (tight || p.money.challenge === 'gasto') add({ id: 's-domingo', kind: 'Ritual', area: 'dinheiro', icon: 'wallet', title: 'Revisar os gastos todo domingo (10 min)', why: p.money.challenge === 'gasto' ? 'Você contou que **gasta mais do que devia**. Olhar os gastos uma vez por semana ajuda a frear antes do fim do mês.' : 'Você marcou **orçamento apertado**. Olhar os gastos uma vez por semana evita surpresas no fim do mês.', act: habit('Revisar os gastos da semana', [0], '18:00') });
  if (p.money.challenge === 'atraso') add({ id: 's-contas', kind: 'Agenda', area: 'dinheiro', icon: 'calendar', title: 'Conferir as contas do mês no dia 1º', why: 'Você contou que **contas atrasam**. Ver de uma vez o que vence no mês evita juros e multa. Cadastre as contas fixas em Finanças para o app avisar antes.', act: { type: 'events', events: [{ title: 'Conferir as contas que vencem no mês', date: nextFirstOfMonth(today), time: '09:00' }] } });
  if (p.money.challenge === 'naosei') add({ id: 's-anotar', kind: 'Hábito', area: 'dinheiro', icon: 'coins', title: 'Anotar os gastos do dia, por 2 semanas', why: 'Você contou que **não sabe quanto entra e sai**. Duas semanas anotando em Finanças já mostram para onde o dinheiro vai.', act: habit('Anotar os gastos do dia', ALL, shiftTime(p.sleep, -90)) });
  // Caixinhas: metas de dinheiro e "quero juntar para…"
  const boxNames = new Set(d.boxes.map((b) => plain(b.name)));
  const moneyGoal = area('dinheiro') ? [...p.shortGoals, ...p.longGoals].find((g) => /r\$|juntar|guardar|poupar|viag/i.test(g.text)) : undefined;
  if (moneyGoal && !boxNames.has(plain(moneyGoal.text))) {
    const target = parseMoneyText(moneyGoal.text) || null;
    add({ id: `s-caixa-${moneyGoal.id}`, kind: 'Caixinha', area: 'dinheiro', icon: 'coins', title: `Criar a caixinha "${moneyGoal.text}"`, why: `É uma das suas **metas**. Com uma caixinha e um plano de R$ 100 por semana, dá para ver quanto falta${target ? ` (uns ${Math.max(1, Math.round(target / 100 / 4.33))} meses)` : ''}.`, act: { type: 'box', box: { name: moneyGoal.text, target, planAmount: 100 } } });
  }
  const save = p.money.saveFor;
  if (save && save !== 'nada') {
    const name = labelOf(SAVE, save);
    const target = p.money.amount;
    if (!boxNames.has(plain(name))) add({ id: 's-caixa-juntar', kind: 'Caixinha', area: 'dinheiro', icon: 'coins', title: `Criar a caixinha "${name}"`, why: `Você quer juntar dinheiro para **${name.toLowerCase()}**. ${target ? `Guardando R$ 100 por semana, você chega a R$ ${target.toLocaleString('pt-BR')} em uns ${Math.max(1, Math.ceil(target / 100 / 4.33))} meses.` : 'Com um plano semanal, dá para ver quanto falta. A meta você define quando quiser.'}`, act: { type: 'box', box: { name, target, planAmount: 100 } } });
  }
  // Largar hábitos: trocas
  const QUIT: Record<string, Suggestion[]> = {
    redes: [
      { id: 's-redes1', kind: 'Abandonar', area: 'largar', icon: 'phone', title: `Celular fora do quarto às ${shiftTime(p.sleep, -30)}`, why: 'Você quer largar **redes sociais à noite**. Se o celular não está perto, a vontade passa mais fácil.', act: habit('Celular fora do quarto', ALL, shiftTime(p.sleep, -30)) },
      { id: 's-redes2', kind: 'Troca', area: 'largar', icon: 'book', title: 'Trocar o scroll da noite por 10 min de leitura', why: 'Largar fica mais fácil quando algo **ocupa o lugar** do hábito antigo.', act: habit('Ler 10 min', ALL, shiftTime(p.sleep, -40)) },
    ],
    doce: [{ id: 's-doce', kind: 'Troca', area: 'largar', icon: 'utensils', title: 'Fruta depois do almoço, no lugar do doce', why: 'Você quer largar o **doce**. A vontade costuma vir depois das refeições.', act: habit('Fruta depois do almoço', ALL, '13:00') }],
    cigarro: [{ id: 's-cigarro', kind: 'Prática', area: 'largar', icon: 'heart', title: 'Respirar 2 minutos quando der vontade', why: 'Você quer largar o **cigarro**. A vontade passa em poucos minutos, e a respiração ajuda a atravessar.', act: habit('Respirar quando der vontade', ALL, '', { link: 'respiracao' }) }],
    refri: [{ id: 's-refri', kind: 'Troca', area: 'largar', icon: 'heart', title: 'Garrafa de água sempre por perto', why: 'Você quer largar o **refrigerante**. Com água à mão, a troca fica automática.', act: habit('Beber água', ALL, '', { goal: { amount: 2000, unit: 'ml', step: 250 } }) }],
    procrastinar: [{ id: 's-procrastinar', kind: 'Ritual', area: 'largar', icon: 'tasks', title: 'Primeira tarefa do dia antes de abrir o celular', why: 'Você quer largar a **procrastinação**. Começar pela tarefa mais curta destrava o resto.', act: habit('Primeira tarefa antes do celular', WEEKDAYS_ONLY, p.wake) }],
    unha: [{ id: 's-unha', kind: 'Troca', area: 'largar', icon: 'smile', title: 'Mãos ocupadas nas horas de tensão', why: 'Você quer parar de **roer unha**. Uma bolinha ou um elástico no pulso ajudam.', act: habit('Bolinha antiestresse por perto', ALL, '') }],
  };
  for (const q of p.quits) for (const s of QUIT[q] ?? []) add(s);
  if (short) add({ id: 's-tempo', kind: 'Dica', area: 'rotina', icon: 'info', title: 'Comece por um hábito só', why: 'Você tem **pouco tempo**. Um hábito firme vale mais do que cinco pela metade. As sugestões já estão mais curtas.', act: { type: 'none' } });
  if (has('day', 'cuido')) add({ id: 's-cuido', kind: 'Hábito', area: 'bemestar', icon: 'heart', title: 'Guardar 15 min só seus por dia', why: 'Você **cuida de alguém**. Quem cuida também precisa de um tempo que seja só seu.', act: habit('15 min só para mim', ALL, '') });

  const order = [...p.areas, 'corpo', 'bemestar', 'mente', 'rotina', 'dinheiro', 'largar'];
  const names = new Set(d.habits.map((h) => plain(h.name)));
  const links = new Set(d.habits.map((h) => h.link).filter(Boolean));
  const seen = new Set<string>();
  return out
    .filter((s) => {
      if (p.dismissed.includes(s.id) || p.accepted.includes(s.id)) return false;
      if (s.act.type === 'habit') {
        const key = plain(s.act.habit.name);
        if (names.has(key) || seen.has(key) || (s.act.habit.link && links.has(s.act.habit.link))) return false;
        seen.add(key);
      }
      return true;
    })
    .sort((a, b) => order.indexOf(a.area) - order.indexOf(b.area));
}

/** Monta o hábito completo a partir da sugestão. */
export function habitFromSpec(s: HabitSpec, color: string, today: string = todayISO()): Habit {
  return {
    id: uid(), name: s.name, color, kind: s.kind, checks: [], days: s.days, period: s.period, time: s.time, cue: '', target: 66, slips: [],
    startDate: today, goal: s.goal?.amount ?? null, unit: s.goal?.unit ?? '', step: s.goal?.step ?? 1, amounts: {},
    attrs: suggestAttributes(s.name), link: s.link, createdAt: new Date().toISOString(), pauses: [], archivedAt: null,
  };
}

const SUG_COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#f97316', '#ec4899', '#06b6d4', '#eab308'];

/** Aceitar: cria o hábito ou os compromissos, e a sugestão não volta. */
export function acceptSuggestion(s: Suggestion, today: string = todayISO()) {
  return (d: AppData): AppData => {
    let next: AppData = { ...d, profile: { ...d.profile, accepted: [...d.profile.accepted, s.id] } };
    if (s.act.type === 'habit') next = { ...next, habits: [...next.habits, habitFromSpec(s.act.habit, SUG_COLORS[d.habits.length % SUG_COLORS.length], today)] };
    if (s.act.type === 'box') {
      const b = s.act.box;
      next = { ...next, boxes: [...next.boxes, newBox({ name: b.name, target: b.target, color: BOX_COLORS[d.boxes.length % BOX_COLORS.length], plan: { amount: b.planAmount, every: 'semana', startDate: today } })] };
    }
    if (s.act.type === 'events') {
      const evs: CalendarEvent[] = s.act.events.map((e) => ({ id: uid(), title: e.title, date: e.date, time: e.time, location: '', description: 'Sugerido em Você.' }));
      next = { ...next, events: [...next.events, ...evs] };
    }
    return next;
  };
}

export function dismissSuggestion(id: string) {
  return (d: AppData): AppData => ({ ...d, profile: { ...d.profile, dismissed: [...d.profile.dismissed, id] } });
}

/** Altera o perfil (e guarda quando foi). */
export function setProfile(fn: (p: Profile) => Profile) {
  return (d: AppData): AppData => ({ ...d, profile: { ...fn(d.profile), updatedAt: new Date().toISOString() } });
}

/** "Agora não" no cartão do Início. */
export function snoozeAsk(today: string = todayISO()) {
  return setProfile((p) => ({ ...p, onboarding: { ...p.onboarding, askHiddenUntil: addDays(today, ASK_SNOOZE_DAYS), askDismissals: p.onboarding.askDismissals + 1 } }));
}
