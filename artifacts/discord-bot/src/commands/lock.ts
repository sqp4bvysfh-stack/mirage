import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";

const MEMBRES_ROLE_ID = "1476411015586517269";

async function toggleLock(message: any, unlock: boolean) {
  const channel = message.channel;
  if (!channel.isTextBased() || !("permissionOverwrites" in channel)) {
    await message.reply("❌ Impossible de lock ce salon.");
    return;
  }

  const membresRole = message.guild?.roles.cache.get(MEMBRES_ROLE_ID);
  if (!membresRole) {
    await message.reply("❌ Rôle MEMBRES introuvable.");
    return;
  }

  await channel.permissionOverwrites.edit(membresRole, {
    SendMessages: unlock ? null : false,
  });

  const embed = new EmbedBuilder()
    .setColor(unlock ? 0x2ecc71 : 0xe74c3c)
    .setTitle(unlock ? "🔓 Salon déverrouillé" : "🔒 Salon verrouillé")
    .setDescription(unlock ? "Les membres peuvent à nouveau écrire." : "Les membres ne peuvent plus écrire.")
    .addFields({ name: "Modérateur", value: message.author.tag })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}

export const lockCommand: Command = {
  name: "lock",
  description: "Verrouiller un salon",
  usage: "*lock",
  execute: async (message) => {
    if (!message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n'as pas la permission d'utiliser cette commande.");
      return;
    }
    await toggleLock(message, false);
  },
};

export const unlockCommand: Command = {
  name: "unlock",
  description: "Déverrouiller un salon",
  usage: "*unlock",
  execute: async (message) => {
    if (!message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n'as pas la permission d'utiliser cette commande.");
      return;
    }
    await toggleLock(message, true);
  },
};
