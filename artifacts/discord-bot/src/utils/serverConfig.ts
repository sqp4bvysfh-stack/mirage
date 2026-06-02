import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

// ─── Types ────────────────────────────────────────────────────────────────

export type ConfigKey =
  | "botName"           // Nom de l'IA
  | "welcomeChannel"    // Salon de bienvenue
  | "giveawayChannel"   // Salon giveaway
  | "membresRole"       // Rôle membres (lock / fermeture)
  | "boostChannel"      // Salon annonce boost
  | "demandeChannel"    // Salon demandes rôle perso
  | "confessionChannel" // Salon confessions
  | "confessionLog"     // Salon logs confessions
  | "lgRole"            // Rôle décoratif Loup-Garou
  | "lgSalon"           // Salon Loup-Garou
  | "staffRole"         // Rôle staff (tickets candidature)
  | "abuseRole"         // Rôle gestion abus (tickets signalement)
  | "modoRole"          // Rôle modérateur
  | "ownerUser"         // ID user de l'owner (tickets owner)
  | "antiPubRole"       // Rôle à mentionner dans l'anti-pub
  | "logsChannel";      // Salon de logs

export type GuildConfig = Partial<Record<ConfigKey, string>>;

export const CONFIG_DESCRIPTIONS: Record<ConfigKey, string> = {
  botName:           "🤖 Nom de l'IA",
  welcomeChannel:    "👋 Salon de bienvenue",
  giveawayChannel:   "🎉 Salon giveaway",
  membresRole:       "👥 Rôle membres",
  boostChannel:      "💎 Salon annonce boost",
  demandeChannel:    "📋 Salon demandes rôle perso",
  confessionChannel: "🕵 Salon confessions",
  confessionLog:     "📝 Salon logs confessions",
  lgRole:            "🐺 Rôle décoratif Loup-Garou",
  lgSalon:           "🌙 Salon Loup-Garou",
  staffRole:         "🎯 Rôle staff (tickets)",
  abuseRole:         "⚠️ Rôle gestion abus (tickets)",
  modoRole:          "🛡️ Rôle modérateur",
  ownerUser:         "👑 ID de l'owner (tickets)",
  antiPubRole:       "🚫 Rôle à mentionner anti-pub",
  logsChannel:       "📋 Salon de logs",
};

// ─── Stockage ─────────────────────────────────────────────────────────────

const store = new Map<string, GuildConfig>();

// ─── Config par défaut (sauvegardée dans le code) ─────────────────────────

const DEFAULT_CONFIGS: Record<string, GuildConfig> = {
 "1493627273302118551": {
    botName:           "Bissapienne",
    membresRole:       "1495371361911050333",
    welcomeChannel:    "1501292133384978583",
    giveawayChannel:   "1505432430809714800",
    logsChannel:       "1495371510544601200",
    modoRole:          "1495371336955203685",
    staffRole:         "1495371332357984306",
    abuseRole:         "1495371336032190604",
    antiPubRole:       "1495371325064089680",
    boostChannel:      "1495371458514259968",
    lgSalon:           "1511205119906283610",
    lgRole:            "1511205224503709746",
    ownerUser:         "1495371325064089680",
    demandeChannel:    "1502876718686539876",
  },

};

for (const [guildId, cfg] of Object.entries(DEFAULT_CONFIGS)) {
  store.set(guildId, cfg);
}

// ─── Fichier persistant ───────────────────────────────────────────────────

const CONFIG_FILE = (() => {
  try {
    if (!existsSync("/data")) mkdirSync("/data", { recursive: true });
    return "/data/server-config.json";
  } catch {
    return join(process.cwd(), "server-config.json");
  }
})();

function loadData(raw: string): void {
  const data = JSON.parse(raw) as Record<string, GuildConfig>;
  for (const [guildId, cfg] of Object.entries(data)) {
    store.set(guildId, { ...store.get(guildId), ...cfg });
  }
}

if (process.env.BOT_CONFIG) {
  try { loadData(process.env.BOT_CONFIG); } catch { /* malformé */ }
}

try {
  const raw = readFileSync(CONFIG_FILE, "utf-8");
  loadData(raw);
} catch { /* fichier inexistant */ }

function save(): void {
  const data: Record<string, GuildConfig> = {};
  for (const [guildId, cfg] of store) data[guildId] = cfg;
  const json = JSON.stringify(data, null, 2);
  try { writeFileSync(CONFIG_FILE, json); } catch { /* lecture seule */ }
}

// ─── API publique ──────────────────────────────────────────────────────────

export function getConfig(guildId: string): GuildConfig {
  return store.get(guildId) ?? {};
}

export function setConfig(guildId: string, key: ConfigKey, value: string): void {
  const existing = store.get(guildId) ?? {};
  store.set(guildId, { ...existing, [key]: value });
  save();
}

export function exportConfigJson(): string {
  const data: Record<string, GuildConfig> = {};
  for (const [guildId, cfg] of store) data[guildId] = cfg;
  return JSON.stringify(data);
}

export function extractId(value: string): string {
  const match = value.match(/^<[#@&]+(\d+)>$/);
  return match ? match[1] : value.trim();
}
