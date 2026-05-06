import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type Interaction,
} from "discord.js";
import type { Command } from "../types.js";

// ─── Contenu par catégorie ─────────────────────────────────────────────────

const CATEGORIES: Record<string, { emoji: string; label: string; embed: EmbedBuilder }> = {
  jeux: {
    emoji: "🎮",
    label: "Jeux",
    embed: new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("🎮 Jeux")
      .addFields(
        { name: "`*loupgarou`",                       value: "Lobby Loup-Garou 🐺 — ✅ rejoindre, 🚀 lancer (modo, 3–30 j.)." },
        { name: "`*finpartie`",                       value: "Terminer la partie en cours et retirer les rôles (modo)." },
        { name: "`*roles`",                           value: "Liste tous les rôles du Loup-Garou." },
        { name: "`*undercover`",                      value: "Lobby Undercover 🕵️ — ✅ rejoindre, 🚀 lancer (3–12 j.)." },
        { name: "`*quiz drapeaux/cultureg/capital`",  value: "Quiz interactif — 30s pour répondre." },
        { name: "`*telephone`",                       value: "Code secret Murder Mystery — via MP." },
        { name: "`*twerk`",                           value: "👀" },
      )
      .setFooter({ text: "Utilise *aide loupgarou ou *aide undercover pour les détails complets." }),
  },

  moderation: {
    emoji: "🛡️",
    label: "Modération",
    embed: new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle("🛡️ Modération")
      .setDescription("Réservées aux modérateurs. ⚠️ La hiérarchie est respectée — tu ne peux pas sanctionner quelqu'un au-dessus de toi.")
      .addFields(
        { name: "`*ban @membre [raison]`",            value: "Bannit définitivement." },
        { name: "`*unban [ID]`",                      value: "Débannit par ID." },
        { name: "`*tempban @membre 1h [raison]`",     value: "Ban temporaire. Durées : `30m`, `2h`, `3j`." },
        { name: "`*kick @membre [raison]`",           value: "Expulse un membre." },
        { name: "`*mute @membre 10m [raison]`",       value: "Rend muet temporairement." },
        { name: "`*unmute @membre`",                  value: "Retire le mute." },
        { name: "`*warn @membre [raison]`",           value: "Avertissement. `*warn list @membre` pour l'historique." },
        { name: "`*clear [nombre]`",                  value: "Supprime des messages (max 100)." },
        { name: "`*lock` / `*unlock`",                value: "Verrouille / déverrouille le salon." },
        { name: "`*roleadd / *roleremove`",           value: "Ajouter / retirer un rôle à un membre." },
        { name: "🚨 Anti-raid",                       value: "Automatique — kick les comptes < 7 jours si 5 arrivées en 10s." },
        { name: "🔗 Anti-lien",                       value: "Supprime tout `discord.gg/` non autorisé + warn automatique. Seul `discord.gg/mirg` est autorisé." },
      ),
  },

  outils: {
    emoji: "🛠️",
    label: "Outils",
    embed: new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle("🛠️ Outils")
      .addFields(
        { name: "`*ticket setup`",                       value: "Initialise le panneau de tickets dans ce salon." },
        { name: "`*giveaway <durée> <prix>`",            value: "Lance un giveaway avec conditions (vocal + statut `/mirg`).\nEx : `*giveaway 1h Nitro`  —  Durées : `30m`, `1h`, `2j`." },
        { name: "`*reroll <ID message>`",                value: "Relance le tirage d'un giveaway sans conditions." },
        { name: "`*poll \"question\" \"choix1\" ...`",   value: "Crée un sondage (min 2, max 10 choix)." },
        { name: "`*confess setup`",                      value: "Initialise le salon de confessions anonymes." },
        { name: "`*setup origines`",                     value: "Crée un panel réaction-rôle par pays (max 20 par panel)." },
        { name: "`*setup origines edit <ID>`",           value: "Ajoute des origines à un panel existant." },
        { name: "`*boostsetup #annonce #demandes`",      value: "Configure le système boost : annonce auto + demande de rôle perso via formulaire." },
      ),
  },

  ia: {
    emoji: "🤖",
    label: "IA",
    embed: new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle("🤖 IA — Mirage")
      .setDescription("Parle avec **Mirage**, une IA qui répond comme une vraie personne du serveur.")
      .addFields(
        { name: "`*ia [message]`",            value: "Pose une question à Mirage." },
        { name: "`@MIRAGE [message]`",        value: "Mentionne le bot directement dans n'importe quel salon." },
        { name: "🎭 Personnalité",            value: "Directe, naturelle, 1-2 phrases max comme dans un vrai Discord." },
        { name: "🛡️ Modos",                  value: "Les modérateurs peuvent lui demander des actions de modération." },
      ),
  },

  utilitaires: {
    emoji: "ℹ️",
    label: "Utilitaires",
    embed: new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("ℹ️ Utilitaires")
      .addFields(
        { name: "`*ping`",          value: "Affiche la latence du bot." },
        { name: "`*info`",          value: "Infos du serveur." },
        { name: "`*aide`",          value: "Ce panneau d'aide." },
        { name: "`*say [texte]`",        value: "Le bot envoie le message et supprime le tien (modo)." },
        { name: "`*send + fichier`",     value: "Envoie un fichier/image via le bot (modo)." },
        { name: "`*talk [#salon]`",      value: "Envoie un message en tant que MIRAGE avec formatage préservé (retours à la ligne, espaces…) + image optionnelle. Guidé en 2 étapes." },
      ),
  },
};

// ─── Panneau principal ──────────────────────────────────────────────────────

function makePanelEmbed() {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("📖 Aide — MIRAGE")
    .setDescription("Clique sur une catégorie pour voir les commandes correspondantes.")
    .addFields(
      { name: "🎮 Jeux",        value: "Loup-Garou, Undercover, Quiz…",          inline: true },
      { name: "🛡️ Modération",  value: "Ban, kick, mute, warn…",                  inline: true },
      { name: "🛠️ Outils",      value: "Tickets, giveaway, poll, confess…",       inline: true },
      { name: "🤖 IA",          value: "Parler avec Mirage.",                      inline: true },
      { name: "ℹ️ Utilitaires", value: "Ping, info, say…",                         inline: true },
    )
    .setFooter({ text: "MIRAGE — Serveur FR" });
}

function makePanelRow() {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("aide_cat_jeux").setLabel("🎮 Jeux").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("aide_cat_moderation").setLabel("🛡️ Modération").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("aide_cat_outils").setLabel("🛠️ Outils").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("aide_cat_ia").setLabel("🤖 IA").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("aide_cat_utilitaires").setLabel("ℹ️ Utilitaires").setStyle(ButtonStyle.Secondary),
  );
}

// ─── Handler d'interaction ─────────────────────────────────────────────────

export async function handleAideInteraction(interaction: Interaction) {
  if (!interaction.isButton()) return;
  if (!interaction.customId.startsWith("aide_cat_")) return;

  const key = interaction.customId.replace("aide_cat_", "");
  const cat = CATEGORIES[key];
  if (!cat) return;

  await interaction.reply({ embeds: [cat.embed], ephemeral: true });
}

// ─── Commande ──────────────────────────────────────────────────────────────

export const aideCommand: Command = {
  name:        "aide",
  description: "Affiche le panneau d'aide interactif.",
  usage:       "*aide",

  execute: async (message) => {
    await message.reply({
      embeds:     [makePanelEmbed()],
      components: [makePanelRow()],
    });
  },
};
