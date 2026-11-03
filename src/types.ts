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

export interface Habit {
  id: string;
  name: string;
  color: string;
  /** Dias (AAAA-MM-DD) cumpridos. */
  checks: string[];
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

export type PaymentMethod = 'pix' | 'debito' | 'dinheiro' | 'boleto' | 'cartao';

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

export interface Settings {
  theme: Theme;
  seededCategories: boolean;
  lastBackupAt: string | null;
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
  categories: Category[];
  settings: Settings;
  /** Itens excluídos (id → data), para uma futura sincronização entre aparelhos. */
  deleted: Record<string, string>;
  /** Dados da versão anterior que ainda não têm tela (ex.: receitas). */
  legacy: Record<string, unknown>;
}

export type Collection = 'tasks' | 'events' | 'habits' | 'notes' | 'journal' | 'categories' | 'cards';
