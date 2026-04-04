import { SlashCommandBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../types.js";

export const pingCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Vérifie si le bot est en ligne et mesure la latence."),

  async execute(interaction: ChatInputCommandInteraction) {
    const before = Date.now();
    await interaction.reply({ content: "🏓 Calcul en cours..." });
    const latency = Date.now() - before;
    const apiLatency = Math.round(interaction.client.ws.ping);
    await interaction.editReply(
      `🏓 **Pong !**\n⏱️ Latence : **${latency}ms**\n📡 API : **${apiLatency}ms**`
    );
  },
};
