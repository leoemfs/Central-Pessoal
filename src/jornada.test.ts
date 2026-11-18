import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, normalize, normalizeHabit } from './data.ts';
import { addExpense, type ExpenseInput } from './finance.ts';
import { addDays } from './utils.ts';
import type { AppData, Habit, JournalEntry } from './types.ts';
import { grid } from './jornada/art.ts';
import { codexEntries, codexSummary } from './jornada/codex.ts';
import { fichas, finishGame, minutesLeft } from './jornada/games.ts';
import { HOMES, ITEMS, PETS, REGION_NAMES, SLOT_LIST, avatarIcon, homeGrid, itemById, itemIcon, petIcon } from './jornada/catalog.ts';
import {
  acquire,
  acquirePlace,
  attributes,
  availability,
  bestStreak,
  classOf,
  defaultJourneyState,
  earnedChests,
  equip,
  equipmentBonus,
  arsenalItems,
  homeCard,
  shopContext,
  newsLine,
  sinceLastVisit,
  snapshot,
  monthsAllOnTime,
  normalizeJourney,
  openChest,
  openChests,
  pendingChests,
  titleProgress,
  visitGift,
  visitStats,
  wallet,
  welcomeState,
  pendingGifts,
  nextInSlot,
  wardrobeItems,
  shopList,
  CODEX_IDS,
  type ShopContext,
} from './jornada/rules.ts';
import { phaseAt, rainWindow, skyAt, starPositions, starsTonight } from './jornada/sky.ts';

const TODAY = '2026-11-25';
const habit = (p: Partial<Habit>): Habit => normalizeHabit({ id: 'h', name: 'X', createdAt: '2026-09-01T12:00:00', ...p });
const days = (end: string, n: number) => Array.from({ length: n }, (_, i) => addDays(end, -i)).reverse();
const entry = (day: string, tag = ''): JournalEntry => ({ id: `j${day}${tag}`, createdAt: `${day}T12:00:00`, title: '', summary: '', content: 'x', tag }) as JournalEntry;
const attrs = (p: Partial<Record<'FOR' | 'AGI' | 'INT' | 'RES' | 'SAB' | 'DIS', number>> = {}) => ({ FOR: 0, AGI: 0, INT: 0, RES: 0, SAB: 0, DIS: 0, ...p });
const withData = (p: Partial<AppData>): AppData => ({ ...emptyData(), ...p });
const ctx = (p: Partial<ShopContext> = {}): ShopContext => ({ attrs: attrs(), gold: 0, crystals: 0, level: 1, cleanAfterSlip: 0, ...p });

// ---------- Arte ----------

test('arte: todo item, pet e morada tem desenho', () => {
  for (const it of ITEMS) assert.match(itemIcon(it), /^data:image\/svg\+xml,/, it.id);
  for (const p of PETS) assert.match(petIcon(p.id), /^data:image\/svg\+xml,/);
  for (const h of HOMES) for (const phase of ['manha', 'tarde', 'noite', 'chuva'] as const) assert.ok(homeGrid(h.id, phase).flat().some(Boolean), `${h.id} ${phase}`);
});

test('catálogo da prévia: 49 itens em 7 espaços, todas as raridades', () => {
  assert.equal(ITEMS.length, 49);
  assert.deepEqual([...new Set(ITEMS.map((i) => i.slot))].sort(), [...SLOT_LIST].sort());
  for (const r of ['comum', 'raro', 'epico', 'mistico']) assert.ok(ITEMS.some((i) => i.rarity === r), r);
  assert.equal(itemById('bracelete')?.slot, 'anel');
  assert.equal(itemById('gota')?.slot, 'colar');
  assert.equal(itemById('grimorio')?.slot, 'magico');
  assert.equal(itemById('arcoCurto')?.weapon, 'arco');
  // Itens de região: só da campanha (ou baús), cada um com sua região.
  for (const it of ITEMS.filter((i) => i.campaign)) assert.ok(REGION_NAMES[it.campaign!], it.id);
  // Todo item que não é de começo nem de região tem um jeito de conseguir: loja, atributo/baú ou forja.
  for (const it of ITEMS.filter((i) => !i.starter && !i.campaign)) assert.ok(it.price || it.attrUnlock || it.crystals, it.id);
});

test('arte: o avatar veste qualquer combinação (arco, colar, elmo)', () => {
  const pick = (slot: string) => [null, ...ITEMS.filter((i) => i.slot === slot).map((i) => i.id)];
  for (const gender of ['f', 'm'] as const)
    for (const elmo of pick('elmo'))
      for (const arma of pick('arma'))
        assert.match(avatarIcon({ gender, skin: 'media', hair: 'castanho' }, { elmo, arma, armadura: 'placas', botas: 'aladas', colar: 'perola' }), /^data:image\/svg\+xml,/);
  const bow = avatarIcon({ gender: 'f', skin: 'media', hair: 'castanho' }, { arma: 'arcoLongo' });
  assert.notEqual(bow, avatarIcon({ gender: 'f', skin: 'media', hair: 'castanho' }, {}));
  // Pele ou cabelo desconhecidos não quebram.
  assert.match(avatarIcon({ gender: 'm', skin: '??', hair: '??' }, {}), /^data:image/);
});

test('arte: "." é transparente e "O" é o contorno', () => {
  const g = grid(['.O', 'A.'], { A: '#fff' });
  assert.deepEqual(g, [[null, '#1a1a1f'], ['#fff', null]]);
});

// ---------- Atributos e classes ----------

test('atributos: +3 com um atributo, +2 em cada com mais; contas, revisões e diário também contam', () => {
  const input: ExpenseInput = { kind: 'avulsa', description: 'Luz', categoryId: 'c', method: 'pix', cardId: null, date: '2026-11-10', amounts: [100], paidAt: '2026-11-09' };
  const d = addExpense(
    withData({
      habits: [habit({ id: 'a', name: 'Ler', attrs: ['INT'], checks: ['2026-11-20', '2026-11-21'] }), habit({ id: 'b', name: 'Correr', attrs: ['FOR', 'AGI'], checks: ['2026-11-21'] })],
      journal: [entry('2026-11-20'), entry('2026-11-20'), entry('2026-11-22'), entry('2026-11-23', 'Revisão')],
    }),
    input,
    TODAY,
  );
  const a = attributes(d, TODAY);
  assert.equal(a.INT, 6);
  assert.equal(a.FOR, 2);
  assert.equal(a.AGI, 2);
  assert.equal(a.SAB, 2, 'dois dias com diário (a revisão não conta aqui)');
  assert.equal(a.DIS, 2 + 3, 'conta paga no prazo + revisão');
  // Janela: só os últimos dias.
  assert.equal(attributes(d, TODAY, '2026-11-21').INT, 3);
});

test('classe: atributo mais alto, híbrida quando os dois estão perto, desempate pelo mês', () => {
  assert.equal(classOf(attrs()).f, 'Aventureira');
  assert.equal(classOf(attrs({ INT: 118, RES: 90 })).f, 'Maga');
  assert.equal(classOf(attrs({ INT: 100, SAB: 95 })).m, 'Arquimago');
  assert.equal(classOf(attrs({ RES: 100, INT: 95 })).f, 'Guardiã', 'sem par híbrido: fica a do maior');
  assert.equal(classOf(attrs({ FOR: 50, AGI: 50 }), attrs({ AGI: 10 })).id, 'AGI+FOR');
  assert.equal(classOf(attrs({ FOR: 50, RES: 50 }), attrs({ RES: 10 })).id, 'RES', 'empate: o que mais subiu no mês');
});

// ---------- Títulos ----------

test('títulos: meses com contas em dia, diário, sequência e recaída', () => {
  let d = withData({});
  for (const m of ['2026-08', '2026-09', '2026-10']) {
    d = addExpense(d, { kind: 'avulsa', description: 'Aluguel', categoryId: 'c', method: 'pix', cardId: null, date: `${m}-10`, amounts: [1000], paidAt: `${m}-09` }, TODAY);
  }
  d = addExpense(d, { kind: 'avulsa', description: 'Multa', categoryId: 'c', method: 'pix', cardId: null, date: '2026-07-10', amounts: [10], paidAt: '2026-07-20' }, TODAY);
  assert.deepEqual(monthsAllOnTime(d, TODAY), ['2026-08', '2026-09', '2026-10'], 'julho pagou atrasado; novembro ainda não fechou');

  d = {
    ...d,
    settings: { ...d.settings, journeyUnlockedAt: '2026-11-01' },
    journal: days(TODAY, 5).map((x) => entry(x)),
    habits: [
      habit({ id: 'r', name: 'Alongar', period: 'manha', checks: days('2026-11-20', 30) }),
      habit({ id: 'q', name: 'Refri', kind: 'abandonar', startDate: '2026-09-01', slips: ['2026-10-01'] }),
    ],
  };
  const t = Object.fromEntries(titleProgress({ d, today: TODAY, attrs: attributes(d, TODAY) }).map((x) => [x.id, x]));
  assert.equal(t.aprendiz.earned, true);
  assert.equal(t.contas.earned, true);
  assert.equal(t.cronista.have, 5);
  assert.equal(t.madrugada.earned, true);
  assert.equal(t.inquebravel.earned, true);
  assert.equal(t.fenix.earned, true, '55 dias limpo depois da recaída de 01/10');
  assert.equal(t.lenda.earned, false);
});

test('sequência: dias fora da rotina não quebram; a maior fica guardada', () => {
  // Só segundas, quartas e sextas.
  const h = habit({ days: [1, 3, 5], checks: ['2026-11-02', '2026-11-04', '2026-11-06', '2026-11-09', '2026-11-16'] });
  assert.equal(bestStreak(h, TODAY), 4, 'faltou na quarta 11/11');
});

// ---------- Baús ----------

test('baús: bronze a cada 7 dias seguidos, prata a cada 30, cristal nos marcos sem recaída', () => {
  const d = withData({
    habits: [
      habit({ id: 'a', checks: days('2026-11-20', 30) }),
      habit({ id: 'q', name: 'Fumar', kind: 'abandonar', startDate: '2026-09-01', slips: ['2026-09-10'] }),
    ],
  });
  const chests = earnedChests(d, TODAY, 11);
  const kinds = (k: string) => chests.filter((c) => c.kind === k);
  assert.equal(kinds('bronze').length, 4);
  assert.equal(kinds('prata').length, 1);
  assert.equal(kinds('dourado').length, 2, 'níveis 5 e 10');
  // Primeira sequência: 01/09 a 09/09 (8 dias limpos) → marco 7. Depois da recaída: 10/09 a hoje (76 dias) → 7, 14, 30, 60.
  assert.deepEqual(kinds('cristal').map((c) => c.key.split(':').slice(2).join(':')), ['2026-09-01:7', '2026-09-10:7', '2026-09-10:14', '2026-09-10:30', '2026-09-10:60']);
  // Desmarcar um dia no meio quebra a sequência e o baú some junto.
  const broken = withData({ habits: [habit({ id: 'a', checks: days('2026-11-20', 30).filter((x) => x !== '2026-11-05') })] });
  assert.equal(earnedChests(broken, TODAY, 1).filter((c) => c.kind === 'prata').length, 0);
});

test('abrir baú: resultado estável, item novo, cristais do baú de cristal e nunca duas vezes', () => {
  const d = withData({ habits: [habit({ id: 'q', kind: 'abandonar', startDate: '2026-10-01' })] });
  const chest = earnedChests(d, TODAY, 1).find((c) => c.key.endsWith(':30'))!;
  const s0 = defaultJourneyState();
  const a = openChest(s0, chest, TODAY);
  const b = openChest(s0, chest, TODAY);
  assert.deepEqual(a.record, b.record, 'mesmo baú, mesmo conteúdo');
  assert.equal(a.record.crystals, 2);
  assert.ok(a.record.item && itemById(a.record.item)!.rarity === 'epico');
  assert.ok(a.state.owned.includes(a.record.item!));
  assert.throws(() => openChest(a.state, chest, TODAY));
  assert.equal(pendingChests(d, a.state, TODAY, 1).some((c) => c.key === chest.key), false);
});

// ---------- Carteira, loja, forja e equipamentos ----------

test('carteira: ouro ganho + baús − gasto; cristais de títulos e baús − gastos', () => {
  const d = withData({ settings: { ...emptyData().settings, journeyUnlockedAt: '2026-11-01' }, journal: [entry('2026-11-20')] });
  const s = { ...defaultJourneyState(), goldSpent: 3, crystalsSpent: 1, chests: [{ key: 'x', kind: 'cristal' as const, openedAt: TODAY, gold: 100, crystals: 2, item: null }] };
  const w = wallet(d, s, TODAY);
  assert.equal(w.gold, 5 + 100 - 3, '1 registro no diário = 5 de ouro');
  assert.equal(w.crystals, 1 + 2 - 1, 'título Aprendiz + baú − gasto');
});

test('loja: compra com ouro, libera pelo atributo e forja místicos com cristais', () => {
  const s = defaultJourneyState();
  const elmo = itemById('elmo')!;
  assert.deepEqual(availability(elmo, s, ctx({ gold: 100 })), { status: 'comprar', price: 600, canAfford: false });
  assert.equal(acquire(s, 'elmo', ctx({ gold: 100 })), 'Faltam 500 de ouro');
  const bought = acquire(s, 'elmo', ctx({ gold: 700 }));
  assert.ok(typeof bought !== 'string' && bought.goldSpent === 600 && bought.owned.includes('elmo'));

  assert.equal(availability(itemById('chapeu')!, s, ctx()).status, 'bau');
  assert.equal(availability(itemById('chapeu')!, s, ctx({ attrs: attrs({ INT: 50 }) })).status, 'liberar');

  const coroa = itemById('coroa')!;
  const locked = availability(coroa, s, ctx({ attrs: attrs({ DIS: 96 }), crystals: 3 }));
  assert.ok(locked.status === 'forja' && !locked.ready);
  const forged = acquire(s, 'coroa', ctx({ attrs: attrs({ DIS: 104 }), crystals: 3 }));
  assert.ok(typeof forged !== 'string' && forged.crystalsSpent === 3 && forged.owned.includes('coroa'));
  // Pena da fênix também pede 30 dias limpo depois de uma recaída.
  const fenix = availability(itemById('fenix')!, s, ctx({ attrs: attrs({ AGI: 90 }), crystals: 9, cleanAfterSlip: 12 }));
  assert.ok(fenix.status === 'forja' && !fenix.ready);
});

test('equipar: só o que tem, no espaço certo; segundo anel no nível 20', () => {
  let s = { ...defaultJourneyState(), owned: [...defaultJourneyState().owned, 'grimorio', 'polar', 'gato', 'bracelete', 'anelFoco', 'gota'] };
  assert.equal(equip(s, 'elmo', 'coroa', 1), 'Você ainda não tem este item');
  assert.equal(equip(s, 'elmo', 'grimorio', 1), 'Este item não vai neste espaço');
  assert.equal(equip(s, 'anel', 'grimorio', 1), 'Este item não vai neste espaço');
  assert.equal(equip(s, 'armadura', null, 1), 'Este espaço não pode ficar vazio');
  assert.equal(equip(s, 'anel2', 'anelFoco', 19), 'O segundo anel abre no nível 20');
  s = equip(s, 'magico', 'grimorio', 1) as typeof s;
  s = equip(s, 'anel', 'bracelete', 1) as typeof s;
  s = equip(s, 'anel2', 'anelFoco', 20) as typeof s;
  s = equip(s, 'colar', 'gota', 1) as typeof s;
  s = equip(s, 'pet', 'gato', 1) as typeof s;
  assert.equal(s.equipped.pet, 'gato');
  const bonus = equipmentBonus(s);
  assert.equal(bonus.xpByAttr.INT, 0.2);
  assert.equal(bonus.xpByAttr.FOR, 0.1);
  assert.equal(bonus.xpByAttr.RES, 0.1);
  s = equip(s, 'magico', 'polar', 1) as typeof s;
  assert.equal(equipmentBonus(s).xpAll, 0.1);
  // O mesmo anel não ocupa os dois espaços.
  s = equip(s, 'anel2', 'bracelete', 20) as typeof s;
  assert.equal(s.equipped.anel, null);
});

test('dados antigos: artefatos vão para o espaço novo (anel, colar ou mágico)', () => {
  const s = normalizeJourney({ owned: ['grimorio', 'bracelete', 'gota'], equipped: { armadura: 'aprendiz', artefato: 'gota', artefato2: 'grimorio' } });
  assert.equal(s.equipped.colar, 'gota');
  assert.equal(s.equipped.magico, 'grimorio');
  assert.equal(s.equipped.anel, null);
  assert.ok(!('artefato' in s.equipped));
  const r = normalizeJourney({ equipped: { artefato: 'bracelete', elmo: 'grimorio', armadura: 'nada' } });
  assert.equal(r.equipped.anel, 'bracelete');
  assert.equal(r.equipped.elmo, null);
  assert.equal(r.equipped.armadura, 'aprendiz');
});

test('itens de região: não se compram nem se forjam; o Codex diz a região', () => {
  const lamina = itemById('laminaOrdem')!;
  assert.deepEqual(availability(lamina, defaultJourneyState(), ctx({ attrs: attrs({ FOR: 999 }), crystals: 99, gold: 99999 })), { status: 'bau', unlock: [] });
});

test('pets e moradas: por nível, atributo e ouro', () => {
  const s = defaultJourneyState();
  assert.equal(acquirePlace('pet', 'gato', s, ctx({ level: 6 })), 'Ainda não liberado');
  assert.ok(typeof acquirePlace('pet', 'gato', s, ctx({ level: 7 })) !== 'string');
  assert.equal(acquirePlace('pet', 'coruja', s, ctx({ level: 30, petGoals: { coruja: { have: 79, need: 80 } } })), 'Ainda não liberado');
  assert.ok(typeof acquirePlace('pet', 'coruja', s, ctx({ petGoals: { coruja: { have: 80, need: 80 } } })) !== 'string');
  assert.equal(acquirePlace('pet', 'cavalo', s, ctx({ level: 12, attrs: attrs({ AGI: 49 }) })), 'Ainda não liberado');
  assert.equal(acquirePlace('morada', 'pedra', s, ctx({ level: 15, gold: 100 })), 'Faltam 500 de ouro');
  const home = acquirePlace('morada', 'pedra', s, ctx({ level: 15, gold: 600 }));
  assert.ok(typeof home !== 'string' && home.goldSpent === 600);
});

test('estado: backup antigo ou incompleto vira um estado válido', () => {
  assert.deepEqual(normalizeJourney(undefined), defaultJourneyState());
  const s = normalizeJourney({ owned: ['elmo', 3], goldSpent: -5, weather: 'limpo', avatar: { gender: 'x' } });
  assert.ok(s.owned.includes('aprendiz') && s.owned.includes('elmo'));
  assert.equal(s.goldSpent, 0);
  assert.equal(s.weather, 'limpo');
  assert.equal(s.avatar, null);
});

// ---------- Céu ----------

test('céu: manhã, tarde e noite pelo relógio', () => {
  const at = (h: number, m = 0) => phaseAt(new Date(2026, 10, 25, h, m));
  assert.equal(at(4, 59), 'noite');
  assert.equal(at(5), 'manha');
  assert.equal(at(15, 59), 'manha');
  assert.equal(at(16), 'tarde');
  assert.equal(at(18, 29), 'tarde');
  assert.equal(at(18, 30), 'noite');
});

test('céu: chuva em cerca de 1 dia a cada 5, sempre no mesmo dia; "sempre limpo" desliga', () => {
  const year = Array.from({ length: 1000 }, (_, i) => addDays('2026-01-01', i));
  const rainy = year.filter((x) => rainWindow(x));
  assert.ok(rainy.length > 150 && rainy.length < 250, `${rainy.length} dias de chuva em 1000`);
  assert.deepEqual(rainWindow(rainy[0]), rainWindow(rainy[0]));
  const w = rainWindow(rainy[0])!;
  const [y, m, dd] = rainy[0].split('-').map(Number);
  assert.equal(skyAt(new Date(y, m - 1, dd, w.start, 10), []).rain, true);
  assert.equal(skyAt(new Date(y, m - 1, dd, w.start, 10), [], 'limpo').rain, false);
  const after = skyAt(new Date(y, m - 1, dd, w.end, 10), []);
  assert.equal(after.rain, false);
  assert.equal(after.rainbow, after.phase !== 'noite');
});

test('céu: uma estrela por dia de uso nos últimos 30 dias', () => {
  assert.equal(starsTonight([...days(TODAY, 23), '2026-01-01'], TODAY), 23);
  assert.equal(starsTonight(days(TODAY, 90), TODAY), 30);
  assert.equal(skyAt(new Date(2026, 10, 25, 21), days(TODAY, 10)).stars, 10);
  assert.equal(skyAt(new Date(2026, 10, 25, 10), days(TODAY, 10)).stars, 0, 'de dia não tem estrela');
  assert.deepEqual(starPositions(5), starPositions(5));
  assert.ok(starPositions(30).every((s) => s.x >= 2 && s.x <= 98 && s.y >= 4 && s.y <= 74));
});

// ---------- Visitas ----------

test('visitas: abrir o app conta, com uma folga por semana', () => {
  // 2026-11-23 é segunda-feira. Uma semana inteira de visitas.
  const week = days('2026-11-29', 7);
  assert.deepEqual(visitStats(week, '2026-11-29'), { streak: 7, best: 7, total: 7, visitedToday: true });
  // Faltou um dia (a folga da semana): a sequência continua, só não conta o dia que faltou.
  const oneMiss = week.filter((d) => d !== '2026-11-25');
  assert.equal(visitStats(oneMiss, '2026-11-29').streak, 6);
  // Faltou dois dias na mesma semana: recomeça, mas o recorde fica.
  const twoMiss = oneMiss.filter((d) => d !== '2026-11-27');
  const st = visitStats([...days('2026-11-22', 10), ...twoMiss], '2026-11-29');
  assert.equal(st.streak, 2);
  assert.equal(st.best, 13, '13 a 24 seguidos, a folga no dia 25 e mais o dia 26');
  // Hoje ainda sem visita não quebra.
  assert.equal(visitStats(days('2026-11-28', 5), '2026-11-29').streak, 5);
  assert.equal(visitStats([], TODAY).streak, 0);
});

test('presente do dia: ouro crescente, baú no 7º dia e marcos', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6].map((n) => visitGift(n).gold), [10, 15, 20, 25, 30, 40]);
  assert.equal(visitGift(7).chest, 'bronze');
  assert.equal(visitGift(8).gold, 10, 'a tira recomeça');
  assert.equal(visitGift(14).milestone?.chest, 'prata');
  assert.equal(visitGift(30).milestone?.title, 'assidua');
});

test('N2.1: dados antigos ganham a Jornada vazia; avatar e clima vêm do backup', () => {
  const old = normalize({ ...emptyData(), journey: undefined });
  assert.equal(old.journey.avatar, null);
  assert.equal(old.journey.equipped.morada, 'cabana');
  const back = normalize({ ...emptyData(), journey: { avatar: { gender: 'm', skin: 'escura', hair: 'preto' }, weather: 'limpo' } });
  assert.deepEqual(back.journey.avatar, { gender: 'm', skin: 'escura', hair: 'preto', name: '' });
  assert.equal(back.journey.weather, 'limpo');
  assert.ok(back.journey.owned.includes('aprendiz'));
});

test('N2.1: boas-vindas dá botas, pet, 50 de ouro e 1 cristal', () => {
  const d = { ...emptyData(), settings: { ...emptyData().settings, journeyUnlockedAt: '2026-11-16' } };
  const st = welcomeState(d.journey, { gender: 'f', skin: 'clara', hair: 'ruivo', name: '  Lia ' }, 'gato', '2026-11-16');
  assert.equal(st.avatar?.name, 'Lia');
  assert.equal(st.equipped.pet, 'gato');
  assert.equal(st.equipped.botas, 'couro');
  assert.ok(st.owned.includes('couro') && st.owned.includes('gato'));
  const w0 = wallet(d, d.journey, '2026-11-16');
  const w1 = wallet(d, st, '2026-11-16');
  assert.equal(w1.gold - w0.gold, 50);
  assert.equal(w1.crystals - w0.crystals, 1);
  assert.equal(welcomeState(st, st.avatar!, 'cao', '2026-11-17').chests.length, 1, 'boas-vindas só uma vez');
});

test('N2.2: cartão no Início só com a Jornada desbloqueada, o Modo Jornada e a opção ligada', () => {
  const today = '2026-11-16';
  const d = emptyData();
  assert.equal(homeCard(d, today), null, 'bloqueada');
  d.settings.journeyUnlockedAt = today;
  assert.equal(homeCard(d, today), null, 'sem escolha ainda');
  d.settings.journeyChoice = 'depois';
  assert.equal(homeCard(d, today), null, 'Modo Jornada desligado');
  d.settings.journeyChoice = 'quero';
  const first = homeCard(d, today)!;
  assert.equal(first.status, 'Crie seu personagem para começar');
  assert.ok(first.dot);
  d.journey = welcomeState(d.journey, { gender: 'f', skin: 'media', hair: 'castanho', name: ' Lia ' }, 'gato', today);
  const card = homeCard(d, today)!;
  assert.equal(card.name, 'Lia');
  assert.equal(card.level, 1);
  assert.match(card.status, /^Faltam .* XP para o nível 2$/);
  assert.ok(card.pct >= 0 && card.pct <= 100);
  d.settings.journeyCard = false;
  assert.equal(homeCard(d, today), null, 'cartão desligado em Configurações');
  assert.equal(normalize({ ...d, settings: { ...d.settings, journeyCard: undefined } } as never).settings.journeyCard, true, 'dados antigos: ligado');
});

test('N2.3: "Desde a sua última visita" mostra só o que subiu, e o Início avisa as novidades', () => {
  const today = '2026-11-16';
  const d = emptyData();
  d.settings.journeyUnlockedAt = today;
  d.settings.journeyChoice = 'quero';
  d.journey = welcomeState(d.journey, { gender: 'f', skin: 'media', hair: 'castanho', name: 'Lia' }, 'gato', today);
  const before = snapshot(d, d.journey, today);
  assert.equal(sinceLastVisit(null, before), null, 'primeira visita: sem resumo');
  assert.equal(sinceLastVisit(before, before), null, 'nada mudou: sem resumo');
  const later = { ...before, date: '2026-11-19', xp: before.xp + 80, gold: before.gold + 12, attrs: { ...before.attrs, DIS: before.attrs.DIS + 2 }, chests: before.chests + 1 };
  const n = sinceLastVisit(before, later)!;
  assert.equal(n.days, 3);
  assert.equal(n.xp, 80);
  assert.equal(n.gold, 12);
  assert.deepEqual(n.attrs, [{ code: 'DIS', gain: 2 }]);
  assert.equal(n.chests, 1);
  assert.equal(newsLine(n), 'Novidades: +80 XP · 1 baú');
  // Gastar na loja não aparece como perda.
  assert.equal(sinceLastVisit(later, { ...later, gold: later.gold - 50 }), null);
  // Cartão do Início: com retrato antigo, as novidades vêm primeiro.
  d.journey = { ...d.journey, lastSeen: { ...snapshot(d, d.journey, today), gold: 0 } };
  assert.equal(homeCard(d, today)!.status, 'Novidades: +50 ouro');
  assert.ok(homeCard(d, today)!.dot);
  d.journey = { ...d.journey, lastSeen: snapshot(d, d.journey, today) };
  assert.doesNotMatch(homeCard(d, today)!.status, /^Novidades/);
  // Backup antigo: sem retrato.
  assert.equal(normalize({ ...d, journey: { ...d.journey, lastSeen: undefined } } as never).journey.lastSeen, null);
  assert.deepEqual(normalize(d).journey.lastSeen, d.journey.lastSeen);
});

test('N2.4: Arsenal mostra os seus primeiro e sem místicos; comprar gasta ouro e vestir troca o item', () => {
  const today = '2026-11-16';
  const d = emptyData();
  d.settings.journeyUnlockedAt = today;
  d.journey = welcomeState(d.journey, { gender: 'f', skin: 'media', hair: 'castanho', name: 'Lia' }, 'gato', today);
  const elmos = arsenalItems('elmo', d.journey);
  assert.ok(elmos.every((i) => i.rarity !== 'mistico'));
  assert.deepEqual(arsenalItems('botas', d.journey).slice(0, 2).map((i) => i.id).sort(), ['couro', 'sapatos']);
  const poor = shopContext(d, d.journey, today);
  assert.match(acquire(d.journey, 'capuz', poor) as string, /^Faltam /);
  const rich = { ...poor, gold: 1000 };
  const bought = acquire(d.journey, 'capuz', rich);
  assert.ok(typeof bought !== 'string');
  assert.equal(bought.goldSpent, d.journey.goldSpent + 150);
  assert.equal(arsenalItems('elmo', bought)[0].id, 'capuz');
  const worn = equip(bought, 'elmo', 'capuz', 1);
  assert.ok(typeof worn !== 'string' && worn.equipped.elmo === 'capuz');
});

test('N2.5: forjar exige atributos e cristais e gasta os cristais; título conquistado vale cristal', () => {
  const st = defaultJourneyState();
  const ready = ctx({ attrs: attrs({ AGI: 100 }), crystals: 3 });
  const after = acquire(st, 'aladas', ready);
  assert.notEqual(typeof after, 'string');
  assert.equal((after as ReturnType<typeof defaultJourneyState>).crystalsSpent, 3);
  assert.equal(typeof acquire(st, 'aladas', ctx({ attrs: attrs({ AGI: 99 }), crystals: 3 })), 'string');
  assert.equal(typeof acquire(st, 'aladas', ctx({ attrs: attrs({ AGI: 100 }), crystals: 2 })), 'string');
});

test('N2.6: presente do dia por abrir o app, uma vez por dia; 7º dia é baú; o ouro entra na carteira', () => {
  const days = Array.from({ length: 7 }, (_, i) => addDays('2026-11-22', -6 + i));
  const d = withData({ settings: { ...emptyData().settings, journeyUnlockedAt: '2026-11-01', visitDays: days } });
  const pend = pendingGifts(d, d.journey, '2026-11-22');
  assert.equal(pend.length, 7);
  assert.deepEqual(pend.map((g) => g.gold), [10, 15, 20, 25, 30, 40, 0]);
  assert.equal(pend[6].chest, 'bronze');
  const st = { ...d.journey, gifts: pend };
  assert.equal(pendingGifts(d, st, '2026-11-22').length, 0, 'não repete');
  assert.equal(wallet({ ...d, journey: st }, st, '2026-11-22').gold - wallet(d, d.journey, '2026-11-22').gold, 140);
  assert.ok(earnedChests({ ...d, journey: st }, '2026-11-22').some((c) => c.key === 'bronze:visita:2026-11-22'));
});

test('N2.6: pets novos com pelagens; nome e pelagem vêm do backup', () => {
  assert.equal(PETS.length, 16);
  for (const p of PETS) assert.match(petIcon(p.id, 'qualquer'), /^data:image\/svg\+xml,/);
  const s = normalizeJourney({ petNames: { gato: 'Mingau', x: 3 }, petStyle: { gato: 'laranja' } });
  assert.deepEqual(s.petNames, { gato: 'Mingau' });
  assert.deepEqual(s.petStyle, { gato: 'laranja' });
  assert.deepEqual(s.gifts, []);
});

test('N2.12: tocar no espaço passa pelos itens que tem e, quando pode, fica sem nada', () => {
  const s = { ...defaultJourneyState(), owned: [...defaultJourneyState().owned, 'capuz', 'elmo', 'couro', 'gato', 'cao'] };
  assert.equal(nextInSlot(s, 'elmo'), 'capuz');
  const s2 = { ...s, equipped: { ...s.equipped, elmo: 'capuz' } };
  assert.equal(nextInSlot(s2, 'elmo'), 'elmo');
  assert.equal(nextInSlot({ ...s, equipped: { ...s.equipped, elmo: 'elmo' } }, 'elmo'), null, 'sem elmo');
  assert.equal(nextInSlot(s, 'botas'), 'couro');
  assert.equal(nextInSlot({ ...s, equipped: { ...s.equipped, botas: 'couro' } }, 'botas'), 'sapatos', 'botas nunca ficam vazias');
  assert.equal(nextInSlot({ ...s, equipped: { ...s.equipped, pet: 'cao' } }, 'pet'), null);
  assert.equal(nextInSlot(s, 'morada'), 'cabana', 'uma casa só: continua nela');
});

test('N2.15: Arsenal só com o que tem (e o recém-liberado); Loja com o que se compra e quanto falta', () => {
  const st = defaultJourneyState();
  const w = wardrobeItems('armadura', st, ctx({ attrs: attrs({ SAB: 50 }) }));
  assert.ok(w.some((x) => x.item.id === 'aprendiz' && !x.isNew));
  assert.ok(w.some((x) => x.item.id === 'manto' && x.isNew), 'Manto arcano liberado por SAB 50');
  assert.ok(!w.some((x) => x.item.id === 'placas'), 'o que falta não aparece no Arsenal');
  const shop = shopList(st, ctx({ gold: 150 }));
  const capuz = shop.items.find((x) => x.item.id === 'capuz')!;
  assert.equal(capuz.missing, 0);
  const malha = shop.items.find((x) => x.item.id === 'malha')!;
  assert.equal(malha.missing, 550);
  assert.ok(shop.homes.some((h) => h.home.id === 'pedra' && h.level === 15));
  assert.ok(!shop.items.some((x) => x.item.id === 'aprendiz'), 'o que já tem não aparece na Loja');
});

test('N2.7: Codex mostra tudo, com dica do que falta; marcos de descoberta viram baús', () => {
  const d = withData({});
  const list = codexEntries(d, '2026-11-16');
  assert.ok(list.some((e) => e.id === 'aprendiz' && e.owned && e.hint === 'Seu'));
  const capuz = list.find((e) => e.id === 'capuz')!;
  assert.match(capuz.hint, /^Loja · 150 ouro/);
  const coroa = list.find((e) => e.id === 'coroa')!;
  assert.ok(coroa.hint.startsWith("Forja: DIS 100 + 3 cristais"));
  assert.ok(list.some((e) => e.cat === 'pet' && e.id === 'coruja' && e.need === 80));
  assert.ok(list.some((e) => e.cat === 'titulo'));
  const s = codexSummary(d.journey.owned);
  assert.equal(s.total, CODEX_IDS.length);
  const half = CODEX_IDS.slice(0, Math.ceil(CODEX_IDS.length / 2));
  const dd = withData({ journey: { ...d.journey, owned: half } });
  const keys = earnedChests(dd, '2026-11-16').map((c) => c.key);
  assert.ok(keys.includes('prata:codex:25') && keys.includes('dourado:codex:50') && !keys.includes('cristal:codex:75'));
});

test('N2.18a: mini games dão fichas (não ouro), só nos primeiros 30 min do dia; recorde guardado', () => {
  let st = defaultJourneyState();
  const r1 = finishGame(st, 'corrida', 350, 60, '2026-11-16');
  assert.equal(r1.fichas, 3);
  assert.equal(r1.record, true);
  st = r1.state;
  st = finishGame(st, 'respira', 1, 60, '2026-11-16').state;
  assert.equal(fichas(st), 5);
  assert.equal(minutesLeft(st, '2026-11-16'), 28);
  // Três partidas longas (uma partida conta no máximo 10 min): a última começa dentro dos 30 min e vale.
  st = finishGame(st, 'corrida', 2000, 600, '2026-11-16').state;
  st = finishGame(st, 'corrida', 10, 600, '2026-11-16').state;
  st = finishGame(st, 'corrida', 10, 480, '2026-11-16').state;
  assert.equal(fichas(st), 12);
  const r4 = finishGame(st, 'corrida', 600, 60, '2026-11-16');
  assert.equal(r4.fichas, 0, 'depois de 30 min, joga sem fichas');
  assert.equal(minutesLeft(r4.state, '2026-11-16'), 0);
  assert.equal(r4.state.games.records.corrida, 2000);
  assert.equal(finishGame(r4.state, 'corrida', 50, 30, '2026-11-17').fichas, 1, 'no outro dia volta a valer');
  // Fichas não entram no ouro; o ouro antigo dos jogos continua.
  const d = withData({});
  assert.equal(wallet({ ...d, journey: r4.state }, r4.state, '2026-11-16').gold, wallet(d, d.journey, '2026-11-16').gold);
  const old = normalizeJourney({ games: { records: {}, prizes: [{ day: '2026-11-10', game: 'corrida', gold: 14 }] } });
  assert.equal(wallet({ ...d, journey: old }, old, '2026-11-16').gold - wallet(d, d.journey, '2026-11-16').gold, 14);
  assert.equal(fichas({ ...r4.state, games: { ...r4.state.games, fichasSpent: 4 } }), 8);
  assert.deepEqual(normalizeJourney({}).games, { records: {}, prizes: [], plays: [], fichasSpent: 0, sudokuDays: [] });
});

test('abrir todos: mesmo resultado que abrir um por um, sem abrir duas vezes', () => {
  const s = defaultJourneyState();
  const cs = [
    { key: 'bronze:2026-11-07', kind: 'bronze' as const, date: '2026-11-07', reason: 'x' },
    { key: 'prata:2026-11-08', kind: 'prata' as const, date: '2026-11-08', reason: 'y' },
  ];
  const all = openChests(s, cs, '2026-11-16');
  let one = s;
  for (const c of cs) one = openChest(one, c, '2026-11-16').state;
  assert.deepEqual(all.state, one);
  assert.equal(all.records.length, 2);
  const again = openChests(all.state, cs, '2026-11-16');
  assert.equal(again.records.length, 0);
  assert.equal(again.state, all.state);
});

test('N2.16b: Memória e Pescaria dão fichas; marcas extras e conquistas no Codex', async () => {
  const { GAME_ACHIEVEMENTS, fichasFor } = await import('./jornada/games.ts');
  assert.equal(fichasFor('memoria', 80 + 25), 5);
  assert.equal(fichasFor('memoria', 30), 2);
  assert.equal(fichasFor('pescaria', 12), 3);
  let st = defaultJourneyState();
  st = finishGame(st, 'memoria', 110, 40, '2026-11-17', { memoria_pares: 8, memoria_sobra: 30 }).state;
  st = finishGame(st, 'pescaria', 11, 40, '2026-11-17', { pescaria_dourado: 1 }).state;
  st = finishGame(st, 'pescaria', 4, 40, '2026-11-17', { pescaria_dourado: 0 }).state;
  assert.equal(st.games.records.pescaria, 11, 'recorde é o melhor');
  assert.equal(st.games.records.pescaria_dourado, 1, 'marca extra também guarda a melhor');
  const done = GAME_ACHIEVEMENTS.filter((a) => a.have(st) >= a.need).map((a) => a.id);
  assert.deepEqual(done.sort(), ['dourado', 'memoria30', 'memoria8', 'pesca10']);
  const d = withData({ journey: st });
  const jogos = codexEntries(d, '2026-11-17').filter((e) => e.cat === 'jogo');
  assert.equal(jogos.length, GAME_ACHIEVEMENTS.length);
  assert.equal(jogos.filter((e) => e.owned).length, 4);
});

test('N2.8a: efeitos dos místicos contam desde que o item foi vestido', async () => {
  const { mysticExtras, wallet } = await import('./jornada/rules.ts');
  // equip registra a data; vestir de novo o mesmo item não muda a data.
  let st = { ...defaultJourneyState(), owned: [...defaultJourneyState().owned, 'cristal', 'coracao', 'aurora', 'estelar', 'olho', 'coroa'] };
  st = equip(st, 'armadura', 'cristal', 1, '2026-11-01') as typeof st;
  assert.equal(st.equippedAt.cristal, '2026-11-01');
  st = equip(st, 'armadura', 'cristal', 1, '2026-11-05') as typeof st;
  assert.equal(st.equippedAt.cristal, '2026-11-01');
  assert.equal(normalizeJourney({ equippedAt: { x: 'lixo', cristal: '2026-11-01' } }).equippedAt.cristal, '2026-11-01');
  assert.deepEqual(normalizeJourney({}).equippedAt, {});

  // Armadura de cristal: um dia perdido por semana não quebra a sequência de rotina (bronze aos 7 dias).
  const checks = days('2026-11-20', 8).filter((x) => x !== '2026-11-16');
  const sem = withData({ habits: [habit({ id: 'a', checks })] });
  const com = { ...sem, journey: st };
  const bronze = (dd: typeof sem) => earnedChests(dd, TODAY, 1).filter((c) => c.kind === 'bronze' && !c.key.includes(':visita:') && !c.key.includes('caixinha')).length;
  assert.equal(bronze(sem), 0, 'sem a armadura, o dia perdido quebra');
  assert.equal(bronze(com), 1, 'com a armadura, a sequência segue');

  // Coração: recaída depois de vestir não zera a contagem do baú de cristal.
  const vicio = habit({ id: 'q', name: 'Doce', kind: 'abandonar', startDate: '2026-11-01', slips: ['2026-11-12'] });
  const base = withData({ habits: [vicio] });
  const cor = equip({ ...st }, 'colar', 'coracao', 1, '2026-11-02');
  const cristais = (dd: typeof base) => earnedChests(dd, TODAY, 1).filter((c) => c.kind === 'cristal').map((c) => c.key.split(':').slice(2).join(':'));
  assert.ok(!cristais(base).includes('2026-11-01:14'), 'sem o coração, a recaída zera');
  assert.ok(cristais({ ...base, journey: cor as typeof st }).includes('2026-11-01:14'), 'com o coração, a contagem segue');

  // Espada da aurora: baú prata extra por nível novo depois de vestir.
  const sw = equip(st, 'arma', 'aurora', 1, TODAY) as typeof st;
  const lv = (n: number) => earnedChests({ ...sem, journey: sw }, TODAY, n).filter((c) => c.key.startsWith('prata:aurora:')).length;
  assert.ok(lv(5) >= 1, 'subiu de nível depois de vestir: baú extra');

  // Coroa, Olho e Cajado estelar: cristais e ouro a mais na carteira.
  const studies = habit({ id: 'e', name: 'Estudar', attrs: ['INT'], checks: ['2026-11-18', '2026-11-19', '2026-11-20'] });
  const rev: JournalEntry = { id: 'r1', createdAt: '2026-11-19T20:00:00', title: 'Revisão', summary: '', content: 'x', tag: 'Revisão' } as JournalEntry;
  const dd = withData({ habits: [studies], journal: [rev] });
  let s2 = equip(st, 'arma', 'estelar', 1, '2026-11-18') as typeof st;
  s2 = equip(s2, 'magico', 'olho', 1, '2026-11-18') as typeof st;
  const mx = mysticExtras(dd, s2, TODAY);
  assert.equal(mx.gold, 3, '+1 ouro por estudo');
  assert.equal(mx.crystals, 1, '+1 cristal pela revisão');
  assert.equal(wallet({ ...dd, journey: s2 }, s2, TODAY).crystalsEarned - wallet({ ...dd, journey: st }, st, TODAY).crystalsEarned, 1);
});

test('N2.8b: bônus de XP e ouro dos itens vestidos, desde o dia em que foram vestidos', async () => {
  const { journeyStats, baseStats, itemXp } = await import('./journey.ts');
  const { mysticExtras } = await import('./jornada/rules.ts');
  const ag = habit({ id: 'ag', name: 'Correr', kind: 'construir', attrs: ['AGI'], days: [0, 1, 2, 3, 4, 5, 6], checks: days('2026-11-24', 10) });
  const vicio = habit({ id: 'v', name: 'Doce', kind: 'abandonar', startDate: '2026-11-01', slips: ['2026-11-20'] });
  const owned = [...defaultJourneyState().owned, 'pena', 'polar', 'fenix', 'arcoVento', 'braceleteMercador', 'anelAurora'];
  const st0 = { ...defaultJourneyState(), owned };
  const d0 = withData({ habits: [ag, vicio] });
  assert.equal(itemXp({ ...d0, journey: st0 }, TODAY), 0, 'sem itens, sem bônus');

  // Pena do vento (+10% em Agilidade) vestida em 20/11: 5 dias de 20 XP → +10 XP.
  const pena = equip(st0, 'magico', 'pena', 1, '2026-11-20') as typeof st0;
  assert.equal(itemXp({ ...d0, journey: pena }, TODAY), 10);
  const s = journeyStats({ ...d0, journey: pena }, TODAY);
  assert.equal(s.xp, baseStats(d0, TODAY).xp + 10);
  assert.ok(s.sources.some((x) => x.id === 'itens' && x.xp === 10), 'aparece em "de onde veio"');

  // Pena da fênix vestida antes da recaída de 20/11: de 20 a 24/11 (5 dias de 20 XP) vale o dobro → +100.
  const fenix = equip(st0, 'magico', 'fenix', 1, '2026-11-19') as typeof st0;
  assert.equal(itemXp({ ...d0, journey: fenix }, TODAY), 100);

  // Estrela polar: +10% de tudo desde que vestiu.
  const polar = equip(st0, 'magico', 'polar', 1, '2026-11-21') as typeof st0;
  assert.equal(itemXp({ ...d0, journey: polar }, TODAY), Math.floor((baseStats(d0, TODAY).xp - baseStats(d0, '2026-11-20').xp) * 0.1));

  // Arco do vento: +1 ouro por missão de Agilidade; Anel da aurora dobra o presente do dia.
  const arco = equip(st0, 'arma', 'arcoVento', 1, '2026-11-22') as typeof st0;
  assert.equal(mysticExtras(d0, arco, TODAY).gold, 3);
  const anel = { ...(equip(st0, 'anel', 'anelAurora', 1, '2026-11-23') as typeof st0), gifts: [{ day: '2026-11-22', n: 1, gold: 10, chest: null }, { day: '2026-11-23', n: 2, gold: 15, chest: null }] };
  assert.equal(mysticExtras(d0, anel, TODAY).gold, 15);
});

test('Sudoku: desafio do dia válido, regras, +2 de INT por dia resolvido, fichas e conquistas', async () => {
  const { makeSudoku, isSolved, conflicts, sudokuStreak, SUDOKU_LEVELS } = await import('./jornada/sudoku.ts');
  const { attributes } = await import('./jornada/rules.ts');
  for (const l of SUDOKU_LEVELS) {
    const g = makeSudoku('2026-11-18', l.id);
    assert.ok(isSolved(g.solution), `solução válida (${l.id})`);
    assert.equal(g.puzzle.filter((v) => v === 0).length, l.holes);
    assert.ok(g.puzzle.every((v, i) => v === 0 || v === g.solution[i]), 'as dadas vêm da solução');
    assert.deepEqual(makeSudoku('2026-11-18', l.id), g, 'o mesmo desafio o dia todo');
  }
  assert.notDeepEqual(makeSudoku('2026-11-19', 'facil').solution, makeSudoku('2026-11-18', 'facil').solution, 'muda de um dia para o outro');
  const sol = makeSudoku('2026-11-18', 'medio').solution;
  const wrong = [...sol];
  wrong[1] = wrong[0];
  assert.ok(conflicts(wrong).has(1) && !isSolved(wrong));
  assert.equal(sudokuStreak(['2026-11-16', '2026-11-17', '2026-11-18'], '2026-11-18'), 3);

  // Resolver guarda o dia (uma vez), dá fichas e +2 de Inteligência por dia.
  let st = defaultJourneyState();
  const a = finishGame(st, 'sudoku', 20, 300, '2026-11-18', { sudoku: 20 });
  assert.equal(a.fichas, 3);
  st = finishGame(a.state, 'sudoku', 10, 200, '2026-11-18').state;
  assert.deepEqual(st.games.sudokuDays, ['2026-11-18'], 'duas vezes no mesmo dia contam uma');
  assert.equal(finishGame(st, 'sudoku', 0, 100, '2026-11-19').state.games.sudokuDays.length, 1, 'sem resolver, não conta');
  const base = withData({});
  assert.equal(attributes({ ...base, journey: st }, '2026-11-18').INT - attributes(base, '2026-11-18').INT, 2);
  assert.deepEqual(normalizeJourney({ games: { sudokuDays: ['2026-11-18', 'lixo', '2026-11-18'] } }).games.sudokuDays, ['2026-11-18']);
  assert.equal(normalizeJourney({}).games.sudokuDays.length, 0);
  // Conquistas no Codex.
  const e = codexEntries({ ...base, journey: st }, '2026-11-18').filter((x) => x.id.startsWith('jogo:sudoku'));
  assert.equal(e.length, 3);
  assert.ok(e.find((x) => x.id === 'jogo:sudoku1')?.owned);
});

test('Pulo nas nuvens: fichas pela altura, recorde e conquistas no Codex', () => {
  let st = defaultJourneyState();
  const r = finishGame(st, 'pulo', 230, 90, '2026-11-18', { pulo_moedas: 12 });
  assert.equal(r.fichas, 3, '1 + uma a cada 100 m');
  assert.ok(r.record);
  st = r.state;
  assert.equal(st.games.records.pulo, 230);
  assert.equal(st.games.records.pulo_moedas, 12);
  const e = codexEntries({ ...withData({}), journey: st }, '2026-11-18').filter((x) => x.id.startsWith('jogo:pulo'));
  assert.deepEqual(e.map((x) => [x.id, x.owned]), [['jogo:pulo100', true], ['jogo:pulo500', false], ['jogo:pulo10', true]]);
});
