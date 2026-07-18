import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

interface AntiRaidSettings {
  enabled: boolean;
}

const SETTINGS_FILE = (() => {
  try {
    if (!existsSync("/data")) mkdirSync("/data", { recursive: true });
    return "/data/antiraid.json";
  } catch {
    return join(process.cwd(), "antiraid.json");
  }
})();

let settings: AntiRaidSettings = {
  enabled: true,
};

function load(): void {
  try {
    if (!existsSync(SETTINGS_FILE)) return;

    const raw = readFileSync(SETTINGS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<AntiRaidSettings>;

    if (typeof parsed.enabled === "boolean") {
      settings.enabled = parsed.enabled;
    }
  } catch (error) {
    console.error("❌ Impossible de charger la configuration anti-raid :", error);
  }
}

function save(): void {
  try {
    writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
  } catch (error) {
    console.error("❌ Impossible de sauvegarder la configuration anti-raid :", error);
  }
}

load();

export function isAntiRaidEnabled(): boolean {
  return settings.enabled;
}

export function setAntiRaidEnabled(enabled: boolean): void {
  settings.enabled = enabled;
  save();
}
