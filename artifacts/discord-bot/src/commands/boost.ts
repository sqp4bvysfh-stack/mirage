import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  type GuildMember,
  type Interaction,
  type Message,
  type TextChannel,
} from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";

// ─── Config en mémoire ────────────────────────────────────────────────────
export const boostConfig: {
  announceChannelId: string | null;
  demandeChannelId:  string | null;
} = {
  announceChannelId: null,
  demandeChannelId:  null,
};

// ─── Détection du boost ───────────────────────────────────────────────────
export async function handleBoostMember(
  oldMember: GuildMember,
  newMember: GuildMember
): Promise<void> {
  // Résoudre le partial pour avoir l'état AVANT le boost
  if (oldMember.partial) {
    try { oldMember = await oldMember.fetch(); } catch { return; }
  }

  // Le membre vient de booster (premiumSince absent avant, présent maintenant)
  const vientDeBooster = !oldMember.premiumSince && !!newMember.premiumSince;

  if (!vientDeBooster) return;
  if (!boostConfig.announceChannelId) return;

  const channel = newMember.guild.channels.cache.get(boostConfig.announceChannelId) as TextChannel | undefined;
  if (!channel || channel.type !== ChannelType.GuildText) return;

  const embed = new EmbedBuilder()
    .setColor(0xff73fa)
    .setTitle("💎 Nouveau Boost !")
    .setDescription(
      `${newMember} vient de booster le serveur ! 🚀\n\n` +
      `Merci infiniment pour ton soutien, tu peux maintenant réclamer ton **rôle personnalisé** !\n` +
      `*(nom, couleur et emoji de ton choix)*`
    )
    .setThumbnail(newMember.user.displayAvatarURL({ size: 128 }))
    .setFooter({ text: `Le serveur a ${newMember.guild.premiumSubscriptionCount} boost(s) au total !` })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`role_perso_demande:${newMember.id}`)
      .setLabel("🎨 Demander mon rôle perso")
      .setStyle(ButtonStyle.Primary)
  );

  await channel.send({ embeds: [embed], components: [row] });
}

// ─── Gestion des interactions boost ──────────────────────────────────────
export async function handleBoostInteraction(interaction: Interaction): Promise<void> {

  // ── Bouton → ouvrir le modal ────────────────────────────────────────────
  if (interaction.isButton() && interaction.customId.startsWith("role_perso_demande:")) {
    const targetId = interaction.customId.split(":")[1];

    // Seul le booster concerné peut cliquer
    if (interaction.user.id !== targetId) {
      await interaction.reply({
        content: "❌ Ce bouton est réservé à la personne qui a boosted.",
        flags: 64,
      });
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId(`role_perso_modal:${targetId}`)
      .setTitle("🎨 Rôle personnalisé");

    const nomInput = new TextInputBuilder()
      .setCustomId("rp_nom")
      .setLabel("Nom du rôle")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Ex : ★ MonPseudo")
      .setMaxLength(100)
      .setRequired(true);

    const couleurInput = new TextInputBuilder()
      .setCustomId("rp_couleur")
      .setLabel("Couleur (code hex)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Ex : #FF73FA")
      .setMaxLength(7)
      .setRequired(true);

    const emojiInput = new TextInputBuilder()
      .setCustomId("rp_emoji")
      .setLabel("Emoji du rôle (facultatif)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Ex : 🌸")
      .setMaxLength(10)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(nomInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(couleurInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(emojiInput),
    );

    await interaction.showModal(modal);
    return;
  }

  // ── Modal soumis → envoyer le récap ────────────────────────────────────
  if (interaction.isModalSubmit() && interaction.customId.startsWith("role_perso_modal:")) {
    const targetId = interaction.customId.split(":")[1];

    const nom     = interaction.fields.getTextInputValue("rp_nom").trim();
    const couleur = interaction.fields.getTextInputValue("rp_couleur").trim();
    const emoji   = interaction.fields.getTextInputValue("rp_emoji").trim();

    // Validation couleur hex
    if (!/^#[0-9A-Fa-f]{6}$/.test(couleur)) {
      await interaction.reply({
        content: "❌ Couleur invalide. Utilise un code hex valide, ex : `#FF73FA`",
        flags: 64,
      });
      return;
    }

    await interaction.reply({
      content: "✅ Ta demande a bien été envoyée ! L'équipe va créer ton rôle dès que possible.",
      flags: 64,
    });

    if (!boostConfig.demandeChannelId) return;

    const demandeChannel = interaction.guild?.channels.cache.get(boostConfig.demandeChannelId) as TextChannel | undefined;
    if (!demandeChannel) return;

    const colorInt = parseInt(couleur.replace("#", ""), 16);

    const recap = new EmbedBuilder()
      .setColor(colorInt)
      .setTitle("📋 Nouvelle demande de rôle perso")
      .addFields(
        { name: "Membre",   value: `<@${targetId}>`, inline: true },
        { name: "Nom",      value: `\`${nom}\``,     inline: true },
        { name: "Couleur",  value: `\`${couleur}\``, inline: true },
        { name: "Emoji",    value: emoji || "*aucun*", inline: true },
      )
      .setFooter({ text: `ID : ${targetId}` })
      .setTimestamp();

    await demandeChannel.send({ embeds: [recap] });
    return;
  }
}

// ─── Commande *boostsetup ─────────────────────────────────────────────────
export const boostSetupCommand: Command = {
  name:        "boostsetup",
  description: "Configure les salons du système de boost",
  usage:       "*boostsetup #salon-boost #salon-demandes",

  execute: async (message: Message, args) => {
    if (!message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n'as pas la permission d'utiliser cette commande.");
      return;
    }

    const annonce  = message.mentions.channels.at(0);
    const demandes = message.mentions.channels.at(1);

    if (!annonce || !demandes) {
      await message.reply(
        "❌ Utilise : `*boostsetup #salon-boost #salon-demandes`\n" +
        "Ex : `*boostsetup #annonces #demandes-rôle-perso`"
      );
      return;
    }

    boostConfig.announceChannelId = annonce.id;
    boostConfig.demandeChannelId  = demandes.id;

    await message.reply(
      `✅ Système de boost configuré !\n` +
      `📢 Annonces boost → ${annonce}\n` +
      `📋 Demandes rôle perso → ${demandes}`
    );
  },
};
