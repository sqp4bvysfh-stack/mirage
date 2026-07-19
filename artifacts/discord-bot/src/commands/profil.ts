import {
  EmbedBuilder,
  type Message,
  type MessageReaction,
  type User,
} from "discord.js";

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";

import { join } from "node:path";

import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";

type ProfilCategory =
  | "couleurs"
  | "genre"
  | "age";

type ProfilOption = {
  emoji: string;
  label: string;
  roleId: string;
};

type ProfilPanelStore =
  Partial<Record<ProfilCategory, string>>;

const PROFIL_FILE = (() => {
  try {
    if (!existsSync("/data")) {
      mkdirSync("/data", {
        recursive: true,
      });
    }

    return "/data/profil-panels.json";
  } catch {
    return join(
      process.cwd(),
      "profil-panels.json",
    );
  }
})();

const PROFIL_CATEGORIES: Record<
  ProfilCategory,
  {
    title: string;
    options: ProfilOption[];
  }
> = {
  couleurs: {
    title: "✦ No Chill • Couleurs",
    options: [
      {
        emoji: "🔵",
        label: "Bleu",
        roleId: "1406009413583765555",
      },
      {
        emoji: "🟡",
        label: "Jaune",
        roleId: "1406009478221926590",
      },
      {
        emoji: "🟢",
        label: "Vert",
        roleId: "1406009513164804206",
      },
      {
        emoji: "🟣",
        label: "Violet",
        roleId: "1406009670203740290",
      },
      {
        emoji: "🌸",
        label: "Rose",
        roleId: "1526777257572700190",
      },
      {
        emoji: "🔴",
        label: "Rouge",
        roleId: "1528114875686060063",
      },
      {
        emoji: "🩶",
        label: "Gris",
        roleId: "1528115005520613546",
      },
      {
        emoji: "⚫",
        label: "Noir",
        roleId: "1406009238165262407",
      },
      {
        emoji: "⚪",
        label: "Blanc",
        roleId: "1406009279034560603",
      },
    ],
  },

  genre: {
    title: "✦ No Chill • Genre",
    options: [
      {
        emoji: "👨",
        label: "Hommes",
        roleId: "1394578403570487376",
      },
      {
        emoji: "👩",
        label: "Femmes",
        roleId: "1394578489054597241",
      },
    ],
  },

  age: {
    title: "✦ No Chill • Âge",
    options: [
      {
        emoji: "🔞",
        label: "Majeur",
        roleId: "1394578661792940052",
      },
      {
        emoji: "🧒",
        label: "Mineur",
        roleId: "1394578802566234162",
      },
    ],
  },
};

let panels: ProfilPanelStore = {};

function loadPanels(): void {
  try {
    if (!existsSync(PROFIL_FILE)) {
      return;
    }

    panels = JSON.parse(
      readFileSync(
        PROFIL_FILE,
        "utf-8",
      ),
    ) as ProfilPanelStore;
  } catch (error) {
    console.error(
      "❌ Impossible de charger profil-panels.json :",
      error,
    );

    panels = {};
  }
}

function savePanels(): void {
  try {
    writeFileSync(
      PROFIL_FILE,
      JSON.stringify(
        panels,
        null,
        2,
      ),
      "utf-8",
    );
  } catch (error) {
    console.error(
      "❌ Impossible de sauvegarder profil-panels.json :",
      error,
    );
  }
}

loadPanels();

function normalizeCategory(
  value?: string,
): ProfilCategory | null {
  const normalized = (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .trim();

  if (
    [
      "couleur",
      "couleurs",
      "color",
    ].includes(normalized)
  ) {
    return "couleurs";
  }

  if (
    [
      "genre",
      "sexe",
    ].includes(normalized)
  ) {
    return "genre";
  }

  if (
    [
      "age",
      "ages",
    ].includes(normalized)
  ) {
    return "age";
  }

  return null;
}

function buildPanelEmbed(
  category: ProfilCategory,
): EmbedBuilder {
  const config =
    PROFIL_CATEGORIES[category];

  return new EmbedBuilder()
    .setColor(0x6d28d9)
    .setTitle(config.title)
    .setDescription(
      config.options
        .map(
          (option) =>
            `${option.emoji} ${option.label}`,
        )
        .join("\n"),
    )
    .setFooter({
      text:
        "Clique sur une réaction pour choisir ton rôle.",
    });
}

async function publishPanel(
  message: Message,
  category: ProfilCategory,
): Promise<void> {
  if (!message.channel.isTextBased()) {
    await message.reply(
      "❌ Cette commande doit être utilisée dans un salon textuel.",
    );
    return;
  }

  const config =
    PROFIL_CATEGORIES[category];

  const panel =
    await message.channel.send({
      embeds: [
        buildPanelEmbed(category),
      ],
    });

  for (
    const option of config.options
  ) {
    await panel.react(option.emoji);
  }

  panels[category] = panel.id;
  savePanels();
}

function detectPanelCategory(
  reaction: MessageReaction,
): ProfilCategory | null {
  // 1. Détection grâce au fichier sauvegardé.
  for (
    const category of Object.keys(
      panels,
    ) as ProfilCategory[]
  ) {
    if (
      panels[category] ===
      reaction.message.id
    ) {
      return category;
    }
  }

  // 2. Détection automatique grâce au titre de l’embed.
  // Cela permet aux panneaux de fonctionner après un redémarrage,
  // même si Render a supprimé le fichier JSON.
  const title =
    reaction.message.embeds[0]?.title;

  if (!title) return null;

  for (
    const category of Object.keys(
      PROFIL_CATEGORIES,
    ) as ProfilCategory[]
  ) {
    if (
      PROFIL_CATEGORIES[category]
        .title === title
    ) {
      panels[category] =
        reaction.message.id;

      savePanels();
      return category;
    }
  }

  return null;
}

async function resolveReaction(
  reaction: MessageReaction,
): Promise<MessageReaction> {
  if (reaction.partial) {
    await reaction.fetch();
  }

  if (
    reaction.message.partial
  ) {
    await reaction.message.fetch();
  }

  return reaction;
}

export async function handleProfilReactionAdd(
  reaction: MessageReaction,
  user: User,
): Promise<void> {
  if (user.bot) return;

  try {
    reaction =
      await resolveReaction(reaction);
  } catch {
    return;
  }

  const category =
    detectPanelCategory(reaction);

  if (
    !category ||
    !reaction.message.guild
  ) {
    return;
  }

  const emoji =
    reaction.emoji.name;

  if (!emoji) return;

  const config =
    PROFIL_CATEGORIES[category];

  const selectedOption =
    config.options.find(
      (option) =>
        option.emoji === emoji,
    );

  if (!selectedOption) {
    return;
  }

  const member =
    await reaction.message.guild.members
      .fetch(user.id)
      .catch(() => null);

  if (!member) return;

  const otherRoleIds =
    config.options
      .filter(
        (option) =>
          option.roleId !==
          selectedOption.roleId,
      )
      .map(
        (option) =>
          option.roleId,
      )
      .filter(
        (roleId) =>
          member.roles.cache.has(
            roleId,
          ),
      );

  if (
    otherRoleIds.length > 0
  ) {
    await member.roles
      .remove(
        otherRoleIds,
        `Changement du profil : ${category}`,
      )
      .catch(() => {});
  }

  if (
    !member.roles.cache.has(
      selectedOption.roleId,
    )
  ) {
    await member.roles
      .add(
        selectedOption.roleId,
        `Choix du profil : ${selectedOption.label}`,
      )
      .catch((error) => {
        console.error(
          `❌ Impossible d’ajouter le rôle ${selectedOption.label}:`,
          error,
        );
      });
  }

  for (
    const panelReaction of reaction
      .message.reactions.cache
      .values()
  ) {
    if (
      panelReaction.emoji.name &&
      panelReaction.emoji.name !==
        emoji &&
      config.options.some(
        (option) =>
          option.emoji ===
          panelReaction.emoji.name,
      )
    ) {
      await panelReaction.users
        .remove(user.id)
        .catch(() => {});
    }
  }
}

export async function handleProfilReactionRemove(
  reaction: MessageReaction,
  user: User,
): Promise<void> {
  if (user.bot) return;

  try {
    reaction =
      await resolveReaction(reaction);
  } catch {
    return;
  }

  const category =
    detectPanelCategory(reaction);

  if (
    !category ||
    !reaction.message.guild
  ) {
    return;
  }

  const emoji =
    reaction.emoji.name;

  if (!emoji) return;

  const option =
    PROFIL_CATEGORIES[
      category
    ].options.find(
      (item) =>
        item.emoji === emoji,
    );

  if (!option) return;

  const member =
    await reaction.message.guild.members
      .fetch(user.id)
      .catch(() => null);

  if (!member) return;

  if (
    member.roles.cache.has(
      option.roleId,
    )
  ) {
    await member.roles
      .remove(
        option.roleId,
        `Retrait du profil : ${option.label}`,
      )
      .catch(() => {});
  }
}

export const profilCommand: Command = {
  name: "profil",
  description:
    "Crée les panneaux de rôles du profil",
  usage:
    "*profil setup [couleurs|genre|age]",

  execute: async (
    message,
    args,
  ) => {
    if (
      !message.guild ||
      !message.member ||
      !isModerator(message.member)
    ) {
      await message.reply(
        "❌ Tu n’as pas la permission d’utiliser cette commande.",
      );
      return;
    }

    if (
      (args[0] ?? "").toLowerCase() !==
      "setup"
    ) {
      await message.reply(
        "❌ Utilisation : `*profil setup` ou `*profil setup couleurs|genre|age`.",
      );
      return;
    }

    const requestedCategory =
      normalizeCategory(args[1]);

    if (
      args[1] &&
      !requestedCategory
    ) {
      await message.reply(
        "❌ Catégorie inconnue. Choisis : `couleurs`, `genre` ou `age`.",
      );
      return;
    }

    if (requestedCategory) {
      await publishPanel(
        message,
        requestedCategory,
      );

      await message.reply(
        `✅ Panneau **${requestedCategory}** publié.`,
      );

      return;
    }

    await publishPanel(
      message,
      "couleurs",
    );

    await publishPanel(
      message,
      "genre",
    );

    await publishPanel(
      message,
      "age",
    );

    await message.reply(
      "✅ Les trois panneaux Profil ont été publiés.",
    );
  },
};
