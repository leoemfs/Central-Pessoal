/**
 * Jornada (N2.6): pets (com nome e pelagem), casas e o presente do dia, seguindo a prancha
 * "v3 · Pets e moradas" da prévia "Jornada RPG" e a "Prévia da Jornada" (Arsenal › Pets, presente do dia).
 */
import { useState } from 'react';
import { useStore } from '../store';
import { todayISO } from '../utils';
import { Icon, notify, Sheet } from '../ui';
import { chestIcon, COIN_ICON, homeIcon, HOMES, PETS, petIcon, RARITY } from '../jornada/catalog';
import { PET_SPRITES } from '../jornada/petsData';
import { acquirePlace, equip, pendingGifts, petGoals, placeAvailability, RARE_VARIANTS, shopContext, visitGift, visitStats, VISIT_GIFTS } from '../jornada/rules';

const fmt = (n: number) => n.toLocaleString('pt-BR');

export function PetsView() {
  const { data, update } = useStore();
  const today = todayISO();
  const state = data.journey;
  const ctx = shopContext(data, state, today);
  const goals = petGoals(data, today);
  const [open, setOpen] = useState<string | null>(null);
  const owned = PETS.filter((p) => state.owned.includes(p.id)).length;
  const take = (id: string) =>
    update((d) => {
      const r = acquirePlace('pet', id, d.journey, shopContext(d, d.journey, todayISO()));
      if (typeof r === 'string') {
        notify('Ainda não', r);
        return d;
      }
      notify('Novo companheiro!', `${PETS.find((p) => p.id === id)!.name} chegou.`);
      return { ...d, journey: r };
    });
  return (
    <>
      <section className="card">
        <div className="card-head">
          <h2>Pets</h2>
          <span className="muted small">
            {owned} de {PETS.length}
          </span>
        </div>
        <p className="muted small">O pet passeia na cena e fica feliz nos dias em que você registra algo. Nunca fica triste nem some.</p>
        <div className="jn-pets">
          {PETS.map((p) => {
            const has = state.owned.includes(p.id);
            const a = placeAvailability('pet', p.id, state, ctx);
            const ready = a.status === 'liberar';
            const g = goals[p.id];
            const levelNeed = p.level > 1 ? p.level : 0;
            const on = state.equipped.pet === p.id;
            return (
              <button key={p.id} type="button" className={`jn-pet-card${has ? ' has' : ''}${on ? ' on' : ''}`} onClick={() => (has ? setOpen(p.id) : ready ? take(p.id) : notify(p.name, g.hint))}>
                <span className="jn-pet-meadow">
                  <img alt="" src={petIcon(p.id, state.petStyle[p.id])} style={has || ready ? undefined : { filter: 'brightness(0) opacity(0.55)' }} />
                  {on && <b className="jn-px">NA CENA</b>}
                </span>
                <strong>{has ? state.petNames[p.id] || p.name : p.name}</strong>
                <span className="small" style={{ color: RARITY[p.rarity].color }}>
                  {RARITY[p.rarity].label}
                </span>
                {!has &&
                  (ready ? (
                    <span className="small" style={{ color: 'var(--green-text)' }}>
                      Liberado: tocar para pegar
                    </span>
                  ) : (
                    <span className="muted small">
                      {g.need > 0 ? `${fmt(Math.min(g.have, g.need))}/${fmt(g.need)} · ` : levelNeed ? `Nível ${levelNeed} · ` : ''}
                      {g.hint}
                    </span>
                  ))}
              </button>
            );
          })}
        </div>
      </section>
      {open && <PetEditor id={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function PetEditor({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, update } = useStore();
  const state = data.journey;
  const pet = PETS.find((p) => p.id === id)!;
  const spr = PET_SPRITES[id];
  const [name, setName] = useState(state.petNames[id] ?? '');
  const [style, setStyle] = useState(state.petStyle[id] ?? spr.variants[0].id);
  const best = visitStats(data.settings.visitDays, todayISO()).best;
  const save = (alsoEquip: boolean) => {
    update((d) => {
      let j = { ...d.journey, petNames: { ...d.journey.petNames, [id]: name.trim().slice(0, 20) }, petStyle: { ...d.journey.petStyle, [id]: style } };
      if (alsoEquip) {
        const r = equip(j, 'pet', id, 1);
        if (typeof r !== 'string') j = r;
      }
      return { ...d, journey: j };
    });
    onClose();
  };
  return (
    <Sheet title={name.trim() || pet.name} onClose={onClose}>
      <div className="jn-pet-edit">
        <span className="jn-pet-meadow big">
          <img alt="" src={petIcon(id, style)} />
        </span>
        <div className="jn-field">
          <label htmlFor="jn-pet-name">Nome</label>
          <input id="jn-pet-name" className="input" maxLength={20} placeholder={pet.name} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="jn-field">
          <span>Cor</span>
          <div className="jn-chipset" role="group" aria-label="Cor">
            {spr.variants.map((v) => {
              const need = v.rare ? RARE_VARIANTS[v.rare] : 0;
              const locked = need > 0 && best < need;
              return (
                <button key={v.id} type="button" aria-pressed={style === v.id} disabled={locked} onClick={() => setStyle(v.id)} title={locked ? `${need} dias seguidos abrindo o app` : undefined}>
                  {locked ? `${v.name} · ${need} dias seguidos` : v.name}
                </button>
              );
            })}
          </div>
        </div>
        <div className="btn-row">
          {state.equipped.pet === id ? (
            <button type="button" className="btn primary" onClick={() => save(false)}>
              Salvar
            </button>
          ) : (
            <>
              <button type="button" className="btn" onClick={() => save(false)}>
                Salvar
              </button>
              <button type="button" className="btn primary" onClick={() => save(true)}>
                Levar para a cena
              </button>
            </>
          )}
        </div>
      </div>
    </Sheet>
  );
}

export function HomesView() {
  const { data, update } = useStore();
  const today = todayISO();
  const state = data.journey;
  const ctx = shopContext(data, state, today);
  const act = (id: string, has: boolean) =>
    update((d) => {
      let j = d.journey;
      if (!has) {
        const r = acquirePlace('morada', id, j, shopContext(d, j, todayISO()));
        if (typeof r === 'string') {
          notify('Ainda não', r);
          return d;
        }
        j = r;
      }
      const e = equip(j, 'morada', id, 1);
      if (typeof e === 'string') {
        notify('Não deu', e);
        return d;
      }
      notify(has ? 'Mudou de casa' : 'Casa nova!', HOMES.find((h) => h.id === id)!.name);
      return { ...d, journey: e };
    });
  return (
    <section className="card">
      <div className="card-head">
        <h2>Casas</h2>
      </div>
      <ul className="jn-homes">
        {HOMES.map((h) => {
          const a = placeAvailability('morada', h.id, state, ctx);
          const has = a.status === 'tem';
          const on = state.equipped.morada === h.id;
          const req = h.attrUnlock ? Object.entries(h.attrUnlock).map(([k, v]) => `${k} ${v}`).join(' · ') : '';
          return (
            <li key={h.id}>
              <img alt="" src={homeIcon(h.id, 'manha')} style={has || a.status !== 'bau' ? undefined : { filter: 'grayscale(1) brightness(0.55)' }} />
              <div>
                <strong>{h.name}</strong>
                <span className="small" style={{ color: RARITY[h.rarity].color }}>
                  {RARITY[h.rarity].label}
                </span>
                <span className="muted small">{has ? (on ? 'Você mora aqui' : 'Sua') : a.status === 'comprar' ? `${fmt(a.price)} ouro` : a.status === 'liberar' ? 'Liberada' : `Nível ${h.level}${req ? ` · ${req}` : ''}${h.price ? ` · ${fmt(h.price)} ouro` : ''}`}</span>
              </div>
              {on ? (
                <span className="small" style={{ color: 'var(--green-text)' }}>
                  Em uso
                </span>
              ) : has || a.status === 'liberar' ? (
                <button type="button" className="btn small primary" onClick={() => act(h.id, has)}>
                  Morar aqui
                </button>
              ) : a.status === 'comprar' ? (
                <button type="button" className="btn small primary" disabled={!a.canAfford} onClick={() => act(h.id, false)}>
                  Comprar
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Presente do dia por abrir o app (F.2): tira de 7 dias, chama com os dias seguidos. */
export function GiftCard() {
  const { data, update } = useStore();
  const today = todayISO();
  const pend = pendingGifts(data, data.journey, today);
  const v = visitStats(data.settings.visitDays, today);
  const n = Math.max(1, v.streak);
  const pos = ((n - 1) % 7) + 1;
  const todayDone = data.journey.gifts.some((g) => g.day === today);
  const claim = () => {
    const gold = pend.reduce((t, g) => t + g.gold, 0);
    const chests = pend.filter((g) => g.chest).length;
    update((d) => ({ ...d, journey: { ...d.journey, gifts: [...d.journey.gifts, ...pendingGifts(d, d.journey, todayISO())] } }));
    notify(pend.length > 1 ? `${pend.length} presentes abertos` : 'Presente aberto', [gold ? `+${fmt(gold)} ouro` : '', chests ? `${chests} ${chests === 1 ? 'baú novo' : 'baús novos'} em Baús` : ''].filter(Boolean).join(' · '));
  };
  return (
    <section className={`card jn-gift${pend.length ? ' ready' : ''}`}>
      <div className="card-head">
        <h2>Presente do dia</h2>
        <span className="jn-flame jn-px" aria-label={`${v.streak} dias seguidos abrindo o app`}>
          <Icon name="flame" size={16} /> {v.streak}
        </span>
      </div>
      <ol className="jn-strip" aria-label="Tira de 7 dias">
        {VISIT_GIFTS.concat([0]).map((gold, i) => {
          const k = i + 1;
          const past = k < pos || (k === pos && todayDone && !pend.length);
          return (
            <li key={k} className={`${k === pos ? 'now' : ''}${past ? ' got' : ''}`}>
              <img alt="" src={k === 7 ? chestIcon('bronze', past) : COIN_ICON} />
              <span className="jn-px">{k === 7 ? 'baú' : gold}</span>
            </li>
          );
        })}
      </ol>
      {pend.length > 0 ? (
        <button type="button" className="btn primary block" onClick={claim}>
          {pend.length > 1 ? `Abrir ${pend.length} presentes` : `Abrir o presente: ${visitGift(pend[0].n).chest ? 'baú de bronze' : `+${pend[0].gold} ouro`}`}
        </button>
      ) : (
        <p className="muted small">Volte amanhã para o próximo. Basta abrir o app; um dia sem abrir por semana não quebra a sequência.</p>
      )}
    </section>
  );
}
