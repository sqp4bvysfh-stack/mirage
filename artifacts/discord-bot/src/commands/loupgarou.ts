import { EmbedBuilder, userMention } from "discord.js";
import type { User } from "discord.js";
import type { Command } from "../types.js";

const ROLES = {
  LOUP_GAROU: {
    nom: "🐺 Loup-Garou",
    description:
      "Chaque nuit, tu te réveilles avec tes alliés loups pour dévorer un villageois. Ton but : éliminer tous les villageois sans te faire découvrir !",
    couleur: 0xe74c3c as number,
    emoji: "🐺",
  },
  VOYANTE: {
    nom: "🔮 Voyante",
    description:
      "Chaque nuit, tu peux regarder la carte d'un joueur de ton choix. Utilise ce pouvoir pour guider les villageois, sans te dévoiler trop vite !",
    couleur: 0x9b59b6 as number,
    emoji: "🔮",
  },
  SORCIERE: {
    nom: "🧪 Sorcière",
    description:
      "Tu possèdes deux potions : une de vie (pour sauver la victime des loups) et une de mort (pour éliminer n'importe quel joueur). Chaque potion ne peut être utilisée qu'une seule fois !",
    couleur: 0x1abc9c as number,
    emoji: "🧪",
  },
  CHASSEUR: {
    nom: "🏹 Chasseur",
    description:
      "Si tu es éliminé (par les loups ou par le village), tu peux emporter un joueur avec toi dans ta chute. Choisis bien ta cible !",
    couleur: 0xe67e22 as number,
    emoji: "🏹",
  },
  CUPIDON: {
    nom: "💘 Cupidon",
    description:
      "La première nuit, tu désignes deux joueurs qui tombent amoureux. Ces amants doivent survivre ensemble — si l'un meurt, l'autre mourra de chagrin !",
    couleur: 0xff69b4 as number,
    emoji: "💘",
  },
  VILLAGEOIS: {
    nom: "👨‍🌾 Villageois",
    description:
      "Tu n'as pas de pouvoir spécial, mais ta force réside dans ton analyse et ta persuasion. Chaque jour, vote pour éliminer les suspects et sauver le village !",
    couleur: 0x3498db as number,
    emoji: "👨‍🌾",
  },
};

function getRoleDistribution(count: number): string[] {
  const roles: string[] = [];
  const nbLoups = count <= 6 ? 1 : count <= 9 ? 2 : count <= 12 ? 3 : count <= 16 ? 4 : 5;

  for (let i = 0; i < nbLoups; i++) roles.push("LOUP_GAROU");
  roles.push("VOYANTE");
  if (count >= 5) roles.push("SORCIERE");
  if (count >= 7) roles.push("CHASSEUR");
  if (count >= 10) roles.push("CUPIDON");
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

export const loupgarouCommand: Command = {
  name: "loupgarou",
  description: "Lance une partie de Loup-Garou et envoie les rôles en MP.",
  usage: "*loupgarou @j1 @j2 @j3 ...",

  async execute(message) {
    // Récupérer les membres mentionnés (sans les bots)
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
    const assignments: { user: User; roleKey: string }[] = players.map((user, i) => ({
      user,
      roleKey: roleKeys[i],
    }));

    // Envoyer les rôles en MP
    const results: string[] = [];
    for (const { user, roleKey } of assignments) {
      const role = ROLES[roleKey as keyof typeof ROLES];
      const dmEmbed = new EmbedBuilder()
        .setColor(role.couleur)
        .setTitle(`${role.emoji} Ton rôle : ${role.nom}`)
        .setDescription(role.description)
        .addFields({
          name: "📍 Serveur",
          value: message.guild?.name ?? "Inconnu",
          inline: true,
        })
        .setFooter({ text: "Bonne chance… et méfie-toi des loups 🐺" })
        .setTimestamp();

      try {
        await user.send({ embeds: [dmEmbed] });
        results.push(`✅ ${userMention(user.id)} — MP envoyé`);
      } catch {
        results.push(`⚠️ ${userMention(user.id)} — MP impossible (MP fermés ?)`);
      }
    }

    const nbLoups = assignments.filter((a) => a.roleKey === "LOUP_GAROU").length;

    const summaryEmbed = new EmbedBuilder()
      .setColor(0x2c2f33)
      .setTitle("🌕 La nuit tombe sur le village…")
      .setDescription(
        `Partie de **Loup-Garou** lancée avec **${players.length} joueurs** !\n` +
          `Chaque joueur a reçu son rôle en message privé.\n\n` +
          `🐺 Il y a **${nbLoups} loup${nbLoups > 1 ? "s" : ""}** parmi vous…`
      )
      .addFields({ name: "📬 Envois", value: results.join("\n") })
      .setFooter({ text: "Que le meilleur camp gagne !" })
      .setTimestamp();

    await message.reply({ embeds: [summaryEmbed] });
  },
};
