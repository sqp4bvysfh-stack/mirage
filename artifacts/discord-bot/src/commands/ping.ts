import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";

export const pingCommand: Command = {
  name: "ping",
  description: "Vérifie si le bot est en ligne et mesure la latence.",
  usage: "*ping",

  async execute(message) {
    const before = Date.now();
    const sent = await message.reply("🏓 Calcul en cours...");
    const latency = Date.now() - before;
    const apiLatency = Math.round(message.client.ws.ping);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("🏓 Pong !")
      .addFields(
        { name: "⏱️ Latence", value: `**${latency}ms**`, inline: true },
        { name: "📡 API Discord", value: `**${apiLatency}ms**`, inline: true }
      );

    await sent.edit({ content: "", embeds: [embed] });
  },
};
