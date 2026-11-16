/**
 * N2.11: barra própria do jogo dentro da Jornada (Anexo E.1 de `modulo-rpg.md`).
 * Cada botão é uma tela (`#/jornada`, `#/jornada/arsenal`…). O que ainda não existe
 * aparece apagado, com cadeado.
 */
export type JourneyTab = 'inicio' | 'arsenal' | 'baus' | 'ficha';

export interface GameTab {
  id: JourneyTab | 'codex' | 'campanha';
  label: string;
  /** Endereço sem o "#/". */
  to: string;
  /** Ainda não construído: apagado com cadeado. */
  locked?: string;
}

export const GAME_TABS: GameTab[] = [
  { id: 'inicio', label: 'Jornada', to: 'jornada' },
  { id: 'arsenal', label: 'Arsenal', to: 'jornada/arsenal' },
  { id: 'baus', label: 'Baús', to: 'jornada/baus' },
  { id: 'ficha', label: 'Ficha', to: 'jornada/ficha' },
  { id: 'codex', label: 'Codex', to: 'jornada', locked: 'O Codex, álbum com tudo o que existe na Jornada, chega numa próxima versão.' },
  { id: 'campanha', label: 'Campanha', to: 'jornada', locked: 'A Campanha, com o mapa, as regiões e os chefes, chega numa próxima versão.' },
];

/** Qual tela da Jornada o endereço pede (o que não for conhecido abre a tela principal). */
export function journeyTab(sub: string): JourneyTab {
  const first = sub.split('/')[0];
  return first === 'arsenal' || first === 'baus' || first === 'ficha' ? first : 'inicio';
}

/** A barra do jogo aparece só quando a Jornada está em uso: desbloqueada, escolhida e com o personagem criado. */
export function gameBarOn(s: { journeyUnlockedAt: string | null; journeyChoice: string | null }, welcomed: boolean): boolean {
  return s.journeyUnlockedAt !== null && s.journeyChoice === 'quero' && welcomed;
}
