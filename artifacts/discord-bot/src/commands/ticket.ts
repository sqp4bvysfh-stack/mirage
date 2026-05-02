import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ThreadAutoArchiveDuration,
  type Interaction,
  type GuildTextBasedChannel,
} from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";

const STAFF_ROLE_ID  = "1476396219314995331";
const OWNER_ID       = "1476499085748862986";
const ABUS_ROLE_ID   = "1476397435117899816";

const TICKET_CONFIG = {
  candidature: {
    label:       "🎯 Candidature",
    color:       0x2ecc71 as number,
    ping:        `<@&${STAFF_ROLE_ID}>`,
    title:       "🎯 Candidature Staff",
    intro:       "Présente ta candidature ici. L'équipe staff te répondra dès que possible.\n\nIndique ton âge, ta disponibilité et pourquoi tu veux rejoindre le staff.",
  },
  owner: {
    label:       "👑 Contacter l'Owner",
    color:       0xf1c40f as number,
    ping:        `<@${OWNER_ID}>`,
    title:       "👑 Contact Owner",
    intro:       "L'owner a été notifié et va te répondre dès que possible.\n\nExplique l'objet de ta demande.",
  },
  abus: {
    label:       "⚠️ Signaler un abus",
    color:       0xe74c3c as number,
    ping:        `<@&${ABUS_ROLE_ID}>`,
    title:       "⚠️ Signalement d'abus",
    intro:       "Ton signalement a été transmis à l'équipe.\n\nDécris les faits avec le plus de détails possible (pseudo, date, preuve si disponible).",
  },
} as const;

type TicketType = keyof typeof TICKET_CONFIG;

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

  // ─── Ouverture d'un ticket ────────────────────────────────────────────────
  if (interaction.isButton() && interaction.customId.startsWith("tkt_open_")) {
    const type = interaction.customId.replace("tkt_open_", "") as TicketType;
    const cfg  = TICKET_CONFIG[type];
    if (!cfg) return;

    const key = `${interaction.user.id}_${type}`;
    const existing = openTickets.get(key);
    if (existing) {
      await interaction.reply({
        content: `❌ Tu as déjà un ticket ouvert : <#${existing}>`,
        ephemeral: true,
      });
      return;
    }

    const channel = interaction.channel as GuildTextBasedChannel | null;
    if (!channel || !("threads" in channel)) {
      await interaction.reply({ content: "❌ Ce salon ne supporte pas les fils.", ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const thread = await channel.threads.create({
        name: `${cfg.label} — ${interaction.user.username}`,
        type: ChannelType.PrivateThread,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
        reason: `Ticket ${type} — ${interaction.user.tag}`,
      });

      await thread.members.add(interaction.user.id);
      openTickets.set(key, thread.id);

      const embed = new EmbedBuilder()
        .setColor(cfg.color)
        .setTitle(cfg.title)
        .setDescription(cfg.intro)
        .addFields(
          { name: "👤 Ouvert par", value: `${interaction.user}`, inline: true },
          { name: "📅 Ouvert le", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
        )
        .setFooter({ text: "Clique sur 🔒 pour fermer ce ticket." })
        .setTimestamp();

      await thread.send({
        content: `${cfg.ping} — nouveau ticket de ${interaction.user}`,
        embeds: [embed],
        components: [makeCloseRow(type, interaction.user.id)],
      });

      await interaction.editReply({ content: `✅ Ton ticket a été créé : <#${thread.id}>` });

    } catch {
      await interaction.editReply({
        content: "❌ Impossible de créer le ticket. Vérifie que le bot a la permission **Créer des fils privés**.",
      });
    }
    return;
  }

  // ─── Fermeture d'un ticket ────────────────────────────────────────────────
  if (interaction.isButton() && interaction.customId.startsWith("tkt_close_")) {
    const parts  = interaction.customId.split("_"); // tkt_close_type_userId
    const type   = parts[2] as TicketType;
    const userId = parts[3];

    const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    const isMod  = member ? isModerator(member) : false;
    const isAuthor = interaction.user.id === userId;

    if (!isMod && !isAuthor) {
      await interaction.reply({
        content: "❌ Seul l'auteur du ticket ou un modérateur peut le fermer.",
        ephemeral: true,
      });
      return;
    }

    openTickets.delete(`${userId}_${type}`);

    await interaction.reply({
      content: `🔒 Ticket fermé par ${interaction.user}. Ce fil sera supprimé dans 5 secondes.`,
    });

    setTimeout(async () => {
      if (interaction.channel?.isThread()) {
        await interaction.channel.delete().catch(() => {});
      }
    }, 5000);
    return;
  }
}

export const ticketCommand: Command = {
  name: "ticket",
  description: "Initialise le panneau de tickets dans ce salon",
  usage: "*ticket setup",

  execute: async (message) => {
    if (!message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n'as pas la permission d'utiliser cette commande.");
      return;
    }

    if (message.content.slice(1).trim().split(/\s+/)[1]?.toLowerCase() !== "setup") {
      await message.reply("❌ Utilise `*ticket setup` pour initialiser le panneau.");
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("🎫 Ouvrir un ticket")
      .setDescription(
        "Choisis la catégorie correspondant à ta demande :\n\n" +
        "🎯 **Candidature** — Rejoindre l'équipe staff\n" +
        "👑 **Owner** — Message privé à l'owner\n" +
        "⚠️ **Abus** — Signaler un comportement abusif\n\n" +
        "*Un fil privé sera créé, visible uniquement par toi et l'équipe concernée.*"
      )
      .setFooter({ text: "Un seul ticket par catégorie à la fois." });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("tkt_open_candidature")
        .setLabel("🎯 Candidature")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("tkt_open_owner")
        .setLabel("👑 Owner")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("tkt_open_abus")
        .setLabel("⚠️ Signaler un abus")
        .setStyle(ButtonStyle.Danger),
    );

    await message.channel.send({ embeds: [embed], components: [row] });
    await message.reply("✅ Panneau de tickets initialisé !");
  },
};
