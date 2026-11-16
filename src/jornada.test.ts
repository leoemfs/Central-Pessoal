import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, normalize, normalizeHabit } from './data.ts';
import { addExpense, type ExpenseInput } from './finance.ts';
import { addDays } from './utils.ts';
import type { AppData, Habit, JournalEntry } from './types.ts';
import { grid } from './jornada/art.ts';
import { HOMES, ITEMS, PETS, avatarGrid, homeGrid, itemById, itemGrid, itemIcon, petIcon } from './jornada/catalog.ts';
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
  pendingChests,
  titleProgress,
  visitGift,
  visitStats,
  wallet,
  welcomeState,
  pendingGifts,
  nextInSlot,
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

test('arte: todo item, pet e morada tem desenho no tamanho certo', () => {
  for (const it of ITEMS) {
    const g = itemGrid(it);
    assert.ok(g.length >= 12 && g.length <= 16, `${it.id}: até 16 linhas`);
    assert.ok(g.every((r) => r.length === 16), `${it.id}: 16 colunas`);
    assert.ok(g.flat().filter(Boolean).length > 20, `${it.id}: tem pixels`);
    assert.match(itemIcon(it), /^data:image\/svg\+xml,/);
  }
  for (const p of PETS) assert.match(petIcon(p.id), /^data:image\/svg\+xml,/);
  for (const h of HOMES) for (const phase of ['manha', 'tarde', 'noite', 'chuva'] as const) assert.ok(homeGrid(h.id, phase).flat().some(Boolean), `${h.id} ${phase}`);
});

test('arte: o avatar veste qualquer combinação no quadro 32×30', () => {
  const pick = (slot: string) => [null, ...ITEMS.filter((i) => i.slot === slot).map((i) => i.id)];
  for (const gender of ['f', 'm'] as const)
    for (const elmo of pick('elmo'))
      for (const arma of pick('arma')) {
        const g = avatarGrid({ gender, skin: 'media', hair: 'castanho' }, { elmo, arma, armadura: 'placas', botas: 'aladas' });
        assert.equal(g.length, 30);
        assert.ok(g.every((r) => r.length === 32));
      }
  // A arma aparece à direita do corpo (colunas além de 20).
  const armed = avatarGrid({ gender: 'f', skin: 'media', hair: 'castanho' }, { arma: 'espada' });
  assert.ok(armed.some((r) => r.slice(21).some(Boolean)));
  const bare = avatarGrid({ gender: 'f', skin: 'media', hair: 'castanho' }, {});
  assert.ok(bare.every((r) => r.slice(21).every((c) => !c)));
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

test('equipar: só o que tem, no espaço certo; segundo artefato no nível 20', () => {
  let s = { ...defaultJourneyState(), owned: [...defaultJourneyState().owned, 'grimorio', 'polar', 'gato'] };
  assert.equal(equip(s, 'elmo', 'coroa', 1), 'Você ainda não tem este item');
  assert.equal(equip(s, 'elmo', 'grimorio', 1), 'Este item não vai neste espaço');
  assert.equal(equip(s, 'armadura', null, 1), 'Este espaço não pode ficar vazio');
  assert.equal(equip(s, 'artefato2', 'polar', 19), 'O segundo artefato abre no nível 20');
  s = equip(s, 'artefato', 'grimorio', 1) as typeof s;
  s = equip(s, 'artefato2', 'polar', 20) as typeof s;
  s = equip(s, 'pet', 'gato', 1) as typeof s;
  assert.equal(s.equipped.pet, 'gato');
  const bonus = equipmentBonus(s);
  assert.equal(bonus.xpByAttr.INT, 0.1);
  assert.equal(bonus.xpAll, 0.1);
  // O mesmo artefato não ocupa os dois espaços.
  s = equip(s, 'artefato2', 'grimorio', 20) as typeof s;
  assert.equal(s.equipped.artefato, null);
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
