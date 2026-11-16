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
import { chestIcon, homeIcon, itemById, itemIcon } from '../jornada/catalog';
import { sprite } from '../jornada/art';
import { pendingChests } from '../jornada/rules';
import { GAME_TABS, type JourneyTab } from '../jornada/tabs';

const LOCK = sprite(['..OOOO..', '.OAAAAO.', '.OA..AO.', 'OOOOOOOO', 'OYYYYYYO', 'OYYOOYYO', 'OYYOOYYO', 'OYYYYYYO', 'OOOOOOOO'], { A: '#a1a1aa', Y: '#facc15' }, 8);

export function GameBarItems({ current }: { current: JourneyTab }) {
  const { data } = useStore();
  const today = todayISO();
  const icons = useMemo(
    () => ({
      inicio: homeIcon('cabana', 'manha'),
      arsenal: itemIcon(itemById('espada')!),
      baus: chestIcon('bronze', false),
      ficha: itemIcon(itemById('grimorio')!),
      codex: itemIcon(itemById('olho')!),
      campanha: homeIcon('castelo', 'manha'),
    }),
    [],
  );
  const chests = pendingChests(data, data.journey, today, journeyStats(data, today).level).length;
  return (
    <>
      {GAME_TABS.map((t) => {
        const active = !t.locked && t.id === current;
        const label = t.locked ? `${t.label} (em breve)` : t.id === 'baus' && chests ? `${t.label}: ${chests} esperando` : t.label;
        return (
          <a
            key={t.id}
            href={`#/${t.to}`}
            data-nav="switch"
            className={`jn-gtab${active ? ' active' : ''}${t.locked ? ' locked' : ''}`}
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
          </a>
        );
      })}
    </>
  );
}
