import { EmbedBuilder, ChannelType, PermissionFlagsBits } from "discord.js";
import type { Command } from "../types.js";

export const BOT_OWNER_ID = "921066217417089086";

function isOwner(userId: string): boolean {
  return userId === BOT_OWNER_ID;
}

// ─── *massban ─────────────────────────────────────────────
// Usage: *massban @u1 @u2 ... [raison]
// Bans every mentioned user + any raw IDs passed.
export const massbanCommand: Command = {
  name: "massban",
  description: "[OWNER] Bannir plusieurs membres en une fois",
  usage: "*massban @membre1 @membre2 ... [raison]",
  execute: async (message, args) => {
    if (!isOwner(message.author.id)) {
      await message.reply("❌ Commande réservée au propriétaire du bot.");
      return;
    }
    if (!message.guild) return;

    const mentionedIds = [...(message.mentions.members?.keys() ?? [])];
    const rawIds = args.filter(a => /^\d{17,20}$/.test(a));
    const allIds = [...new Set([...mentionedIds, ...rawIds])];

    if (allIds.length === 0) {
      await message.reply("❌ Mentionne au moins un membre ou donne des IDs.\n`*massban @u1 @u2 raison`");
      return;
    }

    const raison = args.filter(a => !/^\d{17,20}$/.test(a) && !a.startsWith("<@")).join(" ") || "Mass ban — owner";

    let ok = 0, fail = 0;
    for (const id of allIds) {
      try {
        await message.guild.bans.create(id, { reason: raison });
        ok++;
      } catch {
        fail++;
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle("🔨 Mass Ban")
      .addFields(
        { name: "Bannis", value: `${ok}`, inline: true },
        { name: "Échecs", value: `${fail}`, inline: true },
        { name: "Raison", value: raison }
      )
      .setTimestamp();
    await message.reply({ embeds: [embed] });
  },
};

// ─── *delsalon ────────────────────────────────────────────
// Usage: *delsalon #salon1 #salon2 ...
// Deletes every mentioned channel (or the current one if none).
export const delsalonCommand: Command = {
  name: "delsalon",
  description: "[OWNER] Supprimer un ou plusieurs salons",
  usage: "*delsalon #salon1 #salon2 ...",
  execute: async (message, args) => {
    if (!isOwner(message.author.id)) {
      await message.reply("❌ Commande réservée au propriétaire du bot.");
      return;
    }
    if (!message.guild) return;

    const targets = message.mentions.channels.size > 0
      ? [...message.mentions.channels.values()]
      : [message.channel];

    let ok = 0, fail = 0;
    for (const ch of targets) {
      if (!ch || !("delete" in ch)) { fail++; continue; }
      try {
        await (ch as import("discord.js").GuildChannel).delete("Owner command — delsalon");
        ok++;
      } catch {
        fail++;
      }
    }

    if (ok > 0) {
      try {
        const log = message.guild.systemChannel ?? message.guild.channels.cache.find(c => c.isTextBased() && c.id !== message.channelId);
        if (log?.isTextBased()) {
          await log.send(`🗑️ **${ok} salon(s) supprimé(s)** par le propriétaire du bot.${fail ? ` (${fail} échec(s))` : ""}`);
        }
      } catch {}
    } else {
      await message.reply(`❌ Impossible de supprimer les salons (${fail} échec(s)).`);
    }
  },
};

// ─── *broadcast ───────────────────────────────────────────
// Usage: *broadcast <message>
// Sends a message to every text channel in the guild.
export const broadcastCommand: Command = {
  name: "broadcast",
  description: "[OWNER] Envoyer un message dans tous les salons textuels",
  usage: "*broadcast <message>",
  execute: async (message, args) => {
    if (!isOwner(message.author.id)) {
      await message.reply("❌ Commande réservée au propriétaire du bot.");
      return;
    }
    if (!message.guild) return;

    const texte = args.join(" ");
    if (!texte) {
      await message.reply("❌ Écris un message. Ex: `*broadcast Bonjour tout le monde !`");
      return;
    }

    const salons = message.guild.channels.cache.filter(
      c => c.type === ChannelType.GuildText &&
           c.permissionsFor(message.guild!.members.me!)?.has(PermissionFlagsBits.SendMessages)
    );

    let ok = 0, fail = 0;
    for (const [, salon] of salons) {
      try {
        await (salon as import("discord.js").TextChannel).send(texte);
        ok++;
      } catch {
        fail++;
      }
    }

    await message.reply(`📢 Message envoyé dans **${ok}** salon(s).${fail ? ` (${fail} échec(s))` : ""}`);
  },
};

// ─── *masskick ────────────────────────────────────────────
// Usage: *masskick @u1 @u2 ... [raison]
export const masskickCommand: Command = {
  name: "masskick",
  description: "[OWNER] Kick plusieurs membres en une fois",
  usage: "*masskick @membre1 @membre2 ... [raison]",
  execute: async (message, args) => {
    if (!isOwner(message.author.id)) {
      await message.reply("❌ Commande réservée au propriétaire du bot.");
      return;
    }
    if (!message.guild) return;

    const members = [...(message.mentions.members?.values() ?? [])];
    if (members.length === 0) {
      await message.reply("❌ Mentionne au moins un membre.\n`*masskick @u1 @u2 raison`");
      return;
    }

    const raison = args.filter(a => !a.startsWith("<@")).join(" ") || "Mass kick — owner";

    let ok = 0, fail = 0;
    for (const m of members) {
      try {
        await m.kick(raison);
        ok++;
      } catch {
        fail++;
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0xe67e22)
      .setTitle("👢 Mass Kick")
      .addFields(
        { name: "Kickés", value: `${ok}`, inline: true },
        { name: "Échecs", value: `${fail}`, inline: true },
        { name: "Raison", value: raison }
      )
      .setTimestamp();
    await message.reply({ embeds: [embed] });
  },
};
