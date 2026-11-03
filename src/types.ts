export type Priority = 'baixa' | 'media' | 'alta';

export interface Task {
  id: string;
  title: string;
  notes: string;
  /** Data no formato AAAA-MM-DD, ou null se não tiver prazo. */
  due: string | null;
  priority: Priority;
  tag: string;
  done: boolean;
  createdAt: string;
  doneAt: string | null;
}

export type TxType = 'receita' | 'despesa';

export interface Transaction {
  id: string;
  type: TxType;
  /** Sempre positivo; o sinal vem de `type`. */
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface Habit {
  id: string;
  name: string;
  color: string;
  /** Dias (AAAA-MM-DD) em que o hábito foi cumprido. */
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

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  /** HH:MM ou vazio para "dia inteiro". */
  time: string;
  location: string;
  description: string;
}

export type Theme = 'system' | 'light' | 'dark';

export interface Settings {
  theme: Theme;
}

export interface AppData {
  version: 1;
  tasks: Task[];
  transactions: Transaction[];
  habits: Habit[];
  notes: Note[];
  events: CalendarEvent[];
  settings: Settings;
}

export type Collection = 'tasks' | 'transactions' | 'habits' | 'notes' | 'events';
