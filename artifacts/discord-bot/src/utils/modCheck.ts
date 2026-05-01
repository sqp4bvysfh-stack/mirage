import type { GuildMember } from "discord.js";

const MODERATOR_ROLE_IDS = [
  "1476396219314995331", // Gestion Staff
  "1476397435117899816", // Gestion Abus
  "1476396357982883912", // Modo
];

export function isModerator(member: GuildMember | null): boolean {
  if (!member) return false;
  if (member.guild.ownerId === member.id) return true;
  if (member.permissions.has("Administrator")) return true;
  return member.roles.cache.some(r => MODERATOR_ROLE_IDS.includes(r.id));
}
