import {
  ChannelType,
  type Message,
  type TextChannel,
  type VoiceChannel,
  type CategoryChannel,
} from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";
import { getConfig } from "../utils/serverConfig.js";
import { EmbedBuilder } from "discord.js";
import { sendServerLog } from "../utils/logs.js";

const DEFAULT_MEMBRES_ROLE = "1362527149378240814";

export const fermetureCommand: Command = {
  name:        "fermeture",
  description: "Ferme le serveur — retire la visibilité à @MEMBRES sauf le salon temporaire",
  usage:       "*fermeture [#salon-temporaire]",

  execute: async (message: Message, args) => {
    if (!message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n'as pas la permission d'utiliser cette commande."); return;
    }

    const guild         = message.guild!;
    const membresRoleId = getConfig(guild.id).membresRole ?? DEFAULT_MEMBRES_ROLE;
    const tempChannel   = message.mentions.channels.first();
    const msg           = await message.reply("⏳ Fermeture du serveur en cours…");

    let count = 0;
    for (const [, channel] of guild.channels.cache) {
      if (tempChannel && channel.id === tempChannel.id) continue;
      try {
        if ([
          ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum,
          ChannelType.GuildVoice, ChannelType.GuildStageVoice, ChannelType.GuildCategory,
        ].includes(channel.type)) {
          const isVoice = channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice;
          await (channel as TextChannel | VoiceChannel | CategoryChannel)
            .permissionOverwrites.edit(membresRoleId, {
              ViewChannel: false,
              ...(isVoice ? { Connect: false } : {}),
            });
          count++;
        }
      } catch { /* pas la permission d'éditer ce salon */ }
    }

    await msg.edit(
      `🔒 **Serveur fermé** — ${count} salons masqués pour <@&${membresRoleId}>.` +
      (tempChannel ? `\n📌 Salon temporaire gardé ouvert : ${tempChannel}` : "")
    );

    const logEmbed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle("🔒 Serveur fermé")
      .addFields(
        { name: "Modérateur", value: `${message.author}`, inline: true },
        { name: "Salons masqués", value: String(count), inline: true },
        {
          name: "Salon temporaire",
          value: tempChannel ? `${tempChannel}` : "Aucun",
          inline: true,
        },
      )
      .setTimestamp();

    await sendServerLog(guild, { embeds: [logEmbed] });
  },
};

export const ouvertureCommand: Command = {
  name:        "ouverture",
  description: "Rouvre le serveur — redonne l'accès à @MEMBRES sur tous les salons",
  usage:       "*ouverture",

  execute: async (message: Message) => {
    if (!message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n'as pas la permission d'utiliser cette commande."); return;
    }

    const guild         = message.guild!;
    const membresRoleId = getConfig(guild.id).membresRole ?? DEFAULT_MEMBRES_ROLE;
    const msg           = await message.reply("⏳ Ouverture du serveur en cours…");

    let count = 0;
    for (const [, channel] of guild.channels.cache) {
      try {
        if ([
          ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum,
          ChannelType.GuildVoice, ChannelType.GuildStageVoice, ChannelType.GuildCategory,
        ].includes(channel.type)) {
          const overwrite = (channel as TextChannel).permissionOverwrites?.cache.get(membresRoleId);
          if (!overwrite) continue;
          await (channel as TextChannel | VoiceChannel | CategoryChannel)
            .permissionOverwrites.edit(membresRoleId, { ViewChannel: null, Connect: null });
          count++;
        }
      } catch { /* ignore */ }
    }

    await msg.edit(`🔓 **Serveur ouvert** — accès restauré sur ${count} salons pour <@&${membresRoleId}>.`);

    const logEmbed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("🔓 Serveur rouvert")
      .addFields(
        { name: "Modérateur", value: `${message.author}`, inline: true },
        { name: "Salons restaurés", value: String(count), inline: true },
      )
      .setTimestamp();

    await sendServerLog(guild, { embeds: [logEmbed] });
  },
};
