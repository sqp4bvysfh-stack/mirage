import type { GuildMember } from "discord.js";

const GESTION_STAFF_ID = "1476396219314995331";
const GESTION_ABUS_ID  = "1476397435117899816";
const MODO_ID          = "1476396357982883912";

export const MODERATOR_ROLE_IDS = [
  GESTION_STAFF_ID,
  GESTION_ABUS_ID,
  MODO_ID,
];

export function isModerator(member: GuildMember | null): boolean {
  if (!member) return false;
  if (member.guild.ownerId === member.id) return true;
  if (member.permissions.has("Administrator")) return true;
  return member.roles.cache.some(r => MODERATOR_ROLE_IDS.includes(r.id));
}

/**
 * Hiérarchie du serveur (niveau le plus haut = peut agir sur tous les niveaux inférieurs)
 * 5 — Owner
 * 4 — Gestion Staff
 * 3 — Admin (permission Administrator)
 * 2 — Gestion Abus
 * 1 — Modo
 * 0 — Membre normal
 */
export function getHierarchyLevel(member: GuildMember): number {
  if (member.guild.ownerId === member.id) return 5;
  if (member.roles.cache.has(GESTION_STAFF_ID)) return 4;
  if (member.permissions.has("Administrator")) return 3;
  if (member.roles.cache.has(GESTION_ABUS_ID)) return 2;
  if (member.roles.cache.has(MODO_ID)) return 1;
  return 0;
}

/**
 * Retourne true si `executor` peut sanctionner `target`.
 * Un modérateur ne peut agir que sur quelqu'un de niveau strictement inférieur au sien.
 */
export function canActOn(executor: GuildMember, target: GuildMember): boolean {
  return getHierarchyLevel(executor) > getHierarchyLevel(target);
}
