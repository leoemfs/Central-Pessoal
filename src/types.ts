// ---------- Organização ----------

export type Priority = 'baixa' | 'media' | 'alta';

export interface Task {
  id: string;
  title: string;
  notes: string;
  /** AAAA-MM-DD, ou null sem prazo. */
  due: string | null;
  priority: Priority;
  tag: string;
  done: boolean;
  createdAt: string;
  doneAt: string | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  /** HH:MM ou vazio para "dia todo". */
  time: string;
  location: string;
  description: string;
}

/** ritual = rotina já incorporada · construir = hábito novo · abandonar = hábito a deixar. */
export type HabitKind = 'ritual' | 'construir' | 'abandonar';
export type DayPeriod = 'manha' | 'tarde' | 'noite' | 'livre';

export interface Habit {
  id: string;
  name: string;
  color: string;
  kind: HabitKind;
  /** Dias (AAAA-MM-DD) cumpridos (ritual/construir). */
  checks: string[];
  /** Dias da semana programados: 0 = domingo … 6 = sábado. */
  days: number[];
  period: DayPeriod;
  /** Horário fixo (HH:MM), opcional — ex.: dormir às 23:00. */
  time: string;
  /** Gatilho: "Depois de …" (empilhamento de hábitos). */
  cue: string;
  /** Construir: dias cumpridos para considerar que virou ritual. */
  target: number;
  /** Abandonar: dias em que houve recaída. */
  slips: string[];
  /** Abandonar: desde quando está sem (AAAA-MM-DD). */
  startDate: string;
  /** Meta diária com quantidade (ex.: 2000 ml). null = só marcar feito. */
  goal: number | null;
  /** Unidade da meta (ml, páginas, minutos…). */
  unit: string;
  /** Quanto soma cada toque no "+". */
  step: number;
  /** Quantidade registrada por dia (AAAA-MM-DD → valor). */
  amounts: Record<string, number>;
  /** Atributos que este hábito treina (FOR, AGI, INT, RES, SAB, DIS) — usados pela Jornada. */
  attrs: string[];
  /**
   * Prática do Núcleo ligada a este hábito (ex.: "meditacao", "alongamento:lombar", "treino").
   * Ao concluir a prática, o hábito é marcado sozinho. Vazio = sem ligação.
   */
  link: string;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  /** Data e hora do registro (ISO). Preenchida automaticamente. */
  createdAt: string;
  title: string;
  summary: string;
  content: string;
  /** Etiqueta opcional (ex.: "Pessoal"). */
  tag: string;
  updatedAt: string;
}

// ---------- Finanças ----------

export type PaymentMethod = 'pix' | 'debito' | 'dinheiro' | 'boleto' | 'cartao' | 'vale';

/** avulsa = uma vez · fixa = todo mês, sem fim · parcelada = N vezes. */
export type ExpenseKind = 'avulsa' | 'fixa' | 'parcelada';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface CreditCard {
  id: string;
  name: string;
  closingDay: number;
  dueDay: number;
  limit: number | null;
  color: string;
  /** Faturas pagas: mês da fatura (AAAA-MM) → data do pagamento. */
  paidInvoices: Record<string, string>;
  createdAt: string;
}

/** Cartão de benefício (VR, VA): tem saldo e recarga, sem fatura. */
export interface VoucherCard {
  id: string;
  name: string;
  color: string;
  /** Recarga mensal: valor e dia em que cai. null = sem recarga automática. */
  recharge: { amount: number; day: number } | null;
  /** Saldo no dia do cadastro (ou do último ajuste). */
  startBalance: number;
  startDate: string;
  /** Meses (AAAA-MM) cuja recarga já foi lançada — para não lançar de novo se a receita for apagada. */
  recharged: string[];
  createdAt: string;
}

export interface Expense {
  id: string;
  kind: ExpenseKind;
  seriesId: string | null;
  /** Posição na série (1, 2, 3…). */
  installment: number | null;
  /** Total de parcelas (só parceladas). */
  installments: number | null;
  description: string;
  categoryId: string;
  amount: number;
  method: PaymentMethod;
  cardId: string | null;
  /** Vencimento. No cartão, é o vencimento da fatura. */
  dueDate: string;
  /** Data da compra (só cartão). */
  purchaseDate: string | null;
  /** Fatura (AAAA-MM) em que a compra entra (só cartão). */
  invoiceMonth: string | null;
  /** Data em que foi paga (fora do cartão). */
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Pago com vale (VR/VA): id do cartão de benefício. */
  voucherId?: string | null;
}

/** Modelo de uma conta fixa ou compra parcelada; as ocorrências são `Expense`. */
export interface ExpenseSeries {
  id: string;
  kind: 'fixa' | 'parcelada';
  description: string;
  categoryId: string;
  /** Valor previsto de cada ocorrência. */
  amount: number;
  method: PaymentMethod;
  cardId: string | null;
  /** 1º vencimento (ou 1ª data de compra, no cartão). */
  startDate: string;
  /** Parcelada: total. Fixa: null enquanto ativa; ao encerrar, quantas ocorrências existem. */
  count: number | null;
  /** Quantas ocorrências já foram geradas. */
  generated: number;
  createdAt: string;
}

export type Theme = 'dark' | 'light' | 'system';

// ---------- Receitas ----------

export interface Income {
  id: string;
  /** Receita recorrente (ex.: salário mensal): id da série. */
  seriesId: string | null;
  /** Posição na série (1, 2, 3…). */
  installment: number | null;
  description: string;
  /** Fonte (ex.: Salário, Freelance) — lista `incomeSources`. */
  sourceId: string;
  amount: number;
  /** Data prevista da entrada (AAAA-MM-DD). */
  date: string;
  /** Data em que o dinheiro entrou; null = ainda previsto. */
  receivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Recarga de vale (VR/VA): id do cartão de benefício. */
  voucherId?: string | null;
}

/** Modelo de uma receita mensal; as ocorrências são `Income`. */
export interface IncomeSeries {
  id: string;
  description: string;
  sourceId: string;
  /** Valor previsto de cada mês. */
  amount: number;
  startDate: string;
  /** null enquanto ativa; ao encerrar, quantas ocorrências existem. */
  count: number | null;
  generated: number;
  createdAt: string;
}

export interface Settings {
  theme: Theme;
  /** Cor de destaque escolhida (id de ACCENTS em theme.ts); null = padrão do tema (escuro verde, claro azul). */
  accent: string | null;
  /** Os 3 módulos favoritos da barra de baixo no Início (ids de FAVORITABLE em moduleBar.ts). */
  favorites: [string, string, string];
  /** Ordem e cartões ocultos de cada tela (lápis ao lado da lupa). */
  cards: Record<string, { order: string[]; hidden: string[] }>;
  /** Barra de baixo dentro do módulo: 'fixo' = o favorito fica no lugar dele; 'lado' = o módulo vai para o lado do Início; 'centro' = o módulo vai para o centro. */
  barLayout: 'fixo' | 'lado' | 'centro';
  /** Tocar de novo no módulo aberto mostra os favoritos. */
  tapToFavorites: boolean;
  /** As barras de cima e de baixo somem ao rolar a tela para baixo. */
  hideOnScroll: boolean;
  seededCategories: boolean;
  seededIncomeSources: boolean;
  lastBackupAt: string | null;
  /** Dias (AAAA-MM-DD) em que houve algum registro no app. */
  activeDays: string[];
  /** Dias (AAAA-MM-DD) em que o app foi aberto, mesmo sem registrar nada (sequência de visitas da Jornada). */
  visitDays: string[];
  /** Data em que a Jornada foi desbloqueada. */
  journeyUnlockedAt: string | null;
  /** Resposta depois de desbloquear: quer a Jornada ou não por agora. */
  journeyChoice: 'quero' | 'depois' | null;
}

// ---------- Humor do dia ----------

export interface MoodEntry {
  /** 1 = mal … 5 = ótimo */
  v: 1 | 2 | 3 | 4 | 5;
  /** O que pesou ou ajudou (Trabalho, Sono, Exercício…). */
  tags: string[];
  note: string;
  /** Registro do Diário criado pela anotação do humor. */
  journalId: string | null;
}

// ---------- Listas e Preços ----------

/** Como as listas de uma categoria funcionam. */
export type ListKind = 'mercado' | 'compras' | 'receita' | 'checklist';

/** Uma compra concluída a partir de uma lista. */
export interface Purchase {
  id: string;
  /** AAAA-MM-DD */
  date: string;
  listId: string;
  listName: string;
  /** Loja ou mercado (vazio quando não informado). */
  store: string;
  total: number;
  /** Quantos itens foram comprados. */
  items: number;
}

export interface ListCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  kind: ListKind;
}

export interface ListItem {
  id: string;
  text: string;
  /** Quantidade (mercado e receita). */
  qty: number | null;
  unit: string;
  /** Corredor do mercado (Hortifrúti, Limpeza…). */
  aisle: string;
  /** Produto de Preços (mercado). */
  productId: string | null;
  /** Valor previsto do item (listas de compras). */
  price: number | null;
  store: string;
  done: boolean;
  /** Já virou despesa em Finanças. */
  launched: boolean;
}

export interface UserList {
  id: string;
  name: string;
  categoryId: string;
  pinned: boolean;
  items: ListItem[];
  /** Receita: porções atuais e da receita original, tempo, etiquetas e passos. */
  serves: number;
  baseServes: number;
  minutes: number | null;
  tags: string[];
  steps: string[];
  createdAt: string;
}

/** Produto genérico (Arroz branco). A comparação é por unidade: R$/kg, R$/L ou R$/un. */
export interface Product {
  id: string;
  name: string;
  aisle: string;
  unit: 'kg' | 'L' | 'un';
}

/** Marca + tamanho (Camil 5 kg). */
export interface ProductVariant {
  id: string;
  productId: string;
  brand: string;
  size: number;
  sizeUnit: 'g' | 'kg' | 'ml' | 'L' | 'un';
}

export interface Store {
  id: string;
  name: string;
}

export interface PriceEntry {
  id: string;
  variantId: string;
  storeId: string;
  price: number;
  date: string;
  promo: boolean;
}

// ---------- Caixinhas (dinheiro guardado) ----------

export interface BoxMove {
  id: string;
  /** AAAA-MM-DD */
  date: string;
  amount: number;
  /** plano = guardou na data combinada · extra = fora do plano · retirada = tirou. */
  kind: 'plano' | 'extra' | 'retirada';
  /** Só nas retiradas. */
  reason: 'realizei' | 'emergencia' | 'outro' | null;
  note: string;
}

/** Meta de dinheiro guardado. O app não move dinheiro: só registra o que a pessoa guardou no banco. */
export interface SavingsBox {
  id: string;
  name: string;
  color: string;
  /** Meta em R$ (null = sem meta). */
  target: number | null;
  deadline: string | null;
  plan: { amount: number; every: 'semana' | 'mes'; startDate: string } | null;
  moves: BoxMove[];
  /** Marcos já comemorados (25, 50, 75, 100): cada um só uma vez. */
  marks: number[];
  realizedAt: string | null;
  createdAt: string;
}

// ---------- Você (perfil) ----------

export interface Goal {
  id: string;
  text: string;
  /** Prazo em texto livre (ex.: "até março"). */
  when: string;
  doneAt: string | null;
}

export type MoneyChallenge = '' | 'atraso' | 'gasto' | 'naosei' | 'ok';

/** Estado da entrevista da primeira abertura. */
export interface Onboarding {
  /** novo = ainda não viu · pulou = pulou ou parou no meio · feito = respondeu até o fim. */
  state: 'novo' | 'pulou' | 'feito';
  /** Pergunta em que parou (para continuar). */
  step: number;
  /** "Agora não" no cartão do Início: escondido até esta data (AAAA-MM-DD). */
  askHiddenUntil: string | null;
  askDismissals: number;
}

/** O que a pessoa conta sobre si. Base das sugestões (e da entrevista da Jornada). */
export interface Profile {
  name: string;
  /** HH:MM */
  wake: string;
  sleep: string;
  day: string[];
  /** Minutos livres por dia. */
  free: number;
  likes: string[];
  /** Áreas a melhorar, em ordem de prioridade. */
  areas: string[];
  shortGoals: Goal[];
  longGoals: Goal[];
  quits: string[];
  /** Respondeu "nenhum" (diferente de não ter respondido). */
  noQuit: boolean;
  limits: string[];
  noLimit: boolean;
  notes: string;
  money: { challenge: MoneyChallenge; saveFor: string; amount: number | null };
  onboarding: Onboarding;
  /** Sugestões dispensadas ("Agora não") e aceitas: não aparecem de novo. */
  dismissed: string[];
  accepted: string[];
  updatedAt: string;
}

// ---------- Práticas do Núcleo (Mente e Corpo) ----------

export type PracticeType = 'meditacao' | 'respiracao' | 'alongamento' | 'treino' | 'caminhada';

export interface PracticeSession {
  id: string;
  /** AAAA-MM-DD */
  date: string;
  type: PracticeType;
  /** Qual prática (ex.: "dormir", "478", "lombar", "A"). */
  sub: string;
  title: string;
  minutes: number;
  km: number | null;
  sets: number | null;
  /** Treino: carga × repetições somadas, em kg. */
  volume: number | null;
  feel: 'calmo' | 'igual' | 'agitado' | null;
  createdAt: string;
}

export interface AppData {
  version: 2;
  tasks: Task[];
  events: CalendarEvent[];
  habits: Habit[];
  notes: Note[];
  journal: JournalEntry[];
  expenses: Expense[];
  series: ExpenseSeries[];
  cards: CreditCard[];
  /** Vales (VR, VA). */
  vouchers: VoucherCard[];
  categories: Category[];
  incomes: Income[];
  incomeSeries: IncomeSeries[];
  incomeSources: Category[];
  settings: Settings;
  profile: Profile;
  boxes: SavingsBox[];
  /** Humor de cada dia (AAAA-MM-DD). */
  moods: Record<string, MoodEntry>;
  /** Orçamento por mês de cada categoria de despesa (id → R$). */
  budgets: Record<string, number>;
  listCategories: ListCategory[];
  lists: UserList[];
  products: Product[];
  variants: ProductVariant[];
  stores: Store[];
  prices: PriceEntry[];
  /** Compras concluídas pelas listas (Listas › Compras). */
  purchases: Purchase[];
  sessions: PracticeSession[];
  /** Última carga usada em cada exercício (nome → kg). */
  lastLoads: Record<string, number>;
  /** Itens excluídos (id → data), para uma futura sincronização entre aparelhos. */
  deleted: Record<string, string>;
  /** Dados da versão anterior que ainda não têm tela (ex.: receitas). */
  legacy: Record<string, unknown>;
}

export type Collection = 'tasks' | 'events' | 'habits' | 'notes' | 'journal' | 'categories' | 'cards' | 'incomeSources' | 'boxes' | 'lists' | 'listCategories' | 'stores' | 'vouchers';
