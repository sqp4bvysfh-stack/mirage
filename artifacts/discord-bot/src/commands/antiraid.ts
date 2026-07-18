import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";
import {
  isAntiRaidEnabled,
  setAntiRaidEnabled,
} from "../utils/antiraid.js";

export const antiraidCommand: Command = {
  name: "antiraid",
  description: "Active ou désactive la protection anti-raid",
  usage: "*antiraid on/off/status",

  execute: async (message, args) => {
    if (!message.guild || !message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n’as pas la permission d’utiliser cette commande.");
      return;
    }

    const action = args[0]?.toLowerCase();

    if (!action || action === "status" || action === "statut") {
      const enabled = isAntiRaidEnabled();

      const embed = new EmbedBuilder()
        .setColor(enabled ? 0x6d28d9 : 0x747f8d)
        .setTitle("🚨 Anti-raid")
        .setDescription(
          enabled
            ? "✅ L’anti-raid est actuellement **activé**."
            : "❌ L’anti-raid est actuellement **désactivé**.",
        )
        .addFields(
          { name: "Détection", value: "5 arrivées en 10 secondes", inline: true },
          { name: "Action", value: "Kick des comptes de moins de 7 jours", inline: true },
        )
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      return;
    }

    if (action === "on" || action === "enable" || action === "activer") {
      if (isAntiRaidEnabled()) {
        await message.reply("ℹ️ L’anti-raid est déjà activé.");
        return;
      }

      setAntiRaidEnabled(true);
      await message.reply("✅ L’anti-raid est maintenant **activé**.");
      return;
    }

    if (action === "off" || action === "disable" || action === "désactiver" || action === "desactiver") {
      if (!isAntiRaidEnabled()) {
        await message.reply("ℹ️ L’anti-raid est déjà désactivé.");
        return;
      }

      setAntiRaidEnabled(false);
      await message.reply("✅ L’anti-raid est maintenant **désactivé**.");
      return;
    }

    await message.reply(
      "❌ Utilisation : `*antiraid on`, `*antiraid off` ou `*antiraid status`.",
    );
  },
};
