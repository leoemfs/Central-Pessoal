/**
 * Vales (VR, VA): cartões de benefício com saldo e recarga mensal, sem fatura.
 * A recarga entra como receita (fonte "Vale-alimentação") e as compras como despesas já pagas, que descontam do saldo.
 */
import type { AppData, Income, VoucherCard } from './types.ts';
import { addDays, addMonths, clampDay, dayOf, daysInMonth, monthKey, sum, todayISO, stableId, uid } from './utils.ts';

export const VOUCHER_COLORS = ['#f97316', '#22c55e', '#ec4899', '#3b82f6', '#eab308', '#8b5cf6'];

type Rec = Record<string, unknown>;
const isRec = (x: unknown): x is Rec => typeof x === 'object' && x !== null && !Array.isArray(x);

export function normalizeVoucher(v: Rec): VoucherCard {
  const r = isRec(v.recharge) && typeof v.recharge.amount === 'number' && v.recharge.amount > 0 && typeof v.recharge.day === 'number' ? { amount: v.recharge.amount, day: Math.min(31, Math.max(1, Math.round(v.recharge.day))) } : null;
  return {
    id: v.id as string,
    name: typeof v.name === 'string' && v.name.trim() ? v.name : 'Vale',
    color: typeof v.color === 'string' ? v.color : VOUCHER_COLORS[0],
    recharge: r,
    startBalance: typeof v.startBalance === 'number' ? v.startBalance : 0,
    startDate: typeof v.startDate === 'string' ? v.startDate : todayISO(),
    recharged: Array.isArray(v.recharged) ? v.recharged.filter((m): m is string => typeof m === 'string') : [],
    createdAt: typeof v.createdAt === 'string' ? v.createdAt : new Date().toISOString(),
  };
}

export function newVoucher(p: { name: string; color: string; recharge: VoucherCard['recharge']; balance: number }, today: string = todayISO()): VoucherCard {
  // O mês do cadastro conta como já recarregado se a recarga dele já caiu (o saldo informado já inclui).
  const recharged = p.recharge && clampDay(monthKey(today), p.recharge.day) <= today ? [monthKey(today)] : [];
  return { id: uid(), name: p.name.trim(), color: p.color, recharge: p.recharge, startBalance: p.balance, startDate: today, recharged, createdAt: new Date().toISOString() };
}

/** Saldo: o informado no cadastro + recargas − compras pagas com o vale desde então. */
export function voucherBalance(d: Pick<AppData, 'incomes' | 'expenses'>, v: VoucherCard, today: string = todayISO()): number {
  const ins = d.incomes.filter((i) => i.voucherId === v.id && i.receivedAt && i.date >= v.startDate && i.date <= today).map((i) => i.amount);
  const outs = d.expenses.filter((e) => e.voucherId === v.id && e.dueDate >= v.startDate).map((e) => e.amount);
  return sum([v.startBalance, ...ins, ...outs.map((x) => -x)]);
}

/** Quanto foi gasto com o vale no mês. */
export function voucherMonthUsage(d: Pick<AppData, 'expenses'>, v: VoucherCard, month: string): number {
  return sum(d.expenses.filter((e) => e.voucherId === v.id && monthKey(e.dueDate) === month).map((e) => e.amount));
}

/** Próxima recarga (depois de hoje). */
export function nextRecharge(v: VoucherCard, today: string = todayISO()): string | null {
  if (!v.recharge) return null;
  const thisMonth = clampDay(monthKey(today), v.recharge.day);
  return thisMonth > today ? thisMonth : clampDay(addMonths(monthKey(today), 1), v.recharge.day);
}

/** Resumo para a tela: saldo, uso do mês, próxima recarga, quanto dá por dia e se está baixo. */
export function voucherStatus(d: Pick<AppData, 'incomes' | 'expenses'>, v: VoucherCard, today: string = todayISO()) {
  const balance = voucherBalance(d, v, today);
  const next = nextRecharge(v, today);
  const daysToNext = next ? Math.max(1, Math.round((new Date(`${next}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime()) / 864e5)) : null;
  return {
    balance,
    usedThisMonth: voucherMonthUsage(d, v, monthKey(today)),
    next,
    daysToNext,
    perDay: daysToNext ? Math.max(0, balance) / daysToNext : null,
    /** Menos de 10% da recarga. */
    low: v.recharge ? balance < v.recharge.amount * 0.1 : false,
  };
}

/** Fonte de receita das recargas ("Vale-alimentação"); cria se não existir. */
function voucherSource(d: AppData): { d: AppData; id: string } {
  const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const ex = d.incomeSources.find((s) => plain(s.name).startsWith('vale'));
  if (ex) return { d, id: ex.id };
  const src = { id: stableId('fonte', 'Vale-alimentação'), name: 'Vale-alimentação', icon: 'utensils', color: '#f97316' };
  return { d: { ...d, incomeSources: [...d.incomeSources, src] }, id: src.id };
}

/**
 * Lança as recargas que já caíram (até hoje), uma vez por mês, como receitas já recebidas.
 * Roda ao abrir o app, como as contas fixas.
 */
export function materializeVouchers(d: AppData, today: string = todayISO()): AppData {
  let next = d;
  const stamp = new Date().toISOString();
  for (const v of d.vouchers) {
    if (!v.recharge) continue;
    const added: Income[] = [];
    const months: string[] = [];
    for (let m = monthKey(v.startDate); m <= monthKey(today); m = addMonths(m, 1)) {
      const date = clampDay(m, v.recharge.day);
      if (date <= v.startDate || date > today || v.recharged.includes(m)) continue;
      months.push(m);
      added.push({ id: stableId(v.id, 'recarga', m), seriesId: null, installment: null, description: `Recarga · ${v.name}`, sourceId: '', amount: v.recharge.amount, date, receivedAt: date, createdAt: stamp, updatedAt: stamp, voucherId: v.id });
    }
    if (!added.length) continue;
    const src = voucherSource(next);
    next = {
      ...src.d,
      incomes: [...src.d.incomes, ...added.map((i) => ({ ...i, sourceId: src.id }))],
      vouchers: src.d.vouchers.map((x) => (x.id === v.id ? { ...x, recharged: [...x.recharged, ...months] } : x)),
    };
  }
  return next;
}

/** "Ajustar saldo": o saldo de hoje passa a ser o informado (compras e recargas de antes ficam no histórico). */
export function adjustVoucherBalance(id: string, balance: number, today: string = todayISO()) {
  return (d: AppData): AppData => ({
    ...d,
    vouchers: d.vouchers.map((v) => {
      if (v.id !== id) return v;
      // Compras e recargas de hoje já entram no saldo informado.
      const recharged = v.recharge && clampDay(monthKey(today), v.recharge.day) <= today && !v.recharged.includes(monthKey(today)) ? [...v.recharged, monthKey(today)] : v.recharged;
      return { ...v, startBalance: balance, startDate: addDays(today, 1), recharged };
    }),
  });
}

export const daysLeftInMonth = (today: string = todayISO()) => daysInMonth(monthKey(today)) - dayOf(today);
