import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";
import {
  isAntiSpamEnabled,
  setAntiSpamEnabled,
} from "../utils/antispam.js";

export const antispamCommand: Command = {
  name: "antispam",
  description: "Active ou désactive la protection anti-spam",
  usage: "*antispam on/off/status",

  execute: async (message, args) => {
    if (!message.guild || !message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n’as pas la permission d’utiliser cette commande.");
      return;
    }

    const action = args[0]?.toLowerCase();

    if (!action || action === "status" || action === "statut") {
      const enabled = isAntiSpamEnabled();

      const embed = new EmbedBuilder()
        .setColor(enabled ? 0x6d28d9 : 0x747f8d)
        .setTitle("💬 Anti-spam")
        .setDescription(
          enabled
            ? "✅ L’anti-spam est actuellement **activé**."
            : "❌ L’anti-spam est actuellement **désactivé**.",
        )
        .addFields(
          { name: "Détection", value: "6 messages en 5 secondes", inline: true },
          { name: "Action", value: "Timeout de 1 minute", inline: true },
        )
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      return;
    }

    if (action === "on" || action === "enable" || action === "activer") {
      if (isAntiSpamEnabled()) {
        await message.reply("ℹ️ L’anti-spam est déjà activé.");
        return;
      }

      setAntiSpamEnabled(true);
      await message.reply("✅ L’anti-spam est maintenant **activé**.");
      return;
    }

    if (
      action === "off" ||
      action === "disable" ||
      action === "désactiver" ||
      action === "desactiver"
    ) {
      if (!isAntiSpamEnabled()) {
        await message.reply("ℹ️ L’anti-spam est déjà désactivé.");
        return;
      }

      setAntiSpamEnabled(false);
      await message.reply("✅ L’anti-spam est maintenant **désactivé**.");
      return;
    }

    await message.reply(
      "❌ Utilisation : `*antispam on`, `*antispam off` ou `*antispam status`.",
    );
  },
};
