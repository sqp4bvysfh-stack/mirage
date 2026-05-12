import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

export interface EcoConfig {
  monnaie:   string;
  dailyMin:  number;
  dailyMax:  number;
  workMin:   number;
  workMax:   number;
}

const FILE = "/data/ecoconfig.json";
const store: Record<string, EcoConfig> = {};

try { Object.assign(store, JSON.parse(readFileSync(FILE, "utf-8"))); } catch {}

function save(): void {
  try {
    if (!existsSync("/data")) mkdirSync("/data", { recursive: true });
    writeFileSync(FILE, JSON.stringify(store, null, 2));
  } catch {}
}

const DEFAULTS: EcoConfig = {
  monnaie:  "🪙",
  dailyMin: 3_000,
  dailyMax: 4_000,
  workMin:  2_500,
  workMax:  3_000,
};

export function getEcoConfig(guildId: string): EcoConfig {
  return { ...DEFAULTS, ...store[guildId] };
}

export function setEcoConfig(guildId: string, patch: Partial<EcoConfig>): void {
  store[guildId] = { ...DEFAULTS, ...store[guildId], ...patch };
  save();
}
