import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { isModerator, canActOn } from "../utils/modCheck.js";
import { sendServerLog } from "../utils/logs.js";

function parseDuration(str: string): number | null {
  const match = str.match(/^(\d+)(m|h|j)$/);
  if (!match) return null;
  const val = parseInt(match[1]);
  if (match[2] === "m") return val * 60 * 1000;
  if (match[2] === "h") return val * 60 * 60 * 1000;
  if (match[2] === "j") return val * 24 * 60 * 60 * 1000;
  return null;
}

export const tempbanCommand: Command = {
  name: "tempban",
  description: "Bannir temporairement un membre",
  usage: "*tempban @membre 1h/30m/1j [raison]",
  execute: async (message, args) => {
    if (!message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n'as pas la permission d'utiliser cette commande.");
      return;
    }
    const target = message.mentions.members?.first();
    if (!target) {
      await message.reply("❌ Mentionne un membre. Ex: `*tempban @membre 1h raison`");
      return;
    }
    const durStr = args[1];
    const duration = durStr ? parseDuration(durStr) : null;
    if (!duration) {
      await message.reply("❌ Durée invalide. Utilise `30m`, `1h`, `2j`, etc.");
      return;
    }
    if (!canActOn(message.member!, target)) {
      await message.reply("❌ Tu ne peux pas sanctionner quelqu'un de ton niveau ou au-dessus de toi dans la hiérarchie.");
      return;
    }
    if (!target.bannable) {
      await message.reply("❌ Je ne peux pas bannir ce membre.");
      return;
    }
    const raison = args.slice(2).join(" ") || "Aucune raison fournie";
    const userId = target.id;
    const guild = message.guild!;
    await target.ban({ reason: `[TEMPBAN] ${raison}` });

    setTimeout(async () => {
      await guild.members.unban(userId, "Fin du ban temporaire").catch(() => {});
    }, duration);

    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle("⏱️ Ban temporaire")
      .addFields(
        { name: "Membre", value: target.user.tag, inline: true },
        { name: "Durée", value: durStr, inline: true },
        { name: "Modérateur", value: message.author.tag, inline: true },
        { name: "Raison", value: raison }
      )
      .setTimestamp();
    await message.reply({ embeds: [embed] });
    await sendServerLog(guild, { embeds: [embed] });
  },
};
