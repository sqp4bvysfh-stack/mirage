import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type Interaction,
} from "discord.js";
import type { Command } from "../types.js";
import { getConfig, setConfig } from "../utils/serverConfig.js";
import { isModerator } from "../utils/modCheck.js";
import { sendServerLog } from "../utils/logs.js";

function getBoutons(messageId: string) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("confession_new")
      .setLabel("✍️ Faire une confession")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`confession_reply_${messageId}`)
      .setLabel("💬 Répondre anonymement")
      .setStyle(ButtonStyle.Primary),
  );
}

export async function handleConfessionInteraction(interaction: Interaction) {
  const guildId = interaction.guild?.id ?? "";

  // ─── Bouton : nouvelle confession ────────────────────────────────────────
  if (interaction.isButton() && interaction.customId === "confession_new") {
    const modal = new ModalBuilder().setCustomId("confession_modal_new").setTitle("🕵️ Confession anonyme");
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("confession_text")
          .setLabel("Ta confession")
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder("Écris ta confession ici...")
          .setRequired(true)
          .setMaxLength(1000)
      )
    );
    await interaction.showModal(modal);
    return;
  }

  // ─── Bouton : répondre ────────────────────────────────────────────────────
  if (interaction.isButton() && interaction.customId.startsWith("confession_reply_")) {
    const modal = new ModalBuilder()
      .setCustomId(`confession_modal_reply_${interaction.customId.replace("confession_reply_", "")}`)
      .setTitle("💬 Réponse anonyme");
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("confession_text")
          .setLabel("Ta réponse")
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder("Écris ta réponse ici...")
          .setRequired(true)
          .setMaxLength(1000)
      )
    );
    await interaction.showModal(modal);
    return;
  }

  // ─── Modal : envoi d'une nouvelle confession ──────────────────────────────
  if (interaction.isModalSubmit() && interaction.customId === "confession_modal_new") {
    const texte      = interaction.fields.getTextInputValue("confession_text");
    const cfg        = getConfig(guildId);
    const channel    = interaction.guild?.channels.cache.get(cfg.confessionChannel ?? "");
    const logChannel = interaction.guild?.channels.cache.get(cfg.confessionLog ?? "");

    if (!channel || !channel.isTextBased()) {
      await interaction.reply({ content: "❌ Salon de confession introuvable. Configure avec `*confess setup #salon #logs`.", ephemeral: true });
      return;
    }

    await interaction.reply({ content: "✅ Ta confession a été envoyée anonymement !", ephemeral: true });

    const embed = new EmbedBuilder()
      .setColor(0x2f3136)
      .setTitle("🕵️ Confession anonyme")
      .setDescription(`*${texte}*`)
      .setFooter({ text: "Confession anonyme" })
      .setTimestamp();

    const msg = await channel.send({ embeds: [embed] });
    await msg.edit({ components: [getBoutons(msg.id)] });

    if (logChannel?.isTextBased()) {
      await logChannel.send({ embeds: [
        new EmbedBuilder().setColor(0xe74c3c).setTitle("📋 Log confession")
          .addFields(
            { name: "Auteur", value: `${interaction.user} (${interaction.user.tag})`, inline: true },
            { name: "ID",     value: interaction.user.id, inline: true },
            { name: "Confession", value: texte }
          ).setTimestamp(),
      ]});
    }
    return;
  }

  // ─── Modal : envoi d'une réponse ─────────────────────────────────────────
  if (interaction.isModalSubmit() && interaction.customId.startsWith("confession_modal_reply_")) {
    const texte      = interaction.fields.getTextInputValue("confession_text");
    const originalId = interaction.customId.replace("confession_modal_reply_", "");
    const cfg        = getConfig(guildId);
    const channel    = interaction.guild?.channels.cache.get(cfg.confessionChannel ?? "");
    const logChannel = interaction.guild?.channels.cache.get(cfg.confessionLog ?? "");

    if (!channel || !channel.isTextBased()) {
      await interaction.reply({ content: "❌ Salon de confession introuvable.", ephemeral: true });
      return;
    }

    await interaction.reply({ content: "✅ Ta réponse a été envoyée anonymement !", ephemeral: true });

    let replyTo = "";
    try {
      const original = await channel.messages.fetch(originalId);
      replyTo = original.embeds[0]?.description ?? "";
    } catch {}

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("💬 Réponse anonyme")
      .setDescription(`*${texte}*`)
      .setFooter({ text: "Réponse anonyme" })
      .setTimestamp();

    if (replyTo) embed.addFields({ name: "↩️ En réponse à", value: replyTo.slice(0, 200) });

    const msg = await channel.send({ embeds: [embed] });
    await msg.edit({ components: [getBoutons(msg.id)] });

    if (logChannel?.isTextBased()) {
      await logChannel.send({ embeds: [
        new EmbedBuilder().setColor(0xe67e22).setTitle("📋 Log réponse confession")
          .addFields(
            { name: "Auteur", value: `${interaction.user} (${interaction.user.tag})`, inline: true },
            { name: "ID",     value: interaction.user.id, inline: true },
            { name: "Réponse", value: texte }
          ).setTimestamp(),
      ]});
    }
    return;
  }
}

export const confessionCommand: Command = {
  name: "confess", description: "Initialise le salon de confessions", usage: "*confess setup #confession #logs",
  execute: async (message, args) => {
    if (!message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n’as pas la permission.");
      return;
    }
    if (args[0]?.toLowerCase() !== "setup") {
      await message.reply("❌ Utilise `*confess setup #salon-confessions #salon-logs`"); return;
    }

    const confChan = message.mentions.channels.first();
    const logChan  = message.mentions.channels.at(1);

    if (!confChan) {
      await message.reply("❌ Mentionne le salon des confessions. Ex: `*confess setup #confessions #logs`"); return;
    }

    const guildId = message.guild!.id;
    setConfig(guildId, "confessionChannel", confChan.id);
    if (logChan) setConfig(guildId, "confessionLog", logChan.id);

    const embed = new EmbedBuilder()
      .setColor(0x2f3136)
      .setTitle("🕵️ Confessions anonymes")
      .setDescription("Clique sur le bouton ci-dessous pour faire une confession anonyme.\nPersonne ne saura que c'est toi !")
      .setFooter({ text: "Toutes les confessions sont 100% anonymes" });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("confession_new").setLabel("✍️ Faire une confession").setStyle(ButtonStyle.Secondary)
    );

    await confChan.send({ embeds: [embed], components: [row] });
    await message.reply(
      `✅ Salon de confession initialisé dans ${confChan}` +
      (logChan ? ` — logs dans ${logChan}` : "") + " !"
    );

    const logEmbed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("⚙️ Confessions configurées")
      .addFields(
        { name: "Salon public", value: `${confChan}`, inline: true },
        { name: "Logs privés", value: logChan ? `${logChan}` : "Non configuré", inline: true },
        { name: "Par", value: `${message.author}`, inline: true },
      )
      .setTimestamp();

    await sendServerLog(message.guild!, { embeds: [logEmbed] });
  },
};
