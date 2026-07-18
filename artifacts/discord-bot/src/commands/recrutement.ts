import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";

// ─── Serveur No Chill ─────────────────────────────────────
const MAIN_GUILD_ID = "1362520000426152036";

// Autorisés : propriétaire, Owner, Co Owner, Perm Bot, Gestion Staff
const OWNER_ROLE_ID = "1362525559472652349";
const CO_OWNER_ROLE_ID = "1405985277645946970";
const PERM_BOT_ROLE_ID = "1394977975862038548";
const GESTION_STAFF_ROLE_ID = "1405987770891112589";

type RecruitmentKey =
  | "modo"
  | "surveillant"
  | "support"
  | "animateur"
  | "gestionabus";

type RecruitmentData = {
  label: string;
  emoji: string;
  introduction: string;
  roleDescription: string;
  conditions: string[];
};

const RECRUITMENTS: Record<RecruitmentKey, RecruitmentData> = {
  modo: {
    label: "Modérateur",
    emoji: "🛡️",
    introduction:
      "No Chill ouvre son recrutement de **modérateurs**.",
    roleDescription:
      "Si tu souhaites contribuer à maintenir une communauté agréable et respectueuse, c’est peut-être le moment de nous rejoindre.",
    conditions: [
      "Être actif sur le serveur",
      "Être respectueux envers les membres et le staff",
      "N’avoir aucune sanction récente",
      "Savoir garder son calme dans les situations compliquées",
      "Être capable de prendre des décisions justes et impartiales",
      "Vouloir réellement aider la communauté",
    ],
  },

  surveillant: {
    label: "Surveillant",
    emoji: "👀",
    introduction:
      "No Chill recherche actuellement de nouveaux **surveillants**.",
    roleDescription:
      "Le rôle du surveillant est d’assurer une présence quotidienne et de signaler rapidement les problèmes à l’équipe de modération.",
    conditions: [
      "Être actif régulièrement",
      "Être attentif au respect du règlement",
      "Être respectueux envers les autres",
      "N’avoir aucune sanction récente",
      "Avoir envie de contribuer à une bonne ambiance",
    ],
  },

  support: {
    label: "Support",
    emoji: "💬",
    introduction:
      "No Chill recherche actuellement de nouveaux membres pour intégrer le pôle **Support**.",
    roleDescription:
      "Le rôle du Support est d’aider les membres, de répondre aux questions et d’accueillir les nouveaux arrivants.",
    conditions: [
      "Être patient",
      "Aimer aider les autres",
      "Être actif",
      "Être à l’écoute",
      "Savoir expliquer calmement les choses",
      "N’avoir aucune sanction récente",
    ],
  },

  animateur: {
    label: "Animateur",
    emoji: "🎉",
    introduction:
      "Les recrutements pour devenir **Animateur** sont ouverts !",
    roleDescription:
      "Si tu aimes organiser des événements et faire vivre le serveur, ce poste est peut-être fait pour toi.",
    conditions: [
      "Être créatif",
      "Être motivé",
      "Avoir envie de faire vivre le serveur",
      "Être actif",
      "Savoir proposer régulièrement des animations",
      "Apprécier le travail en équipe",
    ],
  },

  gestionabus: {
    label: "Gestion Abus",
    emoji: "⚖️",
    introduction:
      "No Chill recrute actuellement pour intégrer le pôle **Gestion Abus**.",
    roleDescription:
      "Ce poste demande de traiter des situations sensibles, d’analyser les signalements et de prendre des décisions objectives.",
    conditions: [
      "Être capable de rester objectif et calme",
      "Écouter toutes les parties avant de prendre une décision",
      "Savoir garder des informations confidentielles",
      "Avoir une bonne connaissance du règlement",
      "Savoir gérer les conflits avec sang-froid",
      "N’avoir aucune sanction récente",
      "Être actif et disponible",
    ],
  },
};

const ALIASES: Record<string, RecruitmentKey> = {
  modo: "modo",
  moderateur: "modo",
  modérateur: "modo",

  surveillant: "surveillant",
  surveillants: "surveillant",
  surv: "surveillant",

  support: "support",
  supports: "support",

  animateur: "animateur",
  anim: "animateur",
  animation: "animateur",

  gestionabus: "gestionabus",
  "gestion-abus": "gestionabus",
  abus: "gestionabus",
};

function normalize(value?: string): string {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function resolveRecruitment(value?: string): RecruitmentKey | null {
  const normalized = normalize(value);
  return ALIASES[normalized] ?? null;
}

function canUseRecruitment(message: any): boolean {
  if (!message.guild || !message.member) return false;
  if (message.guild.id !== MAIN_GUILD_ID) return false;

  if (message.guild.ownerId === message.author.id) return true;

  return (
    message.member.roles.cache.has(OWNER_ROLE_ID) ||
    message.member.roles.cache.has(CO_OWNER_ROLE_ID) ||
    message.member.roles.cache.has(PERM_BOT_ROLE_ID) ||
    message.member.roles.cache.has(GESTION_STAFF_ROLE_ID)
  );
}

function buildOpenEmbed(data: RecruitmentData): EmbedBuilder {
  const conditions = data.conditions
    .map((condition) => `• ${condition}`)
    .join("\n");

  return new EmbedBuilder()
    .setColor(0x6d28d9)
    .setTitle(`${data.emoji} Recrutement ${data.label}`)
    .setDescription(
      `${data.introduction}\n\n` +
      `${data.roleDescription}\n\n` +
      `### Conditions\n${conditions}\n\n` +
      "📩 Pour candidater, ouvre un ticket dans la catégorie **Candidature Staff**.\n\n" +
      "💜 Chaque candidature est étudiée avec attention. Nous privilégions la motivation et le comportement plutôt que l’ancienneté.",
    )
    .setFooter({
      text: "No Chill • Nous recherchons des personnes motivées avant tout.",
    })
    .setTimestamp();
}

function buildClosedEmbed(data: RecruitmentData): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x747f8d)
    .setTitle(`🔴 Recrutement ${data.label} fermé`)
    .setDescription(
      `Les candidatures pour le poste de **${data.label}** sont désormais fermées.\n\n` +
      "Merci à toutes les personnes ayant postulé. Les candidatures sont actuellement en cours d’étude.\n\n" +
      "💜 Une nouvelle session pourra être ouverte plus tard.",
    )
    .setFooter({
      text: "No Chill • Recrutement fermé",
    })
    .setTimestamp();
}

function buildListEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x6d28d9)
    .setTitle("💜 No Chill • Recrutements")
    .setDescription(
      "Utilise l’une des commandes suivantes dans le salon où tu veux publier l’annonce :",
    )
    .addFields(
      {
        name: "Ouvrir un recrutement",
        value:
          "`*recrutement modo`\n" +
          "`*recrutement surveillant`\n" +
          "`*recrutement support`\n" +
          "`*recrutement animateur`\n" +
          "`*recrutement gestionabus`",
      },
      {
        name: "Fermer un recrutement",
        value:
          "`*recrutement fermer modo`\n" +
          "`*recrutement fermer surveillant`\n" +
          "`*recrutement fermer support`\n" +
          "`*recrutement fermer animateur`\n" +
          "`*recrutement fermer gestionabus`",
      },
    )
    .setFooter({
      text: "Le message est envoyé dans le salon où la commande est utilisée.",
    });
}

export const recrutementCommand: Command = {
  name: "recrutement",
  description: "Publie une annonce d’ouverture ou de fermeture de recrutement",
  usage: "*recrutement <poste> | *recrutement fermer <poste>",

  execute: async (message, args) => {
    if (!canUseRecruitment(message)) {
      await message.reply(
        "❌ Seuls Gestion Staff et les rôles placés au-dessus peuvent utiliser cette commande.",
      );
      return;
    }

    if (!message.channel.isTextBased()) {
      await message.reply(
        "❌ Cette commande doit être utilisée dans un salon textuel.",
      );
      return;
    }

    if (args.length === 0) {
      await message.reply({
        embeds: [buildListEmbed()],
      });
      return;
    }

    const firstArg = normalize(args[0]);
    const isClosing =
      firstArg === "fermer" ||
      firstArg === "close" ||
      firstArg === "off";

    const recruitmentKey = resolveRecruitment(
      isClosing ? args[1] : args[0],
    );

    if (!recruitmentKey) {
      await message.reply({
        content:
          "❌ Poste inconnu. Utilise `*recrutement` pour afficher la liste.",
        embeds: [buildListEmbed()],
      });
      return;
    }

    const data = RECRUITMENTS[recruitmentKey];
    const embed = isClosing
      ? buildClosedEmbed(data)
      : buildOpenEmbed(data);

    await message.channel.send({
      embeds: [embed],
    });

    await message.delete().catch(() => {});
  },
};
