import { EmbedBuilder, ChannelType } from "discord.js";
import type { Command } from "../types.js";

// Compteur de messages par guild (en mémoire, repart à 0 au redémarrage)
export const messageCounters = new Map<string, number>();

export function incrementMessages(guildId: string) {
  messageCounters.set(guildId, (messageCounters.get(guildId) ?? 0) + 1);
}

export const statsCommand: Command = {
  name: "stats",
  description: "Affiche les statistiques du serveur.",
  usage: "*stats",

  async execute(message) {
    const guild = message.guild;
    if (!guild) return;

    await guild.members.fetch();

    const totalMembers  = guild.memberCount;
    const bots          = guild.members.cache.filter(m => m.user.bot).size;
    const humans        = totalMembers - bots;
    const boosts        = guild.premiumSubscriptionCount ?? 0;
    const boostLevel    = guild.premiumTier;
    const msgCount      = messageCounters.get(guild.id) ?? 0;
    const inVoice       = guild.voiceStates.cache.filter(v => v.channelId !== null).size;
    const textChannels  = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
    const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
    const roles         = guild.roles.cache.size - 1;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`📊 Stats — ${guild.name}`)
      .setThumbnail(guild.iconURL())
      .addFields(
        { name: "👥 Membres",          value: `**${humans}** humains · ${bots} bots`,           inline: false },
        { name: "🚀 Boosts",           value: `**${boosts}** boost${boosts > 1 ? "s" : ""} — Niveau **${boostLevel}**`, inline: true  },
        { name: "🔊 En vocal",         value: `**${inVoice}** personne${inVoice > 1 ? "s" : ""}`,   inline: true  },
        { name: "💬 Messages (session)", value: `**${msgCount.toLocaleString("fr-FR")}**`,       inline: true  },
        { name: "📁 Salons textuels",  value: `${textChannels}`,                                 inline: true  },
        { name: "🎤 Salons vocaux",    value: `${voiceChannels}`,                                inline: true  },
        { name: "🏷️ Rôles",           value: `${roles}`,                                        inline: true  },
      )
      .setFooter({ text: "Les messages comptent depuis le dernier démarrage du bot." })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
