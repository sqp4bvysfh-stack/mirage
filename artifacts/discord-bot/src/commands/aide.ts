import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";

const FICHES: Record<string, EmbedBuilder> = {
  undercover: new EmbedBuilder()
    .setColor(0x2c2f33)
    .setTitle("🕵️ Undercover — Explication")
    .setDescription(
      "Jeu de déduction où certains joueurs ont un mot différent des autres. " +
      "Il faut trouver qui est l'Undercover avant qu'il ne se fonde dans la masse !"
    )
    .addFields(
      { name: "🚀 Lancer une partie", value: "`*undercover @j1 @j2 @j3 ...`\nMinimum **3 joueurs**, maximum **12**." },
      { name: "📬 Déroulement", value: "Chaque joueur reçoit son mot en **MP**.\nÀ tour de rôle, chacun décrit son mot **sans le dire** directement.\nEnsuite, le groupe vote pour éliminer le suspect." },
      {
        name: "🎭 Les rôles", value:
          "**✅ Civil** — a le mot principal. Trouve l'Undercover !\n" +
          "**🕵️ Undercover** — a un mot proche mais différent. Essaie de te fondre dans la masse.\n" +
          "**⬜ Mr. White** *(dès 4 joueurs)* — n'a aucun mot. Écoute les autres et tente de deviner."
      },
      { name: "💡 Conseil", value: "Sois ni trop vague ni trop précis — l'Undercover peut retourner la situation !" },
    )
    .setFooter({ text: "Commande : *undercover @j1 @j2 @j3 ..." }),

  quiz: new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle("🧠 Quiz — Explication")
    .setDescription("Lance un quiz en temps réel dans le salon. Premier à répondre gagne !")
    .addFields(
      { name: "🚀 Modes disponibles", value:
        "`*quiz drapeaux` — Identifie le pays derrière chaque drapeau 🌍\n" +
        "`*quiz cultureg` — Questions de culture générale 🧠\n" +
        "`*quiz capital` — Retrouve les capitales du monde 🏙️"
      },
      { name: "⏱️ Règles", value: "Tu as **30 secondes** pour répondre.\nLe premier à taper la bonne réponse remporte la manche.\nSi personne ne répond, la réponse est révélée." },
      { name: "💡 Conseil", value: "Les réponses sont en minuscules et sans accent. Ex : `france`, `paris`, `japon`." },
    )
    .setFooter({ text: "Commandes : *quiz drapeaux | *quiz cultureg | *quiz capital" }),

  loupgarou: new EmbedBuilder()
    .setColor(0x8b0000)
    .setTitle("🐺 Loup-Garou — Explication")
    .setDescription("Le jeu de société Loup-Garou de Thiercelieux, directement sur Discord ! Chaque joueur reçoit son rôle en MP.")
    .addFields(
      { name: "🚀 Lancer une partie", value: "`*loupgarou @j1 @j2 @j3 ...`\nMinimum **3 joueurs**, maximum **20**." },
      { name: "📬 Attribution des rôles", value: "Les rôles sont envoyés automatiquement en **MP** à chaque joueur selon le nombre de participants. Utilise `*roles` pour voir tous les rôles disponibles." },
      { name: "🐺 Camps", value:
        "**Village** — Villageois, Voyante, Sorcière, Chasseur, Garde, Nécromancien, Cupidon, Renard, Berger, Enfant Sauvage\n" +
        "**Loups-Garous** — Loup-Garou, Loup-Bavard, Loup Blanc, Loup-Noir"
      },
      { name: "💡 Conseil", value: "La nuit, les loups chassent en secret. Le jour, le village débat et vote. Bonne chance !" },
    )
    .setFooter({ text: "Commandes : *loupgarou | *roles" }),

  telephone: new EmbedBuilder()
    .setColor(0x1a1a2e)
    .setTitle("📱 Téléphone — Explication")
    .setDescription("Commande secrète pour les Murder Mystery. Tu dois deviner le code pour accéder au salon 📱.")
    .addFields(
      { name: "🚀 Utilisation", value: "`*telephone`\nLe bot supprime ton message et t'envoie un **MP** pour ne pas révéler le code." },
      { name: "🔒 Règles", value: "Tu as **3 tentatives** et **60 secondes**.\nSi tu trouves le bon code, tu obtiens automatiquement le rôle 📱 qui donne accès au salon secret." },
      { name: "💡 Conseil", value: "Le code se trouve quelque part sur le serveur... cherche bien 👀" },
    )
    .setFooter({ text: "Commande : *telephone" }),

  ia: new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle("🤖 IA — Explication")
    .setDescription("Parle avec **Mirage**, une IA intégrée au bot qui répond comme une vraie personne du serveur.")
    .addFields(
      { name: "🚀 Utilisation", value:
        "`*ia [message]` — pose une question ou démarre une conversation.\n" +
        "**@MIRAGE [message]** — mentionne directement le bot pour le même résultat."
      },
      { name: "🎭 Personnalité", value: "Mirage est une fille de 20 ans, directe et naturelle. Elle répond en 1-2 phrases max, comme dans un vrai message Discord." },
      { name: "🛡️ Modération", value: "Les modérateurs peuvent lui demander des actions de modération. Les membres normaux ne peuvent pas." },
    )
    .setFooter({ text: "Commandes : *ia [message] | @MIRAGE [message]" }),

  moderation: new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle("🛡️ Modération — Explication")
    .setDescription("Toutes les commandes de modération. Réservées aux modérateurs et administrateurs.")
    .addFields(
      { name: "`*ban @membre [raison]`", value: "Bannit définitivement un membre du serveur." },
      { name: "`*unban [ID]`", value: "Débannit un membre via son ID Discord." },
      { name: "`*tempban @membre 1h [raison]`", value: "Ban temporaire. Durées : `30m`, `2h`, `3j`, etc. Le ban est levé automatiquement." },
      { name: "`*kick @membre [raison]`", value: "Expulse un membre (il peut revenir)." },
      { name: "`*mute @membre 10m [raison]`", value: "Rend muet temporairement. Durées : `10m`, `1h`, `7j`." },
      { name: "`*unmute @membre`", value: "Retire le mute immédiatement." },
      { name: "`*warn @membre [raison]`", value: "Ajoute un avertissement. Utilise `*warn list @membre` pour voir l'historique." },
    )
    .setFooter({ text: "Commandes réservées aux modérateurs uniquement" }),

  say: new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("💬 Say & Send — Explication")
    .addFields(
      { name: "`*say [texte]`", value: "Le bot envoie le texte dans le salon et supprime ton message. Réservé aux modérateurs." },
      { name: "`*send [texte] + fichier`", value: "Le bot envoie un fichier/image/vidéo dans le salon. Tu peux ajouter du texte en même temps. Réservé aux modérateurs." },
    )
    .setFooter({ text: "Commandes réservées aux modérateurs uniquement" }),

  twerk: new EmbedBuilder()
    .setColor(0xff69b4)
    .setTitle("💃 Twerk — Explication")
    .setDescription("`*twerk` — Envoie un gif dans le salon.\n\nC'est tout. 👀")
    .setFooter({ text: "Commande : *twerk" }),
};

const LISTE_SOUS_COMMANDES = Object.keys(FICHES).join(" | ");

export const aideCommand: Command = {
  name: "aide",
  description: "Affiche la liste des commandes. Tape *aide [commande] pour plus de détails.",
  usage: "*aide | *aide [commande]",

  async execute(message, args) {
    const sub = args[0]?.toLowerCase();

    if (sub) {
      const fiche = FICHES[sub];
      if (!fiche) {
        await message.reply(
          `❌ Commande inconnue : \`${sub}\`\nDisponible : \`${LISTE_SOUS_COMMANDES}\``
        );
        return;
      }
      await message.reply({ embeds: [fiche] });
      return;
    }

    const utilitaires = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("📖 Commandes — Utilitaires")
      .addFields(
        { name: "`*ping`", value: "Latence du bot.", inline: true },
        { name: "`*info`", value: "Infos du serveur.", inline: true },
        { name: "`*aide`", value: "Ce message.", inline: true },
        { name: "`*say [texte]`", value: "Le bot envoie un message (modo).", inline: false },
        { name: "`*send [texte/fichier]`", value: "Envoie un média dans le salon (modo).", inline: false },
        { name: "`*ia [message]`", value: "Parle avec Mirage (IA). Fonctionne aussi en @mentionnant le bot.", inline: false },
      );

    const moderation = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle("🛡️ Commandes — Modération")
      .addFields(
        { name: "`*ban @membre [raison]`", value: "Bannir un membre.", inline: false },
        { name: "`*unban [ID]`", value: "Débannir par son ID.", inline: false },
        { name: "`*tempban @membre 1h [raison]`", value: "Ban temporaire. Durées : `30m`, `1h`, `2j`.", inline: false },
        { name: "`*kick @membre [raison]`", value: "Expulser un membre.", inline: false },
        { name: "`*mute @membre 10m [raison]`", value: "Rendre muet temporairement.", inline: false },
        { name: "`*unmute @membre`", value: "Retirer le mute.", inline: false },
        { name: "`*warn @membre [raison]`", value: "Avertir un membre.", inline: false },
        { name: "`*warn list @membre`", value: "Voir les avertissements d'un membre.", inline: false },
      );

    const jeux = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("🎮 Commandes — Jeux")
      .addFields(
        { name: "`*loupgarou @j1 @j2 ...`", value: "Lance une partie de Loup-Garou. Rôles envoyés en MP (3–20 joueurs).", inline: false },
        { name: "`*roles`", value: "Affiche tous les rôles du Loup-Garou.", inline: false },
        { name: "`*undercover @j1 @j2 ...`", value: "Lance une partie d'Undercover. Mots envoyés en MP (3–12 joueurs).", inline: false },
        { name: "`*quiz drapeaux`", value: "Quiz de drapeaux — 30 secondes pour répondre.", inline: false },
        { name: "`*quiz cultureg`", value: "Quiz de culture générale.", inline: false },
        { name: "`*quiz capital`", value: "Quiz de capitales du monde.", inline: false },
        { name: "`*telephone`", value: "Accès au téléphone secret (Murder Mystery) — code requis en MP.", inline: false },
        { name: "`*twerk`", value: "👀", inline: false },
      )
      .setFooter({ text: `💡 Tape *aide [commande] pour plus de détails • ex: *aide undercover\nDisponible : ${LISTE_SOUS_COMMANDES}` });

    await message.reply({ embeds: [utilitaires] });
    await message.channel.send({ embeds: [moderation] });
    await message.channel.send({ embeds: [jeux] });
  },
};
