import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";
import { canActOn } from "../utils/modCheck.js";
import { sendServerLog } from "../utils/logs.js";

const warnings = new Map<string, { raison: string; date: string }[]>();

async function appliquerSanction(message: any, target: any, warnCount: number, raison: string) {
  const member = message.guild?.members.cache.get(target.id);

  if (warnCount === 1) {
    // MP d'avertissement
    try {
      const embed = new EmbedBuilder()
        .setColor(0xf39c12)
        .setTitle("⚠️ Avertissement reçu")
        .setDescription(`Tu as reçu un avertissement sur **${message.guild?.name}**.`)
        .addFields(
          { name: "Raison", value: raison },
          { name: "⚠️ Attention", value: "Un prochain avertissement entraînera des sanctions (mute, ban...)." }
        )
        .setTimestamp();
      await target.send({ embeds: [embed] });
    } catch {
      await message.channel.send(`⚠️ Impossible d'envoyer un MP à ${target.tag}.`);
    }

  } else if (warnCount === 2) {
    // Mute 1h
    try {
      await member?.timeout(60 * 60 * 1000, `2 avertissements - ${raison}`);
      try {
        const embed = new EmbedBuilder()
          .setColor(0xe67e22)
          .setTitle("🔇 Tu as été mute")
          .setDescription(`Suite à ton **2ème avertissement** sur **${message.guild?.name}**, tu as été mute pendant **1 heure**.`)
          .addFields({ name: "Raison", value: raison })
          .setTimestamp();
        await target.send({ embeds: [embed] });
      } catch {}
      await message.channel.send(`🔇 ${target.tag} a été mute **1 heure** automatiquement (2 avertissements).`);
    } catch {
      await message.channel.send(`❌ Impossible de mute ${target.tag}.`);
    }

  } else if (warnCount === 3) {
    // Mute 24h
    try {
      await member?.timeout(24 * 60 * 60 * 1000, `3 avertissements - ${raison}`);
      try {
        const embed = new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle("🔇 Tu as été mute")
          .setDescription(`Suite à ton **3ème avertissement** sur **${message.guild?.name}**, tu as été mute pendant **24 heures**.`)
          .addFields(
            { name: "Raison", value: raison },
            { name: "⚠️ Attention", value: "Un prochain avertissement entraînera un bannissement définitif." }
          )
          .setTimestamp();
        await target.send({ embeds: [embed] });
      } catch {}
      await message.channel.send(`🔇 ${target.tag} a été mute **24 heures** automatiquement (3 avertissements).`);
    } catch {
      await message.channel.send(`❌ Impossible de mute ${target.tag}.`);
    }

  } else if (warnCount >= 4) {
    // Ban
    try {
      try {
        const embed = new EmbedBuilder()
          .setColor(0x992d22)
          .setTitle("🔨 Tu as été banni")
          .setDescription(`Suite à ton **4ème avertissement** sur **${message.guild?.name}**, tu as été banni définitivement.`)
          .addFields({ name: "Raison", value: raison })
          .setTimestamp();
        await target.send({ embeds: [embed] });
      } catch {}
      await member?.ban({ reason: `4 avertissements - ${raison}` });
      await message.channel.send(`🔨 ${target.tag} a été **banni** automatiquement (4 avertissements).`);
    } catch {
      await message.channel.send(`❌ Impossible de bannir ${target.tag}.`);
    }
  }
}

export const warnCommand: Command = {
  name: "warn",
  description: "Avertir un membre",
  usage: "*warn @membre [raison] | *warn list @membre | *warn clear @membre",
  execute: async (message, args) => {
    if (!message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n'as pas la permission d'utiliser cette commande.");
      return;
    }

    // ── LIST ──────────────────────────────────────────────
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
        .setFooter({ text: `Total : ${userWarns.length} avertissement(s)` })
        .setTimestamp();
      await message.reply({ embeds: [embed] });
      return;
    }

    // ── CLEAR ─────────────────────────────────────────────
    if (args[0] === "clear") {
      const target = message.mentions.users.first();
      if (!target) {
        await message.reply("❌ Mentionne un membre. Ex: `*warn clear @membre`");
        return;
      }
      warnings.delete(target.id);
      await message.reply(`✅ Les avertissements de ${target.tag} ont été réinitialisés.`);
      return;
    }

    // ── WARN ──────────────────────────────────────────────
    const target = message.mentions.users.first();
    if (!target) {
      await message.reply("❌ Mentionne un membre. Ex: `*warn @membre raison`");
      return;
    }

    if (target.id === message.author.id) {
      await message.reply("❌ Tu ne peux pas te warn toi-même.");
      return;
    }

    if (target.bot) {
      await message.reply("❌ Tu ne peux pas warn un bot.");
      return;
    }

    const targetMember = message.guild?.members.cache.get(target.id);
    if (!targetMember || !canActOn(message.member, targetMember)) {
      await message.reply(
        "❌ Tu ne peux pas avertir quelqu’un de ton niveau ou au-dessus de toi.",
      );
      return;
    }

    const raison = args.slice(1).join(" ") || "Aucune raison fournie";
    const date = new Date().toLocaleDateString("fr-FR");
    const userWarns = warnings.get(target.id) ?? [];
    userWarns.push({ raison, date });
    warnings.set(target.id, userWarns);
    const warnCount = userWarns.length;

    // Embed du warn dans le salon
    const sanctions: Record<number, string> = {
      1: "⚠️ Prochain warn → mute 1h",
      2: "🔇 Mute 1h automatique",
      3: "🔇 Mute 24h automatique",
    };
    const embed = new EmbedBuilder()
      .setColor(0xf39c12)
      .setTitle("⚠️ Avertissement")
      .addFields(
        { name: "Membre", value: target.tag, inline: true },
        { name: "Avertissement", value: `${warnCount}/4`, inline: true },
        { name: "Modérateur", value: message.author.tag, inline: true },
        { name: "Raison", value: raison },
      )
      .setTimestamp();

    if (sanctions[warnCount]) {
      embed.addFields({ name: "🤖 Sanction automatique", value: sanctions[warnCount] });
    }

    await message.reply({ embeds: [embed] });

    if (message.guild) {
      await sendServerLog(message.guild, { embeds: [embed] });
    }

    // Application de la sanction
    await appliquerSanction(message, target, warnCount, raison);
  },
};
