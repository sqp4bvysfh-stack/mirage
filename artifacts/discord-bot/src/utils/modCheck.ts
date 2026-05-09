import type { GuildMember } from "discord.js";
import { getConfig } from "./serverConfig.js";

// ─── Defaults (MIRAGE) — utilisés si le serveur n'a pas configuré ses rôles ─
const DEFAULT_STAFF_ID = "1476396219314995331";
const DEFAULT_ABUS_ID  = "1476397435117899816";
const DEFAULT_MODO_ID  = "1476396357982883912";

function getModRoles(guildId: string): string[] {
  const cfg = getConfig(guildId);
  const configured = [cfg.staffRole, cfg.abuseRole, cfg.modoRole].filter(Boolean) as string[];
  return configured.length > 0
    ? configured
    : [DEFAULT_STAFF_ID, DEFAULT_ABUS_ID, DEFAULT_MODO_ID];
}

export function isModerator(member: GuildMember | null): boolean {
  if (!member) return false;
  if (member.guild.ownerId === member.id) return true;
  if (member.permissions.has("Administrator")) return true;
  return member.roles.cache.some(r => getModRoles(member.guild.id).includes(r.id));
}

/**
 * Hiérarchie du serveur
 * 5 — Owner
 * 4 — Staff (staffRole)
 * 3 — Admin (Administrator permission)
 * 2 — Gestion Abus (abuseRole)
 * 1 — Modo (modoRole)
 * 0 — Membre normal
 */
export function getHierarchyLevel(member: GuildMember): number {
  const cfg = getConfig(member.guild.id);
  const staffId = cfg.staffRole ?? DEFAULT_STAFF_ID;
  const abusId  = cfg.abuseRole ?? DEFAULT_ABUS_ID;
  const modoId  = cfg.modoRole  ?? DEFAULT_MODO_ID;

  if (member.guild.ownerId === member.id) return 5;
  if (member.roles.cache.has(staffId)) return 4;
  if (member.permissions.has("Administrator")) return 3;
  if (member.roles.cache.has(abusId)) return 2;
  if (member.roles.cache.has(modoId)) return 1;
  return 0;
}

export function canActOn(executor: GuildMember, target: GuildMember): boolean {
  return getHierarchyLevel(executor) > getHierarchyLevel(target);
}
