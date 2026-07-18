import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Message } from "discord.js";
import { isModerator } from "./modCheck.js";

interface AntiSpamSettings {
  enabled: boolean;
}

const SETTINGS_FILE = (() => {
  try {
    if (!existsSync("/data")) mkdirSync("/data", { recursive: true });
    return "/data/antispam.json";
  } catch {
    return join(process.cwd(), "antispam.json");
  }
})();

const SPAM_THRESHOLD = 6;
const SPAM_WINDOW_MS = 5_000;
const TIMEOUT_MS = 60_000;

let settings: AntiSpamSettings = {
  enabled: true,
};

const messageTracker = new Map<string, number[]>();

function load(): void {
  try {
    if (!existsSync(SETTINGS_FILE)) return;

    const raw = readFileSync(SETTINGS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<AntiSpamSettings>;

    if (typeof parsed.enabled === "boolean") {
      settings.enabled = parsed.enabled;
    }
  } catch (error) {
    console.error("❌ Impossible de charger la configuration anti-spam :", error);
  }
}

function save(): void {
  try {
    writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
  } catch (error) {
    console.error("❌ Impossible de sauvegarder la configuration anti-spam :", error);
  }
}

load();

export function isAntiSpamEnabled(): boolean {
  return settings.enabled;
}

export function setAntiSpamEnabled(enabled: boolean): void {
  settings.enabled = enabled;
  messageTracker.clear();
  save();
}

/**
 * Retourne true lorsque le message a été traité comme du spam.
 */
export async function handleAntiSpam(message: Message): Promise<boolean> {
  if (!settings.enabled) return false;
  if (!message.guild || !message.member) return false;
  if (message.author.bot) return false;
  if (isModerator(message.member)) return false;

  const now = Date.now();
  const key = `${message.guild.id}:${message.author.id}`;
  const recent = (messageTracker.get(key) ?? []).filter(
    (timestamp) => now - timestamp < SPAM_WINDOW_MS,
  );

  recent.push(now);
  messageTracker.set(key, recent);

  if (recent.length < SPAM_THRESHOLD) return false;

  messageTracker.delete(key);

  await message.delete().catch(() => {});

  const timedOut = await message.member
    .timeout(TIMEOUT_MS, "Anti-spam : trop de messages envoyés rapidement")
    .then(() => true)
    .catch((error) => {
      console.error(`Impossible de timeout ${message.author.tag} :`, error);
      return false;
    });

  const warning = await message.channel
    .send(
      timedOut
        ? `🚫 ${message.author}, tu as été timeout **1 minute** pour spam.`
        : `🚫 ${message.author}, spam détecté. Je n’ai pas pu appliquer le timeout.`,
    )
    .catch(() => null);

  if (warning) {
    setTimeout(() => warning.delete().catch(() => {}), 5_000);
  }

  return true;
}
