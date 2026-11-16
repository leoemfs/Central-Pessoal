/**
 * Mini games da Jornada (N2.16, decidido em 16/11): partidas de 30 a 60 s, prêmio pequeno
 * (5 a 20 de ouro) e até 3 partidas premiadas por dia; depois joga sem prêmio. Recorde pessoal.
 */
import type { JourneyState } from './rules.ts';

export type GameId = 'corrida' | 'respira' | 'memoria' | 'pescaria';
export const PRIZED_PER_DAY = 3;

export const GAMES: { id: GameId; name: string; text: string; ready: boolean }[] = [
  { id: 'corrida', name: 'Corrida do pet', text: 'Seu pet corre sozinho; toque para pular troncos e pedras.', ready: true },
  { id: 'respira', name: 'Respira com o pet', text: 'Acompanhe o pet na respiração 4-7-8. Conta como prática de Mente.', ready: true },
  { id: 'memoria', name: 'Memória do Arsenal', text: 'Vire as cartas e ache os pares de itens.', ready: false },
  { id: 'pescaria', name: 'Pescaria', text: 'Toque na hora certa para pegar o peixe.', ready: false },
];

export const prizedToday = (state: JourneyState, today: string) => state.games.prizes.filter((p) => p.day === today).length;

/** Prêmio da partida: Corrida de 5 a 20 pela distância; Respira, 10 ao completar. */
export function prizeFor(game: GameId, score: number): number {
  if (score <= 0) return 0;
  if (game === 'respira') return 10;
  return Math.max(5, Math.min(20, 5 + Math.floor(score / 100) * 3));
}

/** Guarda a partida: recorde e, se ainda houver partida premiada no dia, o ouro. */
export function finishGame(state: JourneyState, game: GameId, score: number, today: string): { state: JourneyState; gold: number; record: boolean } {
  const prev = state.games.records[game] ?? 0;
  const record = score > prev;
  const gold = prizedToday(state, today) < PRIZED_PER_DAY ? prizeFor(game, score) : 0;
  return {
    state: {
      ...state,
      games: {
        records: record ? { ...state.games.records, [game]: score } : state.games.records,
        prizes: gold ? [...state.games.prizes, { day: today, game, gold }].slice(-400) : state.games.prizes,
      },
    },
    gold,
    record,
  };
}
