import { EmbedBuilder, Message } from "discord.js";
import type { Command } from "../types.js";
import { BOT_OWNER_ID } from "./owner.js";

async function urlToBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function ask(
  message: Message,
  question: string,
): Promise<Message | null> {
  await message.channel.send(question);
  const collected = await message.channel.awaitMessages({
    filter: (m) => m.author.id === message.author.id,
    max: 1,
    time: 60_000,
  });
  return collected.first() ?? null;
}

function getMediaUrl(msg: Message): string | null {
  const attachment = msg.attachments.first();
  if (attachment) return attachment.url;
  const url = msg.content.trim();
  if (url.startsWith("http")) return url;
  return null;
}

export const botprofilCommand: Command = {
  name: "botprofil",
  description: "[OWNER] Modifier le profil du bot sur ce serveur (guide interactif).",
  usage: "*botprofil",

  async execute(message, _args) {
    if (message.author.id !== BOT_OWNER_ID) {
      await message.reply("❌ Commande réservée au propriétaire du bot.");
      return;
    }
    if (!message.guild) return;

    await message.reply(
      "🤖 **Configuration du profil — " + message.guild.name + "**\nRéponds à chaque question. Tape `skip` pour ignorer une étape. Tu as **60 secondes** par question."
    );

    let pseudo: string | null = null;
    let avatarBuffer: Buffer | null = null;
    let bannerBuffer: Buffer | null = null;
    let bannerUrl: string | null = null;

    // ─── Étape 1 : pseudo ─────────────────────────────────
    const repPseudo = await ask(message, "**1/3** — Quel pseudo veux-tu pour le bot sur ce serveur ? (ou `skip`)");
    if (!repPseudo) { await message.channel.send("⏱ Temps écoulé, annulation."); return; }
    if (repPseudo.content.toLowerCase() !== "skip") {
      pseudo = repPseudo.content.trim();
    }

    // ─── Étape 2 : avatar ──────────────────────────────────
    const repAvatar = await ask(message, "**2/3** — Envoie une image ou GIF pour l'avatar (ou colle une URL, ou `skip`) :");
    if (!repAvatar) { await message.channel.send("⏱ Temps écoulé, annulation."); return; }
    if (repAvatar.content.toLowerCase() !== "skip") {
      const url = getMediaUrl(repAvatar);
      if (url) {
        try { avatarBuffer = await urlToBuffer(url); }
        catch { await message.channel.send("⚠️ Impossible de charger l'image de l'avatar — étape ignorée."); }
      } else {
        await message.channel.send("⚠️ Format non reconnu — étape ignorée.");
      }
    }

    // ─── Étape 3 : bannière ───────────────────────────────
    const repBanner = await ask(message, "**3/3** — Envoie une image ou GIF pour la bannière (ou colle une URL, ou `skip`) :");
    if (!repBanner) { await message.channel.send("⏱ Temps écoulé, annulation."); return; }
    if (repBanner.content.toLowerCase() !== "skip") {
      const url = getMediaUrl(repBanner);
      if (url) {
        bannerUrl = url;
        try { bannerBuffer = await urlToBuffer(url); }
        catch { await message.channel.send("⚠️ Impossible de charger l'image de la bannière — étape ignorée."); }
      } else {
        await message.channel.send("⚠️ Format non reconnu — étape ignorée.");
      }
    }

    // ─── Application ──────────────────────────────────────
    const errors: string[] = [];

    if (pseudo !== null) {
      try { await message.guild.members.me!.setNickname(pseudo); }
      catch { errors.push("pseudo"); }
    }

    if (avatarBuffer) {
      try { await message.guild.members.me!.edit({ avatar: avatarBuffer }); }
      catch { errors.push("avatar"); }
    }

    if (bannerBuffer) {
      try { await message.guild.members.me!.edit({ banner: bannerBuffer } as any); }
      catch { errors.push("bannière"); }
    }

    // ─── Récapitulatif ────────────────────────────────────
    const embed = new EmbedBuilder()
      .setColor(errors.length === 0 ? 0x2ecc71 : 0xe67e22)
      .setTitle("✅ Profil mis à jour — " + message.guild.name)
      .addFields(
        { name: "Pseudo",   value: pseudo   ?? "_ignoré_", inline: true },
        { name: "Avatar",   value: avatarBuffer ? "✅ appliqué" : "_ignoré_", inline: true },
        { name: "Bannière", value: bannerBuffer  ? "✅ appliquée" : "_ignoré_", inline: true },
      )
      .setThumbnail(message.guild.members.me!.displayAvatarURL({ size: 256 }))
      .setTimestamp();

    if (bannerUrl && bannerBuffer) embed.setImage(bannerUrl);
    if (errors.length > 0) embed.setFooter({ text: `Erreur sur : ${errors.join(", ")}` });

    await message.channel.send({ embeds: [embed] });
  },
};
