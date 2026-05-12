import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

const FILE = "/data/ia-blocked.json";
const store: Record<string, string[]> = {}; // guildId -> channelId[]

try { Object.assign(store, JSON.parse(readFileSync(FILE, "utf-8"))); } catch {}

function save(): void {
  try {
    if (!existsSync("/data")) mkdirSync("/data", { recursive: true });
    writeFileSync(FILE, JSON.stringify(store, null, 2));
  } catch {}
}

export function isIaBlocked(guildId: string, channelId: string): boolean {
  return (store[guildId] ?? []).includes(channelId);
}

export function blockChannel(guildId: string, channelId: string): boolean {
  store[guildId] ??= [];
  if (store[guildId]!.includes(channelId)) return false;
  store[guildId]!.push(channelId);
  save();
  return true;
}

export function unblockChannel(guildId: string, channelId: string): boolean {
  if (!store[guildId]?.includes(channelId)) return false;
  store[guildId] = store[guildId]!.filter(id => id !== channelId);
  save();
  return true;
}

export function getBlockedChannels(guildId: string): string[] {
  return store[guildId] ?? [];
}
