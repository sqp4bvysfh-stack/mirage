import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

export type ConfigKey =
  | "botName"
  | "welcomeChannel"
  | "giveawayChannel"
  | "membresRole"
  | "boostChannel"
  | "demandeChannel"
  | "confessionChannel"
  | "confessionLog"
  | "lgRole"
  | "lgSalon"
  | "staffRole"
  | "abuseRole"
  | "modoRole"
  | "ownerUser"
  | "antiPubRole"
  | "logsChannel";

export type GuildConfig = Partial<Record<ConfigKey, string>>;

export const CONFIG_DESCRIPTIONS: Record<ConfigKey, string> = {
  botName:           "🤖 Nom de l’IA",
  welcomeChannel:    "👋 Salon de bienvenue",
  giveawayChannel:   "🎉 Salon giveaway",
  membresRole:       "👥 Rôle membres",
  boostChannel:      "💎 Salon annonce boost",
  demandeChannel:    "📋 Salon demandes rôle perso",
  confessionChannel: "🕵️ Salon confessions",
  confessionLog:     "📝 Salon logs confessions",
  lgRole:            "🐺 Rôle décoratif Loup-Garou",
  lgSalon:           "🌙 Salon Loup-Garou",
  staffRole:         "🎯 Rôle staff",
  abuseRole:         "⚠️ Rôle gestion staff",
  modoRole:          "🛡️ Rôle modérateur",
  ownerUser:         "👑 ID de l’owner",
  antiPubRole:       "🚫 Rôle à mentionner anti-pub",
  logsChannel:       "📋 Salon de logs",
};

const MAIN_GUILD_ID = "1362520000426152036";

const DEFAULT_CONFIG: GuildConfig = {
  botName:           " ChiChi",
  welcomeChannel:    "1523502660295069777",
  giveawayChannel:   "1528080830516170813",
  membresRole:       "1362527149378240814",
  boostChannel:      "1528077192615952584",
  demandeChannel:    "1528100158858858636",
  confessionChannel: "1528084269753438259",
  confessionLog:     "1528108255484707038",
  lgSalon:           "1528108478416031866",
  staffRole:         "1405987770891112589",
  abuseRole:         "1405980987418083491",
  modoRole:          "1528059662891618354",
};

let config: GuildConfig = { ...DEFAULT_CONFIG };

const CONFIG_FILE = (() => {
  try {
    if (!existsSync("/data")) mkdirSync("/data", { recursive: true });
    return "/data/no-chill-config.json";
  } catch {
    return join(process.cwd(), "no-chill-config.json");
  }
})();

function loadData(raw: string): void {
  const parsed = JSON.parse(raw) as GuildConfig | Record<string, GuildConfig>;

  // Accepte l’ancien format { guildId: {...} } pour garder les anciennes données.
  const legacy = parsed as Record<string, GuildConfig>;
  const loaded =
    legacy[MAIN_GUILD_ID] && typeof legacy[MAIN_GUILD_ID] === "object"
      ? legacy[MAIN_GUILD_ID]
      : (parsed as GuildConfig);

  config = { ...DEFAULT_CONFIG, ...loaded };
}

if (process.env.BOT_CONFIG) {
  try {
    loadData(process.env.BOT_CONFIG);
  } catch (error) {
    console.error("❌ BOT_CONFIG malformé :", error);
  }
}

try {
  if (existsSync(CONFIG_FILE)) {
    loadData(readFileSync(CONFIG_FILE, "utf-8"));
  }
} catch (error) {
  console.error("❌ Impossible de charger la configuration No Chill :", error);
}

function save(): void {
  try {
    writeFileSync(
      CONFIG_FILE,
      JSON.stringify(config, null, 2),
      "utf-8",
    );
  } catch (error) {
    console.error("❌ Impossible de sauvegarder la configuration No Chill :", error);
  }
}

// On garde guildId dans les signatures pour ne casser aucune commande existante.
export function getConfig(guildId: string): GuildConfig {
  if (guildId !== MAIN_GUILD_ID) return {};
  return { ...config };
}

export function setConfig(
  guildId: string,
  key: ConfigKey,
  value: string,
): void {
  if (guildId !== MAIN_GUILD_ID) return;

  config = {
    ...config,
    [key]: value,
  };

  save();
}

export function exportConfigJson(): string {
  return JSON.stringify(config);
}

export function extractId(value: string): string {
  const match = value.match(/^<[#@&]+(\d+)>$/);
  return match ? match[1] : value.trim();
}
