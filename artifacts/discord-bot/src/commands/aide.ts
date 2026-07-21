import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
  type Interaction,
} from "discord.js";

import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";
import { BOT_OWNER_ID } from "./owner.js";

type HelpCategory =
  | "home"
  | "members"
  | "moderation"
  | "tickets"
  | "tools"
  | "games"
  | "ia"
  | "custom"
  | "owner";

type HelpCommandInfo = {
  name: string;
  description: string;
  usage: string;
  permission: "Membre" | "Modérateur" | "Owner";
  example?: string;
  category: HelpCategory;
};

const HELP_COLOR = 0x6d28d9;
const HELP_FOOTER = "No Chill • Chichi";

const COMMANDS: HelpCommandInfo[] = [
  {
    name: "aide",
    description: "Affiche le centre d’aide interactif.",
    usage: "*aide [commande]",
    permission: "Membre",
    example: "*aide jail",
    category: "members",
  },
  {
    name: "ia",
    description: "Parle avec Chichi.",
    usage: "*ia message",
    permission: "Membre",
    example: "*ia tu penses quoi de Marvel ?",
    category: "ia",
  },
  {
    name: "chichi pp",
    description: "Affiche la photo de profil serveur et générale d’un membre.",
    usage: "chichi pp @membre",
    permission: "Membre",
    example: "chichi pp @Kay",
    category: "members",
  },
  {
    name: "chichi banner",
    description: "Affiche la bannière serveur et générale d’un membre.",
    usage: "chichi banner @membre",
    permission: "Membre",
    example: "chichi banner @Kay",
    category: "members",
  },
  {
    name: "s",
    description: "Affiche le dernier message supprimé du salon.",
    usage: "*s",
    permission: "Modérateur",
    category: "moderation",
  },
  {
    name: "is",
    description: "Affiche les 10 derniers messages supprimés avec navigation.",
    usage: "*is",
    permission: "Modérateur",
    category: "moderation",
  },
  {
    name: "sclearsnipe",
    description: "Efface l’historique des messages supprimés du salon.",
    usage: "*sclearsnipe",
    permission: "Modérateur",
    category: "moderation",
  },
  {
    name: "ban",
    description: "Bannit un membre.",
    usage: "*ban @membre [raison]",
    permission: "Modérateur",
    category: "moderation",
  },
  {
    name: "unban",
    description: "Débannit un utilisateur.",
    usage: "*unban ID",
    permission: "Modérateur",
    category: "moderation",
  },
  {
    name: "tempban",
    description: "Bannit temporairement un membre.",
    usage: "*tempban @membre durée [raison]",
    permission: "Modérateur",
    category: "moderation",
  },
  {
    name: "kick",
    description: "Expulse un membre.",
    usage: "*kick @membre [raison]",
    permission: "Modérateur",
    category: "moderation",
  },
  {
    name: "mute",
    description: "Rend un membre muet.",
    usage: "*mute @membre [durée] [raison]",
    permission: "Modérateur",
    category: "moderation",
  },
  {
    name: "unmute",
    description: "Retire le mute d’un membre.",
    usage: "*unmute @membre",
    permission: "Modérateur",
    category: "moderation",
  },
  {
    name: "warn",
    description: "Avertit un membre.",
    usage: "*warn @membre [raison]",
    permission: "Modérateur",
    category: "moderation",
  },
  {
    name: "jail",
    description: "Met un membre en prison et sauvegarde ses rôles.",
    usage: "*jail @membre [raison]",
    permission: "Modérateur",
    example: "*jail @Kay Spam vocal",
    category: "moderation",
  },
  {
    name: "unjail",
    description: "Libère un membre et restaure ses rôles.",
    usage: "*unjail @membre",
    permission: "Modérateur",
    category: "moderation",
  },
  {
    name: "bl",
    description: "Ajoute un utilisateur à la blacklist.",
    usage: "*bl @membre [raison] | *bl ID [raison] | *bl list",
    permission: "Owner",
    category: "moderation",
  },
  {
    name: "unbl",
    description: "Retire un utilisateur de la blacklist.",
    usage: "*unbl @membre | *unbl ID",
    permission: "Owner",
    category: "moderation",
  },
  {
    name: "permimg",
    description: "Ajoute la permission d’envoyer des images.",
    usage: "Réponds à un message avec *permimg",
    permission: "Modérateur",
    category: "moderation",
  },
  {
    name: "permvoc",
    description: "Ajoute la permission vocale.",
    usage: "Réponds à un message avec *permvoc",
    permission: "Modérateur",
    category: "moderation",
  },
  {
    name: "permremove",
    description: "Retire les permissions images et vocal.",
    usage: "Réponds à un message avec *permremove",
    permission: "Modérateur",
    category: "moderation",
  },
  {
    name: "clear",
    description: "Supprime plusieurs messages.",
    usage: "*clear nombre",
    permission: "Modérateur",
    category: "moderation",
  },
  {
    name: "lock",
    description: "Verrouille le salon.",
    usage: "*lock",
    permission: "Modérateur",
    category: "moderation",
  },
  {
    name: "unlock",
    description: "Déverrouille le salon.",
    usage: "*unlock",
    permission: "Modérateur",
    category: "moderation",
  },
  {
    name: "ticket",
    description: "Publie le panneau de tickets.",
    usage: "*ticket setup",
    permission: "Modérateur",
    category: "tickets",
  },
  {
    name: "verification",
    description: "Publie le panneau de vérification.",
    usage: "*verification setup",
    permission: "Modérateur",
    category: "custom",
  },

  {
    name: "profil",
    description: "Publie les panneaux Couleurs, Genre et Âge.",
    usage: "*profil setup [couleurs|genre|age]",
    permission: "Modérateur",
    category: "custom",
  },
  {
    name: "setup origines",
    description: "Crée ou modifie un panneau d’origines.",
    usage: "*setup origines | *setup origines edit ID",
    permission: "Modérateur",
    category: "custom",
  },
  {
    name: "iablock",
    description: "Bloque ou débloque l’IA dans un salon.",
    usage: "*iablock ...",
    permission: "Modérateur",
    category: "ia",
  },



  {
    name: "quiz",
    description: "Lance un quiz de 10 questions aléatoires avec classement.",
    usage: "*quiz drapeaux | *quiz capital | *quiz cultureg",
    permission: "Membre",
    example: "*quiz drapeaux",
    category: "games",
  },
  {
    name: "undercover",
    description: "Lance une partie d’Undercover.",
    usage: "*undercover",
    permission: "Membre",
    category: "games",
  },
  {
    name: "loupgarou",
    description: "Lance une partie de Loup-Garou.",
    usage: "*loupgarou",
    permission: "Membre",
    category: "games",
  },
  {
    name: "finpartie",
    description: "Met fin à la partie de Loup-Garou en cours.",
    usage: "*finpartie",
    permission: "Modérateur",
    category: "games",
  },

  {
    name: "giveaway",
    description: "Lance un giveaway avec les conditions de ton choix.",
    usage: "*giveaway <durée> [nombre_gagnants] <prix>",
    permission: "Modérateur",
    example: "*giveaway 1h 3 Nitro",
    category: "tools",
  },
  {
    name: "giveaway end",
    description: "Termine immédiatement le dernier giveaway actif du salon, ou un giveaway précis.",
    usage: "*giveaway end [ID_message]",
    permission: "Modérateur",
    example: "*giveaway end",
    category: "tools",
  },
  {
    name: "topgiveaway",
    description: "Lance un giveaway avec plusieurs gagnants et un avantage pour les boosters.",
    usage: "*topgiveaway <durée> <nombre_gagnants> <prix>",
    permission: "Modérateur",
    example: "*topgiveaway 2j 10 Nitro",
    category: "tools",
  },
  {
    name: "reroll",
    description: "Relance le tirage d’un giveaway.",
    usage: "*reroll <ID_message>",
    permission: "Modérateur",
    category: "tools",
  },
  {
    name: "poll",
    description: "Crée un sondage avec plusieurs choix.",
    usage: "*poll \"question\" \"choix 1\" \"choix 2\"",
    permission: "Modérateur",
    category: "tools",
  },
  {
    name: "say",
    description: "Fait envoyer un message simple par Chichi.",
    usage: "*say texte",
    permission: "Modérateur",
    category: "tools",
  },
  {
    name: "send",
    description: "Fait envoyer une image ou un fichier par Chichi.",
    usage: "*send + fichier",
    permission: "Modérateur",
    category: "tools",
  },
  {
    name: "talk",
    description: "Envoie un message formaté avec une image, un GIF, une vidéo ou un fichier optionnel.",
    usage: "*talk [#salon]",
    permission: "Modérateur",
    category: "tools",
  },
  {
    name: "confess",
    description: "Configure le système de confessions anonymes.",
    usage: "*confess setup",
    permission: "Modérateur",
    category: "tools",
  },
  {
    name: "massban",
    description: "Bannit tous les membres possédant un rôle.",
    usage: "*massban @role [raison]",
    permission: "Owner",
    category: "owner",
  },
  {
    name: "masskick",
    description: "Expulse tous les membres possédant un rôle.",
    usage: "*masskick @role [raison]",
    permission: "Owner",
    category: "owner",
  },
  {
    name: "delsalon",
    description: "Supprime les salons mentionnés ou le salon actuel.",
    usage: "*delsalon #salon1 #salon2",
    permission: "Owner",
    category: "owner",
  },
  {
    name: "broadcast",
    description: "Envoie un message dans tous les salons du serveur.",
    usage: "*broadcast message",
    permission: "Owner",
    category: "owner",
  },
  {
    name: "parle",
    description: "Envoie un message dans tous les salons ou dans un salon précis.",
    usage: "*parle message | *parle CHANNEL_ID message",
    permission: "Owner",
    category: "owner",
  },
  {
    name: "botprofil pseudo",
    description: "Change le pseudo du bot sur ce serveur.",
    usage: "*botprofil pseudo <nom>",
    permission: "Owner",
    category: "owner",
  },
  {
    name: "botprofil avatar",
    description: "Change l’avatar du bot.",
    usage: "*botprofil avatar <url>",
    permission: "Owner",
    category: "owner",
  },
  {
    name: "botprofil banniere",
    description: "Change la bannière du bot.",
    usage: "*botprofil banniere <url>",
    permission: "Owner",
    category: "owner",
  },
  {
    name: "botprofil reset",
    description: "Restaure le profil par défaut du bot.",
    usage: "*botprofil reset",
    permission: "Owner",
    category: "owner",
  },
];

function isStaffOnly(command: HelpCommandInfo): boolean {
  return command.permission !== "Membre";
}

function buildMenu(userId: string): ActionRowBuilder<StringSelectMenuBuilder> {
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`aide_menu:${userId}`)
      .setPlaceholder("Choisis une catégorie")
      .addOptions(
        {
          label: "Accueil",
          description: "Retour au centre d’aide",
          value: "home",
          emoji: "🏠",
        },
        {
          label: "Membres",
          description: "Commandes accessibles aux membres",
          value: "members",
          emoji: "👤",
        },
        {
          label: "Modération",
          description: "Commandes de modération",
          value: "moderation",
          emoji: "🛡️",
        },
        {
          label: "Jeux",
          description: "Quiz, Undercover et Loup-Garou",
          value: "games",
          emoji: "🎮",
        },
        {
          label: "Outils",
          description: "Giveaways, sondages et messages",
          value: "tools",
          emoji: "🛠️",
        },
        {
          label: "Tickets",
          description: "Tickets et demandes",
          value: "tickets",
          emoji: "🎫",
        },
        {
          label: "IA",
          description: "Commandes liées à Chichi",
          value: "ia",
          emoji: "🤖",
        },
        {
          label: "Personnalisation",
          description: "Profil et origines",
          value: "custom",
          emoji: "🎨",
        },
        {
          label: "Owner",
          description: "Commandes privées du propriétaire",
          value: "owner",
          emoji: "👑",
        },
      ),
  );
}

function buildHomeEmbed(botAvatar?: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(HELP_COLOR)
    .setTitle("✦ No Chill • Centre d’aide")
    .setDescription(
      "Bienvenue sur le centre d’aide de **Chichi**.\n\n" +
      "Sélectionne une catégorie dans le menu ci-dessous.\n" +
      "Tu peux aussi utiliser `*aide commande` pour ouvrir directement une fiche.",
    )
    .addFields(
      {
        name: "👤 Membres",
        value: `${COMMANDS.filter((c) => c.category === "members").length} commandes`,
        inline: true,
      },
      {
        name: "🛡️ Modération",
        value: `${COMMANDS.filter((c) => c.category === "moderation").length} commandes`,
        inline: true,
      },
      {
        name: "🛠️ Outils",
        value: `${COMMANDS.filter((c) => c.category === "tools").length} commandes`,
        inline: true,
      },
      {
        name: "🎮 Jeux",
        value: `${COMMANDS.filter((c) => c.category === "games").length} commandes`,
        inline: true,
      },
    )
    .setFooter({
      text: `${HELP_FOOTER} • ${COMMANDS.length} commandes répertoriées`,
    });

  if (botAvatar) {
    embed.setThumbnail(botAvatar);
  }

  return embed;
}

const CATEGORY_TITLES: Record<HelpCategory, string> = {
  home: "🏠 Accueil",
  members: "👤 Commandes membres",
  moderation: "🛡️ Modération",
  tickets: "🎫 Tickets",
  tools: "🛠️ Outils",
  games: "🎮 Jeux",
  ia: "🤖 Intelligence artificielle",
  custom: "🎨 Personnalisation",
  owner: "👑 Commandes Owner",
};

function buildCategoryEmbed(
  category: HelpCategory,
  canSeeStaff: boolean,
  isBotOwner: boolean,
): EmbedBuilder {
  const visible = COMMANDS.filter((command) => {
    if (command.category !== category) return false;

    if (command.permission === "Owner") {
      return isBotOwner;
    }

    if (command.permission === "Modérateur") {
      return canSeeStaff || isBotOwner;
    }

    return true;
  });

  const embed = new EmbedBuilder()
    .setColor(HELP_COLOR)
    .setTitle(`✦ No Chill • ${CATEGORY_TITLES[category]}`)
    .setFooter({
      text: `${HELP_FOOTER} • ${visible.length} commande(s)`,
    });

  if (visible.length === 0) {
    return embed.setDescription(
      "Aucune commande accessible dans cette catégorie.",
    );
  }

  embed.setDescription(
    visible
      .map(
        (command) =>
          `**\`${command.usage}\`**\n> ${command.description}`,
      )
      .join("\n\n")
      .slice(0, 4096),
  );

  return embed;
}

function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .replace(/^\*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findCommand(query: string): HelpCommandInfo | null {
  const normalized = normalizeSearch(query);

  return (
    COMMANDS.find(
      (command) => normalizeSearch(command.name) === normalized,
    ) ??
    COMMANDS.find(
      (command) => normalizeSearch(command.usage).startsWith(normalized),
    ) ??
    null
  );
}

function buildCommandEmbed(command: HelpCommandInfo): EmbedBuilder {
  const fields = [
    {
      name: "Description",
      value: command.description,
    },
    {
      name: "Utilisation",
      value: `\`${command.usage}\``,
    },
    {
      name: "Permission",
      value:
        command.permission === "Membre"
          ? "👤 Membre"
          : command.permission === "Modérateur"
            ? "🛡️ Modérateur"
            : "👑 Owner",
      inline: true,
    },
  ];

  if (command.example) {
    fields.push({
      name: "Exemple",
      value: `\`${command.example}\``,
    });
  }

  return new EmbedBuilder()
    .setColor(HELP_COLOR)
    .setTitle(`✦ Aide • ${command.name}`)
    .addFields(fields)
    .setFooter({
      text: HELP_FOOTER,
    });
}

function buildHomeButton(userId: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`aide_home:${userId}`)
      .setLabel("Accueil")
      .setEmoji("🏠")
      .setStyle(ButtonStyle.Secondary),
  );
}

export const aideCommand: Command = {
  name: "aide",
  description: "Affiche le centre d’aide",
  usage: "*aide [commande]",

  execute: async (message, args) => {
    const query = args.join(" ").trim();
    const canSeeStaff = Boolean(
      message.member && isModerator(message.member),
    );

    const isBotOwner =
      message.author.id === BOT_OWNER_ID;

    if (query) {
      const command = findCommand(query);

      if (!command) {
        await message.reply(
          "❌ Commande introuvable. Utilise `*aide` pour voir toutes les catégories.",
        );
        return;
      }

      if (
        command.permission === "Owner" &&
        !isBotOwner
      ) {
        await message.reply(
          "❌ Cette commande est réservée au propriétaire du bot.",
        );
        return;
      }

      if (
        command.permission === "Modérateur" &&
        !canSeeStaff &&
        !isBotOwner
      ) {
        await message.reply(
          "❌ Cette commande est réservée au staff.",
        );
        return;
      }

      await message.reply({
        embeds: [buildCommandEmbed(command)],
        components: [buildHomeButton(message.author.id)],
        allowedMentions: {
          parse: [],
          repliedUser: false,
        },
      });

      return;
    }

    await message.reply({
      embeds: [
        buildHomeEmbed(
          message.client.user?.displayAvatarURL({
            size: 256,
          }),
        ),
      ],
      components: [buildMenu(message.author.id)],
      allowedMentions: {
        parse: [],
        repliedUser: false,
      },
    });
  },
};

export async function handleAideInteraction(
  interaction: Interaction,
): Promise<void> {
  if (!interaction.isStringSelectMenu() && !interaction.isButton()) {
    return;
  }

  const isMenu =
    interaction.isStringSelectMenu() &&
    interaction.customId.startsWith("aide_menu:");

  const isHome =
    interaction.isButton() &&
    interaction.customId.startsWith("aide_home:");

  if (!isMenu && !isHome) {
    return;
  }

  const ownerId = interaction.customId.split(":")[1];

  if (interaction.user.id !== ownerId) {
    await interaction.reply({
      content:
        "❌ Seule la personne qui a lancé `*aide` peut utiliser ce menu.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const member =
    interaction.guild?.members.cache.get(interaction.user.id) ??
    null;

  const canSeeStaff = Boolean(
    member && isModerator(member),
  );

  const isBotOwner =
    interaction.user.id === BOT_OWNER_ID;

  if (isHome) {
    await interaction.update({
      embeds: [
        buildHomeEmbed(
          interaction.client.user.displayAvatarURL({
            size: 256,
          }),
        ),
      ],
      components: [buildMenu(ownerId)],
    });
    return;
  }

  const category =
    interaction.values[0] as HelpCategory;

  if (
    category === "owner" &&
    !isBotOwner
  ) {
    await interaction.reply({
      content:
        "❌ Cet onglet est réservé au propriétaire du bot.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (category === "home") {
    await interaction.update({
      embeds: [
        buildHomeEmbed(
          interaction.client.user.displayAvatarURL({
            size: 256,
          }),
        ),
      ],
      components: [buildMenu(ownerId)],
    });
    return;
  }

  await interaction.update({
    embeds: [
      buildCategoryEmbed(
        category,
        canSeeStaff,
        isBotOwner,
      ),
    ],
    components: [
      buildMenu(ownerId),
      buildHomeButton(ownerId),
    ],
  });
}
