import type { GuildMember } from "discord.js";

// ─── Serveur ──────────────────────────────────────────────
const MAIN_GUILD_ID = "1362520000426152036";

// ─── Rôles ────────────────────────────────────────────────
const OWNER_ROLE_ID         = "1362525559472652349";
const CO_OWNER_ROLE_ID      = "1405985277645946970";
const YONKO_ROLE_ID         = "1394977975862038548";
const GESTION_STAFF_ROLE_ID = "1405987770891112589";
const GESTION_ABUS_ROLE_ID  = "1405980987418083491";
const MODO_ROLE_ID          = "1528059662891618354";
const MEMBRE_ROLE_ID        = "1362527149378240814";

// ─── Vérifie si le membre fait partie de la modération ────
export function isModerator(member: GuildMember | null): boolean {
  if (!member) return false;
  if (member.guild.id !== MAIN_GUILD_ID) return false;

  if (member.guild.ownerId === member.id) return true;

  return (
    member.roles.cache.has(OWNER_ROLE_ID) ||
    member.roles.cache.has(CO_OWNER_ROLE_ID) ||
    member.roles.cache.has(YONKO_ROLE_ID) ||
    member.roles.cache.has(GESTION_STAFF_ROLE_ID) ||
    member.roles.cache.has(GESTION_ABUS_ROLE_ID) ||
    member.roles.cache.has(MODO_ROLE_ID)
  );
}

/**
 * Hiérarchie
 *
 * 7 — Propriétaire
 * 7 — Owner
 * 6 — Co Owner
 * 5 — Yonko
 * 4 — Gestion Staff
 * 3 — Gestion Abus
 * 2 — Modérateur
 * 1 — Membre
 * 0 — Aucun rôle
 */
export function getHierarchyLevel(member: GuildMember): number {
  if (member.guild.id !== MAIN_GUILD_ID) return 0;

  if (member.guild.ownerId === member.id) return 7;
  if (member.roles.cache.has(OWNER_ROLE_ID)) return 7;
  if (member.roles.cache.has(CO_OWNER_ROLE_ID)) return 6;
  if (member.roles.cache.has(YONKO_ROLE_ID)) return 5;
  if (member.roles.cache.has(GESTION_STAFF_ROLE_ID)) return 4;
  if (member.roles.cache.has(GESTION_ABUS_ROLE_ID)) return 3;
  if (member.roles.cache.has(MODO_ROLE_ID)) return 2;
  if (member.roles.cache.has(MEMBRE_ROLE_ID)) return 1;

  return 0;
}

// ─── Vérifie si un membre peut agir sur un autre ──────────
export function canActOn(
  executor: GuildMember,
  target: GuildMember
): boolean {
  if (
    executor.guild.id !== MAIN_GUILD_ID ||
    target.guild.id !== MAIN_GUILD_ID
  ) {
    return false;
  }

  return getHierarchyLevel(executor) > getHierarchyLevel(target);
}

// ─── Commandes ultra sensibles (Blacklist...) ─────────────
export function canUseBlacklist(member: GuildMember | null): boolean {
  if (!member) return false;
  if (member.guild.id !== MAIN_GUILD_ID) return false;

  return (
    member.guild.ownerId === member.id ||
    member.roles.cache.has(OWNER_ROLE_ID) ||
    member.roles.cache.has(CO_OWNER_ROLE_ID)
  );
}
