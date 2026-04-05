import type { GuildMember } from "discord.js";

export function isModerator(member: GuildMember | null): boolean {
  if (!member) return false;
  if (member.guild.ownerId === member.id) return true;
  if (member.permissions.has("Administrator")) return true;
  return member.roles.cache.some(r =>
    ["Modérateur", "Moderator", "Admin", "Staff", "Modo"].includes(r.name)
  );
}