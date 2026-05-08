import {
  ChannelType,
  PermissionsBitField,
  type Message,
  type TextChannel,
  type VoiceChannel,
  type CategoryChannel,
} from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";

const MEMBRES_ROLE_ID = "1476411015586517269";

// ─── FERMETURE ────────────────────────────────────────────────────────────
export const fermetureCommand: Command = {
  name:        "fermeture",
  description: "Ferme le serveur — retire la visibilité à @MEMBRES sauf le salon temporaire",
  usage:       "*fermeture [#salon-temporaire]",

  execute: async (message: Message, args) => {
    if (!message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n'as pas la permission d'utiliser cette commande.");
      return;
    }

    const guild = message.guild!;
    const tempChannel = message.mentions.channels.first();

    const msg = await message.reply("⏳ Fermeture du serveur en cours…");

    let count = 0;
    for (const [, channel] of guild.channels.cache) {
      // Garder le salon temporaire accessible
      if (tempChannel && channel.id === tempChannel.id) continue;

      try {
        if (
          channel.type === ChannelType.GuildText ||
          channel.type === ChannelType.GuildAnnouncement ||
          channel.type === ChannelType.GuildForum ||
          channel.type === ChannelType.GuildVoice ||
          channel.type === ChannelType.GuildStageVoice ||
          channel.type === ChannelType.GuildCategory
        ) {
          const isVoice =
            channel.type === ChannelType.GuildVoice ||
            channel.type === ChannelType.GuildStageVoice;

          await (channel as TextChannel | VoiceChannel | CategoryChannel)
            .permissionOverwrites.edit(MEMBRES_ROLE_ID, {
              ViewChannel: false,
              ...(isVoice ? { Connect: false } : {}),
            });
          count++;
        }
      } catch {
        // Ignore les salons où on n'a pas la permission d'éditer
      }
    }

    await msg.edit(
      `🔒 **Serveur fermé** — ${count} salons masqués pour <@&${MEMBRES_ROLE_ID}>.` +
      (tempChannel ? `\n📌 Salon temporaire gardé ouvert : ${tempChannel}` : "")
    );
  },
};

// ─── OUVERTURE ────────────────────────────────────────────────────────────
export const ouvertureCommand: Command = {
  name:        "ouverture",
  description: "Rouvre le serveur — redonne l'accès à @MEMBRES sur tous les salons",
  usage:       "*ouverture",

  execute: async (message: Message) => {
    if (!message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n'as pas la permission d'utiliser cette commande.");
      return;
    }

    const guild = message.guild!;
    const msg   = await message.reply("⏳ Ouverture du serveur en cours…");

    let count = 0;
    for (const [, channel] of guild.channels.cache) {
      try {
        if (
          channel.type === ChannelType.GuildText ||
          channel.type === ChannelType.GuildAnnouncement ||
          channel.type === ChannelType.GuildForum ||
          channel.type === ChannelType.GuildVoice ||
          channel.type === ChannelType.GuildStageVoice ||
          channel.type === ChannelType.GuildCategory
        ) {
          const overwrite = (channel as TextChannel).permissionOverwrites?.cache.get(MEMBRES_ROLE_ID);
          if (!overwrite) continue;

          await (channel as TextChannel | VoiceChannel | CategoryChannel)
            .permissionOverwrites.edit(MEMBRES_ROLE_ID, {
              ViewChannel: null,
              Connect:     null,
            });
          count++;
        }
      } catch {
        // Ignore
      }
    }

    await msg.edit(
      `🔓 **Serveur ouvert** — accès restauré sur ${count} salons pour <@&${MEMBRES_ROLE_ID}>.`
    );
  },
};
