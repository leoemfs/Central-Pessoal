/**
 * N2.11: barra própria do jogo, em pixel art, no lugar da barra do app dentro da Jornada.
 * Puxar a barra para cima continua abrindo o menu do app (PullToMais, em App.tsx).
 * O que ainda não existe (Codex, Campanha) aparece apagado, com cadeado.
 */
import { useMemo } from 'react';
import { useStore } from '../store';
import { journeyStats } from '../journey';
import { todayISO } from '../utils';
import { notify } from '../ui';
import { chestIcon, homeIcon, itemById, itemIcon, petIcon } from '../jornada/catalog';
import { sprite } from '../jornada/art';
import { pendingChests } from '../jornada/rules';
import { GAME_TABS, type JourneyTab } from '../jornada/tabs';

const PAD = sprite(['....OOOOOOOO....', '..OOGGGGGGGGOO..', '.OGGGGGGGGGGGGO.', 'OGGWGGGGGGGRRGGO', 'OGWWWGGGGGRGGRGO', 'OGGWGGGGGGGRRGGO', 'OGGGGGOOOOGGGGGO', '.OGGGOO..OOGGGO.', '..OOO......OOO..'], { G: '#7c3aed', W: '#ffffff', R: '#facc15' }, 16);
const BAG = sprite(['.....OOOO.....', '....OBBBBO....', '.....OBBO.....', '...OOOBBOOO...', '..OBBBBBBBBO..', '.OBBBYYYYBBBO.', 'OBBBYBBBBYBBBO', 'OBBBBYYYYBBBBO', 'OBBBBBBBBYBBBO', 'OBBBYYYYYBBBBO', '.OBBBBYYBBBBO.', '..OOOOOOOOOO..'], { B: '#a16207', Y: '#facc15' }, 14);
const LOCK = sprite(['..OOOO..', '.OAAAAO.', '.OA..AO.', 'OOOOOOOO', 'OYYYYYYO', 'OYYOOYYO', 'OYYOOYYO', 'OYYYYYYO', 'OOOOOOOO'], { A: '#a1a1aa', Y: '#facc15' }, 8);

export function GameBarItems({ current }: { current: JourneyTab }) {
  const { data } = useStore();
  const today = todayISO();
  const pet = data.journey.equipped.pet;
  const petStyle = pet ? data.journey.petStyle[pet] : undefined;
  const home = data.journey.equipped.morada;
  const icons = useMemo(
    () => ({
      inicio: homeIcon('cabana', 'manha'),
      campanha: homeIcon('castelo', 'manha'),
      arsenal: itemIcon(itemById('espada')!),
      baus: chestIcon('bronze', false),
      ficha: itemIcon(itemById('grimorio')!),
      pet: petIcon(pet ?? 'gato', petStyle),
      casa: homeIcon(home === 'cabana' ? 'casinha' : home, 'manha'),
      codex: itemIcon(itemById('olho')!),
      jogos: PAD,
      loja: BAG,
    }),
    [pet, petStyle, home],
  );
  const chests = pendingChests(data, data.journey, today, journeyStats(data, today).level).length;
  // Barra encolhida (ao rolar): fica só a fileira da tela atual, sem os nomes.
  const activeRow = GAME_TABS.findIndex((t) => !t.locked && t.id === current) >= 5 ? 2 : 1;
  return (
    <>
      {GAME_TABS.map((t, idx) => {
        const active = !t.locked && t.id === current;
        const label = t.locked ? `${t.label} (em breve)` : t.id === 'baus' && chests ? `${t.label}: ${chests} esperando` : t.label;
        return [
          idx === 5 ? <span key="sep" className="jn-gsep" aria-hidden="true" /> : null,
          <a
            key={t.id}
            href={`#/${t.to}`}
            data-nav="switch"
            className={`jn-gtab${active ? ' active' : ''}${t.locked ? ' locked' : ''}${(idx >= 5 ? 2 : 1) === activeRow ? ' jn-rowon' : ''}`}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            aria-disabled={t.locked ? true : undefined}
            onClick={(e) => {
              if (!t.locked) return;
              e.preventDefault();
              notify(`${t.label}: em breve`, t.locked);
            }}
          >
            <span className="jn-gicon">
              <img alt="" src={icons[t.id]} />
              {t.locked && <img className="jn-glock" alt="" src={LOCK} />}
              {t.id === 'baus' && chests > 0 && <b className="jn-gbadge">{chests}</b>}
            </span>
            <span className="jn-glabel">{t.label}</span>
          </a>,
        ];
      })}
    </>
  );
}
