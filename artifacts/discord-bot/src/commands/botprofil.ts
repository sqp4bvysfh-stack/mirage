import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { BOT_OWNER_ID } from "./owner.js";

async function urlToBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

export const botprofilCommand: Command = {
  name: "botprofil",
  description: "[OWNER] Modifier le profil du bot par serveur (pseudo, avatar, bannière).",
  usage: "*botprofil pseudo <nom> | *botprofil avatar <url> | *botprofil banniere <url> | *botprofil reset",

  async execute(message, args) {
    if (message.author.id !== BOT_OWNER_ID) {
      await message.reply("❌ Commande réservée au propriétaire du bot.");
      return;
    }
    if (!message.guild) return;

    const sub = args[0]?.toLowerCase();

    // ─── *botprofil pseudo <nom> ──────────────────────────
    if (sub === "pseudo") {
      const nom = args.slice(1).join(" ");
      if (!nom) {
        await message.reply("❌ Donne un nom. Ex : `*botprofil pseudo MIRAGE`");
        return;
      }
      try {
        await message.guild.members.me!.setNickname(nom);
        const embed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle("✅ Pseudo mis à jour")
          .addFields(
            { name: "Serveur",        value: message.guild.name, inline: true },
            { name: "Nouveau pseudo", value: `\`${nom}\``,        inline: true },
          )
          .setFooter({ text: "Uniquement sur ce serveur." })
          .setTimestamp();
        await message.reply({ embeds: [embed] });
      } catch {
        await message.reply("❌ Impossible de changer le pseudo.");
      }
      return;
    }

    // ─── *botprofil avatar <url> ──────────────────────────
    if (sub === "avatar") {
      const url = args[1];
      if (!url?.startsWith("http")) {
        await message.reply("❌ Donne une URL d'image. Ex : `*botprofil avatar https://...`");
        return;
      }
      try {
        const buffer = await urlToBuffer(url);
        await message.guild.members.me!.edit({ avatar: buffer });
        const embed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle("✅ Avatar mis à jour sur ce serveur")
          .setThumbnail(message.guild.members.me!.displayAvatarURL({ size: 256 }))
          .setFooter({ text: "Uniquement sur ce serveur — les autres ne sont pas affectés." })
          .setTimestamp();
        await message.reply({ embeds: [embed] });
      } catch {
        await message.reply("❌ Impossible de changer l'avatar (URL invalide, format non supporté ou rate limit).");
      }
      return;
    }

    // ─── *botprofil banniere <url> ────────────────────────
    if (sub === "banniere") {
      const url = args[1];
      if (!url?.startsWith("http")) {
        await message.reply("❌ Donne une URL d'image. Ex : `*botprofil banniere https://...`");
        return;
      }
      try {
        const buffer = await urlToBuffer(url);
        await message.guild.members.me!.edit({ banner: buffer } as any);
        const embed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle("✅ Bannière mise à jour sur ce serveur")
          .setImage(url)
          .setFooter({ text: "Uniquement sur ce serveur." })
          .setTimestamp();
        await message.reply({ embeds: [embed] });
      } catch {
        await message.reply("❌ Impossible de changer la bannière (URL invalide, format non supporté ou rate limit).");
      }
      return;
    }

    // ─── *botprofil reset ─────────────────────────────────
    if (sub === "reset") {
      try {
        await message.guild.members.me!.edit({ nick: null, avatar: null } as any);
        await message.reply(`✅ Profil remis par défaut sur **${message.guild.name}**.`);
      } catch {
        await message.reply("❌ Impossible de reset le profil.");
      }
      return;
    }

    // ─── Aide ─────────────────────────────────────────────
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("🤖 Profil du bot — par serveur")
      .addFields(
        { name: "`*botprofil pseudo <nom>`",    value: "Change le pseudo sur ce serveur uniquement." },
        { name: "`*botprofil avatar <url>`",    value: "Change l'avatar sur ce serveur (GIF supporté)." },
        { name: "`*botprofil banniere <url>`",  value: "Change la bannière sur ce serveur (GIF supporté)." },
        { name: "`*botprofil reset`",            value: "Remet le profil par défaut sur ce serveur." },
      )
      .setThumbnail(message.guild.members.me!.displayAvatarURL({ size: 256 }))
      .setTimestamp();
    await message.reply({ embeds: [embed] });
  },
};
