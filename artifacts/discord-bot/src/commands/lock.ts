import { EmbedBuilder, type GuildChannel } from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";
import { getConfig } from "../utils/serverConfig.js";

const DEFAULT_MEMBRES_ROLE_ID = "1362527149378240814";

function isCategoryArgument(value?: string): boolean {
  if (!value) return false;

  const normalized = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return normalized === "categorie" || normalized === "category" || normalized === "cat";
}

async function editChannelLock(
  channel: GuildChannel,
  roleId: string,
  unlock: boolean,
): Promise<boolean> {
  if (!("permissionOverwrites" in channel)) return false;

  try {
    await channel.permissionOverwrites.edit(roleId, {
      SendMessages: unlock ? null : false,
    });
    return true;
  } catch (error) {
    console.error(`Erreur lock/unlock du salon ${channel.id}:`, error);
    return false;
  }
}

async function toggleCurrentChannel(message: any, unlock: boolean): Promise<void> {
  const channel = message.channel;

  if (
    !message.guild ||
    !channel ||
    !channel.isTextBased() ||
    !("permissionOverwrites" in channel)
  ) {
    await message.reply("❌ Impossible de modifier les permissions de ce salon.");
    return;
  }

  const membresRoleId =
    getConfig(message.guild.id).membresRole ?? DEFAULT_MEMBRES_ROLE_ID;

  const membresRole = message.guild.roles.cache.get(membresRoleId);
  if (!membresRole) {
    await message.reply(
      "❌ Le rôle Membres est introuvable. Vérifie son ID dans la configuration.",
    );
    return;
  }

  const success = await editChannelLock(channel, membresRole.id, unlock);

  if (!success) {
    await message.reply(
      "❌ Je n’ai pas réussi à modifier ce salon. Vérifie mes permissions.",
    );
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(unlock ? 0x2ecc71 : 0x6d28d9)
    .setTitle(unlock ? "🔓 Salon déverrouillé" : "🔒 Salon verrouillé")
    .setDescription(
      unlock
        ? "Les membres peuvent à nouveau écrire dans ce salon."
        : "Les membres ne peuvent plus écrire dans ce salon.",
    )
    .addFields({ name: "Modérateur", value: message.author.tag })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}

async function toggleCategory(message: any, unlock: boolean): Promise<void> {
  if (!message.guild || !message.channel || !("parent" in message.channel)) {
    await message.reply("❌ Cette commande doit être utilisée dans un salon du serveur.");
    return;
  }

  const category = message.channel.parent;

  if (!category) {
    await message.reply("❌ Ce salon n’est placé dans aucune catégorie.");
    return;
  }

  const membresRoleId =
    getConfig(message.guild.id).membresRole ?? DEFAULT_MEMBRES_ROLE_ID;

  const membresRole = message.guild.roles.cache.get(membresRoleId);
  if (!membresRole) {
    await message.reply(
      "❌ Le rôle Membres est introuvable. Vérifie son ID dans la configuration.",
    );
    return;
  }

  const channels = [...category.children.cache.values()];
  let modified = 0;
  let failed = 0;

  for (const channel of channels) {
    const success = await editChannelLock(channel, membresRole.id, unlock);
    if (success) modified += 1;
    else failed += 1;
  }

  if (modified === 0) {
    await message.reply(
      "❌ Aucun salon de cette catégorie n’a pu être modifié. Vérifie mes permissions.",
    );
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(unlock ? 0x2ecc71 : 0x6d28d9)
    .setTitle(
      unlock
        ? "🔓 Catégorie déverrouillée"
        : "🔒 Catégorie verrouillée",
    )
    .setDescription(
      unlock
        ? `Les membres peuvent à nouveau écrire dans les salons de **${category.name}**.`
        : `Les membres ne peuvent plus écrire dans les salons de **${category.name}**.`,
    )
    .addFields(
      { name: "Salons modifiés", value: String(modified), inline: true },
      { name: "Échecs", value: String(failed), inline: true },
      { name: "Modérateur", value: message.author.tag, inline: false },
    )
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}

async function executeLockCommand(
  message: any,
  args: string[],
  unlock: boolean,
): Promise<void> {
  if (!message.member || !isModerator(message.member)) {
    await message.reply("❌ Tu n’as pas la permission d’utiliser cette commande.");
    return;
  }

  if (isCategoryArgument(args[0])) {
    await toggleCategory(message, unlock);
    return;
  }

  await toggleCurrentChannel(message, unlock);
}

export const lockCommand: Command = {
  name: "lock",
  description: "Verrouille un salon ou sa catégorie",
  usage: "*lock [catégorie]",

  execute: async (message, args) => {
    await executeLockCommand(message, args, false);
  },
};

export const unlockCommand: Command = {
  name: "unlock",
  description: "Déverrouille un salon ou sa catégorie",
  usage: "*unlock [catégorie]",

  execute: async (message, args) => {
    await executeLockCommand(message, args, true);
  },
};
