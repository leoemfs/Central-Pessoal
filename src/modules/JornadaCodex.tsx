/**
 * Jornada (N2.7): Codex, seguindo a "Prévia da Jornada" (Arsenal › Codex) e a prancha "v2 · Coleção".
 * Tudo o que existe, por categoria: o que é seu, colorido com a frase do Codex; o que falta, em
 * silhueta com a dica e o progresso. Marcos de descoberta: 25% prata, 50% dourado, 75% cristal, 100% título.
 */
import { useState } from 'react';
import { useStore } from '../store';
import { todayISO } from '../utils';
import { Sheet, Toggle } from '../ui';
import { chestIcon, homeIcon, itemById, itemIcon, medalIcon, petIcon, PETS, RARITY, trophyIcon } from '../jornada/catalog';
import { TITLES } from '../jornada/rules';
import { CODEX_CATS, codexEntries, codexSummary, type CodexCat, type CodexEntry } from '../jornada/codex';
import { PET_SPRITES } from '../jornada/petsData';
import { PetEditor } from './JornadaPets';
import { HudTabs } from './JornadaTopo';

const fmt = (n: number) => n.toLocaleString('pt-BR');

function iconOf(e: CodexEntry, petStyle: Record<string, string>): string {
  if (e.cat === 'pet') return petIcon(e.id, petStyle[e.id]);
  if (e.cat === 'casa') return homeIcon(e.id, 'manha');
  if (e.cat === 'jogo') return trophyIcon(e.owned);
  if (e.cat === 'titulo') return medalIcon(Math.max(0, TITLES.findIndex((t) => `titulo:${t.id}` === e.id)), e.owned);
  return itemIcon(itemById(e.id)!);
}

export function CodexView() {
  const { data } = useStore();
  const today = todayISO();
  const all = codexEntries(data, today);
  const sum = codexSummary(data.journey.owned);
  const [cat, setCat] = useState<CodexCat>('pet');
  const [missing, setMissing] = useState(false);
  const [open, setOpen] = useState<CodexEntry | null>(null);
  const [editPet, setEditPet] = useState<string | null>(null);
  const list = all.filter((e) => e.cat === cat && (!missing || !e.owned));
  const markIcons = [chestIcon('prata', false), chestIcon('dourado', false), chestIcon('cristal', false), medalIcon(3, true)];
  return (
    <>
      <section className="card jn-codex-top">
        <div className="card-head">
          <h2>Codex</h2>
          <span className="muted small tabular">
            {sum.have} de {sum.total} descobertos
          </span>
        </div>
        <div className="jn-codex-track" aria-label={`${sum.pct}% descoberto`}>
          <i style={{ width: `${Math.min(100, (sum.have / sum.total) * 100)}%` }} />
          {sum.marks.map((m, k) => (
            <span key={m.at} className={m.hit ? 'hit' : ''} style={{ left: `${m.at}%` }} title={`${m.at}%: ${m.prize}`}>
              <img alt="" src={markIcons[k]} />
            </span>
          ))}
        </div>
        <p className="muted small">Tudo o que existe na Jornada. O que falta aparece em silhueta, com a dica de como conquistar. Ao descobrir 25%, 50% e 75% você ganha baús; com 100%, o título Lenda do Codex.</p>
      </section>
      <HudTabs>
      <div className="jn-chipset jn-codex-cats" role="group" aria-label="Categoria do Codex">
        {CODEX_CATS.map((c) => {
          const l = all.filter((e) => e.cat === c.id);
          return (
            <button key={c.id} type="button" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
              {c.label} {l.filter((e) => e.owned).length}/{l.length}
            </button>
          );
        })}
      </div>
      </HudTabs>
      <div className="jn-codex-filter">
        <span className="muted small">
          {CODEX_CATS.find((c) => c.id === cat)?.label} · {all.filter((e) => e.cat === cat && e.owned).length} de {all.filter((e) => e.cat === cat).length}
        </span>
        <span className="jn-codex-tog">
          Só o que falta <Toggle label="Só o que falta" checked={missing} onChange={setMissing} />
        </span>
      </div>
      <div className="jn-codex-grid">
        {list.map((e) => (
          <button key={e.id} type="button" className={`jn-cx${e.owned ? '' : ' locked'}`} style={{ '--rc': RARITY[e.rarity].color } as React.CSSProperties} onClick={() => setOpen(e)}>
            <span className="jn-cx-pic">
              <img alt="" src={iconOf(e, data.journey.petStyle)} />
            </span>
            <strong>{e.owned ? e.name : e.cat === 'titulo' ? e.name : e.name}</strong>
            <span className="small" style={{ color: RARITY[e.rarity].color }}>
              {RARITY[e.rarity].label}
            </span>
            {!e.owned && (
              <>
                <span className="jn-cx-hint">{e.hint}</span>
                {e.need ? (
                  <span className="jn-near-bar">
                    <i style={{ width: `${Math.min(100, ((e.have ?? 0) / e.need) * 100)}%`, background: RARITY[e.rarity].color }} />
                  </span>
                ) : null}
              </>
            )}
          </button>
        ))}
        {list.length === 0 && <p className="muted small">Nada faltando aqui: você já tem tudo desta categoria.</p>}
      </div>
      {open && (
        <CodexDetail
          e={open}
          icon={iconOf(open, data.journey.petStyle)}
          onClose={() => setOpen(null)}
          onEdit={() => {
            const id = open.id;
            setOpen(null);
            // Abre o editor depois que a janela do Codex fecha (cada janela cuida do seu "voltar").
            window.setTimeout(() => setEditPet(id), 250);
          }}
        />
      )}
      {editPet && <PetEditor id={editPet} onClose={() => setEditPet(null)} />}
    </>
  );
}

function CodexDetail({ e, icon, onClose, onEdit }: { e: CodexEntry; icon: string; onClose: () => void; onEdit: () => void }) {
  const { data } = useStore();
  const it = itemById(e.id);
  const spr = e.cat === 'pet' ? PET_SPRITES[e.id] : null;
  // Pet seu: mostra o nome que você deu e permite editar nome e cor dali mesmo.
  const petName = e.cat === 'pet' && e.owned ? data.journey.petNames[e.id]?.trim() : '';
  const baseName = PETS.find((p) => p.id === e.id)?.name ?? e.name;
  return (
    <Sheet title={petName && petName !== baseName ? `${petName} (${baseName})` : e.name} onClose={onClose}>
      <div className="jn-cx-detail">
        <span className="jn-px" style={{ color: RARITY[e.rarity].color }}>
          CODEX · {RARITY[e.rarity].label.toUpperCase()}
        </span>
        <div className={`jn-cx-stage${e.owned ? '' : ' locked'}`} style={{ '--rc': RARITY[e.rarity].color } as React.CSSProperties}>
          <img alt="" src={icon} />
        </div>
        <p className="jn-cx-lore">{e.owned ? `“${e.lore}”` : 'Ainda não descoberto.'}</p>
        {it?.effect && <p className="small">✦ {it.effect}</p>}
        <div className="jn-cx-how">
          <b>{e.owned ? 'Conquistado' : 'Como conquistar'}</b>
          <span>{e.owned ? (e.cat === 'titulo' || e.cat === 'jogo' ? e.lore : 'Já é seu.') : e.hint}</span>
          {!e.owned && e.need ? (
            <span className="muted small tabular">
              {fmt(e.have ?? 0)} de {fmt(e.need)}
            </span>
          ) : null}
        </div>
        {spr && (
          <div className="jn-cx-variants">
            {spr.variants.map((v) => (
              <span key={v.id} title={v.name}>
                <img alt="" src={petIcon(e.id, v.id)} style={e.owned ? undefined : { filter: 'brightness(0) opacity(0.5)' }} />
                <small>{v.name}</small>
              </span>
            ))}
          </div>
        )}
        {spr && e.owned && (
          <button type="button" className="btn primary block" onClick={onEdit}>
            Editar nome e cor
          </button>
        )}
      </div>
    </Sheet>
  );
}
