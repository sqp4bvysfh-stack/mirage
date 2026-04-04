import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";

export const infoCommand: Command = {
  name: "info",
  description: "Affiche les informations du serveur.",
  usage: "*info",

  async execute(message) {
    const guild = message.guild;
    if (!guild) {
      await message.reply("Cette commande doit être utilisée dans un serveur.");
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle(`📊 Informations — ${guild.name}`)
      .setThumbnail(guild.iconURL())
      .addFields(
        { name: "👑 Propriétaire", value: `<@${guild.ownerId}>`, inline: true },
        { name: "👥 Membres", value: `${guild.memberCount}`, inline: true },
        {
          name: "📅 Créé le",
          value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`,
          inline: true,
        },
        { name: "💬 Salons", value: `${guild.channels.cache.size}`, inline: true },
        { name: "🎭 Rôles", value: `${guild.roles.cache.size}`, inline: true }
      )
      .setFooter({ text: `ID: ${guild.id}` })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
