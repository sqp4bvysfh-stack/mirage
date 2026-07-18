import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  type GuildMember,
  type Interaction,
} from "discord.js";

import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";

// ─── Configuration No Chill ───────────────────────────────
const MAIN_GUILD_ID = "1362520000426152036";
const MEMBER_ROLE_ID = "1362527149378240814";
const UNVERIFIED_ROLE_ID = "1523505822569594992";
const VERIFICATION_CHANNEL_ID = "1528184967861899435";

// ─── Rôle automatique à l’arrivée ─────────────────────────
export async function handleVerificationJoin(
  member: GuildMember,
): Promise<void> {
  if (member.guild.id !== MAIN_GUILD_ID) return;
  if (member.user.bot) return;

  if (member.roles.cache.has(MEMBER_ROLE_ID)) return;

  const unverifiedRole =
    member.guild.roles.cache.get(UNVERIFIED_ROLE_ID);

  if (!unverifiedRole) {
    console.error("❌ Rôle Non vérifié introuvable.");
    return;
  }

  await member.roles
    .add(
      unverifiedRole,
      "Rôle automatique avant vérification",
    )
    .catch((error) => {
      console.error(
        `❌ Impossible d’ajouter Non vérifié à ${member.user.tag}:`,
        error,
      );
    });
}

function buildVerificationPanel(): {
  embed: EmbedBuilder;
  row: ActionRowBuilder<ButtonBuilder>;
} {
  const embed = new EmbedBuilder()
    .setColor(0x6d28d9)
    .setTitle("✦ No Chill • Vérification")
    .setDescription(
      "Clique sur le bouton ci-dessous pour accéder au serveur.",
    );

  const row =
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("verification_simple")
        .setLabel("Se vérifier")
        .setEmoji("✅")
        .setStyle(ButtonStyle.Primary),
    );

  return { embed, row };
}

// ─── Commande de création du panneau ──────────────────────
export const verificationCommand: Command = {
  name: "verification",
  description: "Publie le panneau de vérification",
  usage: "*verification setup",

  execute: async (message, args) => {
    if (
      !message.guild ||
      !message.member ||
      !isModerator(message.member)
    ) {
      await message.reply(
        "❌ Tu n’as pas la permission d’utiliser cette commande.",
      );
      return;
    }

    if ((args[0] ?? "").toLowerCase() !== "setup") {
      await message.reply(
        "❌ Utilisation : `*verification setup`.",
      );
      return;
    }

    const channel = await message.guild.channels
      .fetch(VERIFICATION_CHANNEL_ID)
      .catch(() => null);

    if (
      !channel ||
      channel.type !== ChannelType.GuildText
    ) {
      await message.reply(
        "❌ Le salon de vérification est introuvable.",
      );
      return;
    }

    const { embed, row } = buildVerificationPanel();

    await channel.send({
      embeds: [embed],
      components: [row],
    });

    await message.reply(
      `✅ Panneau publié dans <#${VERIFICATION_CHANNEL_ID}>.`,
    );
  },
};

// ─── Clic sur le bouton ───────────────────────────────────
export async function handleVerificationInteraction(
  interaction: Interaction,
): Promise<void> {
  if (interaction.guildId !== MAIN_GUILD_ID) return;

  if (
    !interaction.isButton() ||
    interaction.customId !== "verification_simple"
  ) {
    return;
  }

  if (!interaction.guild) return;

  await interaction.deferReply({
    flags: MessageFlags.Ephemeral,
  });

  const member = await interaction.guild.members
    .fetch(interaction.user.id)
    .catch(() => null);

  if (!member) {
    await interaction.editReply(
      "❌ Impossible de retrouver ton compte sur le serveur.",
    );
    return;
  }

  if (member.roles.cache.has(MEMBER_ROLE_ID)) {
    await interaction.editReply(
      "✅ Tu es déjà vérifié.",
    );
    return;
  }

  const memberRole =
    interaction.guild.roles.cache.get(MEMBER_ROLE_ID);

  if (!memberRole) {
    await interaction.editReply(
      "❌ Le rôle Membres est introuvable.",
    );
    return;
  }

  try {
    await member.roles.remove(
      UNVERIFIED_ROLE_ID,
      "Vérification terminée",
    );

    await member.roles.add(
      memberRole,
      "Vérification terminée",
    );
  } catch (error) {
    console.error(
      `❌ Erreur vérification de ${member.user.tag}:`,
      error,
    );

    await interaction.editReply(
      "❌ Je n’ai pas réussi à te vérifier. Préviens un membre du staff.",
    );
    return;
  }

  await interaction.editReply(
    "✅ Tu es maintenant vérifié. Bienvenue sur **No Chill** !",
  );
}
