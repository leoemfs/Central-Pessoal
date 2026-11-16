/**
 * Mini games da Jornada (N2.16; fichas e limite na N2.18a, decidido em 16/11).
 * Os jogos dão FICHAS, uma moeda só deles, que servem apenas para o bichinho virtual. O ouro dos
 * hábitos não muda (o ouro que os jogos deram antes continua na carteira). Só os primeiros 30 minutos
 * de jogo de cada dia dão fichas; depois dá para continuar jogando, sem fichas, até o dia seguinte.
 */
import type { JourneyState } from './rules.ts';

export type GameId = 'corrida' | 'respira' | 'memoria' | 'pescaria';
/** Minutos de jogo por dia que dão fichas. */
export const DAILY_MINUTES = 30;

export const GAMES: { id: GameId; name: string; text: string; ready: boolean }[] = [
  { id: 'corrida', name: 'Corrida do pet', text: 'Seu pet corre sozinho; toque para pular troncos e pedras.', ready: true },
  { id: 'respira', name: 'Respira com o pet', text: 'Acompanhe o pet na respiração 4-7-8. Conta como prática de Mente.', ready: true },
  { id: 'memoria', name: 'Memória do Arsenal', text: 'Vire as cartas e ache os pares de itens.', ready: false },
  { id: 'pescaria', name: 'Pescaria', text: 'Toque na hora certa para pegar o peixe.', ready: false },
];

/** Segundos jogados no dia (todas as partidas, com ou sem fichas). */
export const playedToday = (state: JourneyState, today: string) => state.games.plays.filter((p) => p.day === today).reduce((a, p) => a + p.seconds, 0);

/** Minutos que ainda dão fichas hoje (0 a 30). */
export const minutesLeft = (state: JourneyState, today: string) => Math.max(0, Math.ceil((DAILY_MINUTES * 60 - playedToday(state, today)) / 60));

/** Fichas da partida: Corrida de 1 a 5 pela distância; Respira, 2 ao completar. */
export function fichasFor(game: GameId, score: number): number {
  if (score <= 0) return 0;
  if (game === 'respira') return 2;
  return Math.max(1, Math.min(5, 1 + Math.floor(score / 150)));
}

/** Fichas na carteira: o que os jogos deram menos o que foi gasto no bichinho. */
export const fichas = (state: JourneyState) => Math.max(0, state.games.plays.reduce((a, p) => a + p.fichas, 0) - state.games.fichasSpent);

/** Guarda a partida: tempo jogado, recorde e, se ainda estiver nos 30 minutos do dia, as fichas. */
export function finishGame(state: JourneyState, game: GameId, score: number, seconds: number, today: string): { state: JourneyState; fichas: number; record: boolean } {
  const prev = state.games.records[game] ?? 0;
  const record = score > prev;
  const secs = Math.max(1, Math.min(600, Math.round(seconds)));
  const won = playedToday(state, today) < DAILY_MINUTES * 60 ? fichasFor(game, score) : 0;
  return {
    state: {
      ...state,
      games: {
        ...state.games,
        records: record ? { ...state.games.records, [game]: score } : state.games.records,
        plays: [...state.games.plays, { day: today, game, seconds: secs, fichas: won }].slice(-600),
      },
    },
    fichas: won,
    record,
  };
}
