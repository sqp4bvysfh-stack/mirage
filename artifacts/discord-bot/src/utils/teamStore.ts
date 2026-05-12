import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Team {
  name:          string;
  ownerId:       string;
  members:       string[];
  coffre:        number;
  troupeLevel:   number;    // 0-5, augmente difficulté cassage cadenas
  cadenas:       boolean[]; // true = intact, false = cassé (longueur = 5 + cadenas supp)
  lastRepair:    number;    // timestamp dernier cadenas posé
  extraCadenas:  number;    // cadenas supplémentaires achetés au shop
}

type GuildTeams   = Record<string, Team>;  // teamName -> Team
type AllTeamsData = Record<string, GuildTeams>; // guildId -> GuildTeams

// ─── Stockage ─────────────────────────────────────────────────────────────────

const FILE  = "/data/teams.json";
const store: AllTeamsData = {};

try { Object.assign(store, JSON.parse(readFileSync(FILE, "utf-8"))); } catch {}

function save(): void {
  try {
    if (!existsSync("/data")) mkdirSync("/data", { recursive: true });
    writeFileSync(FILE, JSON.stringify(store, null, 2));
  } catch {}
}

// ─── API ─────────────────────────────────────────────────────────────────────

export function getGuildTeams(guildId: string): GuildTeams {
  store[guildId] ??= {};
  return store[guildId]!;
}

export function getTeam(guildId: string, name: string): Team | null {
  return store[guildId]?.[name.toLowerCase()] ?? null;
}

export function getUserTeam(guildId: string, userId: string): Team | null {
  const teams = store[guildId] ?? {};
  return Object.values(teams).find(t => t.members.includes(userId)) ?? null;
}

export function saveTeam(guildId: string, team: Team): void {
  store[guildId] ??= {};
  store[guildId]![team.name.toLowerCase()] = team;
  save();
}

export function deleteTeam(guildId: string, name: string): void {
  if (store[guildId]) delete store[guildId]![name.toLowerCase()];
  save();
}

export function createTeam(guildId: string, name: string, ownerId: string): Team {
  const team: Team = {
    name:         name.toLowerCase(),
    ownerId,
    members:      [ownerId],
    coffre:       0,
    troupeLevel:  0,
    cadenas:      Array(5).fill(true),
    lastRepair:   Date.now(),
    extraCadenas: 0,
  };
  store[guildId] ??= {};
  store[guildId]![name.toLowerCase()] = team;
  save();
  return team;
}

export function getLeaderboardTeams(guildId: string): { name: string; coffre: number }[] {
  const teams = store[guildId] ?? {};
  return Object.values(teams)
    .map(t => ({ name: t.name, coffre: t.coffre }))
    .sort((a, b) => b.coffre - a.coffre)
    .slice(0, 10);
}

export const TROUPE_LEVELS = [
  { name: "Sans troupes",    cadenasBonus: 0,    cost: 0       },
  { name: "Milice",          cadenasBonus: 10,   cost: 5_000   },
  { name: "Gardes",          cadenasBonus: 20,   cost: 15_000  },
  { name: "Soldats",         cadenasBonus: 30,   cost: 40_000  },
  { name: "Élite",           cadenasBonus: 40,   cost: 100_000 },
  { name: "Force spéciale",  cadenasBonus: 50,   cost: null    },
];

// Taux de réussite cassage cadenas = 50% - bonus troupes
export function tauxCassage(troupeLevel: number): number {
  const bonus = TROUPE_LEVELS[troupeLevel]?.cadenasBonus ?? 0;
  return Math.max(10, 50 - bonus);
}

// Réparation auto cadenas (1 par heure si coffre pas pillé)
export function repairCadenas(team: Team): Team {
  const now   = Date.now();
  const hours = Math.floor((now - team.lastRepair) / 3_600_000);
  if (hours <= 0) return team;
  const total = 5 + team.extraCadenas;
  for (let i = 0; i < hours; i++) {
    const idx = team.cadenas.findIndex(c => !c);
    if (idx === -1 || team.cadenas.length >= total) break;
    team.cadenas[idx] = true;
  }
  team.lastRepair = now;
  return team;
}
