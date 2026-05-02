import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";

const FICHES: Record<string, EmbedBuilder> = {
  undercover: new EmbedBuilder()
    .setColor(0x2c2f33)
    .setTitle("🕵️ Undercover — Explication")
    .setDescription("Jeu de déduction où certains joueurs ont un mot différent des autres.")
    .addFields(
      { name: "🚀 Lancer", value: "`*undercover` — ouvre un lobby.\nLes joueurs cliquent ✅, le host clique 🚀 pour lancer. (min. 3, max. 12)" },
      { name: "📬 Déroulement", value: "Chaque joueur reçoit son mot en **MP**.\nÀ tour de rôle, chacun décrit son mot **sans le dire**.\nLe groupe vote pour éliminer le suspect." },
      { name: "🎭 Rôles", value: "**✅ Civil** — a le mot principal.\n**🕵️ Undercover** — a un mot proche mais différent.\n**⬜ Mr. White** *(dès 4 joueurs)* — n'a aucun mot." },
    )
    .setFooter({ text: "Commande : *undercover" }),

  loupgarou: new EmbedBuilder()
    .setColor(0x8b0000)
    .setTitle("🐺 Loup-Garou — Explication")
    .setDescription("Le jeu Loup-Garou de Thiercelieux directement sur Discord ! Réservé aux modérateurs.")
    .addFields(
      { name: "🚀 Lancer", value: "`*loupgarou` — ouvre un lobby.\nLes joueurs cliquent ✅, le host (maître du jeu) clique 🚀 pour lancer. (min. 3, max. 30)" },
      { name: "🔚 Terminer", value: "`*finpartie` — réinitialise le lobby si besoin." },
      { name: "🐺 Camps", value: "**Village** — Villageois, Voyante, Sorcière, Chasseur, Garde, Nécromancien, Cupidon, Renard, Berger, Enfant Sauvage\n**Loups** — Loup-Garou, Loup-Bavard, Loup Blanc, Loup-Noir" },
    )
    .setFooter({ text: "Commandes : *loupgarou | *roles | *finpartie" }),

  quiz: new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle("🧠 Quiz — Explication")
    .setDescription("Lance un quiz en temps réel. Premier à répondre gagne !")
    .addFields(
      { name: "🚀 Modes", value: "`*quiz drapeaux` — drapeaux 🌍\n`*quiz cultureg` — culture générale 🧠\n`*quiz capital` — capitales du monde 🏙️" },
      { name: "⏱️ Règles", value: "**30 secondes** pour répondre. Premier à taper la bonne réponse gagne." },
    )
    .setFooter({ text: "Commandes : *quiz drapeaux | *quiz cultureg | *quiz capital" }),

  telephone: new EmbedBuilder()
    .setColor(0x1a1a2e)
    .setTitle("📱 Téléphone — Explication")
    .setDescription("Commande secrète pour les Murder Mystery. Trouve le code pour accéder au salon 📱.")
    .addFields(
      { name: "🚀 Utilisation", value: "`*telephone` — le bot te demande le code en MP." },
      { name: "🔒 Règles", value: "**3 tentatives**, **60 secondes**. Si tu réussis → accès au rôle 📱." },
    )
    .setFooter({ text: "Commande : *telephone" }),

  ia: new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle("🤖 IA — Explication")
    .setDescription("Parle avec **Mirage**, une IA qui répond comme une vraie personne du serveur.")
    .addFields(
      { name: "🚀 Utilisation", value: "`*ia [message]` — pose une question.\n**@MIRAGE [message]** — mentionne le bot directement." },
      { name: "🎭 Personnalité", value: "Mirage est directe, naturelle, 1-2 phrases max comme dans un vrai Discord." },
      { name: "🛡️ Modération", value: "Les modérateurs peuvent lui demander des actions de modération." },
    )
    .setFooter({ text: "Commandes : *ia [message] | @MIRAGE [message]" }),

  moderation: new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle("🛡️ Modération — Explication")
    .setDescription("Toutes les commandes de modération. Réservées aux modérateurs.")
    .addFields(
      { name: "`*ban @membre [raison]`", value: "Bannit définitivement." },
      { name: "`*unban [ID]`", value: "Débannit par ID." },
      { name: "`*tempban @membre 1h [raison]`", value: "Ban temporaire. Durées : `30m`, `2h`, `3j`." },
      { name: "`*kick @membre [raison]`", value: "Expulse un membre." },
      { name: "`*mute @membre 10m [raison]`", value: "Rend muet temporairement." },
      { name: "`*unmute @membre`", value: "Retire le mute." },
      { name: "`*warn @membre [raison]`", value: "Avertissement. `*warn list @membre` pour l'historique." },
      { name: "`*clear [nombre]`", value: "Supprime des messages (max 100)." },
      { name: "`*lock` / `*unlock`", value: "Verrouille/déverrouille le salon." },
    )
    .setFooter({ text: "Réservé aux modérateurs" }),

  giveaway: new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle("🎉 Giveaway — Explication")
    .setDescription("Lance un giveaway avec conditions (vocal + statut `/mirg`).")
    .addFields(
      { name: "`*giveaway <durée> <prix>`", value: "Lance un giveaway dans le salon dédié.\nEx: `*giveaway 1h Nitro`\nDurées : `30m`, `1h`, `2j`." },
      { name: "`*reroll <ID message>`", value: "Relance le tirage sans conditions si personne ne validait." },
      { name: "✅ Conditions pour gagner", value: "• Être en vocal du début à la fin\n• Avoir `/mirg` dans son statut" },
    )
    .setFooter({ text: "Commandes : *giveaway | *reroll" }),

  poll: new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle("📊 Poll — Explication")
    .setDescription("Crée un sondage avec réactions. Réservé aux modérateurs.")
    .addFields(
      { name: "🚀 Format", value: '`*poll "question" "choix1" "choix2" ...`\nMinimum 2 choix, maximum 10.' },
      { name: "Exemple", value: '`*poll "Meilleure pizza ?" "Margherita" "4 fromages" "Pepperoni"`' },
    )
    .setFooter({ text: "Commande : *poll" }),

  ticket: new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("🎫 Tickets — Explication")
    .setDescription("Système de tickets avec 3 catégories. Un fil privé est créé pour chaque ticket.")
    .addFields(
      { name: "`*ticket setup`", value: "Initialise le panneau de tickets dans ce salon (modo uniquement)." },
      { name: "🎯 Candidature", value: "Ouvre un ticket staff. Pinge l'équipe de gestion staff." },
      { name: "👑 Owner", value: "Ouvre un ticket privé. Pinge l'owner directement." },
      { name: "⚠️ Signaler un abus", value: "Ouvre un ticket signalement. Pinge l'équipe gestion abus." },
      { name: "🔒 Fermeture", value: "L'auteur du ticket ou un modo peut fermer le ticket (bouton dans le fil)." },
    )
    .setFooter({ text: "Commande : *ticket setup" }),

  confess: new EmbedBuilder()
    .setColor(0x2f3136)
    .setTitle("🕵️ Confessions — Explication")
    .setDescription("Système de confessions et réponses anonymes.")
    .addFields(
      { name: "`*confess setup`", value: "Initialise le bouton de confession dans le salon dédié (modo uniquement)." },
      { name: "📬 Fonctionnement", value: "Les membres cliquent sur **✍️ Faire une confession** → modal anonyme.\nIls peuvent aussi **répondre anonymement** à une confession existante." },
      { name: "📋 Logs", value: "L'identité des auteurs est enregistrée en secret dans le salon de logs (modo uniquement)." },
    )
    .setFooter({ text: "Commande : *confess setup" }),

  say: new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("💬 Say & Send — Explication")
    .addFields(
      { name: "`*say [texte]`", value: "Le bot envoie le message et supprime le tien. (modo)" },
      { name: "`*send [texte] + fichier`", value: "Envoie un fichier/image via le bot. (modo)" },
    )
    .setFooter({ text: "Réservé aux modérateurs" }),

  roleadd: new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle("🏷️ Rôles — Explication")
    .addFields(
      { name: "`*roleadd @membre [nom du rôle]`", value: "Ajoute un rôle à un membre. (modo)" },
      { name: "`*roleremove @membre [nom du rôle]`", value: "Retire un rôle à un membre. (modo)" },
    )
    .setFooter({ text: "Commandes : *roleadd | *roleremove" }),

  twerk: new EmbedBuilder()
    .setColor(0xff69b4)
    .setTitle("💃 Twerk")
    .setDescription("`*twerk` — Envoie un gif dans le salon.\n\nC'est tout. 👀"),
};

const LISTE_SOUS_COMMANDES = Object.keys(FICHES).join(" | ");

export const aideCommand: Command = {
  name: "aide",
  description: "Affiche la liste des commandes. *aide [commande] pour plus de détails.",
  usage: "*aide | *aide [commande]",

  async execute(message, args) {
    const sub = args[0]?.toLowerCase();

    if (sub) {
      const fiche = FICHES[sub];
      if (!fiche) {
        await message.reply(`❌ Commande inconnue : \`${sub}\`\nDisponible : \`${LISTE_SOUS_COMMANDES}\``);
        return;
      }
      await message.reply({ embeds: [fiche] });
      return;
    }

    const utilitaires = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("📖 Utilitaires")
      .addFields(
        { name: "`*ping`", value: "Latence du bot.", inline: true },
        { name: "`*info`", value: "Infos du serveur.", inline: true },
        { name: "`*aide`", value: "Ce message.", inline: true },
        { name: "`*say [texte]`", value: "Le bot parle (modo).", inline: false },
        { name: "`*send [fichier]`", value: "Envoie un média (modo).", inline: false },
        { name: "`*ia [message]`", value: "Parle avec Mirage. Aussi via @MIRAGE.", inline: false },
      );

    const moderation = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle("🛡️ Modération")
      .addFields(
        { name: "`*ban / *unban / *tempban`", value: "Bannir / débannir / ban temporaire.", inline: false },
        { name: "`*kick`", value: "Expulser un membre.", inline: false },
        { name: "`*mute / *unmute`", value: "Rendre muet / retirer le mute.", inline: false },
        { name: "`*warn [list]`", value: "Avertir / voir l'historique.", inline: false },
        { name: "`*clear [nombre]`", value: "Supprimer des messages (max 100).", inline: false },
        { name: "`*lock / *unlock`", value: "Verrouiller / déverrouiller le salon.", inline: false },
        { name: "`*roleadd / *roleremove`", value: "Ajouter / retirer un rôle.", inline: false },
      );

    const jeux = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("🎮 Jeux")
      .addFields(
        { name: "`*loupgarou`", value: "Lobby Loup-Garou 🐺 — ✅ rejoindre, 🚀 lancer (modo, 3–30 j.).", inline: false },
        { name: "`*finpartie`", value: "Réinitialise le lobby en cours (modo).", inline: false },
        { name: "`*roles`", value: "Affiche tous les rôles du Loup-Garou.", inline: false },
        { name: "`*undercover`", value: "Lobby Undercover 🕵️ — ✅ rejoindre, 🚀 lancer (3–12 j.).", inline: false },
        { name: "`*quiz drapeaux/cultureg/capital`", value: "Quiz interactif — 30s pour répondre.", inline: false },
        { name: "`*telephone`", value: "Code secret Murder Mystery — via MP.", inline: false },
        { name: "`*twerk`", value: "👀", inline: false },
      );

    const outils = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle("🛠️ Outils")
      .addFields(
        { name: "`*giveaway <durée> <prix>`", value: "Lance un giveaway avec conditions.", inline: false },
        { name: "`*reroll <ID>`", value: "Relance le tirage d'un giveaway.", inline: false },
        { name: "`*poll \"question\" \"choix1\" ...`", value: "Crée un sondage (max 10 choix).", inline: false },
        { name: "`*confess setup`", value: "Initialise le système de confessions anonymes.", inline: false },
      )
      .setFooter({ text: `💡 Tape *aide [commande] pour les détails • ${LISTE_SOUS_COMMANDES}` });

    await message.reply({ embeds: [utilitaires] });
    await message.channel.send({ embeds: [moderation] });
    await message.channel.send({ embeds: [jeux] });
    await message.channel.send({ embeds: [outils] });
  },
};
