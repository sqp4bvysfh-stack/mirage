import { EmbedBuilder, Events, AuditLogEvent, ChannelType } from "discord.js";
import type { Client, TextChannel, GuildMember, PartialGuildMember } from "discord.js";
import { getConfig } from "./serverConfig.js";

async function getLogChannel(client: Client, guildId: string): Promise<TextChannel | null> {
  const channelId = getConfig(guildId).logsChannel;
  if (!channelId) return null;
  try {
    const ch = await client.channels.fetch(channelId);
    return ch?.isTextBased() ? (ch as TextChannel) : null;
  } catch {
    return null;
  }
}

function ts() {
  return Math.floor(Date.now() / 1000);
}

export function registerLogs(client: Client) {

  // ─── MESSAGES ─────────────────────────────────────────────

  client.on(Events.MessageDelete, async (message) => {
    if (!message.guild || message.author?.bot) return;
    const log = await getLogChannel(client, message.guild.id);
    if (!log) return;
    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle("🗑️ Message supprimé")
      .addFields(
        { name: "Auteur",  value: `${message.author ?? "Inconnu"} (${message.author?.id ?? "?"})`, inline: true },
        { name: "Salon",   value: `<#${message.channelId}>`, inline: true },
        { name: "Contenu", value: message.content?.slice(0, 1024) || "*Aucun texte*" },
      )
      .setTimestamp();
    await log.send({ embeds: [embed] }).catch(() => {});
  });

  client.on(Events.MessageUpdate, async (oldMsg, newMsg) => {
    if (!newMsg.guild || newMsg.author?.bot) return;
    if (oldMsg.content === newMsg.content) return;
    const log = await getLogChannel(client, newMsg.guild.id);
    if (!log) return;
    const embed = new EmbedBuilder()
      .setColor(0xf39c12)
      .setTitle("✏️ Message modifié")
      .setURL(newMsg.url)
      .addFields(
        { name: "Auteur",  value: `${newMsg.author} (${newMsg.author?.id})`, inline: true },
        { name: "Salon",   value: `<#${newMsg.channelId}>`, inline: true },
        { name: "Avant",   value: oldMsg.content?.slice(0, 512) || "*Inconnu*" },
        { name: "Après",   value: newMsg.content?.slice(0, 512) || "*Vide*" },
      )
      .setTimestamp();
    await log.send({ embeds: [embed] }).catch(() => {});
  });

  // ─── MEMBRES ──────────────────────────────────────────────

  client.on(Events.GuildMemberAdd, async (member) => {
    const log = await getLogChannel(client, member.guild.id);
    if (!log) return;
    const created = Math.floor(member.user.createdTimestamp / 1000);
    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("📥 Membre rejoint")
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        { name: "Membre",  value: `${member.user.tag} (${member.id})` },
        { name: "Compte créé le", value: `<t:${created}:R>` },
      )
      .setTimestamp();
    await log.send({ embeds: [embed] }).catch(() => {});
  });

  client.on(Events.GuildMemberRemove, async (member) => {
    const log = await getLogChannel(client, member.guild.id);
    if (!log) return;
    const embed = new EmbedBuilder()
      .setColor(0xe67e22)
      .setTitle("📤 Membre parti / expulsé")
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        { name: "Membre", value: `${member.user.tag} (${member.id})` },
        { name: "Rôles",  value: member.roles.cache.filter(r => r.id !== member.guild.id).map(r => `<@&${r.id}>`).join(", ") || "Aucun" },
      )
      .setTimestamp();
    await log.send({ embeds: [embed] }).catch(() => {});
  });

  client.on(Events.GuildBanAdd, async (ban) => {
    const log = await getLogChannel(client, ban.guild.id);
    if (!log) return;
    const embed = new EmbedBuilder()
      .setColor(0x992d22)
      .setTitle("🔨 Membre banni")
      .addFields(
        { name: "Membre", value: `${ban.user.tag} (${ban.user.id})` },
        { name: "Raison", value: ban.reason ?? "Aucune raison" },
      )
      .setTimestamp();
    await log.send({ embeds: [embed] }).catch(() => {});
  });

  client.on(Events.GuildBanRemove, async (ban) => {
    const log = await getLogChannel(client, ban.guild.id);
    if (!log) return;
    const embed = new EmbedBuilder()
      .setColor(0x27ae60)
      .setTitle("✅ Membre débanni")
      .addFields(
        { name: "Membre", value: `${ban.user.tag} (${ban.user.id})` },
      )
      .setTimestamp();
    await log.send({ embeds: [embed] }).catch(() => {});
  });

  // ─── RÔLES ────────────────────────────────────────────────

  client.on(Events.GuildMemberUpdate, async (oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) => {
    const log = await getLogChannel(client, newMember.guild.id);
    if (!log) return;

    const added   = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
    const removed = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));

    if (added.size === 0 && removed.size === 0) return;

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle("🏷️ Rôles modifiés")
      .addFields(
        { name: "Membre",   value: `${newMember.user.tag} (${newMember.id})` },
      );

    if (added.size > 0)   embed.addFields({ name: "➕ Ajoutés",   value: added.map(r => `<@&${r.id}>`).join(", ") });
    if (removed.size > 0) embed.addFields({ name: "➖ Retirés",   value: removed.map(r => `<@&${r.id}>`).join(", ") });

    embed.setTimestamp();
    await log.send({ embeds: [embed] }).catch(() => {});
  });

  // ─── VOCAL ────────────────────────────────────────────────

  client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    if (!newState.guild || newState.member?.user.bot) return;
    const log = await getLogChannel(client, newState.guild.id);
    if (!log) return;

    const member = newState.member ?? oldState.member;
    if (!member) return;

    let title = "", color = 0x5865f2, detail = "";

    if (!oldState.channelId && newState.channelId) {
      title = "🔊 Rejoint un vocal";
      color = 0x2ecc71;
      detail = `<#${newState.channelId}>`;
    } else if (oldState.channelId && !newState.channelId) {
      title = "🔇 Quitté un vocal";
      color = 0xe74c3c;
      detail = `<#${oldState.channelId}>`;
    } else if (oldState.channelId !== newState.channelId) {
      title = "🔀 Changé de vocal";
      color = 0xf39c12;
      detail = `<#${oldState.channelId}> → <#${newState.channelId}>`;
    } else {
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .addFields(
        { name: "Membre", value: `${member.user.tag} (${member.id})`, inline: true },
        { name: "Salon",  value: detail, inline: true },
      )
      .setTimestamp();
    await log.send({ embeds: [embed] }).catch(() => {});
  });

  // ─── SERVEUR ──────────────────────────────────────────────

  client.on(Events.ChannelCreate, async (channel) => {
    if (!("guild" in channel) || !channel.guild) return;
    const log = await getLogChannel(client, channel.guild.id);
    if (!log) return;
    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("➕ Salon créé")
      .addFields({ name: "Salon", value: `<#${channel.id}> (${channel.name})` })
      .setTimestamp();
    await log.send({ embeds: [embed] }).catch(() => {});
  });

  client.on(Events.ChannelDelete, async (channel) => {
    if (!("guild" in channel) || !channel.guild) return;
    const log = await getLogChannel(client, channel.guild.id);
    if (!log) return;
    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle("🗑️ Salon supprimé")
      .addFields({ name: "Salon", value: `#${(channel as any).name ?? channel.id}` })
      .setTimestamp();
    await log.send({ embeds: [embed] }).catch(() => {});
  });

  client.on(Events.GuildRoleCreate, async (role) => {
    const log = await getLogChannel(client, role.guild.id);
    if (!log) return;
    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("➕ Rôle créé")
      .addFields({ name: "Rôle", value: `<@&${role.id}> (${role.name})` })
      .setTimestamp();
    await log.send({ embeds: [embed] }).catch(() => {});
  });

  client.on(Events.GuildRoleDelete, async (role) => {
    const log = await getLogChannel(client, role.guild.id);
    if (!log) return;
    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle("🗑️ Rôle supprimé")
      .addFields({ name: "Rôle", value: role.name })
      .setTimestamp();
    await log.send({ embeds: [embed] }).catch(() => {});
  });

  client.on(Events.GuildUpdate, async (oldGuild, newGuild) => {
    const log = await getLogChannel(client, newGuild.id);
    if (!log) return;
    const changes: string[] = [];
    if (oldGuild.name !== newGuild.name) changes.push(`Nom : **${oldGuild.name}** → **${newGuild.name}**`);
    if (oldGuild.icon !== newGuild.icon) changes.push("Icône modifiée");
    if (oldGuild.description !== newGuild.description) changes.push("Description modifiée");
    if (changes.length === 0) return;
    const embed = new EmbedBuilder()
      .setColor(0xf39c12)
      .setTitle("⚙️ Serveur modifié")
      .setDescription(changes.join("\n"))
      .setTimestamp();
    await log.send({ embeds: [embed] }).catch(() => {});
  });
}
