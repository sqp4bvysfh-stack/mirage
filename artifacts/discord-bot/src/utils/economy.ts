import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Metier = "aucun" | "braqueur" | "cambrioleur" | "cybervoleur" | "juge";

export interface ShopBuff {
  antirob?:      number; // timestamp expiry
  blindage?:     number;
  boostDaily?:   boolean;
  boostWork?:    number; // remaining uses
}

export interface UserEconomy {
  poche:             number;
  banque:            number;
  rep:               number;
  lastRepGiven:      Record<string, number>; // targetId -> timestamp
  metier:            Metier;
  livret:            number;
  livretLastUpdate:  number;
  tycoonLevel:       number;
  tycoonLastCollect: number;
  crypto:            Record<string, number>;
  lastDaily:         number;
  lastWork:          number;
  lastJob:           number;
  totalEarned:       number;
  buffs:             ShopBuff;
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

// ─── API ─────────────────────────────────────────────────────────────────────

const DEFAULTS: UserEconomy = {
  poche: 0, banque: 0, rep: 0, lastRepGiven: {},
  metier: "aucun", livret: 0, livretLastUpdate: 0,
  tycoonLevel: 0, tycoonLastCollect: 0,
  crypto: {}, lastDaily: 0, lastWork: 0, lastJob: 0,
  totalEarned: 0, buffs: {},
};

export function getUser(guildId: string, userId: string): UserEconomy {
  store[guildId] ??= {};
  if (!store[guildId][userId]) {
    const now = Date.now();
    store[guildId][userId] = { ...DEFAULTS, lastRepGiven: {}, buffs: {}, livretLastUpdate: now, tycoonLastCollect: now };
  }
  const u = store[guildId][userId]!;
  u.lastRepGiven ??= {};
  u.buffs        ??= {};
  u.rep          ??= 0;
  return u;
}

export function saveUser(guildId: string, userId: string, data: UserEconomy): void {
  store[guildId] ??= {};
  store[guildId][userId] = data;
  save();
}

export function getAllUsers(guildId: string): Record<string, UserEconomy> {
  return store[guildId] ?? {};
}

export function getLeaderboard(guildId: string, mode: "total" | "poche" | "rep"): { userId: string; value: number }[] {
  const users = store[guildId] ?? {};
  return Object.entries(users)
    .map(([userId, d]) => ({
      userId,
      value: mode === "poche" ? d.poche : mode === "rep" ? (d.rep ?? 0) : d.poche + d.banque + d.livret,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function fmt(n: number, monnaie = "🪙"): string {
  return `**${Math.floor(n).toLocaleString("fr-FR")}** ${monnaie}`;
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

export function isBooster(member: import("discord.js").GuildMember): boolean {
  return !!member.premiumSince;
}

// ─── Constantes ──────────────────────────────────────────────────────────────

export const DAILY_CD = 1 * 3600_000;   // 1h
export const WORK_CD  = 20 * 60_000;    // 20min
export const JOB_CD   = 1 * 3600_000;   // 1h
export const REP_CD   = 5 * 3600_000;   // 5h (4h si booster)
export const REP_CD_BOOSTER = 4 * 3600_000;
export const LIVRET_TAUX = 0.02;        // 2%/24h

export const METIER_PRIX: Record<Metier, number> = {
  aucun:       0,
  cambrioleur: 10,
  braqueur:    14,
  cybervoleur: 17,
  juge:        20,
};

export const TYCOON = [
  { name: "Vendeur de rue", rate: 50,     cost: 2_000   },
  { name: "Snack",          rate: 200,    cost: 8_000   },
  { name: "Restaurant",     rate: 600,    cost: 25_000  },
  { name: "Hôtel",          rate: 2_000,  cost: 80_000  },
  { name: "Casino",         rate: 7_000,  cost: 250_000 },
  { name: "Empire",         rate: 20_000, cost: null    },
];

export const CRYPTO_BASE: Record<string, number> = {
  BTC:  50_000,
  ETH:  3_000,
  DOGE: 0.15,
  PEPE: 0.00001,
};

const priceCache: Record<string, { p: number; t: number }> = {};

export function cryptoPrice(coin: string): number {
  const now = Date.now();
  const c   = priceCache[coin];
  if (c && now - c.t < 5 * 60_000) return c.p;
  const base      = CRYPTO_BASE[coin] ?? 1;
  const variation = 1 + (Math.random() - 0.5) * 0.12;
  const p         = Math.round(base * variation * 10000) / 10000;
  priceCache[coin] = { p, t: now };
  return p;
}

// ─── Livret auto-intérêts ────────────────────────────────────────────────────

export function applyLivretInterets(u: UserEconomy): UserEconomy {
  if (u.livret <= 0) { u.livretLastUpdate = Date.now(); return u; }
  const elapsed = Date.now() - u.livretLastUpdate;
  const days    = elapsed / 86_400_000;
  const gain    = Math.floor(u.livret * LIVRET_TAUX * days);
  if (gain > 0) { u.livret += gain; u.totalEarned += gain; }
  u.livretLastUpdate = Date.now();
  return u;
}
