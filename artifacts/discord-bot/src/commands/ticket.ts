import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
  type Interaction,
  type GuildTextBasedChannel,
} from "discord.js";

import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";
import { getConfig } from "../utils/serverConfig.js";
import { sendTicketLog } from "../utils/logs.js";

// ─── Defaults No Chill ────────────────────────────────────────────────────
const DEFAULT_STAFF_ID = "1476396219314995331";
const DEFAULT_OWNER_ROLE_ID = "1362525559472652349";
const DEFAULT_ABUS_ID = "1476397435117899816";

type TicketType = "candidature" | "owner" | "abus";

type TicketCategory = {
  label: string;
  color: number;
  ping: string;
  pingId: string;
  title: string;
  intro: string;
  channelPrefix: string;
};

const openTickets = new Map<string, string>();

async function getTicketConfig(
  guild: NonNullable<Interaction["guild"]>,
): Promise<Record<TicketType, TicketCategory>> {
  const cfg = getConfig(guild.id);

  const staffId = cfg.staffRole ?? DEFAULT_STAFF_ID;
  const abusId = cfg.abuseRole ?? DEFAULT_ABUS_ID;

  const ownerRoleId =
    guild.roles.cache.has(DEFAULT_OWNER_ROLE_ID)
      ? DEFAULT_OWNER_ROLE_ID
      : cfg.staffRole ?? DEFAULT_STAFF_ID;

  return {
    candidature: {
      label: "🎯 Candidature",
      color: 0x6d28d9,
      ping: `<@&${staffId}>`,
      pingId: staffId,
      title: "✦ No Chill • Candidature Staff",
      intro:
        "Présente ta candidature ici. L’équipe staff te répondra dès que possible.\n\n" +
        "Indique ton âge, tes disponibilités et les raisons pour lesquelles tu souhaites rejoindre l’équipe.",
      channelPrefix: "candidature",
    },
    owner: {
      label: "👑 Contacter l’Owner",
      color: 0x6d28d9,
      ping: `<@&${ownerRoleId}>`,
      pingId: ownerRoleId,
      title: "✦ No Chill • Contact Owner",
      intro:
        "L’owner a été notifié et te répondra dès que possible.\n\n" +
        "Explique clairement l’objet de ta demande.",
      channelPrefix: "owner",
    },
    abus: {
      label: "⚠️ Signaler un abus",
      color: 0x6d28d9,
      ping: `<@&${abusId}>`,
      pingId: abusId,
      title: "✦ No Chill • Signalement d’abus",
      intro:
        "Ton signalement a été transmis à l’équipe concernée.\n\n" +
        "Décris les faits avec le plus de détails possible : pseudo, date et preuves disponibles.",
      channelPrefix: "abus",
    },
  };
}

function makeCloseRow(
  type: TicketType,
  userId: string,
): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`tkt_close_${type}_${userId}`)
      .setLabel("Fermer le ticket")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger),
  );
}

export async function handleTicketInteraction(
  interaction: Interaction,
): Promise<void> {
  if (!interaction.guild) return;

  // ─── Ouverture ─────────────────────────────────────────────────────────
  if (
    interaction.isButton() &&
    interaction.customId.startsWith("tkt_open_")
  ) {
    const type = interaction.customId.replace(
      "tkt_open_",
      "",
    ) as TicketType;

    if (!["candidature", "owner", "abus"].includes(type)) {
      return;
    }

    const ticketCfg = await getTicketConfig(
      interaction.guild,
    );

    const cfg = ticketCfg[type];
    const key = `${interaction.user.id}_${type}`;
    const existing = openTickets.get(key);

    if (existing) {
      const existingChannel =
        interaction.guild.channels.cache.get(existing);

      if (existingChannel) {
        await interaction.reply({
          content: `❌ Tu as déjà un ticket ouvert : <#${existing}>`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      openTickets.delete(key);
    }

    await interaction.deferReply({
      flags: MessageFlags.Ephemeral,
    });

    try {
      const guild = interaction.guild;
      const panelChannel =
        interaction.channel as GuildTextBasedChannel;

      const parentId =
        "parentId" in panelChannel
          ? panelChannel.parentId
          : null;

      const safeName =
        interaction.user.username
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "")
          .slice(0, 20) || interaction.user.id;

      const permissionOverwrites = [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
          ],
        },
        {
          id: cfg.pingId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        {
          id: guild.members.me!.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageChannels,
          ],
        },
      ];

      const ticketChannel =
        await guild.channels.create({
          name: `${cfg.channelPrefix}-${safeName}`,
          type: ChannelType.GuildText,
          parent: parentId ?? undefined,
          permissionOverwrites,
          reason: `Ticket ${type} — ${interaction.user.tag}`,
        });

      openTickets.set(key, ticketChannel.id);

      const embed = new EmbedBuilder()
        .setColor(0x6d28d9)
        .setTitle(cfg.title)
        .setDescription(cfg.intro)
        .addFields(
          {
            name: "👤 Ouvert par",
            value: `${interaction.user}`,
            inline: true,
          },
          {
            name: "📅 Ouvert le",
            value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
            inline: true,
          },
        )
        .setFooter({
          text: "Utilise le bouton ci-dessous pour fermer le ticket.",
        })
        .setTimestamp();

      await ticketChannel.send({
        content:
          `${cfg.ping} — nouveau ticket de ${interaction.user}`,
        embeds: [embed],
        components: [
          makeCloseRow(type, interaction.user.id),
        ],
      });

      await interaction.editReply({
        content:
          `✅ Ton ticket a été créé : <#${ticketChannel.id}>`,
      });

      const logEmbed = new EmbedBuilder()
        .setColor(0x6d28d9)
        .setTitle("🎫 Ticket ouvert")
        .addFields(
          {
            name: "Auteur",
            value: `${interaction.user}`,
            inline: true,
          },
          {
            name: "Type",
            value: cfg.label,
            inline: true,
          },
          {
            name: "Salon",
            value: `<#${ticketChannel.id}>`,
            inline: true,
          },
        )
        .setTimestamp();

      await sendTicketLog(guild, {
        embeds: [logEmbed],
      });
    } catch (error) {
      console.error(
        `❌ Erreur création ticket ${type}:`,
        error,
      );

      await interaction.editReply({
        content:
          "❌ Impossible de créer le ticket.\n" +
          "Vérifie la configuration du rôle ou de l’utilisateur concerné, ainsi que la permission **Gérer les salons** du bot.",
      });
    }

    return;
  }

  // ─── Fermeture ─────────────────────────────────────────────────────────
  if (
    interaction.isButton() &&
    interaction.customId.startsWith("tkt_close_")
  ) {
    const parts = interaction.customId.split("_");
    const type = parts[2] as TicketType;
    const userId = parts[3];

    const member = await interaction.guild.members
      .fetch(interaction.user.id)
      .catch(() => null);

    const isMod = member
      ? isModerator(member)
      : false;

    const isAuthor =
      interaction.user.id === userId;

    if (!isMod && !isAuthor) {
      await interaction.reply({
        content:
          "❌ Seul l’auteur du ticket ou un modérateur peut le fermer.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    openTickets.delete(`${userId}_${type}`);

    const logEmbed = new EmbedBuilder()
      .setColor(0x6d28d9)
      .setTitle("🔒 Ticket fermé")
      .addFields(
        {
          name: "Auteur du ticket",
          value: `<@${userId}>`,
          inline: true,
        },
        {
          name: "Fermé par",
          value: `${interaction.user}`,
          inline: true,
        },
        {
          name: "Type",
          value: type,
          inline: true,
        },
        {
          name: "Salon",
          value: interaction.channel
            ? `<#${interaction.channel.id}>`
            : "Inconnu",
          inline: true,
        },
      )
      .setTimestamp();

    await sendTicketLog(interaction.guild, {
      embeds: [logEmbed],
    });

    await interaction.reply({
      content:
        `🔒 Ticket fermé par ${interaction.user}. ` +
        "Ce salon sera supprimé dans 5 secondes.",
    });

    setTimeout(async () => {
      if (
        interaction.channel &&
        "delete" in interaction.channel
      ) {
        await interaction.channel
          .delete(
            `Ticket fermé par ${interaction.user.tag}`,
          )
          .catch(() => {});
      }
    }, 5000);

    return;
  }
}

export const ticketCommand: Command = {
  name: "ticket",
  description:
    "Initialise le panneau de tickets dans ce salon",
  usage: "*ticket setup",

  execute: async (message, args) => {
    if (
      !message.member ||
      !isModerator(message.member)
    ) {
      await message.reply(
        "❌ Tu n’as pas la permission d’utiliser cette commande.",
      );
      return;
    }

    if (
      (args[0] ?? "").toLowerCase() !== "setup"
    ) {
      await message.reply(
        "❌ Utilise `*ticket setup` pour initialiser le panneau.",
      );
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x6d28d9)
      .setTitle("✦ No Chill • Tickets")
      .setDescription(
        "Choisis la catégorie correspondant à ta demande :\n\n" +
        "🎯 **Candidature** — Rejoindre l’équipe staff\n" +
        "👑 **Owner** — Contacter directement l’owner\n" +
        "⚠️ **Abus** — Signaler un comportement abusif\n\n" +
        "*Un salon privé sera créé, visible uniquement par toi et l’équipe concernée.*",
      )
      .setFooter({
        text: "Un seul ticket par catégorie à la fois.",
      });

    const row =
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("tkt_open_candidature")
          .setLabel("Candidature")
          .setEmoji("🎯")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("tkt_open_owner")
          .setLabel("Owner")
          .setEmoji("👑")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("tkt_open_abus")
          .setLabel("Signaler un abus")
          .setEmoji("⚠️")
          .setStyle(ButtonStyle.Primary),
      );

    const panel = await message.channel.send({
      embeds: [embed],
      components: [row],
    });

    await message.reply(
      "✅ Panneau de tickets initialisé !",
    );

    const logEmbed = new EmbedBuilder()
      .setColor(0x6d28d9)
      .setTitle(
        "⚙️ Panneau de tickets initialisé",
      )
      .addFields(
        {
          name: "Salon",
          value: `${message.channel}`,
          inline: true,
        },
        {
          name: "Message",
          value: `[Ouvrir le panneau](${panel.url})`,
          inline: true,
        },
        {
          name: "Par",
          value: `${message.author}`,
          inline: true,
        },
      )
      .setTimestamp();

    if (message.guild) {
      await sendTicketLog(message.guild, {
        embeds: [logEmbed],
      });
    }
  },
};
