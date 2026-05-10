import { EmbedBuilder, ChannelType, PermissionFlagsBits } from "discord.js";
import type { Command } from "../types.js";

export const BOT_OWNER_ID = "921066217417089086";

function isOwner(userId: string): boolean {
  return userId === BOT_OWNER_ID;
}

// ─── *massban ─────────────────────────────────────────────
// Usage: *massban @role [raison]   → ban tous les membres du rôle
//        *massban @u1 @u2 [raison] → ban les membres mentionnés
export const massbanCommand: Command = {
  name: "massban",
  description: "[OWNER] Bannir tous les membres d'un rôle (ou membres mentionnés)",
  usage: "*massban @role [raison]",
  execute: async (message, args) => {
    if (!isOwner(message.author.id)) {
      await message.reply("❌ Commande réservée au propriétaire du bot.");
      return;
    }
    if (!message.guild) return;

    if (!message.guild.members.me?.permissions.has(PermissionFlagsBits.BanMembers)) {
      await message.reply("❌ Le bot n'a pas la permission **Bannir des membres** sur ce serveur.");
      return;
    }

    const role = message.mentions.roles.first();
    const raison = args.filter(a => !a.startsWith("<")).join(" ") || "Mass ban — owner";

    let targets: string[] = [];

    if (role) {
      await message.guild.members.fetch();
      targets = role.members.map(m => m.id);
    } else {
      targets = [...(message.mentions.members?.keys() ?? [])];
    }

    if (targets.length === 0) {
      await message.reply("❌ Mentionne un rôle ou des membres.\n`*massban @role raison`");
      return;
    }

    const msg = await message.reply(`⏳ Ban en cours de **${targets.length}** membres...`);

    let ok = 0, fail = 0;
    for (const id of targets) {
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
        { name: "Cible", value: role ? `<@&${role.id}>` : `${targets.length} membres`, inline: true },
        { name: "Bannis", value: `${ok}`, inline: true },
        { name: "Échecs", value: `${fail}`, inline: true },
        { name: "Raison", value: raison }
      )
      .setTimestamp();
    await msg.edit({ content: "", embeds: [embed] });
  },
};

// ─── *masskick ────────────────────────────────────────────
// Usage: *masskick @role [raison]   → kick tous les membres du rôle
//        *masskick @u1 @u2 [raison] → kick les membres mentionnés
export const masskickCommand: Command = {
  name: "masskick",
  description: "[OWNER] Kick tous les membres d'un rôle (ou membres mentionnés)",
  usage: "*masskick @role [raison]",
  execute: async (message, args) => {
    if (!isOwner(message.author.id)) {
      await message.reply("❌ Commande réservée au propriétaire du bot.");
      return;
    }
    if (!message.guild) return;

    if (!message.guild.members.me?.permissions.has(PermissionFlagsBits.KickMembers)) {
      await message.reply("❌ Le bot n'a pas la permission **Expulser des membres** sur ce serveur.");
      return;
    }

    const role = message.mentions.roles.first();
    const raison = args.filter(a => !a.startsWith("<")).join(" ") || "Mass kick — owner";

    let targets: import("discord.js").GuildMember[] = [];

    if (role) {
      await message.guild.members.fetch();
      targets = [...role.members.values()];
    } else {
      targets = [...(message.mentions.members?.values() ?? [])];
    }

    if (targets.length === 0) {
      await message.reply("❌ Mentionne un rôle ou des membres.\n`*masskick @role raison`");
      return;
    }

    const msg = await message.reply(`⏳ Kick en cours de **${targets.length}** membres...`);

    let ok = 0, fail = 0;
    for (const m of targets) {
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
        { name: "Cible", value: role ? `<@&${role.id}>` : `${targets.length} membres`, inline: true },
        { name: "Kickés", value: `${ok}`, inline: true },
        { name: "Échecs", value: `${fail}`, inline: true },
        { name: "Raison", value: raison }
      )
      .setTimestamp();
    await msg.edit({ content: "", embeds: [embed] });
  },
};

// ─── *parle ───────────────────────────────────────────────
// Usage (en DM au bot):
//   *parle message          → envoie dans TOUS les salons textuels de tous les serveurs
//   *parle CHANNEL_ID msg   → envoie uniquement dans ce salon
export const parleCommand: Command = {
  name: "parle",
  description: "[OWNER] Parler via le bot (tous les salons ou un salon précis)",
  usage: "*parle [CHANNEL_ID] message",
  execute: async (message, args) => {
    if (!isOwner(message.author.id)) {
      await message.reply("❌ Commande réservée au propriétaire du bot.");
      return;
    }

    if (args.length === 0) {
      await message.reply("❌ Usage : `*parle message` ou `*parle CHANNEL_ID message`");
      return;
    }

    const isId = /^\d{17,20}$/.test(args[0]);

    if (isId) {
      const channelId = args[0];
      const texte = args.slice(1).join(" ");
      if (!texte) {
        await message.reply("❌ Écris un message après l'ID du salon.");
        return;
      }
      try {
        const channel = await message.client.channels.fetch(channelId);
        if (!channel?.isTextBased()) {
          await message.reply("❌ Salon introuvable ou pas un salon textuel.");
          return;
        }
        await (channel as import("discord.js").TextChannel).send(texte);
        await message.reply(`✅ Message envoyé dans <#${channelId}>.`);
      } catch {
        await message.reply("❌ Impossible d'envoyer (salon introuvable ou permissions insuffisantes).");
      }
    } else {
      const texte = args.join(" ");
      let ok = 0, fail = 0;
      for (const [, guild] of message.client.guilds.cache) {
        const salons = guild.channels.cache.filter(
          c => c.type === ChannelType.GuildText &&
               c.permissionsFor(guild.members.me!)?.has(PermissionFlagsBits.SendMessages)
        );
        for (const [, salon] of salons) {
          try {
            await (salon as import("discord.js").TextChannel).send(texte);
            ok++;
          } catch {
            fail++;
          }
        }
      }
      await message.reply(`📢 Message envoyé dans **${ok}** salon(s).${fail ? ` (${fail} échec(s))` : ""}`);
    }
  },
};

// ─── *delsalon ────────────────────────────────────────────
// Usage: *delsalon #salon1 #salon2 ...
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
