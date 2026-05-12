import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Metier = "aucun" | "braqueur" | "cambrioleur" | "policier" | "juge";

export interface UserEconomy {
  wallet:            number;
  livret:            number;
  livretLastUpdate:  number;
  metier:            Metier;
  tycoonLevel:       number;
  tycoonLastCollect: number;
  crypto:            Record<string, number>;
  lastDaily:         number;
  lastWork:          number;
  lastJob:           number;
  totalEarned:       number;
}

type GuildData   = Record<string, UserEconomy>;
type EconomyData = Record<string, GuildData>;

// ─── Stockage ─────────────────────────────────────────────────────────────────

const DATA_FILE = "/data/economy.json";
const store: EconomyData = {};

try {
  const raw = readFileSync(DATA_FILE, "utf-8");
  Object.assign(store, JSON.parse(raw));
} catch {}

function save(): void {
  try {
    if (!existsSync("/data")) mkdirSync("/data", { recursive: true });
    writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
  } catch {}
}

// ─── API publique ─────────────────────────────────────────────────────────────

const DEFAULTS: UserEconomy = {
  wallet: 0, livret: 0, livretLastUpdate: 0,
  metier: "aucun", tycoonLevel: 0, tycoonLastCollect: 0,
  crypto: {}, lastDaily: 0, lastWork: 0, lastJob: 0, totalEarned: 0,
};

export function getUser(guildId: string, userId: string): UserEconomy {
  store[guildId] ??= {};
  if (!store[guildId][userId]) {
    const now = Date.now();
    store[guildId][userId] = { ...DEFAULTS, livretLastUpdate: now, tycoonLastCollect: now };
  }
  return store[guildId][userId]!;
}

export function saveUser(guildId: string, userId: string, data: UserEconomy): void {
  store[guildId] ??= {};
  store[guildId][userId] = data;
  save();
}

export function addCoins(guildId: string, userId: string, amount: number): void {
  const u = getUser(guildId, userId);
  u.wallet += amount;
  if (amount > 0) u.totalEarned += amount;
  saveUser(guildId, userId, u);
}

export function getLeaderboard(guildId: string): { userId: string; total: number }[] {
  if (!store[guildId]) return [];
  return Object.entries(store[guildId])
    .map(([userId, d]) => ({ userId, total: d.wallet + d.livret }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function fmt(n: number): string {
  return `**${Math.floor(n).toLocaleString("fr-FR")}** 🪙`;
}

export function cooldownLeft(last: number, cd: number): string | null {
  const left = last + cd - Date.now();
  if (left <= 0) return null;
  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

export const DAILY_AMOUNT  = 500;
export const DAILY_CD      = 24 * 3600_000;
export const WORK_CD       = 30 * 60_000;
export const JOB_CD        = 60 * 60_000;
export const LIVRET_TAUX   = 0.02; // 2% / 24h

export const TYCOON = [
  { name: "Vendeur de rue",  rate: 50,    cost: 2_000 },
  { name: "Snack",           rate: 200,   cost: 8_000 },
  { name: "Restaurant",      rate: 600,   cost: 25_000 },
  { name: "Hôtel",           rate: 2_000, cost: 80_000 },
  { name: "Casino",          rate: 7_000, cost: 250_000 },
  { name: "Empire",          rate: 20_000, cost: null },
];

// Crypto — prix de base (en coins du bot, pas en €)
export const CRYPTO_BASE: Record<string, number> = {
  BTC:  50_000,
  ETH:  3_000,
  DOGE: 0.15,
  PEPE: 0.00001,
};

const priceCache: Record<string, { p: number; t: number }> = {};

export function cryptoPrice(coin: string): number {
  const now = Date.now();
  const c = priceCache[coin];
  if (c && now - c.t < 5 * 60_000) return c.p;
  const base = CRYPTO_BASE[coin] ?? 1;
  const variation = 1 + (Math.random() - 0.5) * 0.12;
  const p = Math.round(base * variation * 1000) / 1000;
  priceCache[coin] = { p, t: now };
  return p;
}
