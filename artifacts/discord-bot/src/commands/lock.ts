import {
  EmbedBuilder,
  PermissionFlagsBits,
  type GuildChannel,
} from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";
import { getConfig } from "../utils/serverConfig.js";
import { sendServerLog } from "../utils/logs.js";

const DEFAULT_MEMBRES_ROLE_ID = "1362527149378240814";

function isCategoryArgument(value?: string): boolean {
  if (!value) return false;

  const normalized = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return ["categorie", "category", "cat"].includes(normalized);
}

function getSendMessagesState(
  channel: GuildChannel,
  roleId: string,
): boolean | null {
  if (!("permissionOverwrites" in channel)) return null;

  const overwrite = channel.permissionOverwrites.cache.get(roleId);
  if (!overwrite) return null;

  if (overwrite.deny.has(PermissionFlagsBits.SendMessages)) return false;
  if (overwrite.allow.has(PermissionFlagsBits.SendMessages)) return true;

  return null;
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

  const roleId =
    getConfig(message.guild.id).membresRole ?? DEFAULT_MEMBRES_ROLE_ID;

  if (!message.guild.roles.cache.has(roleId)) {
    await message.reply("❌ Le rôle Membres est introuvable.");
    return;
  }

  const state = getSendMessagesState(channel, roleId);

  if (!unlock && state === false) {
    await message.reply("⚠️ Ce salon est déjà verrouillé.");
    return;
  }

  if (unlock && state !== false) {
    await message.reply("⚠️ Ce salon est déjà déverrouillé.");
    return;
  }

  if (!(await editChannelLock(channel, roleId, unlock))) {
    await message.reply("❌ Je n’ai pas réussi à modifier ce salon.");
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(unlock ? 0x2ecc71 : 0x6d28d9)
    .setTitle(unlock ? "🔓 Salon déverrouillé" : "🔒 Salon verrouillé")
    .addFields(
      { name: "Salon", value: `${channel}`, inline: true },
      { name: "Modérateur", value: `${message.author}`, inline: true },
    )
    .setTimestamp();

  await message.reply({ embeds: [embed] });
  await sendServerLog(message.guild, { embeds: [embed] });
}

async function toggleCategory(message: any, unlock: boolean): Promise<void> {
  if (!message.guild || !("parent" in message.channel)) {
    await message.reply("❌ Cette commande doit être utilisée dans un salon.");
    return;
  }

  const category = message.channel.parent;
  if (!category) {
    await message.reply("❌ Ce salon n’est placé dans aucune catégorie.");
    return;
  }

  const roleId =
    getConfig(message.guild.id).membresRole ?? DEFAULT_MEMBRES_ROLE_ID;

  const channels = [...category.children.cache.values()].filter(
    (channel) => "permissionOverwrites" in channel,
  );

  const toModify = channels.filter((channel) => {
    const state = getSendMessagesState(channel, roleId);
    return unlock ? state === false : state !== false;
  });

  const alreadyCorrect = channels.length - toModify.length;

  if (toModify.length === 0) {
    await message.reply(
      unlock
        ? "⚠️ Cette catégorie est déjà déverrouillée."
        : "⚠️ Cette catégorie est déjà verrouillée.",
    );
    return;
  }

  let modified = 0;
  let failed = 0;

  for (const channel of toModify) {
    if (await editChannelLock(channel, roleId, unlock)) modified += 1;
    else failed += 1;
  }

  const embed = new EmbedBuilder()
    .setColor(unlock ? 0x2ecc71 : 0x6d28d9)
    .setTitle(unlock ? "🔓 Catégorie déverrouillée" : "🔒 Catégorie verrouillée")
    .addFields(
      { name: "Catégorie", value: category.name, inline: true },
      { name: "Salons modifiés", value: String(modified), inline: true },
      {
        name: unlock ? "Déjà déverrouillés" : "Déjà verrouillés",
        value: String(alreadyCorrect),
        inline: true,
      },
      { name: "Échecs", value: String(failed), inline: true },
      { name: "Modérateur", value: `${message.author}`, inline: false },
    )
    .setTimestamp();

  await message.reply({ embeds: [embed] });
  await sendServerLog(message.guild, { embeds: [embed] });
}

async function executeLock(
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
  execute: async (message, args) => executeLock(message, args, false),
};

export const unlockCommand: Command = {
  name: "unlock",
  description: "Déverrouille un salon ou sa catégorie",
  usage: "*unlock [catégorie]",
  execute: async (message, args) => executeLock(message, args, true),
};
