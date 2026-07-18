import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { canUseBlacklist } from "../utils/modCheck.js";
import {
  addToBlacklist,
  getBlacklistEntries,
  getBlacklistEntry,
  removeFromBlacklist,
} from "../utils/blacklist.js";

function extractUserId(value?: string): string | null {
  if (!value) return null;
  const match = value.match(/^<@!?(\d+)>$/);
  const id = match?.[1] ?? value;
  return /^\d{17,20}$/.test(id) ? id : null;
}

export const blCommand: Command = {
  name: "bl",
  description: "Ajoute un utilisateur à la blacklist permanente",
  usage: "*bl @membre [raison] | *bl list",

  execute: async (message, args) => {
    if (!message.guild || !message.member || !canUseBlacklist(message.member)) {
      await message.reply("❌ Seuls le propriétaire, Owner et Co Owner peuvent utiliser cette commande.");
      return;
    }

    if (args[0]?.toLowerCase() === "list") {
      const entries = getBlacklistEntries();
      if (entries.length === 0) {
        await message.reply("✅ La blacklist est vide.");
        return;
      }

      const shown = entries.slice(0, 20);
      const description = shown.map((entry, index) => {
        const date = Math.floor(Date.parse(entry.createdAt) / 1000);
        return (
          `**${index + 1}.** <@${entry.userId}> — \`${entry.userId}\`\n` +
          `> **Raison :** ${entry.reason}\n` +
          `> **Par :** <@${entry.moderatorId}> • <t:${date}:R>`
        );
      }).join("\n\n");

      const embed = new EmbedBuilder()
        .setColor(0x6d28d9)
        .setTitle(`⛔ Blacklist — ${entries.length} utilisateur(s)`)
        .setDescription(description)
        .setFooter({
          text: entries.length > shown.length
            ? `Affichage des ${shown.length} entrées les plus récentes.`
            : "Blacklist permanente de No Chill",
        })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      return;
    }

    const target = message.mentions.members?.first();
    if (!target) {
      await message.reply("❌ Mentionne un membre. Exemple : `*bl @membre raison`");
      return;
    }

    if (target.id === message.author.id) {
      await message.reply("❌ Tu ne peux pas te blacklist toi-même.");
      return;
    }

    if (target.id === message.client.user.id) {
      await message.reply("❌ Tu ne peux pas blacklist le bot.");
      return;
    }

    if (target.id === message.guild.ownerId) {
      await message.reply("❌ Le propriétaire du serveur ne peut pas être blacklisté.");
      return;
    }

    if (target.permissions.has("Administrator")) {
      await message.reply("❌ Tu ne peux pas blacklist un administrateur.");
      return;
    }

    if (!target.bannable) {
      await message.reply(
        "❌ Je ne peux pas bannir ce membre. Place le rôle du bot au-dessus du sien et vérifie la permission **Bannir des membres**.",
      );
      return;
    }

    const existing = getBlacklistEntry(target.id);
    if (existing) {
      await message.reply(`❌ <@${target.id}> est déjà blacklisté pour : **${existing.reason}**`);
      return;
    }

    const reason = args.slice(1).join(" ").trim() || "Aucune raison fournie";
    const entry = {
      userId: target.id,
      reason,
      moderatorId: message.author.id,
      moderatorTag: message.author.tag,
      createdAt: new Date().toISOString(),
    };

    addToBlacklist(entry);

    try {
      await target.ban({
        deleteMessageSeconds: 60 * 60 * 24,
        reason: `Blacklist par ${message.author.tag} : ${reason}`,
      });
    } catch (error) {
      removeFromBlacklist(target.id);
      console.error("Erreur blacklist/ban :", error);
      await message.reply("❌ Le bannissement a échoué, donc la blacklist n’a pas été enregistrée.");
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x6d28d9)
      .setTitle("⛔ Utilisateur blacklisté")
      .addFields(
        { name: "Utilisateur", value: `${target.user.tag}\n\`${target.id}\``, inline: true },
        { name: "Par", value: `${message.author.tag}\n<@${message.author.id}>`, inline: true },
        { name: "Raison", value: reason },
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};

export const unblCommand: Command = {
  name: "unbl",
  description: "Retire un utilisateur de la blacklist",
  usage: "*unbl ID",

  execute: async (message, args) => {
    if (!message.guild || !message.member || !canUseBlacklist(message.member)) {
      await message.reply("❌ Seuls le propriétaire, Owner et Co Owner peuvent utiliser cette commande.");
      return;
    }

    const userId = extractUserId(args[0]);
    if (!userId) {
      await message.reply("❌ Donne un ID valide. Exemple : `*unbl 123456789012345678`");
      return;
    }

    const removed = removeFromBlacklist(userId);
    if (!removed) {
      await message.reply(`❌ L’utilisateur \`${userId}\` n’est pas blacklisté.`);
      return;
    }

    let unbanned = false;
    try {
      await message.guild.bans.remove(userId, `Retrait blacklist par ${message.author.tag}`);
      unbanned = true;
    } catch {
      // Il pouvait déjà ne plus être banni : le retrait de blacklist reste valide.
    }

    await message.reply(
      `✅ <@${userId}> (\`${userId}\`) a été retiré de la blacklist` +
      (unbanned ? " et débanni." : "."),
    );
  },
};
