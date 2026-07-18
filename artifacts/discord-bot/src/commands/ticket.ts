import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  type Interaction,
  type GuildTextBasedChannel,
} from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";
import { getConfig } from "../utils/serverConfig.js";
import { sendTicketLog } from "../utils/logs.js";

// ─── Defaults (MIRAGE) ────────────────────────────────────────────────────
const DEFAULT_STAFF_ID = "1476396219314995331";
const DEFAULT_OWNER_ID = "1476499085748862986";
const DEFAULT_ABUS_ID  = "1476397435117899816";

function getTicketConfig(guildId: string) {
  const cfg      = getConfig(guildId);
  const staffId  = cfg.staffRole  ?? DEFAULT_STAFF_ID;
  const ownerId  = cfg.ownerUser  ?? DEFAULT_OWNER_ID;
  const abusId   = cfg.abuseRole  ?? DEFAULT_ABUS_ID;

  return {
    candidature: {
      label:         "🎯 Candidature",
      color:         0x2ecc71 as number,
      ping:          `<@&${staffId}>`,
      pingId:        staffId,
      isUser:        false,
      title:         "🎯 Candidature Staff",
      intro:         "Présente ta candidature ici. L'équipe staff te répondra dès que possible.\n\nIndique ton âge, ta disponibilité et pourquoi tu veux rejoindre le staff.",
      channelPrefix: "candidature",
    },
    owner: {
      label:         "👑 Contacter l'Owner",
      color:         0xf1c40f as number,
      ping:          `<@${ownerId}>`,
      pingId:        ownerId,
      isUser:        true,
      title:         "👑 Contact Owner",
      intro:         "L'owner a été notifié et va te répondre dès que possible.\n\nExplique l'objet de ta demande.",
      channelPrefix: "owner",
    },
    abus: {
      label:         "⚠️ Signaler un abus",
      color:         0xe74c3c as number,
      ping:          `<@&${abusId}>`,
      pingId:        abusId,
      isUser:        false,
      title:         "⚠️ Signalement d'abus",
      intro:         "Ton signalement a été transmis à l'équipe.\n\nDécris les faits avec le plus de détails possible (pseudo, date, preuve si disponible).",
      channelPrefix: "abus",
    },
  } as const;
}

type TicketType = "candidature" | "owner" | "abus";
const openTickets = new Map<string, string>();

function makeCloseRow(type: TicketType, userId: string) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`tkt_close_${type}_${userId}`)
      .setLabel("🔒 Fermer le ticket")
      .setStyle(ButtonStyle.Danger),
  );
}

export async function handleTicketInteraction(interaction: Interaction) {
  if (!interaction.guild) return;

  // ─── Ouverture ─────────────────────────────────────────────────────────
  if (interaction.isButton() && interaction.customId.startsWith("tkt_open_")) {
    const type        = interaction.customId.replace("tkt_open_", "") as TicketType;
    const ticketCfg   = getTicketConfig(interaction.guild.id);
    const cfg         = ticketCfg[type];
    if (!cfg) return;

    const key      = `${interaction.user.id}_${type}`;
    const existing = openTickets.get(key);
    if (existing) {
      await interaction.reply({ content: `❌ Tu as déjà un ticket ouvert : <#${existing}>`, ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const guild       = interaction.guild;
      const panelChan   = interaction.channel as GuildTextBasedChannel;
      const parentId    = "parentId" in panelChan ? panelChan.parentId : null;
      const safeName    = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);

      const ticketChannel = await guild.channels.create({
        name: `${cfg.channelPrefix}-${safeName}`,
        type: ChannelType.GuildText,
        parent: parentId ?? undefined,
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id,     allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
          { id: cfg.pingId,              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
        ],
        reason: `Ticket ${type} — ${interaction.user.tag}`,
      });

      openTickets.set(key, ticketChannel.id);

      const embed = new EmbedBuilder()
        .setColor(cfg.color)
        .setTitle(cfg.title)
        .setDescription(cfg.intro)
        .addFields(
          { name: "👤 Ouvert par", value: `${interaction.user}`,                              inline: true },
          { name: "📅 Ouvert le",  value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
        )
        .setFooter({ text: "Clique sur 🔒 pour fermer et supprimer ce ticket." })
        .setTimestamp();

      await ticketChannel.send({
        content: `${cfg.ping} — nouveau ticket de ${interaction.user}`,
        embeds:  [embed],
        components: [makeCloseRow(type, interaction.user.id)],
      });

      await interaction.editReply({ content: `✅ Ton ticket a été créé : <#${ticketChannel.id}>` });

      const logEmbed = new EmbedBuilder()
        .setColor(cfg.color)
        .setTitle("🎫 Ticket ouvert")
        .addFields(
          { name: "Auteur", value: `${interaction.user}`, inline: true },
          { name: "Type", value: cfg.label, inline: true },
          { name: "Salon", value: `<#${ticketChannel.id}>`, inline: true },
        )
        .setTimestamp();

      await sendTicketLog(guild, { embeds: [logEmbed] });
    } catch {
      await interaction.editReply({ content: "❌ Impossible de créer le ticket. Vérifie que le bot a la permission **Gérer les salons**." });
    }
    return;
  }

  // ─── Fermeture ─────────────────────────────────────────────────────────
  if (interaction.isButton() && interaction.customId.startsWith("tkt_close_")) {
    const parts  = interaction.customId.split("_");
    const type   = parts[2] as TicketType;
    const userId = parts[3];

    const member   = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    const isMod    = member ? isModerator(member) : false;
    const isAuthor = interaction.user.id === userId;

    if (!isMod && !isAuthor) {
      await interaction.reply({ content: "❌ Seul l'auteur du ticket ou un modérateur peut le fermer.", ephemeral: true });
      return;
    }

    openTickets.delete(`${userId}_${type}`);

    const logEmbed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle("🔒 Ticket fermé")
      .addFields(
        { name: "Auteur du ticket", value: `<@${userId}>`, inline: true },
        { name: "Fermé par", value: `${interaction.user}`, inline: true },
        { name: "Type", value: type, inline: true },
        {
          name: "Salon",
          value: interaction.channel ? `<#${interaction.channel.id}>` : "Inconnu",
          inline: true,
        },
      )
      .setTimestamp();

    await sendTicketLog(interaction.guild, { embeds: [logEmbed] });
    await interaction.reply({ content: `🔒 Ticket fermé par ${interaction.user}. Ce salon sera supprimé dans 5 secondes.` });

    setTimeout(async () => {
      if (interaction.channel && "delete" in interaction.channel) {
        await (interaction.channel as any).delete(`Ticket fermé par ${interaction.user.tag}`).catch(() => {});
      }
    }, 5000);
    return;
  }
}

export const ticketCommand: Command = {
  name: "ticket", description: "Initialise le panneau de tickets dans ce salon", usage: "*ticket setup",
  execute: async (message) => {
    if (!message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n'as pas la permission d'utiliser cette commande."); return;
    }
    if (message.content.slice(1).trim().split(/\s+/)[1]?.toLowerCase() !== "setup") {
      await message.reply("❌ Utilise `*ticket setup` pour initialiser le panneau."); return;
    }
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("🎫 Ouvrir un ticket")
      .setDescription("Choisis la catégorie correspondant à ta demande :\n\n🎯 **Candidature** — Rejoindre l'équipe staff\n👑 **Owner** — Message privé à l'owner\n⚠️ **Abus** — Signaler un comportement abusif\n\n*Un salon privé sera créé, visible uniquement par toi et l'équipe concernée.*")
      .setFooter({ text: "Un seul ticket par catégorie à la fois." });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("tkt_open_candidature").setLabel("🎯 Candidature").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("tkt_open_owner").setLabel("👑 Owner").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("tkt_open_abus").setLabel("⚠️ Signaler un abus").setStyle(ButtonStyle.Danger),
    );
    const panel = await message.channel.send({ embeds: [embed], components: [row] });
    await message.reply("✅ Panneau de tickets initialisé !");

    const logEmbed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("⚙️ Panneau de tickets initialisé")
      .addFields(
        { name: "Salon", value: `${message.channel}`, inline: true },
        { name: "Message", value: `[Ouvrir le panneau](${panel.url})`, inline: true },
        { name: "Par", value: `${message.author}`, inline: true },
      )
      .setTimestamp();

    if (message.guild) await sendTicketLog(message.guild, { embeds: [logEmbed] });
  },
};
