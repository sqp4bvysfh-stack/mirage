import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";

export const serverprofileCommand: Command = {
  name: "serverprofile",
  description: "Affiche le profil visuel du serveur (icône & bannière GIF).",
  usage: "*serverprofile",

  async execute(message) {
    const guild = message.guild;
    if (!guild) return;

    await guild.fetch();

    const iconURL   = guild.iconURL({ size: 512, extension: "gif" })
                   ?? guild.iconURL({ size: 512 })
                   ?? message.client.user.displayAvatarURL({ size: 512 });

    const bannerURL = guild.bannerURL({ size: 1024, extension: "gif" })
                   ?? guild.bannerURL({ size: 1024 });

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`🖼️ Profil — ${guild.name}`)
      .setThumbnail(iconURL)
      .addFields(
        { name: "👥 Membres",     value: `${guild.memberCount}`,                                           inline: true },
        { name: "🚀 Boosts",      value: `${guild.premiumSubscriptionCount ?? 0} (Niv. ${guild.premiumTier})`, inline: true },
        { name: "📅 Créé le",     value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`,             inline: true },
      );

    if (guild.description) {
      embed.setDescription(guild.description);
    }

    if (bannerURL) {
      embed.setImage(bannerURL);
    }

    if (!guild.icon) {
      embed.setFooter({ text: "Ce serveur n'a pas d'icône personnalisée — image par défaut du bot utilisée." });
    }

    await message.reply({ embeds: [embed] });
  },
};
