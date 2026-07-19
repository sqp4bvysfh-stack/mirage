import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";

import { join } from "node:path";

export interface BlacklistEntry {
  userId: string;
  reason: string;
  moderatorId: string;
  moderatorTag: string;
  createdAt: string;
}

type BlacklistData = Record<string, BlacklistEntry>;

const BLACKLIST_FILE = (() => {
  try {
    if (!existsSync("/data")) {
      mkdirSync("/data", {
        recursive: true,
      });
    }

    return "/data/blacklist.json";
  } catch {
    return join(
      process.cwd(),
      "blacklist.json",
    );
  }
})();

let blacklist: BlacklistData = {};

function loadBlacklist(): void {
  try {
    if (!existsSync(BLACKLIST_FILE)) {
      blacklist = {};
      return;
    }

    const raw = readFileSync(
      BLACKLIST_FILE,
      "utf-8",
    );

    const parsed = JSON.parse(
      raw,
    ) as BlacklistData;

    blacklist =
      parsed &&
      typeof parsed === "object"
        ? parsed
        : {};
  } catch (error) {
    console.error(
      "❌ Impossible de charger la blacklist :",
      error,
    );

    blacklist = {};
  }
}

function saveBlacklist(): void {
  try {
    writeFileSync(
      BLACKLIST_FILE,
      JSON.stringify(
        blacklist,
        null,
        2,
      ),
      "utf-8",
    );
  } catch (error) {
    console.error(
      "❌ Impossible de sauvegarder la blacklist :",
      error,
    );
  }
}

loadBlacklist();

export function getBlacklistEntry(
  userId: string,
): BlacklistEntry | null {
  return blacklist[userId] ?? null;
}

export function isBlacklisted(
  userId: string,
): boolean {
  return Boolean(
    blacklist[userId],
  );
}

export function getBlacklistEntries(): BlacklistEntry[] {
  return Object.values(
    blacklist,
  ).sort(
    (a, b) =>
      Date.parse(b.createdAt) -
      Date.parse(a.createdAt),
  );
}

export function addToBlacklist(
  entry: BlacklistEntry,
): void {
  blacklist[entry.userId] = entry;
  saveBlacklist();
}

export function removeFromBlacklist(
  userId: string,
): BlacklistEntry | null {
  const existing =
    blacklist[userId];

  if (!existing) {
    return null;
  }

  delete blacklist[userId];
  saveBlacklist();

  return existing;
}
