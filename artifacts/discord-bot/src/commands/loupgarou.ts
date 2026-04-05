import { EmbedBuilder, userMention } from "discord.js";
import type { Message, User } from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";

const ROLES = {
  VILLAGEOIS:    { nom: "🧑‍🌾 Villageois",      camp: "Village",           couleur: 0x3498db, description: "Tu es un simple villageois. Tu n'as aucun pouvoir spécial, mais ta force réside dans ton observation et ta persuasion. Chaque jour, vote pour éliminer les suspects et débarrasser le village des Loups-Garous !" },
  VOYANTE:       { nom: "🔮 La Voyante",         camp: "Village",           couleur: 0x9b59b6, description: "Chaque nuit, tu te réveilles et peux choisir un joueur pour découvrir son rôle. Tu es un pilier du village — utilise tes informations avec discernement pour ne pas te dévoiler trop tôt." },
  CHASSEUR:      { nom: "🏹 Chasseur",           camp: "Village",           couleur: 0xe67e22, description: "À ta mort (que ce soit par les loups ou par le village), tu peux choisir d'entraîner un autre joueur dans la tombe avec toi. Choisis bien ta dernière cible !" },
  SORCIERE:      { nom: "🧪 La Sorcière",        camp: "Village",           couleur: 0x1abc9c, description: "Chaque nuit, tu te réveilles et peux utiliser l'une de tes deux potions :\n• **Potion de vie** : soigne la victime des Loups-Garous cette nuit.\n• **Potion de mort** : tue n'importe quel joueur de ton choix.\nChaque potion ne peut être utilisée qu'une seule fois dans la partie !" },
  GARDE:         { nom: "🛡️ Le Garde",           camp: "Village",           couleur: 0x2ecc71, description: "Chaque nuit, tu choisis un joueur à protéger contre l'attaque des Loups-Garous. Tu peux te protéger toi-même, mais tu **ne peux pas protéger le même joueur deux nuits d'affilée**." },
  NECROMANCIEN:  { nom: "💀 Le Nécromancien",    camp: "Village",           couleur: 0x7f8c8d, description: "La nuit, tu peux communiquer avec les joueurs éliminés pour obtenir des informations précieuses sur ce qu'ils ont vu ou entendu avant leur mort." },
  CUPIDON:       { nom: "💘 Cupidon",            camp: "Village",           couleur: 0xff69b4, description: "La première nuit, tu désignes **deux joueurs** comme Amoureux. Ces deux joueurs seront liés : si l'un meurt, l'autre mourra de chagrin." },
  RENARD:        { nom: "🦊 Le Renard",          camp: "Village",           couleur: 0xd35400, description: "La première nuit, tu choisis **3 joueurs** à renifler. Tu sauras si un Loup-Garou se trouve parmi eux." },
  BERGER:        { nom: "🐑 Le Berger",          camp: "Village",           couleur: 0x27ae60, description: "Tu possèdes **3 moutons**. Chaque nuit, tu peux envoyer un mouton chez n'importe quel joueur. Si ce joueur est un Loup-Garou, ton mouton est dévoré." },
  ENFANT_SAUVAGE:{ nom: "🧒 L'Enfant Sauvage",  camp: "Village (variable)", couleur: 0x8e44ad, description: "La première nuit, tu choisis en secret un joueur comme **père**. Tant que ton père est en vie, tu joues du côté du village. **Si ton père meurt**, tu bascules du côté des Loups-Garous !" },
  LOUP_GAROU:   { nom: "🐺 Loup-Garou",         camp: "Loups",             couleur: 0xe74c3c, description: "Chaque nuit, tu te réveilles avec tes alliés loups pour voter et dévorer un villageois. Le jour, fais tout pour ne pas être démasqué." },
  LOUP_BAVARD:  { nom: "💬 Loup-Bavard",         camp: "Loups",             couleur: 0xc0392b, description: "Tu es un Loup-Garou, mais chaque jour tu reçois un **mot secret** que tu dois prononcer avant le coucher du soleil. Si tu échoues… tu meurs." },
  LOUP_BLANC:   { nom: "🤍 Loup Blanc",          camp: "Solo",              couleur: 0xecf0f1, description: "Tu te réveilles la nuit avec les autres Loups-Garous, qui te croient allié. Mais ton vrai objectif est d'être le **seul survivant**.\n**Une nuit sur deux**, tu peux dévorer un joueur — y compris un autre Loup-Garou." },
  LOUP_NOIR:    { nom: "🖤 Loup-Noir",           camp: "Loups",             couleur: 0x2c3e50, description: "Tu te réveilles la nuit avec les autres Loups-Garous. **Une seule fois dans la partie**, tu peux infecter la victime : elle devient Loup-Garou tout en conservant son rôle et ses pouvoirs !" },
};

type RoleKey = keyof typeof ROLES;

const CAMP_COLORS: Record<string, string> = {
  "Village": "🟦", "Village (variable)": "🟪", "Loups": "🟥", "Solo": "⬜",
};

function getRoleDistribution(count: number): RoleKey[] {
  const roles: RoleKey[] = [];
  const nbLoups = count <= 5 ? 1 : count <= 9 ? 2 : count <= 13 ? 3 : 4;
  for (let i = 0; i < nbLoups; i++) roles.push("LOUP_GAROU");
  roles.push("VOYANTE");
  if (count >= 5)  roles.push("SORCIERE");
  if (count >= 6)  roles.push("CHASSEUR");
  if (count >= 8)  roles.push("GARDE");
  if (count >= 10) roles.push("CUPIDON");
  if (count >= 12) roles.push("ENFANT_SAUVAGE");
  if (count >= 13) roles.push("RENARD");
  if (count >= 14) roles.push("NECROMANCIEN");
  if (count >= 15) roles.push("BERGER");
  if (count >= 16) roles.push("LOUP_BLANC");
  if (count >= 18) roles.push("LOUP_BAVARD");
  if (count >= 20) roles.push("LOUP_NOIR");
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

async function lancerPartie(message: Message, players: User[]) {
  const roleKeys = shuffle(getRoleDistribution(players.length));
  const assignments = players.map((user, i) => ({ user, roleKey: roleKeys[i] as RoleKey }));

  const results = await Promise.all(
    assignments.map(async ({ user, roleKey }) => {
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
        return { mention: `✅ ${userMention(user.id)} — rôle envoyé`, user, roleKey };
      } catch {
        return { mention: `⚠️ ${userMention(user.id)} — MP fermés`, user, roleKey };
      }
    })
  );

  try {
    const recapLines = results.map(({ user, roleKey }) => {
      const role = ROLES[roleKey];
      return `${CAMP_COLORS[role.camp] ?? "⬜"} **${user.username}** → ${role.nom}`;
    });
    await message.author.send(
      `📋 **Récap des rôles — ${message.guild?.name}**\n\n${recapLines.join("\n")}\n\n🤫 Ne partage pas cette liste !`
    );
  } catch { /* MP fermés du lanceur */ }

  const nbLoups = assignments.filter(a => ["LOUP_GAROU", "LOUP_BAVARD", "LOUP_NOIR"].includes(a.roleKey)).length;
  const hasLoupBlanc = assignments.some(a => a.roleKey === "LOUP_BLANC");

  const summaryEmbed = new EmbedBuilder()
    .setColor(0x2c2f33)
    .setTitle("🌕 La nuit tombe sur le village…")
    .setDescription(
      `Partie lancée avec **${players.length} joueurs** !\n` +
      `Chaque joueur a reçu son rôle en MP.\n\n` +
      `🐺 Il y a **${nbLoups} loup${nbLoups > 1 ? "s" : ""}** parmi vous…` +
      (hasLoupBlanc ? "\n⚠️ Un joueur joue pour lui-même…" : "")
    )
    .addFields({ name: "📬 Envois des rôles", value: results.map(r => r.mention).join("\n") })
    .setFooter({ text: "Que le meilleur camp gagne !" })
    .setTimestamp();

  await message.channel.send({ embeds: [summaryEmbed] });
}

// Empêche plusieurs lobbies simultanés par salon
const lobbiesActifs = new Set<string>();

function makeLobbyEmbed(host: User, players: Map<string, User>, tempsRestant: string) {
  const liste = players.size > 0
    ? [...players.values()].map(u => `• ${userMention(u.id)}`).join("\n")
    : "*Personne pour l'instant…*";

  return new EmbedBuilder()
    .setColor(0x8b0000)
    .setTitle("🐺 Lobby Loup-Garou")
    .setDescription(
      `**${host.username}** ouvre une partie !\n\n` +
      `Clique sur ✅ pour rejoindre la partie.\nQuand tout le monde est là, ${userMention(host.id)} *(maître du jeu)* clique sur 🚀 pour lancer.\n\n` +
      `> Min. **3 joueurs** — Max. **20 joueurs**`
    )
    .addFields(
      { name: `👥 Joueurs (${players.size})`, value: liste },
    )
    .setFooter({ text: `⏱️ Lobby actif encore ${tempsRestant} • ✅ rejoindre • 🚀 lancer (host uniquement)` })
    .setTimestamp();
}

export const loupgarouCommand: Command = {
  name: "loupgarou",
  description: "Ouvre un lobby Loup-Garou. Les joueurs rejoignent en cliquant sur ✅.",
  usage: "*loupgarou",

  async execute(message) {
    // Réservé aux admins/modérateurs
    if (!message.member || !isModerator(message.member)) {
      await message.reply("❌ Seuls les modérateurs peuvent lancer une partie de Loup-Garou.");
      return;
    }

    // Mode immédiat si des mentions sont fournies (rétrocompatibilité)
    const mentions = message.mentions.users.filter(u => !u.bot);
    if (mentions.size >= 3) {
      await lancerPartie(message, [...mentions.values()]);
      return;
    }
    if (mentions.size > 0 && mentions.size < 3) {
      await message.reply("❌ Il faut au moins **3 joueurs** ! Lance `*loupgarou` sans mentions pour ouvrir un lobby.");
      return;
    }

    if (lobbiesActifs.has(message.channelId)) {
      await message.reply("❌ Un lobby est déjà en cours dans ce salon !");
      return;
    }

    lobbiesActifs.add(message.channelId);
    const DUREE_MS = 5 * 60 * 1000; // 5 minutes
    const host = message.author;

    // Le host n'est PAS auto-ajouté — il doit cliquer ✅ comme tout le monde s'il veut jouer
    const players = new Map<string, User>();

    const lobbyMsg = await message.channel.send({
      embeds: [makeLobbyEmbed(host, players, "5 min")],
    });

    await lobbyMsg.react("✅");
    await lobbyMsg.react("🚀");

    const collector = lobbyMsg.createReactionCollector({
      filter: (reaction, user) => !user.bot && ["✅", "🚀"].includes(reaction.emoji.name ?? ""),
      time: DUREE_MS,
      dispose: true,
    });

    const lancer = async () => {
      collector.stop("launched");
      lobbiesActifs.delete(message.channelId);

      if (players.size < 3) {
        await message.channel.send("❌ Pas assez de joueurs pour lancer (minimum 3).");
        await lobbyMsg.edit({
          embeds: [makeLobbyEmbed(host, players, "expiré").setColor(0x555555).setTitle("🐺 Lobby annulé")],
        });
        return;
      }

      if (players.size > 20) {
        await message.channel.send("❌ Trop de joueurs (maximum 20).");
        return;
      }

      await lobbyMsg.edit({
        embeds: [
          new EmbedBuilder()
            .setColor(0x8b0000)
            .setTitle("🌕 Lancement en cours…")
            .setDescription(`**${players.size} joueurs** vont recevoir leur rôle en MP !`)
            .setTimestamp(),
        ],
      });

      await lancerPartie(message, [...players.values()]);
    };

    // Minuterie pour mettre à jour le footer toutes les minutes
    const intervals = [4, 3, 2, 1].map(min =>
      setTimeout(() => {
        if (collector.ended) return;
        lobbyMsg.edit({ embeds: [makeLobbyEmbed(host, players, `${min} min`)] }).catch(() => {});
      }, (5 - min) * 60 * 1000)
    );

    collector.on("collect", async (reaction, user) => {
      if (reaction.emoji.name === "✅") {
        // Le host est maître du jeu, il ne peut pas jouer
        if (user.id === host.id) {
          await reaction.users.remove(user.id).catch(() => {});
          return;
        }
        if (players.size >= 20) {
          await reaction.users.remove(user.id).catch(() => {});
          return;
        }
        players.set(user.id, user);
        await lobbyMsg.edit({ embeds: [makeLobbyEmbed(host, players, "…")] }).catch(() => {});
      }
      if (reaction.emoji.name === "🚀") {
        if (user.id !== host.id) {
          await reaction.users.remove(user.id).catch(() => {});
          return;
        }
        intervals.forEach(clearTimeout);
        await lancer();
      }
    });

    collector.on("remove", async (reaction, user) => {
      if (reaction.emoji.name === "✅" && user.id !== host.id) {
        players.delete(user.id);
        await lobbyMsg.edit({ embeds: [makeLobbyEmbed(host, players, "…")] }).catch(() => {});
      }
    });

    collector.on("end", async (_, reason) => {
      intervals.forEach(clearTimeout);
      lobbiesActifs.delete(message.channelId);
      if (reason === "time") {
        await lobbyMsg.edit({
          embeds: [
            new EmbedBuilder()
              .setColor(0x555555)
              .setTitle("🐺 Lobby expiré")
              .setDescription("Le lobby a expiré sans être lancé. Refais `*loupgarou` pour en ouvrir un nouveau.")
              .setTimestamp(),
          ],
        }).catch(() => {});
      }
    });
  },
};
