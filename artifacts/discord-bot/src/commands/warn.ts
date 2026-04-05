import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";

const warnings = new Map<string, { raison: string; date: string }[]>();

export const warnCommand: Command = {
  name: "warn",
  description: "Avertir un membre",
  usage: "*warn @membre [raison] | *warn list @membre",
  execute: async (message, args) => {
    if (!message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n'as pas la permission d'utiliser cette commande.");
      return;
    }

    if (args[0] === "list") {
      const target = message.mentions.users.first();
      if (!target) {
        await message.reply("❌ Mentionne un membre. Ex: `*warn list @membre`");
        return;
      }
      const userWarns = warnings.get(target.id) ?? [];
      if (userWarns.length === 0) {
        await message.reply(`✅ ${target.tag} n'a aucun avertissement.`);
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(0xf39c12)
        .setTitle(`⚠️ Avertissements de ${target.tag}`)
        .setDescription(userWarns.map((w, i) => `**${i + 1}.** ${w.raison} — ${w.date}`).join("\n"))
        .setTimestamp();
      await message.reply({ embeds: [embed] });
      return;
    }

    const target = message.mentions.users.first();
    if (!target) {
      await message.reply("❌ Mentionne un membre. Ex: `*warn @membre raison`");
      return;
    }
    const raison = args.slice(1).join(" ") || "Aucune raison fournie";
    const date = new Date().toLocaleDateString("fr-FR");
    const userWarns = warnings.get(target.id) ?? [];
    userWarns.push({ raison, date });
    warnings.set(target.id, userWarns);

    const embed = new EmbedBuilder()
      .setColor(0xf39c12)
      .setTitle("⚠️ Avertissement")
      .addFields(
        { name: "Membre", value: target.tag, inline: true },
        { name: "Avertissement", value: `${userWarns.length}`, inline: true },
        { name: "Modérateur", value: message.author.tag, inline: true },
        { name: "Raison", value: raison }
      )
      .setTimestamp();
    await message.reply({ embeds: [embed] });
  },
};