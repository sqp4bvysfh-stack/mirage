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
  confessionChannel: "🕵️ Salon confessions",
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

// /data est un volume persistant sur Railway (survit aux redéploiements).
// Si le dossier n'existe pas (dev local), on retombe sur le répertoire courant.
const CONFIG_FILE = (() => {
  try {
    if (!existsSync("/data")) mkdirSync("/data", { recursive: true });
    return "/data/server-config.json";
  } catch {
    return join(process.cwd(), "server-config.json");
  }
})();
const store       = new Map<string, GuildConfig>();

function loadData(raw: string): void {
  const data = JSON.parse(raw) as Record<string, GuildConfig>;
  for (const [guildId, cfg] of Object.entries(data)) {
    store.set(guildId, cfg);
  }
}

// 1. Charger depuis la variable d'env BOT_CONFIG (persiste sur Railway)
if (process.env.BOT_CONFIG) {
  try { loadData(process.env.BOT_CONFIG); } catch { /* malformé */ }
}

// 2. Fusionner avec le fichier local (plus récent que l'env si le bot a tourné)
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

/** Retourne la config complète encodée en JSON — à coller dans BOT_CONFIG sur Railway */
export function exportConfigJson(): string {
  const data: Record<string, GuildConfig> = {};
  for (const [guildId, cfg] of store) data[guildId] = cfg;
  return JSON.stringify(data);
}

/** Extrait un ID brut depuis une mention Discord ou renvoie la valeur telle quelle */
export function extractId(value: string): string {
  const match = value.match(/^<[#@&]+(\d+)>$/);
  return match ? match[1] : value.trim();
}
