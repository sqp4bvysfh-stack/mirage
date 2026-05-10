import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";

export const userinfoCommand: Command = {
  name: "userinfo",
  description: "Affiche les informations d'un membre.",
  usage: "*userinfo [@membre]",

  async execute(message) {
    const target = message.mentions.members?.first() ?? message.member;
    if (!target) {
      await message.reply("❌ Impossible de trouver ce membre.");
      return;
    }

    const user = target.user;
    const createdAt  = Math.floor(user.createdTimestamp / 1000);
    const joinedAt   = target.joinedTimestamp ? Math.floor(target.joinedTimestamp / 1000) : null;
    const roles      = target.roles.cache
      .filter(r => r.id !== message.guild!.id)
      .sort((a, b) => b.position - a.position)
      .map(r => `<@&${r.id}>`)
      .join(", ") || "Aucun";

    const badges: string[] = [];
    const flags = user.flags?.toArray() ?? [];
    if (flags.includes("Staff"))                   badges.push("👨‍💼 Staff Discord");
    if (flags.includes("Partner"))                 badges.push("🤝 Partenaire");
    if (flags.includes("HypeSquadOnlineHouse1"))   badges.push("🏠 HypeSquad Bravery");
    if (flags.includes("HypeSquadOnlineHouse2"))   badges.push("🏠 HypeSquad Brilliance");
    if (flags.includes("HypeSquadOnlineHouse3"))   badges.push("🏠 HypeSquad Balance");
    if (flags.includes("BugHunterLevel1"))         badges.push("🐛 Bug Hunter");
    if (flags.includes("BugHunterLevel2"))         badges.push("🐛 Bug Hunter Gold");
    if (flags.includes("ActiveDeveloper"))         badges.push("👨‍💻 Développeur actif");
    if (flags.includes("VerifiedDeveloper"))       badges.push("✅ Développeur vérifié");
    if (flags.includes("PremiumEarlySupporter"))   badges.push("💎 Early Supporter");
    if (target.premiumSince)                       badges.push("🚀 Booster");
    if (user.bot)                                  badges.push("🤖 Bot");

    const embed = new EmbedBuilder()
      .setColor(target.displayHexColor === "#000000" ? 0x5865f2 : (target.displayColor || 0x5865f2))
      .setTitle(`👤 ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "🆔 ID",             value: user.id,                                            inline: true  },
        { name: "📅 Compte créé",    value: `<t:${createdAt}:D> (<t:${createdAt}:R>)`,          inline: false },
        { name: "📥 A rejoint",      value: joinedAt ? `<t:${joinedAt}:D> (<t:${joinedAt}:R>)` : "Inconnu", inline: false },
        { name: `🏷️ Rôles (${target.roles.cache.size - 1})`, value: roles.slice(0, 1024),        inline: false },
      );

    if (badges.length > 0) {
      embed.addFields({ name: "🎖️ Badges", value: badges.join(" · ") });
    }

    embed.setImage(user.bannerURL({ size: 512 }) ?? null)
         .setFooter({ text: `Pseudo du serveur : ${target.displayName}` })
         .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
