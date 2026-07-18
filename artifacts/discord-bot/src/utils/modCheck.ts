import type { GuildMember } from "discord.js";

const MAIN_GUILD_ID = "1362520000426152036";

const OWNER_ROLE_ID               = "1362525559472652349";
const CO_OWNER_ROLE_ID            = "1405985277645946970";
const PERM_BOT_ROLE_ID            = "1394977975862038548";
const GESTION_STAFF_ROLE_ID       = "1405987770891112589";
const BVTMAN_ROLE_ID              = "1405980987418083491";
const GESTION_MODO_ROLE_ID        = "1528111672743694437";
const MODO_ROLE_ID                = "1528059662891618354";
const GESTION_SURVEILLANT_ROLE_ID = "1408464940783894611";
const SURVEILLANT_ROLE_ID         = "1528110697047654410";
const SUPPORT_ROLE_ID             = "1528114226625904860";
const MEMBRE_ROLE_ID              = "1362527149378240814";
const JAIL_ROLE_ID                = "1514981124903010405";

type HierarchyRole = {
  roleId: string;
  level: number;
};

const HIERARCHY: HierarchyRole[] = [
  { roleId: OWNER_ROLE_ID,               level: 10 },
  { roleId: CO_OWNER_ROLE_ID,            level: 9 },
  { roleId: PERM_BOT_ROLE_ID,            level: 8 },
  { roleId: GESTION_STAFF_ROLE_ID,       level: 7 },
  { roleId: BVTMAN_ROLE_ID,              level: 6 },
  { roleId: GESTION_MODO_ROLE_ID,        level: 5 },
  { roleId: MODO_ROLE_ID,                level: 4 },
  { roleId: GESTION_SURVEILLANT_ROLE_ID, level: 3 },
  { roleId: SURVEILLANT_ROLE_ID,         level: 2 },
  { roleId: SUPPORT_ROLE_ID,             level: 1 },
  { roleId: MEMBRE_ROLE_ID,              level: 0 },
];

export function isModerator(member: GuildMember | null): boolean {
  if (!member) return false;
  if (member.guild.id !== MAIN_GUILD_ID) return false;
  if (member.roles.cache.has(JAIL_ROLE_ID)) return false;
  if (member.guild.ownerId === member.id) return true;

  return HIERARCHY
    .filter((entry) => entry.level >= 1)
    .some((entry) => member.roles.cache.has(entry.roleId));
}

/**
 * 11 — Propriétaire du serveur
 * 10 — Owner
 * 9  — Co Owner
 * 8  — Perm Bot
 * 7  — Gestion Staff
 * 6  — Bvtman
 * 5  — Gestion Modo
 * 4  — Modo
 * 3  — Gestion Surveillant
 * 2  — Surveillants
 * 1  — Supports
 * 0  — Membres
 * -1 — Jail
 */
export function getHierarchyLevel(member: GuildMember): number {
  if (member.guild.id !== MAIN_GUILD_ID) return -2;

  // Jail est prioritaire, même si d'autres rôles sont encore présents.
  if (member.roles.cache.has(JAIL_ROLE_ID)) return -1;
  if (member.guild.ownerId === member.id) return 11;

  for (const entry of HIERARCHY) {
    if (member.roles.cache.has(entry.roleId)) {
      return entry.level;
    }
  }

  return -2;
}

export function canActOn(
  executor: GuildMember,
  target: GuildMember,
): boolean {
  if (executor.guild.id !== MAIN_GUILD_ID) return false;
  if (target.guild.id !== MAIN_GUILD_ID) return false;
  if (executor.guild.id !== target.guild.id) return false;
  if (executor.id === target.id) return false;

  return getHierarchyLevel(executor) > getHierarchyLevel(target);
}

export function canUseBlacklist(member: GuildMember | null): boolean {
  if (!member) return false;
  if (member.guild.id !== MAIN_GUILD_ID) return false;
  if (member.roles.cache.has(JAIL_ROLE_ID)) return false;

  return (
    member.guild.ownerId === member.id ||
    member.roles.cache.has(OWNER_ROLE_ID) ||
    member.roles.cache.has(CO_OWNER_ROLE_ID)
  );
}

export { JAIL_ROLE_ID };
