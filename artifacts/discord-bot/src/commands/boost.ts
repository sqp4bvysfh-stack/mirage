import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type GuildMember,
  type Interaction,
  type Message,
} from "discord.js";

import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";
import { sendServerLog } from "../utils/logs.js";

// ─── Configuration fixe No Chill ───────────────────────────
const BOOST_CHANNEL_ID = "1528077192615952584";
const BOOST_REQUEST_CHANNEL_ID = "1528100158858858636";

// ─── Détection du boost ────────────────────────────────────
export async function handleBoostMember(
  oldMember: GuildMember,
  newMember: GuildMember,
): Promise<void> {
  const vientDeBooster =
    !oldMember.premiumSince &&
    Boolean(newMember.premiumSince);

  if (!vientDeBooster) return;

  const channel =
    await newMember.guild.channels
      .fetch(BOOST_CHANNEL_ID)
      .catch(() => null);

  if (
    !channel ||
    channel.type !== ChannelType.GuildText
  ) {
    console.error(
      `❌ Salon boost introuvable ou invalide : ${BOOST_CHANNEL_ID}`,
    );
    return;
  }

  const embed =
    new EmbedBuilder()
      .setColor(0x6d28d9)
      .setTitle("✦ No Chill • Nouveau boost")
      .setDescription(
        `${newMember} vient de booster le serveur ! 🚀\n\n` +
        "Merci infiniment pour ton soutien. Tu peux maintenant réclamer " +
        "ton **rôle personnalisé**.\n" +
        "*(nom, couleur et emoji de ton choix)*",
      )
      .setThumbnail(
        newMember.user.displayAvatarURL({
          size: 128,
        }),
      )
      .setFooter({
        text:
          `Le serveur a ` +
          `${newMember.guild.premiumSubscriptionCount ?? 0} boost(s) au total !`,
      })
      .setTimestamp();

  const row =
    new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(
            `role_perso_demande:${newMember.id}`,
          )
          .setLabel("Demander mon rôle perso")
          .setEmoji("🎨")
          .setStyle(ButtonStyle.Primary),
      );

  await channel
    .send({
      embeds: [embed],
      components: [row],
    })
    .catch((error) => {
      console.error(
        "❌ Impossible d’envoyer l’annonce boost :",
        error,
      );
    });

  await sendServerLog(
    newMember.guild,
    {
      embeds: [embed],
    },
  );
}

// ─── Gestion des interactions boost ────────────────────────
export async function handleBoostInteraction(
  interaction: Interaction,
): Promise<void> {
  if (
    interaction.isButton() &&
    interaction.customId.startsWith(
      "role_perso_demande:",
    )
  ) {
    const targetId =
      interaction.customId.split(":")[1];

    if (!targetId) {
      await interaction.reply({
        content:
          "❌ Ce bouton est invalide. Demande au staff de republier le panneau.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (
      interaction.user.id !==
      targetId
    ) {
      await interaction.reply({
        content:
          "❌ Ce bouton est réservé à la personne qui a boosté.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const modal =
      new ModalBuilder()
        .setCustomId(
          `role_perso_modal:${targetId}`,
        )
        .setTitle(
          "🎨 Rôle personnalisé",
        );

    const nomInput =
      new TextInputBuilder()
        .setCustomId("rp_nom")
        .setLabel("Nom du rôle")
        .setStyle(
          TextInputStyle.Short,
        )
        .setPlaceholder(
          "Ex : ★ MonPseudo",
        )
        .setMaxLength(100)
        .setRequired(true);

    const couleurInput =
      new TextInputBuilder()
        .setCustomId(
          "rp_couleur",
        )
        .setLabel(
          "Couleur (code hex)",
        )
        .setStyle(
          TextInputStyle.Short,
        )
        .setPlaceholder(
          "Ex : #6D28D9",
        )
        .setMinLength(7)
        .setMaxLength(7)
        .setRequired(true);

    const emojiInput =
      new TextInputBuilder()
        .setCustomId("rp_emoji")
        .setLabel(
          "Emoji du rôle (facultatif)",
        )
        .setStyle(
          TextInputStyle.Short,
        )
        .setPlaceholder("Ex : 🌸")
        .setMaxLength(20)
        .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(nomInput),

      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          couleurInput,
        ),

      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(emojiInput),
    );

    try {
      await interaction.showModal(
        modal,
      );
    } catch (error) {
      console.error(
        "❌ Impossible d’ouvrir le formulaire boost :",
        error,
      );
    }

    return;
  }

  if (
    interaction.isModalSubmit() &&
    interaction.customId.startsWith(
      "role_perso_modal:",
    )
  ) {
    const targetId =
      interaction.customId.split(":")[1];

    if (
      !targetId ||
      interaction.user.id !==
        targetId
    ) {
      await interaction.reply({
        content:
          "❌ Cette demande ne t’appartient pas.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({
      flags: MessageFlags.Ephemeral,
    });

    const nom =
      interaction.fields
        .getTextInputValue(
          "rp_nom",
        )
        .trim();

    const couleur =
      interaction.fields
        .getTextInputValue(
          "rp_couleur",
        )
        .trim()
        .toUpperCase();

    const emoji =
      interaction.fields
        .getTextInputValue(
          "rp_emoji",
        )
        .trim();

    if (
      !/^#[0-9A-F]{6}$/.test(
        couleur,
      )
    ) {
      await interaction.editReply(
        "❌ Couleur invalide. Utilise un code hex comme `#6D28D9`.",
      );
      return;
    }

    if (!interaction.guild) {
      await interaction.editReply(
        "❌ Cette demande doit être envoyée depuis le serveur.",
      );
      return;
    }

    const demandeChannel =
      await interaction.guild.channels
        .fetch(
          BOOST_REQUEST_CHANNEL_ID,
        )
        .catch(() => null);

    if (
      !demandeChannel ||
      demandeChannel.type !==
        ChannelType.GuildText
    ) {
      console.error(
        `❌ Salon demandes boost introuvable : ${BOOST_REQUEST_CHANNEL_ID}`,
      );

      await interaction.editReply(
        "❌ Le salon des demandes est introuvable. Préviens un responsable.",
      );
      return;
    }

    const colorInt =
      Number.parseInt(
        couleur.slice(1),
        16,
      );

    const recap =
      new EmbedBuilder()
        .setColor(colorInt)
        .setTitle(
          "✦ No Chill • Demande de rôle personnalisé",
        )
        .setThumbnail(
          interaction.user
            .displayAvatarURL({
              size: 128,
            }),
        )
        .addFields(
          {
            name: "Membre",
            value:
              `${interaction.user}\n` +
              `\`${targetId}\``,
            inline: true,
          },
          {
            name: "Nom",
            value: `\`${nom}\``,
            inline: true,
          },
          {
            name: "Couleur",
            value:
              `\`${couleur}\``,
            inline: true,
          },
          {
            name: "Emoji",
            value:
              emoji || "*Aucun*",
            inline: true,
          },
        )
        .setTimestamp();

    try {
      await demandeChannel.send({
        embeds: [recap],
      });
    } catch (error) {
      console.error(
        "❌ Impossible d’envoyer la demande boost :",
        error,
      );

      await interaction.editReply(
        "❌ Je n’ai pas pu envoyer ta demande. Vérifie les permissions du bot.",
      );
      return;
    }

    await sendServerLog(
      interaction.guild,
      {
        embeds: [recap],
      },
    );

    await interaction.editReply(
      "✅ Ta demande a bien été envoyée ! L’équipe va créer ton rôle dès que possible.",
    );

    return;
  }
}

// ─── Commande *boostsetup ──────────────────────────────────
export const boostSetupCommand: Command = {
  name: "boostsetup",
  description:
    "Affiche la configuration du système de boost",
  usage: "*boostsetup",

  execute: async (
    message: Message,
  ) => {
    if (
      !message.guild ||
      !message.member ||
      !isModerator(
        message.member,
      )
    ) {
      await message.reply(
        "❌ Tu n’as pas la permission d’utiliser cette commande.",
      );
      return;
    }

    const annonce =
      message.guild.channels.cache.get(
        BOOST_CHANNEL_ID,
      );

    const demandes =
      message.guild.channels.cache.get(
        BOOST_REQUEST_CHANNEL_ID,
      );

    await message.reply(
      "✅ **Système de boost No Chill**\n" +
      `📢 Annonces : ${
        annonce ??
        `\`${BOOST_CHANNEL_ID}\``
      }\n` +
      `📋 Demandes : ${
        demandes ??
        `\`${BOOST_REQUEST_CHANNEL_ID}\``
      }`,
    );
  },
};
