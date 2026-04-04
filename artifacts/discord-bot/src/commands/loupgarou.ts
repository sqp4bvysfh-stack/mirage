import { EmbedBuilder, userMention } from "discord.js";
import type { User } from "discord.js";
import type { Command } from "../types.js";

const ROLES = {
  // ─── Villageois spéciaux ───────────────────────────────────────────────────
  VILLAGEOIS: {
    nom: "🧑‍🌾 Villageois",
    camp: "Village",
    couleur: 0x3498db,
    description:
      "Tu es un simple villageois. Tu n'as aucun pouvoir spécial, mais ta force réside dans ton observation et ta persuasion. Chaque jour, vote pour éliminer les suspects et débarrasser le village des Loups-Garous !",
  },
  VOYANTE: {
    nom: "🔮 La Voyante",
    camp: "Village",
    couleur: 0x9b59b6,
    description:
      "Chaque nuit, tu te réveilles et peux choisir un joueur pour découvrir son rôle. Tu es un pilier du village — utilise tes informations avec discernement pour ne pas te dévoiler trop tôt.",
  },
  CHASSEUR: {
    nom: "🏹 Chasseur",
    camp: "Village",
    couleur: 0xe67e22,
    description:
      "À ta mort (que ce soit par les loups ou par le village), tu peux choisir d'entraîner un autre joueur dans la tombe avec toi. Choisis bien ta dernière cible !",
  },
  SORCIERE: {
    nom: "🧪 La Sorcière",
    camp: "Village",
    couleur: 0x1abc9c,
    description:
      "Chaque nuit, tu te réveilles et peux utiliser l'une de tes deux potions :\n• **Potion de vie** : soigne la victime des Loups-Garous cette nuit.\n• **Potion de mort** : tue n'importe quel joueur de ton choix.\nChaque potion ne peut être utilisée qu'une seule fois dans la partie !",
  },
  GARDE: {
    nom: "🛡️ Le Garde",
    camp: "Village",
    couleur: 0x2ecc71,
    description:
      "Chaque nuit, tu choisis un joueur à protéger contre l'attaque des Loups-Garous. Tu peux te protéger toi-même, mais tu **ne peux pas protéger le même joueur deux nuits d'affilée**. Planifie bien ta protection !",
  },
  NECROMANCIEN: {
    nom: "💀 Le Nécromancien",
    camp: "Village",
    couleur: 0x7f8c8d,
    description:
      "La nuit, tu peux communiquer avec les joueurs éliminés pour obtenir des informations précieuses sur ce qu'ils ont vu ou entendu avant leur mort. Les morts parlent… si on sait les écouter.",
  },
  CUPIDON: {
    nom: "💘 Cupidon",
    camp: "Village",
    couleur: 0xff69b4,
    description:
      "La première nuit, tu désignes **deux joueurs** comme Amoureux (tu peux te désigner toi-même comme l'un des deux). Ces deux joueurs seront liés : si l'un meurt, l'autre mourra de chagrin. Choisis judicieusement !",
  },
  RENARD: {
    nom: "🦊 Le Renard",
    camp: "Village",
    couleur: 0xd35400,
    description:
      "La première nuit, tu choisis **3 joueurs** à renifler. Tu sauras si un Loup-Garou se trouve parmi eux.\n• **Si aucun loup** : tu perds ton pouvoir, mais tu as innocenté 3 joueurs.\n• **Si un loup est présent** : la nuit suivante, tu peux renifler un nouveau trio.\nUtilise tes soupçons pour cibler les bons joueurs !",
  },
  BERGER: {
    nom: "🐑 Le Berger",
    camp: "Village",
    couleur: 0x27ae60,
    description:
      "Tu possèdes **3 moutons**. Chaque nuit, tu peux envoyer un mouton chez n'importe quel joueur.\n• Si ce joueur est un **Loup-Garou**, ton mouton est dévoré — tu sais qu'un loup habite là.\n• Tu peux continuer à utiliser ta capacité avec tes moutons restants.\nGère tes ressources comme le Renard gère ses renifflements !",
  },
  ENFANT_SAUVAGE: {
    nom: "🧒 L'Enfant Sauvage",
    camp: "Village (variable)",
    couleur: 0x8e44ad,
    description:
      "La première nuit, tu choisis en secret un joueur parmi les participants comme **père**. Tant que ton père est en vie, tu joues du côté du village. **Si ton père meurt**, tu bascules du côté des Loups-Garous et rejoins leur clan !",
  },

  // ─── Les méchants ─────────────────────────────────────────────────────────
  LOUP_GAROU: {
    nom: "🐺 Loup-Garou",
    camp: "Loups",
    couleur: 0xe74c3c,
    description:
      "Chaque nuit, tu te réveilles avec tes alliés loups pour voter et dévorer un villageois. Le jour, fais tout pour ne pas être démasqué. Votre but : éliminer tous les villageois !",
  },
  LOUP_BAVARD: {
    nom: "💬 Loup-Bavard",
    camp: "Loups",
    couleur: 0xc0392b,
    description:
      "Tu es un Loup-Garou, mais avec une contrainte : chaque jour, tu reçois un **mot secret** que tu dois prononcer avant le coucher du soleil. Si tu échoues à le placer dans la conversation… tu meurs. Sois créatif et discret !",
  },
  LOUP_BLANC: {
    nom: "🤍 Loup Blanc",
    camp: "Solo",
    couleur: 0xecf0f1,
    description:
      "Tu te réveilles la nuit avec les autres Loups-Garous, qui te croient allié. Mais ton vrai objectif est d'être le **seul survivant**, t'opposant à tous les camps.\n**Une nuit sur deux**, tu peux dévorer un joueur de ton choix — y compris un autre Loup-Garou. Joue double jeu !",
  },
  LOUP_NOIR: {
    nom: "🖤 Loup-Noir",
    camp: "Loups",
    couleur: 0x2c3e50,
    description:
      "Tu te réveilles la nuit avec les autres Loups-Garous. **Une seule fois dans la partie**, tu peux infecter la victime choisie cette nuit-là : elle devient Loup-Garou. Le joueur infecté **conserve son rôle et ses pouvoirs**, tout en gagnant ceux d'un Loup-Garou !",
  },
};

type RoleKey = keyof typeof ROLES;

function getRoleDistribution(count: number): RoleKey[] {
  const roles: RoleKey[] = [];

  // Loups de base
  const nbLoups = count <= 5 ? 1 : count <= 9 ? 2 : count <= 13 ? 3 : 4;
  for (let i = 0; i < nbLoups; i++) roles.push("LOUP_GAROU");

  // Villageois spéciaux selon le nombre de joueurs
  roles.push("VOYANTE");
  if (count >= 5)  roles.push("SORCIERE");
  if (count >= 6)  roles.push("CHASSEUR");
  if (count >= 8)  roles.push("GARDE");
  if (count >= 10) roles.push("CUPIDON");
  if (count >= 12) roles.push("ENFANT_SAUVAGE");
  if (count >= 13) roles.push("RENARD");
  if (count >= 14) roles.push("NECROMANCIEN");
  if (count >= 15) roles.push("BERGER");

  // Loups spéciaux dans les grandes parties
  if (count >= 16) roles.push("LOUP_BLANC");
  if (count >= 18) roles.push("LOUP_BAVARD");
  if (count >= 20) roles.push("LOUP_NOIR");

  // Compléter avec des villageois
  while (roles.length < count) roles.push("VILLAGEOIS");

  return roles;
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const CAMP_COLORS: Record<string, string> = {
  "Village": "🟦",
  "Village (variable)": "🟪",
  "Loups": "🟥",
  "Solo": "⬜",
};

export const loupgarouCommand: Command = {
  name: "loupgarou",
  description: "Lance une partie de Loup-Garou et envoie les rôles en MP.",
  usage: "*loupgarou @j1 @j2 @j3 ...",

  async execute(message) {
    const players: User[] = message.mentions.users.filter((u) => !u.bot).map((u) => u);

    if (players.length < 3) {
      await message.reply(
        "❌ Il faut mentionner au moins **3 joueurs** !\nEx : `*loupgarou @j1 @j2 @j3`"
      );
      return;
    }

    if (players.length > 20) {
      await message.reply("❌ Maximum **20 joueurs** par partie.");
      return;
    }

    const roleKeys = shuffle(getRoleDistribution(players.length));
    const assignments: { user: User; roleKey: RoleKey }[] = players.map((user, i) => ({
      user,
      roleKey: roleKeys[i],
    }));

    // Envoyer les rôles en MP
    const results: string[] = [];
    for (const { user, roleKey } of assignments) {
      const role = ROLES[roleKey];
      const campEmoji = CAMP_COLORS[role.camp] ?? "⬜";

      const dmEmbed = new EmbedBuilder()
        .setColor(role.couleur)
        .setTitle(`Ton rôle : ${role.nom}`)
        .setDescription(role.description)
        .addFields(
          { name: "⚔️ Camp", value: `${campEmoji} **${role.camp}**`, inline: true },
          { name: "📍 Serveur", value: message.guild?.name ?? "Inconnu", inline: true }
        )
        .setFooter({ text: "Bonne chance… et méfie-toi des loups 🐺" })
        .setTimestamp();

      try {
        await user.send({ embeds: [dmEmbed] });
        results.push(`✅ ${userMention(user.id)} — ${role.nom}`);
      } catch {
        results.push(`⚠️ ${userMention(user.id)} — MP fermés`);
      }
    }

    // Résumé public (sans révéler les rôles)
    const nbLoups = assignments.filter((a) =>
      ["LOUP_GAROU", "LOUP_BAVARD", "LOUP_NOIR"].includes(a.roleKey)
    ).length;
    const hasLoupBlanc = assignments.some((a) => a.roleKey === "LOUP_BLANC");

    const summaryEmbed = new EmbedBuilder()
      .setColor(0x2c2f33)
      .setTitle("🌕 La nuit tombe sur le village…")
      .setDescription(
        `Partie de **Loup-Garou** lancée avec **${players.length} joueurs** !\n` +
          `Chaque joueur a reçu son rôle en message privé.\n\n` +
          `🐺 Il y a **${nbLoups} loup${nbLoups > 1 ? "s" : ""}** parmi vous…` +
          (hasLoupBlanc ? "\n⚠️ Un joueur joue pour lui-même…" : "")
      )
      .addFields({ name: "📬 Envois des rôles", value: results.join("\n") })
      .setFooter({ text: "Que le meilleur camp gagne !" })
      .setTimestamp();

    await message.reply({ embeds: [summaryEmbed] });
  },
};
