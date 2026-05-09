import { readFileSync, writeFileSync } from "node:fs";
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
  | "antiPubRole";      // Rôle à mentionner dans l'anti-pub

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
};

// ─── Stockage ─────────────────────────────────────────────────────────────

const CONFIG_FILE = join(process.cwd(), "server-config.json");
const store       = new Map<string, GuildConfig>();

// Charger au démarrage
try {
  const raw  = readFileSync(CONFIG_FILE, "utf-8");
  const data = JSON.parse(raw) as Record<string, GuildConfig>;
  for (const [guildId, cfg] of Object.entries(data)) {
    store.set(guildId, cfg);
  }
} catch { /* fichier inexistant au premier démarrage */ }

function save(): void {
  const data: Record<string, GuildConfig> = {};
  for (const [guildId, cfg] of store) data[guildId] = cfg;
  try { writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2)); }
  catch (err) { console.error("Erreur sauvegarde config:", err); }
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

/** Extrait un ID brut depuis une mention Discord ou renvoie la valeur telle quelle */
export function extractId(value: string): string {
  // <#channelId> | <@&roleId> | <@userId>
  const match = value.match(/^<[#@&]+(\d+)>$/);
  return match ? match[1] : value.trim();
}
