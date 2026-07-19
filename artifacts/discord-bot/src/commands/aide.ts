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
      .setColor(0x6d28d9)
      .setTitle("🎮 No Chill • Jeux")
      .addFields(
        { name: "`*loupgarou`",                       value: "Lobby Loup-Garou 🐺 — ✅ rejoindre, 🚀 lancer (modo, 3–30 j.)." },
        { name: "`*finpartie`",                       value: "Terminer la partie en cours et retirer les rôles (modo)." },
        { name: "`*roles`",                           value: "Liste tous les rôles du Loup-Garou." },
        { name: "`*undercover`",                      value: "Lobby Undercover 🕵️ — ✅ rejoindre, 🚀 lancer (3–12 j.)." },
        { name: "`*quiz drapeaux/cultureg/capital`",  value: "Quiz interactif — 30s pour répondre." },
        { name: "`*telephone`",                       value: "Code secret Murder Mystery — via MP." },
        { name: "`*twerk`",                           value: "👀" },
      )
      .setFooter({ text: "No Chill • Préfixe : *" }),
  },

  moderation: {
    emoji: "🛡️",
    label: "Sanctions",
    embed: new EmbedBuilder()
      .setColor(0x6d28d9)
      .setTitle("🛡️ No Chill • Sanctions")
      .setDescription("Réservées à l’équipe de modération. ⚠️ La hiérarchie du serveur est respectée : tu ne peux pas sanctionner quelqu’un placé au-dessus de toi.")
      .addFields(
        { name: "`*ban @membre [raison]`",            value: "Bannit définitivement." },
        { name: "`*unban [ID]`",                      value: "Débannit par ID." },
        { name: "`*tempban @membre 1h [raison]`",     value: "Ban temporaire. Durées : `30m`, `2h`, `3j`." },
        { name: "`*kick @membre [raison]`",           value: "Expulse un membre." },
        { name: "`*mute @membre 10m [raison]`",       value: "Rend muet temporairement." },
        { name: "`*unmute @membre`",                  value: "Retire le mute." },
        { name: "`*warn @membre [raison]`",           value: "Avertissement. `*warn list @membre` pour l’historique." },
        { name: "`*jail @membre [raison]`",           value: "Sauvegarde ses rôles, l’isole dans la prison et le déplace dans le vocal prison." },
        { name: "`*unjail @membre`",                  value: "Libère le membre et restaure automatiquement ses anciens rôles." },
        { name: "`*bl @membre [raison]`",             value: "Ajoute définitivement un utilisateur à la blacklist et le bannit." },
        { name: "`*unbl ID`",                         value: "Retire un utilisateur de la blacklist." },
        { name: "`*bl list`",                         value: "Affiche les utilisateurs actuellement blacklistés." },
        { name: "`*roleadd / *roleremove`",           value: "Ajouter ou retirer un rôle à un membre." },
      ),
  },

  securite: {
    emoji: "🚨",
    label: "Sécurité",
    embed: new EmbedBuilder()
      .setColor(0x6d28d9)
      .setTitle("🚨 No Chill • Sécurité")
      .setDescription("Commandes de protection et de gestion des salons.")
      .addFields(
        { name: "`*clear <1-100>`",                   value: "Supprime le nombre indiqué de messages récents." },
        { name: "`*clear all`",                     value: "Vide entièrement le salon sans le supprimer ni changer son ID." },
        { name: "`*lock` / `*unlock`",                value: "Verrouille ou déverrouille le salon actuel." },
        { name: "`*lock catégorie` / `*unlock catégorie`", value: "Verrouille ou déverrouille tous les salons de la catégorie actuelle." },
        { name: "`*fermeture [#salon-temp]`",         value: "Ferme le serveur et masque les salons aux membres, sauf le salon temporaire indiqué." },
        { name: "`*ouverture`",                       value: "Rouvre le serveur et redonne l’accès aux membres." },
        { name: "`*antiraid on/off/status`",          value: "Active, désactive ou affiche l’état de l’anti-raid." },
        { name: "`*antispam on/off/status`",          value: "Active, désactive ou affiche l’état de l’anti-spam du chat." },
        { name: "🚨 Anti-raid",                       value: "Détecte les arrivées massives et expulse les comptes récents lorsqu’il est activé." },
        { name: "💬 Anti-spam",                       value: "Détecte et bloque les envois excessifs de messages lorsqu’il est activé." },
        { name: "🔗 Anti-lien",                       value: "Supprime tout `discord.gg/` non autorisé et ajoute un avertissement automatique." },
        { name: "📊 Hiérarchie",                      value: "Propriétaire > Owner > Co Owner > Perm Bot > Gestion Staff > Bvtman > Gestion Modo > Modo > Gestion Surveillant > Surveillants > Supports > Membres > Jail" },
      ),
  },

  outils: {
    emoji: "🛠️",
    label: "Outils",
    embed: new EmbedBuilder()
      .setColor(0x6d28d9)
      .setTitle("🛠️ No Chill • Outils")
      .addFields(
        { name: "`*ticket setup`",                       value: "Initialise le panneau de tickets dans ce salon." },
        { name: "`*giveaway <durée> <prix>`",            value: "Lance un giveaway avec conditions (vocal + statut).\nEx : `*giveaway 1h Nitro`  —  Durées : `30m`, `1h`, `2j`." },
        { name: "`*reroll <ID message>`",                value: "Relance le tirage d'un giveaway sans conditions." },
        { name: "`*poll \"question\" \"choix1\" ...`",   value: "Crée un sondage (min 2, max 10 choix)." },
        { name: "`*confess setup #conf #logs`",          value: "Initialise le salon de confessions anonymes." },
        { name: "`*setup origines`",                     value: "Crée le panneau réaction-rôle dans le salon Origines fixe." },
        { name: "`*setup origines edit <ID>`",           value: "Ajoute des origines à un panneau existant. Les données restent après redémarrage." },
        { name: "`*boostsetup #annonce #demandes`",      value: "Modifie les salons du système boost. Les salons No Chill sont déjà configurés." },
        { name: "`*photo`",                              value: "Affiche le salon photo fixe. Les médias reçoivent automatiquement la réaction 💜." },
        { name: "`*profil setup [couleurs|genre|age]`", value: "Publie tous les panneaux Profil ou seulement la catégorie choisie." },
        { name: "`*recrutement <poste>`",              value: "Publie une annonce de recrutement dans le salon actuel." },
        { name: "`*recrutement fermer <poste>`",       value: "Publie la fermeture du recrutement choisi." },
        { name: "`*verification setup`",                value: "Installe le panneau de vérification. Refuse d’en créer un second s’il existe déjà." },
      ),
  },

  ia: {
    emoji: "🤖",
    label: "IA",
    embed: new EmbedBuilder()
      .setColor(0x6d28d9)
      .setTitle("🤖 No Chill • IA")
      .setDescription("Parle avec l'IA du serveur — elle répond comme une vraie personne.\nSon nom se configure via `*config set botName <nom>`. Nom conseillé : **Panamienne**.")
      .addFields(
        { name: "`*ia [message]`",                          value: "Pose une question à l'IA." },
        { name: "`@bot [message]`",                         value: "Mentionne le bot directement dans n'importe quel salon." },
        { name: "`*iablock add/remove #salon`",             value: "Empêche l'IA de répondre dans un salon spécifique (modo)." },
        { name: "`*iablock liste`",                         value: "Voir tous les salons bloqués." },
        { name: "🎭 Personnalité",                          value: "Directe, naturelle, à gauche, fan de Marvel et de rap français." },
      ),
  },

  utilitaires: {
    emoji: "ℹ️",
    label: "Utilitaires",
    embed: new EmbedBuilder()
      .setColor(0x6d28d9)
      .setTitle("ℹ️ No Chill • Utilitaires")
      .addFields(
        { name: "`*ping`",               value: "Affiche la latence du bot." },
        { name: "`*info`",               value: "Infos du serveur." },
        { name: "`*serverprofile`",      value: "Profil visuel du serveur — icône & bannière GIF si disponibles." },
        { name: "`*stats`",              value: "Stats du serveur : membres, boosts, messages, gens en vocal." },
        { name: "`*userinfo [@membre]`", value: "Infos détaillées d'un membre (compte, rôles, badges, banner)." },
        { name: "`*aide`",               value: "Ce panneau d'aide." },
        { name: "`*dm @membre message`", value: "Envoie un DM via le bot à un membre (modo). `*dm @role message` pour tout un rôle (owner)." },
        { name: "`*say [texte]`",        value: "Le bot envoie le message et supprime le tien (modo)." },
        { name: "`*send + fichier`",     value: "Envoie un fichier/image via le bot (modo)." },
        { name: "`*talk [#salon]`",      value: "Envoie un message en tant que le bot avec formatage préservé + image optionnelle. Guidé en 2 étapes." },
      ),
  },

  owner: {
    emoji: "👑",
    label: "Owner",
    embed: new EmbedBuilder()
      .setColor(0x6d28d9)
      .setTitle("👑 No Chill • Owner")
      .setDescription("Réservées exclusivement au propriétaire du bot.")
      .addFields(
        { name: "`*massban @role [raison]`",  value: "Bannit tous les membres d'un rôle en une fois." },
        { name: "`*masskick @role [raison]`", value: "Kick tous les membres d'un rôle en une fois." },
        { name: "`*delsalon #salon1 ...`",    value: "Supprime les salons mentionnés (ou le salon actuel)." },
        { name: "`*broadcast message`",        value: "Envoie un message dans tous les salons du serveur." },
        { name: "`*parle message`",            value: "Envoie un message dans tous les salons de No Chill." },
        { name: "`*parle CHANNEL_ID msg`",     value: "Envoie un message dans un salon précis (fonctionne en DM au bot)." },
        { name: "`*botprofil pseudo <nom>`",   value: "Change le pseudo du bot sur No Chill." },
        { name: "`*botprofil avatar <url>`",   value: "Change l'avatar du bot (GIF supporté)." },
        { name: "`*botprofil banniere <url>`", value: "Change la bannière du bot (GIF supporté)." },
        { name: "`*botprofil reset`",          value: "Remet le profil par défaut." },
      ),
  },

  config: {
    emoji: "⚙️",
    label: "Config bot",
    embed: new EmbedBuilder()
      .setColor(0x6d28d9)
      .setTitle("⚙️ No Chill • Configuration")
      .setDescription(
        "La configuration concerne uniquement **No Chill** et s’applique immédiatement.\n" +
        "Commandes réservées à l’équipe autorisée.\n\n" +
        "`*config list` — afficher la configuration actuelle\n" +
        "`*config set <clé> <valeur>` — modifier une valeur"
      )
      .addFields(
        {
          name: "🤖 IA",
          value: "`botName` — Nom affiché par l’IA",
        },
        {
          name: "📢 Salons automatiques",
          value:
            "`welcomeChannel` — Bienvenue\n" +
            "`giveawayChannel` — Giveaways\n" +
            "`boostChannel` — Annonces boost\n" +
            "`demandeChannel` — Demandes boost",
        },
        {
          name: "🕵️ Confessions",
          value:
            "`confessionChannel` — Confessions publiques\n" +
            "`confessionLog` — Logs privés des confessions",
        },
        {
          name: "🐺 Loup-Garou",
          value:
            "`lgRole` — Rôle Loup-Garou\n" +
            "`lgSalon` — Salon Loup-Garou",
        },
        {
          name: "🛡️ Divers",
          value:
            "`membresRole` — Rôle Membres utilisé par lock/fermeture\n" +
            "`antiPubRole` — Rôle mentionné par l’anti-pub",
        },
        {
          name: "📖 Exemple",
          value:
            "```\n" +
            "*config set botName Panamienne\n" +
            "*config set welcomeChannel #bienvenue\n" +
            "*config list\n" +
            "```",
        },
      )
      .setFooter({ text: "No Chill • Configuration unique" }),
  },
};

// ─── Panneau principal ──────────────────────────────────────────────────────

function makePanelEmbed() {
  return new EmbedBuilder()
    .setColor(0x6d28d9)
    .setTitle("💜 No Chill • Centre d’aide")
    .setDescription("Choisis une catégorie pour afficher ses commandes.\nLes réponses des boutons sont visibles uniquement par toi.")
    .addFields(
      { name: "🎮 Jeux",        value: "Loup-Garou, Undercover, Quiz…",          inline: true },
      { name: "🛡️ Sanctions",   value: "Ban, mute, jail, blacklist…",               inline: true },
      { name: "🚨 Sécurité",    value: "Anti-raid, anti-spam, clear, lock…",         inline: true },
      { name: "🛠️ Outils",      value: "Tickets, giveaway, poll, confess…",       inline: true },
      { name: "ℹ️ Utilitaires", value: "Ping, info, say…",                         inline: true },
      { name: "⚙️ Config bot",  value: "Configurer le bot pour ce serveur.",       inline: true },
    )
    .setFooter({ text: "No Chill • Préfixe : *" });
}

function makePanelRows() {
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("aide_cat_jeux").setLabel("🎮 Jeux").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("aide_cat_moderation").setLabel("🛡️ Sanctions").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("aide_cat_securite").setLabel("🚨 Sécurité").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("aide_cat_outils").setLabel("🛠️ Outils").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("aide_cat_utilitaires").setLabel("ℹ️ Utilitaires").setStyle(ButtonStyle.Secondary),
  );
  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("aide_cat_ia").setLabel("🤖 IA").setStyle(ButtonStyle.Secondary),
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
