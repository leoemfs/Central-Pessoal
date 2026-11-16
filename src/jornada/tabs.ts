/**
 * Barra própria do jogo dentro da Jornada (N2.11; duas fileiras de 5 na N2.15, Anexo E.1 de `modulo-rpg.md`).
 * Cada botão é uma tela (`#/jornada`, `#/jornada/arsenal`…). O que ainda não existe aparece apagado, com cadeado.
 */
export type JourneyTab = 'inicio' | 'arsenal' | 'baus' | 'ficha' | 'pet' | 'casa' | 'loja';

export interface GameTab {
  id: JourneyTab | 'campanha' | 'codex' | 'jogos';
  label: string;
  /** Endereço sem o "#/". */
  to: string;
  /** Ainda não construído: apagado com cadeado. */
  locked?: string;
}

/** Fileira de cima: o jogo do dia a dia. Fileira de baixo: coleção e diversão. */
export const GAME_TABS: GameTab[] = [
  { id: 'inicio', label: 'Jornada', to: 'jornada' },
  { id: 'campanha', label: 'Campanha', to: 'jornada', locked: 'A Campanha, com o mapa, as regiões e os chefes, chega numa próxima versão.' },
  { id: 'arsenal', label: 'Arsenal', to: 'jornada/arsenal' },
  { id: 'baus', label: 'Baús', to: 'jornada/baus' },
  { id: 'ficha', label: 'Ficha', to: 'jornada/ficha' },
  { id: 'pet', label: 'Pet', to: 'jornada/pet' },
  { id: 'casa', label: 'Casa', to: 'jornada/casa' },
  { id: 'codex', label: 'Codex', to: 'jornada', locked: 'O Codex, álbum com tudo o que existe na Jornada, chega numa próxima versão.' },
  { id: 'jogos', label: 'Mini games', to: 'jornada', locked: 'Os mini games (Corrida do pet, Memória, Pescaria e Respira com o pet) chegam numa próxima versão.' },
  { id: 'loja', label: 'Loja', to: 'jornada/loja' },
];

const SCREENS: JourneyTab[] = ['arsenal', 'baus', 'ficha', 'pet', 'casa', 'loja'];

/** Qual tela da Jornada o endereço pede (o que não for conhecido abre a tela principal). */
export function journeyTab(sub: string): JourneyTab {
  const first = sub.split('/')[0] as JourneyTab;
  return SCREENS.includes(first) ? first : 'inicio';
}

/** A barra do jogo aparece só quando a Jornada está em uso: desbloqueada, escolhida e com o personagem criado. */
export function gameBarOn(s: { journeyUnlockedAt: string | null; journeyChoice: string | null }, welcomed: boolean): boolean {
  return s.journeyUnlockedAt !== null && s.journeyChoice === 'quero' && welcomed;
}
