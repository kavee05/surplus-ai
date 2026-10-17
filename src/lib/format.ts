import type { ISODate } from "./types";

const DAY = 86_400_000;

function parse(d: ISODate): number {
  const [y, m, day] = d.split("-").map(Number);
  return Date.UTC(y, m - 1, day);
}

function toISO(ms: number): ISODate {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(d: ISODate, days: number): ISODate {
  return toISO(parse(d) + days * DAY);
}

/** Whole days from a to b (b minus a). */
export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((parse(b) - parse(a)) / DAY);
}

export function dateMs(d: ISODate): number {
  return parse(d);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtDate(d: ISODate): string {
  const [y, m, day] = d.split("-").map(Number);
  return `${day} ${MONTHS[m - 1]} ${y}`;
}

export function fmtShortDate(d: ISODate): string {
  const [, m, day] = d.split("-").map(Number);
  return `${day} ${MONTHS[m - 1]}`;
}

export function fmtMonth(d: ISODate): string {
  const [y, m] = d.split("-").map(Number);
  return `${MONTHS[m - 1]} ${String(y).slice(2)}`;
}

export function fmtNum(n: number, digits = 0): string {
  return n.toLocaleString("en-MY", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtRm(n: number): string {
  return `RM ${fmtNum(Math.round(n))}`;
}

export function fmtTonnes(t: number): string {
  return `${fmtNum(t, t < 10 ? 1 : 0)} t`;
}

export function fmtPct(f: number): string {
  return `${Math.round(f * 100)}%`;
}
