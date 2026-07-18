import {
  EmbedBuilder,
  Events,
  type Client,
  type Guild,
  type GuildMember,
  type PartialGuildMember,
  type TextBasedChannel,
} from "discord.js";

// ─── Salons de logs No Chill ──────────────────────────────
export const LOG_SERVER_CHANNEL_ID   = "1523510731952357386";
export const LOG_MESSAGES_CHANNEL_ID = "1394571299057307648";
export const LOG_TICKETS_CHANNEL_ID  = "1394583938751533149";
export const LOG_ROLES_CHANNEL_ID    = "1394571517425352734";
export const LOG_VOICE_CHANNEL_ID    = "1394571379550191689";

type LogPayload =
  | string
  | {
      embeds: EmbedBuilder[];
    };

async function getTextChannel(
  guild: Guild,
  channelId: string,
): Promise<TextBasedChannel | null> {
  const cached = guild.channels.cache.get(channelId);

  if (cached?.isTextBased()) {
    return cached;
  }

  const fetched = await guild.channels.fetch(channelId).catch(() => null);

  return fetched?.isTextBased() ? fetched : null;
}

async function sendLog(
  guild: Guild,
  channelId: string,
  payload: LogPayload,
): Promise<boolean> {
  const channel = await getTextChannel(guild, channelId);
  if (!channel || !("send" in channel)) return false;

  try {
    if (typeof payload === "string") {
      await channel.send({ content: payload });
    } else {
      await channel.send(payload);
    }

    return true;
  } catch (error) {
    console.error(`❌ Erreur envoi log dans ${channelId}:`, error);
    return false;
  }
}

// ─── Fonctions publiques réutilisables ────────────────────
export function sendServerLog(
  guild: Guild,
  payload: LogPayload,
): Promise<boolean> {
  return sendLog(guild, LOG_SERVER_CHANNEL_ID, payload);
}

export function sendMessageLog(
  guild: Guild,
  payload: LogPayload,
): Promise<boolean> {
  return sendLog(guild, LOG_MESSAGES_CHANNEL_ID, payload);
}

export function sendTicketLog(
  guild: Guild,
  payload: LogPayload,
): Promise<boolean> {
  return sendLog(guild, LOG_TICKETS_CHANNEL_ID, payload);
}

export function sendRoleLog(
  guild: Guild,
  payload: LogPayload,
): Promise<boolean> {
  return sendLog(guild, LOG_ROLES_CHANNEL_ID, payload);
}

export function sendVoiceLog(
  guild: Guild,
  payload: LogPayload,
): Promise<boolean> {
  return sendLog(guild, LOG_VOICE_CHANNEL_ID, payload);
}

// ─── Logs automatiques ─────────────────────────────────────
export function registerLogs(client: Client): void {
  // ── Messages ──────────────────────────────────────────────
  client.on(Events.MessageDelete, async (message) => {
    if (!message.guild || message.author?.bot) return;

    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle("🗑️ Message supprimé")
      .addFields(
        {
          name: "Auteur",
          value: `${message.author ?? "Inconnu"} (${message.author?.id ?? "?"})`,
          inline: true,
        },
        {
          name: "Salon",
          value: `<#${message.channelId}>`,
          inline: true,
        },
        {
          name: "Contenu",
          value: message.content?.slice(0, 1024) || "*Aucun texte*",
        },
      )
      .setTimestamp();

    await sendMessageLog(message.guild, { embeds: [embed] });
  });

  client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    const embed = new EmbedBuilder()
      .setColor(0xf39c12)
      .setTitle("✏️ Message modifié")
      .setURL(newMessage.url)
      .addFields(
        {
          name: "Auteur",
          value: `${newMessage.author ?? "Inconnu"} (${newMessage.author?.id ?? "?"})`,
          inline: true,
        },
        {
          name: "Salon",
          value: `<#${newMessage.channelId}>`,
          inline: true,
        },
        {
          name: "Avant",
          value: oldMessage.content?.slice(0, 512) || "*Inconnu*",
        },
        {
          name: "Après",
          value: newMessage.content?.slice(0, 512) || "*Vide*",
        },
      )
      .setTimestamp();

    await sendMessageLog(newMessage.guild, { embeds: [embed] });
  });

  // ── Membres / sanctions ───────────────────────────────────
  client.on(Events.GuildMemberAdd, async (member) => {
    const createdTimestamp = Math.floor(
      member.user.createdTimestamp / 1000,
    );

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("📥 Membre rejoint")
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        {
          name: "Membre",
          value: `${member.user.tag} (${member.id})`,
        },
        {
          name: "Compte créé",
          value: `<t:${createdTimestamp}:R>`,
        },
      )
      .setTimestamp();

    await sendServerLog(member.guild, { embeds: [embed] });
  });

  client.on(Events.GuildMemberRemove, async (member) => {
    const roles = member.roles.cache
      .filter((role) => role.id !== member.guild.id)
      .map((role) => `<@&${role.id}>`)
      .join(", ");

    const embed = new EmbedBuilder()
      .setColor(0xe67e22)
      .setTitle("📤 Membre parti ou expulsé")
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        {
          name: "Membre",
          value: `${member.user.tag} (${member.id})`,
        },
        {
          name: "Rôles",
          value: roles || "Aucun",
        },
      )
      .setTimestamp();

    await sendServerLog(member.guild, { embeds: [embed] });
  });

  client.on(Events.GuildBanAdd, async (ban) => {
    const embed = new EmbedBuilder()
      .setColor(0x992d22)
      .setTitle("🔨 Membre banni")
      .addFields(
        {
          name: "Membre",
          value: `${ban.user.tag} (${ban.user.id})`,
        },
        {
          name: "Raison",
          value: ban.reason ?? "Aucune raison",
        },
      )
      .setTimestamp();

    await sendServerLog(ban.guild, { embeds: [embed] });
  });

  client.on(Events.GuildBanRemove, async (ban) => {
    const embed = new EmbedBuilder()
      .setColor(0x27ae60)
      .setTitle("✅ Membre débanni")
      .addFields({
        name: "Membre",
        value: `${ban.user.tag} (${ban.user.id})`,
      })
      .setTimestamp();

    await sendServerLog(ban.guild, { embeds: [embed] });
  });

  // ── Rôles ────────────────────────────────────────────────
  client.on(
    Events.GuildMemberUpdate,
    async (
      oldMember: GuildMember | PartialGuildMember,
      newMember: GuildMember,
    ) => {
      const added = newMember.roles.cache.filter(
        (role) => !oldMember.roles.cache.has(role.id),
      );

      const removed = oldMember.roles.cache.filter(
        (role) => !newMember.roles.cache.has(role.id),
      );

      if (added.size === 0 && removed.size === 0) return;

      const embed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle("🏷️ Rôles modifiés")
        .addFields({
          name: "Membre",
          value: `${newMember.user.tag} (${newMember.id})`,
        });

      if (added.size > 0) {
        embed.addFields({
          name: "➕ Ajoutés",
          value: added.map((role) => `<@&${role.id}>`).join(", "),
        });
      }

      if (removed.size > 0) {
        embed.addFields({
          name: "➖ Retirés",
          value: removed.map((role) => `<@&${role.id}>`).join(", "),
        });
      }

      embed.setTimestamp();

      await sendRoleLog(newMember.guild, { embeds: [embed] });
    },
  );

  client.on(Events.GuildRoleCreate, async (role) => {
    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("➕ Rôle créé")
      .addFields({
        name: "Rôle",
        value: `<@&${role.id}> (${role.name})`,
      })
      .setTimestamp();

    await sendRoleLog(role.guild, { embeds: [embed] });
  });

  client.on(Events.GuildRoleDelete, async (role) => {
    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle("🗑️ Rôle supprimé")
      .addFields({
        name: "Rôle",
        value: `${role.name} (${role.id})`,
      })
      .setTimestamp();

    await sendRoleLog(role.guild, { embeds: [embed] });
  });

  // ── Vocal ────────────────────────────────────────────────
  client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    const member = newState.member ?? oldState.member;
    if (!member || member.user.bot) return;

    let title: string;
    let color: number;
    let detail: string;

    if (!oldState.channelId && newState.channelId) {
      title = "🔊 Connexion vocale";
      color = 0x2ecc71;
      detail = `<#${newState.channelId}>`;
    } else if (oldState.channelId && !newState.channelId) {
      title = "🔇 Déconnexion vocale";
      color = 0xe74c3c;
      detail = `<#${oldState.channelId}>`;
    } else if (oldState.channelId !== newState.channelId) {
      title = "🔀 Changement de vocal";
      color = 0xf39c12;
      detail = `<#${oldState.channelId}> → <#${newState.channelId}>`;
    } else {
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .addFields(
        {
          name: "Membre",
          value: `${member.user.tag} (${member.id})`,
          inline: true,
        },
        {
          name: "Salon",
          value: detail,
          inline: true,
        },
      )
      .setTimestamp();

    await sendVoiceLog(newState.guild, { embeds: [embed] });
  });

  // ── Serveur ──────────────────────────────────────────────
  client.on(Events.ChannelCreate, async (channel) => {
    if (!("guild" in channel)) return;

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("➕ Salon créé")
      .addFields({
        name: "Salon",
        value: `<#${channel.id}> (${channel.name})`,
      })
      .setTimestamp();

    await sendServerLog(channel.guild, { embeds: [embed] });
  });

  client.on(Events.ChannelDelete, async (channel) => {
    if (!("guild" in channel)) return;

    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle("🗑️ Salon supprimé")
      .addFields({
        name: "Salon",
        value: `#${channel.name ?? channel.id}`,
      })
      .setTimestamp();

    await sendServerLog(channel.guild, { embeds: [embed] });
  });

  client.on(Events.GuildUpdate, async (oldGuild, newGuild) => {
    const changes: string[] = [];

    if (oldGuild.name !== newGuild.name) {
      changes.push(
        `Nom : **${oldGuild.name}** → **${newGuild.name}**`,
      );
    }

    if (oldGuild.icon !== newGuild.icon) {
      changes.push("Icône modifiée");
    }

    if (oldGuild.description !== newGuild.description) {
      changes.push("Description modifiée");
    }

    if (changes.length === 0) return;

    const embed = new EmbedBuilder()
      .setColor(0xf39c12)
      .setTitle("⚙️ Serveur modifié")
      .setDescription(changes.join("\n"))
      .setTimestamp();

    await sendServerLog(newGuild, { embeds: [embed] });
  });
}
