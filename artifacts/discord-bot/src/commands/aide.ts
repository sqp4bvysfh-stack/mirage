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

type HelpCategory =
  | "home"
  | "members"
  | "moderation"
  | "tickets"
  | "config"
  | "ia"
  | "custom";

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
    category: "config",
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
    name: "boostsetup",
    description: "Affiche la configuration du système de boost.",
    usage: "*boostsetup",
    permission: "Modérateur",
    category: "config",
  },
  {
    name: "photo",
    description: "Affiche la configuration du salon photo.",
    usage: "*photo",
    permission: "Modérateur",
    category: "config",
  },
  {
    name: "iablock",
    description: "Bloque ou débloque l’IA dans un salon.",
    usage: "*iablock ...",
    permission: "Modérateur",
    category: "ia",
  },
  {
    name: "pp block",
    description: "Désactive Chichi PP et Chichi Banner.",
    usage: "*pp block",
    permission: "Modérateur",
    category: "config",
  },
  {
    name: "pp unblock",
    description: "Réactive Chichi PP et Chichi Banner.",
    usage: "*pp unblock",
    permission: "Modérateur",
    category: "config",
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
          label: "Tickets",
          description: "Tickets et demandes",
          value: "tickets",
          emoji: "🎫",
        },
        {
          label: "Configuration",
          description: "Réglages du serveur",
          value: "config",
          emoji: "⚙️",
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
        name: "⚙️ Configuration",
        value: `${COMMANDS.filter((c) => ["config", "tickets", "custom"].includes(c.category)).length} commandes`,
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
  config: "⚙️ Configuration",
  ia: "🤖 Intelligence artificielle",
  custom: "🎨 Personnalisation",
};

function buildCategoryEmbed(
  category: HelpCategory,
  canSeeStaff: boolean,
): EmbedBuilder {
  const visible = COMMANDS.filter((command) => {
    if (command.category !== category) return false;
    if (!canSeeStaff && isStaffOnly(command)) return false;
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

    if (query) {
      const command = findCommand(query);

      if (!command) {
        await message.reply(
          "❌ Commande introuvable. Utilise `*aide` pour voir toutes les catégories.",
        );
        return;
      }

      if (!canSeeStaff && isStaffOnly(command)) {
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
      ),
    ],
    components: [
      buildMenu(ownerId),
      buildHomeButton(ownerId),
    ],
  });
}
