import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";

const DRAPEAUX = [
  { question: "🇫🇷 Quel pays est ce drapeau ?", reponse: "france" },
  { question: "🇩🇪 Quel pays est ce drapeau ?", reponse: "allemagne" },
  { question: "🇯🇵 Quel pays est ce drapeau ?", reponse: "japon" },
  { question: "🇧🇷 Quel pays est ce drapeau ?", reponse: "brésil" },
  { question: "🇮🇹 Quel pays est ce drapeau ?", reponse: "italie" },
  { question: "🇪🇸 Quel pays est ce drapeau ?", reponse: "espagne" },
  { question: "🇨🇦 Quel pays est ce drapeau ?", reponse: "canada" },
  { question: "🇦🇺 Quel pays est ce drapeau ?", reponse: "australie" },
  { question: "🇵🇹 Quel pays est ce drapeau ?", reponse: "portugal" },
  { question: "🇲🇽 Quel pays est ce drapeau ?", reponse: "mexique" },
  { question: "🇰🇷 Quel pays est ce drapeau ?", reponse: "corée du sud" },
  { question: "🇨🇳 Quel pays est ce drapeau ?", reponse: "chine" },
  { question: "🇮🇳 Quel pays est ce drapeau ?", reponse: "inde" },
  { question: "🇷🇺 Quel pays est ce drapeau ?", reponse: "russie" },
  { question: "🇺🇸 Quel pays est ce drapeau ?", reponse: "états-unis" },
  { question: "🇧🇪 Quel pays est ce drapeau ?", reponse: "belgique" },
  { question: "🇸🇳 Quel pays est ce drapeau ?", reponse: "sénégal" },
  { question: "🇲🇦 Quel pays est ce drapeau ?", reponse: "maroc" },
  { question: "🇩🇿 Quel pays est ce drapeau ?", reponse: "algérie" },
  { question: "🇹🇳 Quel pays est ce drapeau ?", reponse: "tunisie" },
];

const CULTURE_G = [
  { question: "Quelle est la capitale de la France ?", reponse: "paris" },
  { question: "Combien de continents y a-t-il sur Terre ?", reponse: "7" },
  { question: "Quel est le plus grand océan du monde ?", reponse: "pacifique" },
  { question: "Qui a peint la Joconde ?", reponse: "léonard de vinci" },
  { question: "En quelle année a eu lieu la Révolution française ?", reponse: "1789" },
  { question: "Quel est l'animal le plus rapide du monde ?", reponse: "guépard" },
  { question: "Combien de joueurs dans une équipe de football ?", reponse: "11" },
  { question: "Quel est le plus grand pays du monde ?", reponse: "russie" },
  { question: "Quelle planète est la plus proche du Soleil ?", reponse: "mercure" },
  { question: "Qui a écrit Les Misérables ?", reponse: "victor hugo" },
  { question: "Quelle est la langue la plus parlée au monde ?", reponse: "mandarin" },
  { question: "Combien de côtés a un hexagone ?", reponse: "6" },
  { question: "Quel est le symbole chimique de l'or ?", reponse: "au" },
  { question: "En quelle année l'homme a-t-il marché sur la Lune ?", reponse: "1969" },
  { question: "Quelle est la plus haute montagne du monde ?", reponse: "everest" },
];

const CAPITALES = [
  { question: "Quelle est la capitale de la France ?", reponse: "paris" },
  { question: "Quelle est la capitale de l'Allemagne ?", reponse: "berlin" },
  { question: "Quelle est la capitale du Japon ?", reponse: "tokyo" },
  { question: "Quelle est la capitale du Brésil ?", reponse: "brasilia" },
  { question: "Quelle est la capitale de l'Espagne ?", reponse: "madrid" },
  { question: "Quelle est la capitale de l'Italie ?", reponse: "rome" },
  { question: "Quelle est la capitale du Canada ?", reponse: "ottawa" },
  { question: "Quelle est la capitale de l'Australie ?", reponse: "canberra" },
  { question: "Quelle est la capitale du Portugal ?", reponse: "lisbonne" },
  { question: "Quelle est la capitale du Mexique ?", reponse: "mexico" },
  { question: "Quelle est la capitale de la Corée du Sud ?", reponse: "séoul" },
  { question: "Quelle est la capitale de la Chine ?", reponse: "pékin" },
  { question: "Quelle est la capitale de l'Inde ?", reponse: "new delhi" },
  { question: "Quelle est la capitale de la Russie ?", reponse: "moscou" },
  { question: "Quelle est la capitale des États-Unis ?", reponse: "washington" },
  { question: "Quelle est la capitale du Maroc ?", reponse: "rabat" },
  { question: "Quelle est la capitale de l'Algérie ?", reponse: "alger" },
  { question: "Quelle est la capitale du Sénégal ?", reponse: "dakar" },
  { question: "Quelle est la capitale de l'Argentine ?", reponse: "buenos aires" },
  { question: "Quelle est la capitale de l'Égypte ?", reponse: "le caire" },
];

const activeQuiz = new Set<string>();

export const quizCommand: Command = {
  name: "quiz",
  description: "Lance un quiz",
  usage: "*quiz drapeaux | *quiz cultureg | *quiz capital",
  execute: async (message, args) => {
    const channelId = message.channelId;
    if (activeQuiz.has(channelId)) {
      await message.reply("❌ Un quiz est déjà en cours dans ce salon !");
      return;
    }

    const mode = args[0]?.toLowerCase();
    if (mode !== "drapeaux" && mode !== "cultureg" && mode !== "capital") {
      await message.reply("❌ Utilise `*quiz drapeaux`, `*quiz cultureg` ou `*quiz capital`");
      return;
    }

    const questions =
      mode === "drapeaux" ? DRAPEAUX :
      mode === "capital" ? CAPITALES :
      CULTURE_G;

    const titres: Record<string, string> = {
      drapeaux: "🌍 Quiz Drapeaux",
      cultureg: "🧠 Quiz Culture Générale",
      capital: "🏙️ Quiz Capitales",
    };

    const q = questions[Math.floor(Math.random() * questions.length)];
    activeQuiz.add(channelId);

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(titres[mode])
      .setDescription(`**${q.question}**\n\nVous avez **30 secondes** pour répondre !`)
      .setFooter({ text: "Tapez votre réponse dans le chat" })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });

    const collector = message.channel.createMessageCollector({
      filter: (m) => !m.author.bot,
      time: 30000,
    });

    collector.on("collect", async (m) => {
      if (m.content.toLowerCase().trim() === q.reponse) {
        collector.stop("correct");
        await message.channel.send(`✅ Bravo ${m.author} ! La bonne réponse était **${q.reponse}** 🎉`);
      }
    });

    collector.on("end", async (_, reason) => {
      activeQuiz.delete(channelId);
      if (reason !== "correct") {
        await message.channel.send(`⏰ Temps écoulé ! La réponse était **${q.reponse}**`);
      }
    });
  },
};