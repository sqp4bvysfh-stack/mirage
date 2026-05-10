import { EmbedBuilder, Message } from "discord.js";
import type { Command } from "../types.js";
import { BOT_OWNER_ID } from "./owner.js";

async function urlToBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function ask(message: Message, question: string): Promise<Message | null> {
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
  description: "[OWNER] Modifier le profil du bot (pseudo par serveur, avatar/bannière global).",
  usage: "*botprofil",

  async execute(message, _args) {
    if (message.author.id !== BOT_OWNER_ID) {
      await message.reply("❌ Commande réservée au propriétaire du bot.");
      return;
    }
    if (!message.guild) return;

    await message.reply(
      `🤖 **Configuration du profil — ${message.guild.name}**\n` +
      `Réponds à chaque question ou tape \`skip\`. Tu as **60 secondes** par question.\n` +
      `> ⚠️ L'avatar et la bannière changent sur **tous les serveurs** (limite Discord pour les bots).`
    );

    let pseudo: string | null = null;
    let avatarBuffer: Buffer | null = null;
    let bannerBuffer: Buffer | null = null;
    let bannerPreviewUrl: string | null = null;
    let avatarPreviewUrl: string | null = null;

    // ─── 1 : pseudo (par serveur) ─────────────────────────
    const repPseudo = await ask(message, "**1/3** — Quel pseudo pour le bot sur ce serveur ? (ou `skip`)");
    if (!repPseudo) { await message.channel.send("⏱ Temps écoulé, annulation."); return; }
    if (repPseudo.content.toLowerCase() !== "skip") {
      pseudo = repPseudo.content.trim();
    }

    // ─── 2 : avatar (global) ──────────────────────────────
    const repAvatar = await ask(message, "**2/3** — Envoie une image/GIF pour l'avatar (s'applique partout) ou `skip` :");
    if (!repAvatar) { await message.channel.send("⏱ Temps écoulé, annulation."); return; }
    if (repAvatar.content.toLowerCase() !== "skip") {
      const url = getMediaUrl(repAvatar);
      if (url) {
        avatarPreviewUrl = url;
        try { avatarBuffer = await urlToBuffer(url); }
        catch { await message.channel.send("⚠️ Impossible de charger l'image — étape ignorée."); }
      } else {
        await message.channel.send("⚠️ Format non reconnu — étape ignorée.");
      }
    }

    // ─── 3 : bannière (global) ────────────────────────────
    const repBanner = await ask(message, "**3/3** — Envoie une image/GIF pour la bannière (s'applique partout) ou `skip` :");
    if (!repBanner) { await message.channel.send("⏱ Temps écoulé, annulation."); return; }
    if (repBanner.content.toLowerCase() !== "skip") {
      const url = getMediaUrl(repBanner);
      if (url) {
        bannerPreviewUrl = url;
        try { bannerBuffer = await urlToBuffer(url); }
        catch { await message.channel.send("⚠️ Impossible de charger l'image — étape ignorée."); }
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
      try { await message.client.user.setAvatar(avatarBuffer); }
      catch { errors.push("avatar"); }
    }

    if (bannerBuffer) {
      try { await message.client.user.setBanner(bannerBuffer); }
      catch { errors.push("bannière"); }
    }

    // ─── Récap ────────────────────────────────────────────
    const embed = new EmbedBuilder()
      .setColor(errors.length === 0 ? 0x2ecc71 : 0xe67e22)
      .setTitle("✅ Profil mis à jour")
      .addFields(
        { name: "Pseudo",    value: pseudo        ? `\`${pseudo}\` _(ce serveur)_` : "_ignoré_", inline: true },
        { name: "Avatar",    value: avatarBuffer  ? "✅ _(global)_" : "_ignoré_",                inline: true },
        { name: "Bannière",  value: bannerBuffer  ? "✅ _(global)_" : "_ignoré_",                inline: true },
      )
      .setThumbnail(message.client.user.displayAvatarURL({ size: 256, forceStatic: false }))
      .setTimestamp();

    if (bannerPreviewUrl && bannerBuffer) embed.setImage(bannerPreviewUrl);
    if (errors.length > 0) embed.setFooter({ text: `Erreur sur : ${errors.join(", ")}` });

    await message.channel.send({ embeds: [embed] });
  },
};
