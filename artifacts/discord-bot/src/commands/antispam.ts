import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";
import {
  addIgnoredAntiSpamChannel,
  getIgnoredAntiSpamChannels,
  isAntiSpamChannelIgnored,
  isAntiSpamEnabled,
  removeIgnoredAntiSpamChannel,
  setAntiSpamEnabled,
} from "../utils/antispam.js";

export const antispamCommand: Command = {
  name: "antispam",
  description: "Gère l’anti-spam et les salons ignorés",
  usage: "*antispam on/off/status | ignore [#salon] | unignore [#salon] | list",

  execute: async (message, args) => {
    if (!message.guild || !message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n’as pas la permission d’utiliser cette commande.");
      return;
    }

    const action = args[0]?.toLowerCase();

    if (!action || action === "status" || action === "statut") {
      const enabled = isAntiSpamEnabled();
      const ignored = getIgnoredAntiSpamChannels();

      const embed = new EmbedBuilder()
        .setColor(enabled ? 0x6d28d9 : 0x747f8d)
        .setTitle("✦ No Chill • Anti-spam")
        .setDescription(
          enabled
            ? "✅ L’anti-spam est actuellement **activé**."
            : "❌ L’anti-spam est actuellement **désactivé**.",
        )
        .addFields(
          { name: "Détection", value: "6 messages en 5 secondes", inline: true },
          { name: "Action", value: "Timeout de 1 minute", inline: true },
          {
            name: "Salons ignorés",
            value:
              ignored.length > 0
                ? ignored.map((id) => `<#${id}>`).join("\n").slice(0, 1024)
                : "Aucun",
          },
        )
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      return;
    }

    if (["on", "enable", "activer"].includes(action)) {
      if (isAntiSpamEnabled()) {
        await message.reply("ℹ️ L’anti-spam est déjà activé.");
        return;
      }

      setAntiSpamEnabled(true);
      await message.reply("✅ L’anti-spam est maintenant **activé**.");
      return;
    }

    if (["off", "disable", "désactiver", "desactiver"].includes(action)) {
      if (!isAntiSpamEnabled()) {
        await message.reply("ℹ️ L’anti-spam est déjà désactivé.");
        return;
      }

      setAntiSpamEnabled(false);
      await message.reply("✅ L’anti-spam est maintenant **désactivé**.");
      return;
    }

    if (action === "ignore" || action === "unignore") {
      const targetChannel =
        message.mentions.channels.first() ?? message.channel;

      if (!targetChannel.isTextBased()) {
        await message.reply("❌ Ce salon n’est pas compatible.");
        return;
      }

      if (action === "ignore") {
        if (isAntiSpamChannelIgnored(targetChannel.id)) {
          await message.reply(`ℹ️ ${targetChannel} est déjà ignoré par l’anti-spam.`);
          return;
        }

        addIgnoredAntiSpamChannel(targetChannel.id);
        await message.reply(`✅ L’anti-spam ignorera maintenant ${targetChannel}.`);
        return;
      }

      if (!isAntiSpamChannelIgnored(targetChannel.id)) {
        await message.reply(`ℹ️ ${targetChannel} n’est pas ignoré par l’anti-spam.`);
        return;
      }

      removeIgnoredAntiSpamChannel(targetChannel.id);
      await message.reply(`✅ L’anti-spam est de nouveau actif dans ${targetChannel}.`);
      return;
    }

    if (action === "list" || action === "liste") {
      const ignored = getIgnoredAntiSpamChannels();

      const embed = new EmbedBuilder()
        .setColor(0x6d28d9)
        .setTitle("✦ Anti-spam • Salons ignorés")
        .setDescription(
          ignored.length > 0
            ? ignored.map((id, index) => `**${index + 1}.** <#${id}>`).join("\n")
            : "Aucun salon n’est ignoré.",
        )
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      return;
    }

    await message.reply(
      "❌ Utilisation :\n" +
      "`*antispam on`\n" +
      "`*antispam off`\n" +
      "`*antispam status`\n" +
      "`*antispam ignore [#salon]`\n" +
      "`*antispam unignore [#salon]`\n" +
      "`*antispam list`",
    );
  },
};
