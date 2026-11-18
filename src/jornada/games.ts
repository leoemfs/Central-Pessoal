/**
 * Mini games da Jornada (N2.16; fichas e limite na N2.18a, decidido em 16/11).
 * Os jogos dão FICHAS, uma moeda só deles, que servem apenas para o bichinho virtual. O ouro dos
 * hábitos não muda (o ouro que os jogos deram antes continua na carteira). Só os primeiros 30 minutos
 * de jogo de cada dia dão fichas; depois dá para continuar jogando, sem fichas, até o dia seguinte.
 */
import type { JourneyState } from './rules.ts';

export type GameId = 'corrida' | 'respira' | 'memoria' | 'pescaria' | 'sudoku';
import { sudokuStreak } from './sudoku.ts';
/** Minutos de jogo por dia que dão fichas. */
export const DAILY_MINUTES = 30;

export const GAMES: { id: GameId; name: string; text: string; ready: boolean }[] = [
  { id: 'corrida', name: 'Corrida do pet', text: 'Seu pet corre sozinho; toque para pular troncos e pedras.', ready: true },
  { id: 'respira', name: 'Respira com o pet', text: 'Acompanhe o pet na respiração 4-7-8. Conta como prática de Mente.', ready: true },
  { id: 'memoria', name: 'Memória do Arsenal', text: 'Vire as cartas e ache os 8 pares de itens em 60 s.', ready: true },
  { id: 'pescaria', name: 'Pescaria', text: 'Toque quando o ponteiro estiver no verde para fisgar o peixe.', ready: true },
  { id: 'sudoku', name: 'Sudoku', text: 'Um desafio 6×6 por dia. Resolver dá +2 de Inteligência.', ready: true },
];

/** Segundos jogados no dia (todas as partidas, com ou sem fichas). */
export const playedToday = (state: JourneyState, today: string) => state.games.plays.filter((p) => p.day === today).reduce((a, p) => a + p.seconds, 0);

/** Minutos que ainda dão fichas hoje (0 a 30). */
export const minutesLeft = (state: JourneyState, today: string) => Math.max(0, Math.ceil((DAILY_MINUTES * 60 - playedToday(state, today)) / 60));

/**
 * Fichas da partida (1 a 5): Corrida pela distância; Respira, 2 ao completar; Memória pelos pontos
 * (10 por par + segundos que sobraram); Pescaria pelos pontos (comum 1, raro 3, dourado 6).
 */
export function fichasFor(game: GameId, score: number): number {
  if (score <= 0) return 0;
  if (game === 'respira') return 2;
  const per = game === 'memoria' ? 25 : game === 'pescaria' ? 5 : game === 'sudoku' ? 10 : 150;
  return Math.max(1, Math.min(5, 1 + Math.floor(score / per)));
}

/** Fichas na carteira: o que os jogos deram menos o que foi gasto no bichinho. */
export const fichas = (state: JourneyState) => Math.max(0, state.games.plays.reduce((a, p) => a + p.fichas, 0) - state.games.fichasSpent);

/** Guarda a partida: tempo jogado, recorde e, se ainda estiver nos 30 minutos do dia, as fichas. */
export function finishGame(state: JourneyState, game: GameId, score: number, seconds: number, today: string, extra: Record<string, number> = {}): { state: JourneyState; fichas: number; record: boolean } {
  const prev = state.games.records[game] ?? 0;
  const record = score > prev;
  // Marcas extras da partida (ex.: pares achados, peixe dourado): guarda a melhor de cada.
  // Sudoku resolvido: guarda o dia (vale Inteligência) e a maior sequência de dias seguidos.
  const sudokuDays = game === 'sudoku' && score > 0 ? Array.from(new Set([...(state.games.sudokuDays ?? []), today])).sort().slice(-400) : (state.games.sudokuDays ?? []);
  if (game === 'sudoku' && score > 0) extra = { ...extra, sudoku_seq: sudokuStreak(sudokuDays, today) };
  const best = Object.fromEntries(Object.entries(extra).filter(([k, v]) => v > (state.games.records[k] ?? 0)));
  const secs = Math.max(1, Math.min(600, Math.round(seconds)));
  const won = playedToday(state, today) < DAILY_MINUTES * 60 ? fichasFor(game, score) : 0;
  return {
    state: {
      ...state,
      games: {
        ...state.games,
        records: { ...state.games.records, ...best, ...(record ? { [game]: score } : {}) },
        plays: [...state.games.plays, { day: today, game, seconds: secs, fichas: won }].slice(-600),
        sudokuDays,
      },
    },
    fichas: won,
    record,
  };
}

// ---------- Conquistas dos jogos (aparecem no Codex) ----------

export const GAME_ACHIEVEMENTS: { id: string; name: string; rule: string; need: number; have: (s: JourneyState) => number }[] = [
  { id: 'corrida500', name: 'Corredor de bairro', rule: 'Correr 500 m na Corrida do pet', need: 500, have: (s) => s.games.records.corrida ?? 0 },
  { id: 'corrida1000', name: 'Maratonista', rule: 'Correr 1.000 m na Corrida do pet', need: 1000, have: (s) => s.games.records.corrida ?? 0 },
  { id: 'memoria8', name: 'Memória de elefante', rule: 'Achar os 8 pares na Memória do Arsenal', need: 8, have: (s) => s.games.records.memoria_pares ?? 0 },
  { id: 'memoria30', name: 'Relâmpago', rule: 'Terminar a Memória com 30 s sobrando', need: 30, have: (s) => s.games.records.memoria_sobra ?? 0 },
  { id: 'pesca10', name: 'Pescador de primeira', rule: 'Fazer 10 pontos numa Pescaria', need: 10, have: (s) => s.games.records.pescaria ?? 0 },
  { id: 'dourado', name: 'Peixe dourado', rule: 'Pescar um peixe dourado', need: 1, have: (s) => s.games.records.pescaria_dourado ?? 0 },
  { id: 'sudoku1', name: 'Primeiro Sudoku', rule: 'Resolver um Sudoku', need: 1, have: (s) => Math.min(1, (s.games.sudokuDays ?? []).length) },
  { id: 'sudoku7', name: 'Mente afiada', rule: 'Resolver o Sudoku 7 dias seguidos', need: 7, have: (s) => s.games.records.sudoku_seq ?? 0 },
  { id: 'sudokuLimpo', name: 'Sem rasura', rule: 'Resolver um Sudoku difícil sem nenhum erro', need: 1, have: (s) => s.games.records.sudoku_limpo ?? 0 },
  { id: 'respira7', name: 'Fôlego de monge', rule: 'Respirar com o pet 7 vezes', need: 7, have: (s) => s.games.records.respira ?? 0 },
  {
    id: 'maratona',
    name: 'Dia de fliperama',
    rule: `Jogar os ${DAILY_MINUTES} minutos de fichas num dia`,
    need: DAILY_MINUTES,
    have: (s) => {
      const by: Record<string, number> = {};
      for (const p of s.games.plays) by[p.day] = (by[p.day] ?? 0) + p.seconds;
      return Math.floor(Math.max(0, ...Object.values(by)) / 60);
    },
  },
];
