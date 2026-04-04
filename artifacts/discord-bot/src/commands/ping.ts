import { SlashCommandBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../index.js";

export const pingCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Vérifie si le bot est en ligne et mesure la latence."),

  async execute(interaction: ChatInputCommandInteraction) {
    const sent = await interaction.reply({
      content: "🏓 Calcul en cours...",
      fetchReply: true,
    });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);
    await interaction.editReply(
      `🏓 **Pong !**\n⏱️ Latence : **${latency}ms**\n📡 API : **${apiLatency}ms**`
    );
  },
};
