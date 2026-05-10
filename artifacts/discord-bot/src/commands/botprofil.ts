import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { BOT_OWNER_ID } from "./owner.js";

export const botprofilCommand: Command = {
  name: "botprofil",
  description: "[OWNER] Modifier le profil du bot (pseudo par serveur, avatar global).",
  usage: "*botprofil pseudo <nom> | *botprofil reset | *botprofil avatar <url>",

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
        await message.guild.members.me!.setNickname(nom, "Owner — changement pseudo bot");
        const embed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle("✅ Pseudo mis à jour")
          .addFields(
            { name: "Serveur",    value: message.guild.name, inline: true },
            { name: "Nouveau pseudo", value: `\`${nom}\``,  inline: true },
          )
          .setFooter({ text: "Uniquement sur ce serveur — les autres serveurs ne sont pas affectés." })
          .setTimestamp();
        await message.reply({ embeds: [embed] });
      } catch {
        await message.reply("❌ Impossible de changer le pseudo (permission manquante ?).");
      }
      return;
    }

    // ─── *botprofil reset ─────────────────────────────────
    if (sub === "reset") {
      try {
        await message.guild.members.me!.setNickname(null, "Owner — reset pseudo bot");
        await message.reply(`✅ Pseudo remis par défaut sur **${message.guild.name}**.`);
      } catch {
        await message.reply("❌ Impossible de reset le pseudo.");
      }
      return;
    }

    // ─── *botprofil avatar <url> ──────────────────────────
    if (sub === "avatar") {
      const url = args[1];
      if (!url || !url.startsWith("http")) {
        await message.reply("❌ Donne une URL d'image. Ex : `*botprofil avatar https://...`");
        return;
      }
      try {
        await message.client.user.setAvatar(url);
        const embed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle("✅ Avatar mis à jour")
          .setThumbnail(message.client.user.displayAvatarURL({ size: 256 }))
          .setDescription("⚠️ L'avatar est **global** — il change sur tous les serveurs.")
          .setTimestamp();
        await message.reply({ embeds: [embed] });
      } catch {
        await message.reply("❌ Impossible de changer l'avatar (URL invalide ou rate limit).");
      }
      return;
    }

    // ─── Aide ─────────────────────────────────────────────
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("🤖 Profil du bot")
      .addFields(
        { name: "`*botprofil pseudo <nom>`", value: "Change le pseudo du bot **sur ce serveur uniquement**." },
        { name: "`*botprofil reset`",         value: "Remet le pseudo par défaut sur ce serveur." },
        { name: "`*botprofil avatar <url>`",  value: "Change l'avatar du bot **(global — tous les serveurs)**." },
      )
      .setThumbnail(message.client.user.displayAvatarURL({ size: 256 }))
      .setTimestamp();
    await message.reply({ embeds: [embed] });
  },
};
