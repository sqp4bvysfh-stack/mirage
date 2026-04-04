import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../index.js";

export const infoCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Affiche les informations du serveur."),

  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({
        content: "Cette commande doit être utilisée dans un serveur.",
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle(`📊 Informations — ${guild.name}`)
      .setThumbnail(guild.iconURL())
      .addFields(
        { name: "👑 Propriétaire", value: `<@${guild.ownerId}>`, inline: true },
        { name: "👥 Membres", value: `${guild.memberCount}`, inline: true },
        { name: "📅 Créé le", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
        { name: "💬 Salons", value: `${guild.channels.cache.size}`, inline: true },
        { name: "🎭 Rôles", value: `${guild.roles.cache.size}`, inline: true },
      )
      .setFooter({ text: `ID: ${guild.id}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
