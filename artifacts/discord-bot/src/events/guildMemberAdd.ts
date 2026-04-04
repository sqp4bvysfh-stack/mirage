import { EmbedBuilder, TextChannel } from "discord.js";
import type { GuildMember } from "discord.js";

export async function onGuildMemberAdd(member: GuildMember) {
  const guild = member.guild;

  const welcomeChannel = guild.channels.cache.find(
    (ch) => ch.isTextBased() && (ch.name.includes("bienvenue") || ch.name.includes("welcome") || ch.name.includes("général") || ch.name.includes("general"))
  ) as TextChannel | undefined;

  if (!welcomeChannel) return;

  const memberCount = guild.memberCount;
  const avatarUrl = member.user.displayAvatarURL({ size: 256 });

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`👋 Bienvenue sur ${guild.name} !`)
    .setDescription(
      `Salut <@${member.user.id}>, on est ravis de t'accueillir ici !\nN'hésite pas à te présenter et à lire les règles du serveur.`
    )
    .setThumbnail(avatarUrl)
    .addFields(
      { name: "👤 Membre", value: `${member.user.tag}`, inline: true },
      { name: "🎉 Tu es le membre n°", value: `**${memberCount}**`, inline: true },
      {
        name: "📅 Compte créé le",
        value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:D>`,
        inline: true,
      }
    )
    .setFooter({ text: `ID: ${member.user.id}` })
    .setTimestamp();

  await welcomeChannel.send({ embeds: [embed] });
}
