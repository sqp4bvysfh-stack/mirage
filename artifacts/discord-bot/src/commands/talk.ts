import {
  AttachmentBuilder,
  type Message,
  type TextChannel,
} from "discord.js";

import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";

const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024;

async function downloadAttachments(
  message: Message,
): Promise<AttachmentBuilder[]> {
  const files: AttachmentBuilder[] = [];

  for (const attachment of message.attachments.values()) {
    if (attachment.size > MAX_ATTACHMENT_SIZE) {
      console.warn(
        `⚠️ Fichier ignoré car trop lourd : ${attachment.name}`,
      );
      continue;
    }

    try {
      const response = await fetch(attachment.url);

      if (!response.ok) {
        console.error(
          `❌ Téléchargement impossible pour ${attachment.name} : ${response.status}`,
        );
        continue;
      }

      const buffer = Buffer.from(
        await response.arrayBuffer(),
      );

      if (buffer.length === 0) {
        console.error(
          `❌ Fichier vide récupéré : ${attachment.name}`,
        );
        continue;
      }

      files.push(
        new AttachmentBuilder(buffer, {
          name: attachment.name ?? "fichier",
        }),
      );
    } catch (error) {
      console.error(
        `❌ Erreur téléchargement de ${attachment.name} :`,
        error,
      );
    }
  }

  return files;
}

export const talkCommand: Command = {
  name: "talk",
  description:
    "Envoie un message en tant que Chichi avec média optionnel",
  usage: "*talk [#salon]",

  execute: async (message: Message) => {
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

    const mentionedChannel = message.mentions.channels.first();

    const cible =
      mentionedChannel?.isTextBased()
        ? mentionedChannel
        : message.channel;

    if (
      !cible.isTextBased() ||
      !("send" in cible)
    ) {
      await message.reply(
        "❌ Le salon cible n’est pas valide.",
      );
      return;
    }

    const commandChannel = message.channel;

    await message.delete().catch(() => {});

    const promptMessage = await commandChannel.send(
      "📝 **Talk — Étape 1/2**\n\n" +
      `Écris le message à envoyer dans ${cible}.\n` +
      "Les retours à la ligne seront conservés.\n\n" +
      "*Tu as 5 minutes. Tape `annuler` pour quitter.*",
    );

    let contentMessage: Message;

    try {
      const collected = await commandChannel.awaitMessages({
        filter: (candidate) =>
          candidate.author.id === message.author.id,
        max: 1,
        time: 300_000,
        errors: ["time"],
      });

      const first = collected.first();

      if (!first) {
        throw new Error("Réponse introuvable");
      }

      contentMessage = first;
    } catch {
      await promptMessage.delete().catch(() => {});

      const timeout = await commandChannel.send(
        "⏰ Temps écoulé.",
      );

      setTimeout(() => {
        timeout.delete().catch(() => {});
      }, 3000);

      return;
    }

    const contenu = contentMessage.content;

    await contentMessage.delete().catch(() => {});
    await promptMessage.delete().catch(() => {});

    if (
      contenu.toLowerCase().trim() === "annuler"
    ) {
      const cancelled = await commandChannel.send(
        "❌ Envoi annulé.",
      );

      setTimeout(() => {
        cancelled.delete().catch(() => {});
      }, 3000);

      return;
    }

    const promptMedia = await commandChannel.send(
      "🖼️ **Talk — Étape 2/2**\n\n" +
      "Envoie maintenant une image, un GIF, une vidéo ou plusieurs fichiers.\n" +
      "Tape `non` pour envoyer uniquement le texte.\n\n" +
      "*Tu as 2 minutes.*",
    );

    let files: AttachmentBuilder[] = [];
    let mediaReply: Message | null = null;

    try {
      const collected = await commandChannel.awaitMessages({
        filter: (candidate) =>
          candidate.author.id === message.author.id,
        max: 1,
        time: 120_000,
        errors: ["time"],
      });

      mediaReply = collected.first() ?? null;

      if (
        mediaReply &&
        mediaReply.content.toLowerCase().trim() !== "non"
      ) {
        files = await downloadAttachments(mediaReply);
      }
    } catch {
      // Si le délai est dépassé, le texte part sans fichier.
    }

    if (mediaReply) {
      await mediaReply.delete().catch(() => {});
    }

    await promptMedia.delete().catch(() => {});

    if (
      mediaReply &&
      mediaReply.content.toLowerCase().trim() !== "non" &&
      files.length === 0
    ) {
      const noFile = await commandChannel.send(
        "❌ Aucun fichier valide n’a été trouvé. Le message n’a pas été envoyé.",
      );

      setTimeout(() => {
        noFile.delete().catch(() => {});
      }, 5000);

      return;
    }

    try {
      await (cible as TextChannel).send({
        content:
          contenu.trim().length > 0
            ? contenu
            : undefined,
        files,
        allowedMentions: {
          parse: [],
        },
      });
    } catch (error) {
      console.error(
        "❌ Erreur Talk :",
        error,
      );

      const failed = await commandChannel.send(
        "❌ Impossible d’envoyer le message ou le fichier.",
      );

      setTimeout(() => {
        failed.delete().catch(() => {});
      }, 5000);
    }
  },
};
