import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";
import { BOT_OWNER_ID } from "./owner.js";

export const dmCommand: Command = {
  name: "dm",
  description: "Envoyer un DM via le bot à un membre ou tous les membres d'un rôle.",
  usage: "*dm @membre message  |  *dm @role message (owner)",

  async execute(message, args) {
    if (!message.guild || !message.member) return;

    const role   = message.mentions.roles.first();
    const member = message.mentions.members?.first();

    if (!role && !member) {
      await message.reply("❌ Mentionne un membre ou un rôle.\n`*dm @membre message` ou `*dm @role message`");
      return;
    }

    // DM à un rôle = owner uniquement
    if (role && message.author.id !== BOT_OWNER_ID) {
      await message.reply("❌ Envoyer un DM à tout un rôle est réservé au propriétaire du bot.");
      return;
    }

    // DM à un membre = modo minimum
    if (member && !isModerator(message.member)) {
      await message.reply("❌ Tu n'as pas la permission d'utiliser cette commande.");
      return;
    }

    const texte = args.filter(a => !a.startsWith("<")).join(" ");
    if (!texte) {
      await message.reply("❌ Écris un message après la mention.");
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`📩 Message de **${message.guild.name}**`)
      .setDescription(texte)
      .setThumbnail(message.guild.iconURL())
      .setFooter({ text: `Envoyé par ${message.author.tag}` })
      .setTimestamp();

    // ─── DM à un seul membre ──────────────────────────────
    if (member) {
      try {
        await member.send({ embeds: [embed] });
        await message.reply(`✅ DM envoyé à ${member}.`);
      } catch {
        await message.reply(`❌ Impossible d'envoyer un DM à ${member} (DMs fermés ou bloqué).`);
      }
      return;
    }

    // ─── DM à tout un rôle ───────────────────────────────
    await message.guild.members.fetch();
    const targets = role!.members.filter(m => !m.user.bot);

    if (targets.size === 0) {
      await message.reply("❌ Aucun membre humain dans ce rôle.");
      return;
    }

    const msg = await message.reply(`⏳ Envoi des DMs à **${targets.size}** membres...`);

    let ok = 0, fail = 0;
    for (const [, m] of targets) {
      try {
        await m.send({ embeds: [embed] });
        ok++;
      } catch {
        fail++;
      }
    }

    await msg.edit({
      content: `📩 DMs envoyés — ✅ **${ok}** reçus · ❌ **${fail}** échec(s) (DMs fermés).`,
    });
  },
};
