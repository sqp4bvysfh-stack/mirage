import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type Interaction,
} from "discord.js";
import type { Command } from "../types.js";
import { BOT_OWNER_ID } from "./owner.js";

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
      .setDescription("Réservées aux modérateurs. ⚠️ La hiérarchie est respectée sur **tous les serveurs** — tu ne peux pas sanctionner quelqu'un au-dessus de toi.")
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
        { name: "`*fermeture [#salon-temp]`",         value: "Ferme le serveur — masque tous les salons à @MEMBRES sauf le salon temporaire mentionné." },
        { name: "`*ouverture`",                       value: "Rouvre le serveur — redonne l'accès à @MEMBRES sur tous les salons." },
        { name: "`*roleadd / *roleremove`",           value: "Ajouter / retirer un rôle à un membre." },
        { name: "🚨 Anti-raid",                       value: "Automatique — kick les comptes < 7 jours si 5 arrivées en 10s." },
        { name: "🔗 Anti-lien",                       value: "Supprime tout `discord.gg/` non autorisé + warn automatique." },
        { name: "📊 Hiérarchie",                      value: "👑 Owner > 🎯 Staff > ⚙️ Admin > ⚠️ Abus > 🛡️ Modo\nConfigurable par serveur via `*config set`." },
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
        { name: "`*giveaway <durée> <prix>`",            value: "Lance un giveaway avec conditions (vocal + statut).\nEx : `*giveaway 1h Nitro`  —  Durées : `30m`, `1h`, `2j`." },
        { name: "`*reroll <ID message>`",                value: "Relance le tirage d'un giveaway sans conditions." },
        { name: "`*topgiveaway <durée> <nb> <prix>`",   value: "Giveaway Top X — les boosters ont **3x** plus de chances. Ex : `*topgiveaway 2j 10 Nitro`" },
        { name: "`*poll \"question\" \"choix1\" ...`",   value: "Crée un sondage (min 2, max 10 choix)." },
        { name: "`*confess setup #conf #logs`",          value: "Initialise le salon de confessions anonymes." },
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
      .setTitle("🤖 IA")
      .setDescription("Parle avec l'IA du serveur — elle répond comme une vraie personne.\nSon nom se configure via `*config set botName <nom>`.")
      .addFields(
        { name: "`*ia [message]`",            value: "Pose une question à l'IA." },
        { name: "`@bot [message]`",           value: "Mentionne le bot directement dans n'importe quel salon." },
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
        { name: "`*ping`",              value: "Affiche la latence du bot." },
        { name: "`*info`",              value: "Infos du serveur." },
        { name: "`*stats`",             value: "Stats du serveur : membres, boosts, messages, gens en vocal." },
        { name: "`*userinfo [@membre]`", value: "Infos détaillées d'un membre (compte, rôles, badges, banner)." },
        { name: "`*aide`",              value: "Ce panneau d'aide." },
        { name: "`*dm @membre message`", value: "Envoie un DM via le bot à un membre (modo). `*dm @role message` pour tout un rôle (owner)." },
        { name: "`*say [texte]`",       value: "Le bot envoie le message et supprime le tien (modo)." },
        { name: "`*send + fichier`",    value: "Envoie un fichier/image via le bot (modo)." },
        { name: "`*talk [#salon]`",     value: "Envoie un message en tant que le bot avec formatage préservé + image optionnelle. Guidé en 2 étapes." },
      ),
  },

  owner: {
    emoji: "👑",
    label: "Owner",
    embed: new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle("👑 Commandes Owner")
      .setDescription("Réservées exclusivement au propriétaire du bot.")
      .addFields(
        { name: "`*massban @role [raison]`",  value: "Bannit tous les membres d'un rôle en une fois." },
        { name: "`*masskick @role [raison]`", value: "Kick tous les membres d'un rôle en une fois." },
        { name: "`*delsalon #salon1 ...`",    value: "Supprime les salons mentionnés (ou le salon actuel)." },
        { name: "`*broadcast message`",        value: "Envoie un message dans tous les salons du serveur." },
        { name: "`*parle message`",            value: "Envoie un message dans **tous** les salons de **tous** les serveurs." },
        { name: "`*parle CHANNEL_ID msg`",     value: "Envoie un message dans un salon précis (fonctionne en DM au bot)." },
      ),
  },

  config: {
    emoji: "⚙️",
    label: "Config bot",
    embed: new EmbedBuilder()
      .setColor(0x95a5a6)
      .setTitle("⚙️ Configuration du bot")
      .setDescription(
        "Toute la configuration est **par serveur** et s'applique immédiatement.\n" +
        "Commandes réservées aux modérateurs.\n\n" +
        "`*config list` — voir la config actuelle\n" +
        "`*config set <clé> <valeur>` — modifier une valeur\n\n" +
        "La valeur peut être une **mention** (`@rôle`, `#salon`) ou un **ID brut**."
      )
      .addFields(
        {
          name: "🛡️ Rôles de modération",
          value:
            "`modoRole` — Rôle modérateur\n" +
            "`abuseRole` — Rôle gestion abus\n" +
            "`staffRole` — Rôle staff\n" +
            "`ownerUser` — ID de l'owner (pour tickets)\n" +
            "`membresRole` — Rôle membres (lock / fermeture)",
        },
        {
          name: "📢 Salons automatiques",
          value:
            "`welcomeChannel` — Salon de bienvenue\n" +
            "`giveawayChannel` — Salon giveaway\n" +
            "`boostChannel` — Salon annonce boost\n" +
            "`demandeChannel` — Salon demandes rôle perso",
        },
        {
          name: "🕵️ Confessions",
          value:
            "`confessionChannel` — Salon où les confessions apparaissent\n" +
            "`confessionLog` — Salon logs des confessions (modo uniquement)",
        },
        {
          name: "🐺 Loup-Garou",
          value:
            "`lgRole` — Rôle décoratif Loup-Garou\n" +
            "`lgSalon` — Salon Loup-Garou",
        },
        {
          name: "🤖 IA & Divers",
          value:
            "`botName` — Nom de l'IA (affiché dans ses réponses)\n" +
            "`antiPubRole` — Rôle à mentionner dans les avertissements anti-pub\n" +
            "`logsChannel` — Salon de logs (membres, messages, vocal, rôles, serveur)",
        },
        {
          name: "📖 Exemple complet",
          value:
            "```\n" +
            "*config set modoRole @Modérateur\n" +
            "*config set welcomeChannel #bienvenue\n" +
            "*config set botName Aria\n" +
            "*config list\n" +
            "```",
        },
      )
      .setFooter({ text: "Si une valeur n'est pas configurée, le bot utilise les valeurs par défaut (serveur MIRAGE)." }),
  },
};

// ─── Panneau principal ──────────────────────────────────────────────────────

function makePanelEmbed() {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("📖 Aide — Bot")
    .setDescription("Clique sur une catégorie pour voir les commandes correspondantes.")
    .addFields(
      { name: "🎮 Jeux",        value: "Loup-Garou, Undercover, Quiz…",          inline: true },
      { name: "🛡️ Modération",  value: "Ban, kick, mute, warn…",                  inline: true },
      { name: "🛠️ Outils",      value: "Tickets, giveaway, poll, confess…",       inline: true },
      { name: "🤖 IA",          value: "Parler avec l'IA du serveur.",             inline: true },
      { name: "ℹ️ Utilitaires", value: "Ping, info, say…",                         inline: true },
      { name: "⚙️ Config bot",  value: "Configurer le bot pour ce serveur.",       inline: true },
    )
    .setFooter({ text: "Préfixe : *  —  Multi-serveur compatible" });
}

function makePanelRows() {
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("aide_cat_jeux").setLabel("🎮 Jeux").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("aide_cat_moderation").setLabel("🛡️ Modération").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("aide_cat_outils").setLabel("🛠️ Outils").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("aide_cat_ia").setLabel("🤖 IA").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("aide_cat_utilitaires").setLabel("ℹ️ Utilitaires").setStyle(ButtonStyle.Secondary),
  );
  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("aide_cat_config").setLabel("⚙️ Config bot").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("aide_cat_owner").setLabel("👑 Owner").setStyle(ButtonStyle.Secondary),
  );
  return [row1, row2];
}

// ─── Handler d'interaction ─────────────────────────────────────────────────

export async function handleAideInteraction(interaction: Interaction) {
  if (!interaction.isButton()) return;
  if (!interaction.customId.startsWith("aide_cat_")) return;

  const key = interaction.customId.replace("aide_cat_", "");

  if (key === "owner" && interaction.user.id !== BOT_OWNER_ID) {
    await interaction.reply({ content: "❌ Cet onglet est réservé au propriétaire du bot.", ephemeral: true });
    return;
  }

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
      components: makePanelRows(),
    });
  },
};
