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
  { question: "🇳🇱 Quel pays est ce drapeau ?", reponse: "pays-bas" },
  { question: "🇸🇪 Quel pays est ce drapeau ?", reponse: "suède" },
  { question: "🇳🇴 Quel pays est ce drapeau ?", reponse: "norvège" },
  { question: "🇩🇰 Quel pays est ce drapeau ?", reponse: "danemark" },
  { question: "🇫🇮 Quel pays est ce drapeau ?", reponse: "finlande" },
  { question: "🇨🇭 Quel pays est ce drapeau ?", reponse: "suisse" },
  { question: "🇦🇹 Quel pays est ce drapeau ?", reponse: "autriche" },
  { question: "🇵🇱 Quel pays est ce drapeau ?", reponse: "pologne" },
  { question: "🇬🇷 Quel pays est ce drapeau ?", reponse: "grèce" },
  { question: "🇹🇷 Quel pays est ce drapeau ?", reponse: "turquie" },
  { question: "🇸🇦 Quel pays est ce drapeau ?", reponse: "arabie saoudite" },
  { question: "🇦🇪 Quel pays est ce drapeau ?", reponse: "émirats arabes unis" },
  { question: "🇮🇱 Quel pays est ce drapeau ?", reponse: "israël" },
  { question: "🇮🇷 Quel pays est ce drapeau ?", reponse: "iran" },
  { question: "🇵🇰 Quel pays est ce drapeau ?", reponse: "pakistan" },
  { question: "🇧🇩 Quel pays est ce drapeau ?", reponse: "bangladesh" },
  { question: "🇹🇭 Quel pays est ce drapeau ?", reponse: "thaïlande" },
  { question: "🇻🇳 Quel pays est ce drapeau ?", reponse: "vietnam" },
  { question: "🇮🇩 Quel pays est ce drapeau ?", reponse: "indonésie" },
  { question: "🇵🇭 Quel pays est ce drapeau ?", reponse: "philippines" },
  { question: "🇲🇾 Quel pays est ce drapeau ?", reponse: "malaisie" },
  { question: "🇸🇬 Quel pays est ce drapeau ?", reponse: "singapour" },
  { question: "🇳🇬 Quel pays est ce drapeau ?", reponse: "nigeria" },
  { question: "🇬🇭 Quel pays est ce drapeau ?", reponse: "ghana" },
  { question: "🇨🇮 Quel pays est ce drapeau ?", reponse: "côte d'ivoire" },
  { question: "🇨🇲 Quel pays est ce drapeau ?", reponse: "cameroun" },
  { question: "🇪🇹 Quel pays est ce drapeau ?", reponse: "éthiopie" },
  { question: "🇰🇪 Quel pays est ce drapeau ?", reponse: "kenya" },
  { question: "🇿🇦 Quel pays est ce drapeau ?", reponse: "afrique du sud" },
  { question: "🇪🇬 Quel pays est ce drapeau ?", reponse: "égypte" },
  { question: "🇱🇾 Quel pays est ce drapeau ?", reponse: "libye" },
  { question: "🇦🇷 Quel pays est ce drapeau ?", reponse: "argentine" },
  { question: "🇨🇱 Quel pays est ce drapeau ?", reponse: "chili" },
  { question: "🇨🇴 Quel pays est ce drapeau ?", reponse: "colombie" },
  { question: "🇵🇪 Quel pays est ce drapeau ?", reponse: "pérou" },
  { question: "🇻🇪 Quel pays est ce drapeau ?", reponse: "venezuela" },
  { question: "🇨🇺 Quel pays est ce drapeau ?", reponse: "cuba" },
  { question: "🇯🇲 Quel pays est ce drapeau ?", reponse: "jamaïque" },
  { question: "🇬🇧 Quel pays est ce drapeau ?", reponse: "royaume-uni" },
  { question: "🇮🇪 Quel pays est ce drapeau ?", reponse: "irlande" },
  { question: "🇺🇦 Quel pays est ce drapeau ?", reponse: "ukraine" },
  { question: "🇷🇴 Quel pays est ce drapeau ?", reponse: "roumanie" },
  { question: "🇭🇺 Quel pays est ce drapeau ?", reponse: "hongrie" },
  { question: "🇨🇿 Quel pays est ce drapeau ?", reponse: "tchéquie" },
  { question: "🇸🇰 Quel pays est ce drapeau ?", reponse: "slovaquie" },
  { question: "🇭🇷 Quel pays est ce drapeau ?", reponse: "croatie" },
  { question: "🇷🇸 Quel pays est ce drapeau ?", reponse: "serbie" },
  { question: "🇧🇬 Quel pays est ce drapeau ?", reponse: "bulgarie" },
  { question: "🇦🇱 Quel pays est ce drapeau ?", reponse: "albanie" },
  { question: "🇲🇰 Quel pays est ce drapeau ?", reponse: "macédoine du nord" },
  { question: "🇳🇿 Quel pays est ce drapeau ?", reponse: "nouvelle-zélande" },
  { question: "🇿🇼 Quel pays est ce drapeau ?", reponse: "zimbabwe" },
  { question: "🇲🇱 Quel pays est ce drapeau ?", reponse: "mali" },
  { question: "🇧🇫 Quel pays est ce drapeau ?", reponse: "burkina faso" },
  { question: "🇲🇷 Quel pays est ce drapeau ?", reponse: "mauritanie" },
  { question: "🇰🇵 Quel pays est ce drapeau ?", reponse: "corée du nord" },
  { question: "🇲🇳 Quel pays est ce drapeau ?", reponse: "mongolie" },
  { question: "🇰🇿 Quel pays est ce drapeau ?", reponse: "kazakhstan" },
  { question: "🇮🇶 Quel pays est ce drapeau ?", reponse: "irak" },
  { question: "🇸🇾 Quel pays est ce drapeau ?", reponse: "syrie" },
  { question: "🇯🇴 Quel pays est ce drapeau ?", reponse: "jordanie" },
  { question: "🇱🇧 Quel pays est ce drapeau ?", reponse: "liban" },
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
  { question: "Quelle est la capitale des Pays-Bas ?", reponse: "amsterdam" },
  { question: "Quelle est la capitale de la Suède ?", reponse: "stockholm" },
  { question: "Quelle est la capitale de la Norvège ?", reponse: "oslo" },
  { question: "Quelle est la capitale du Danemark ?", reponse: "copenhague" },
  { question: "Quelle est la capitale de la Finlande ?", reponse: "helsinki" },
  { question: "Quelle est la capitale de la Suisse ?", reponse: "berne" },
  { question: "Quelle est la capitale de l'Autriche ?", reponse: "vienne" },
  { question: "Quelle est la capitale de la Pologne ?", reponse: "varsovie" },
  { question: "Quelle est la capitale de la Grèce ?", reponse: "athènes" },
  { question: "Quelle est la capitale de la Turquie ?", reponse: "ankara" },
  { question: "Quelle est la capitale de l'Arabie Saoudite ?", reponse: "riyad" },
  { question: "Quelle est la capitale des Émirats Arabes Unis ?", reponse: "abou dabi" },
  { question: "Quelle est la capitale de l'Iran ?", reponse: "téhéran" },
  { question: "Quelle est la capitale du Pakistan ?", reponse: "islamabad" },
  { question: "Quelle est la capitale du Bangladesh ?", reponse: "dacca" },
  { question: "Quelle est la capitale de la Thaïlande ?", reponse: "bangkok" },
  { question: "Quelle est la capitale du Vietnam ?", reponse: "hanoï" },
  { question: "Quelle est la capitale de l'Indonésie ?", reponse: "jakarta" },
  { question: "Quelle est la capitale des Philippines ?", reponse: "manille" },
  { question: "Quelle est la capitale de la Malaisie ?", reponse: "kuala lumpur" },
  { question: "Quelle est la capitale de Singapour ?", reponse: "singapour" },
  { question: "Quelle est la capitale du Nigeria ?", reponse: "abuja" },
  { question: "Quelle est la capitale du Ghana ?", reponse: "accra" },
  { question: "Quelle est la capitale du Cameroun ?", reponse: "yaoundé" },
  { question: "Quelle est la capitale de l'Éthiopie ?", reponse: "addis-abeba" },
  { question: "Quelle est la capitale du Kenya ?", reponse: "nairobi" },
  { question: "Quelle est la capitale de l'Afrique du Sud ?", reponse: "pretoria" },
  { question: "Quelle est la capitale de la Colombie ?", reponse: "bogotá" },
  { question: "Quelle est la capitale du Pérou ?", reponse: "lima" },
  { question: "Quelle est la capitale du Chili ?", reponse: "santiago" },
  { question: "Quelle est la capitale du Venezuela ?", reponse: "caracas" },
  { question: "Quelle est la capitale de Cuba ?", reponse: "la havane" },
  { question: "Quelle est la capitale du Royaume-Uni ?", reponse: "londres" },
  { question: "Quelle est la capitale de l'Ukraine ?", reponse: "kiev" },
  { question: "Quelle est la capitale de la Roumanie ?", reponse: "bucarest" },
  { question: "Quelle est la capitale de la Hongrie ?", reponse: "budapest" },
  { question: "Quelle est la capitale de la Croatie ?", reponse: "zagreb" },
  { question: "Quelle est la capitale de la Serbie ?", reponse: "belgrade" },
  { question: "Quelle est la capitale de la Bulgarie ?", reponse: "sofia" },
  { question: "Quelle est la capitale de la Nouvelle-Zélande ?", reponse: "wellington" },
  { question: "Quelle est la capitale du Kazakhstan ?", reponse: "astana" },
  { question: "Quelle est la capitale de l'Irak ?", reponse: "bagdad" },
  { question: "Quelle est la capitale de la Syrie ?", reponse: "damas" },
  { question: "Quelle est la capitale de la Jordanie ?", reponse: "amman" },
  { question: "Quelle est la capitale du Liban ?", reponse: "beyrouth" },
  { question: "Quelle est la capitale de la Côte d'Ivoire ?", reponse: "yamoussoukro" },
  { question: "Quelle est la capitale de la Belgique ?", reponse: "bruxelles" },
  { question: "Quelle est la capitale de l'Irlande ?", reponse: "dublin" },
  { question: "Quelle est la capitale de la Mongolie ?", reponse: "oulan-bator" },
  { question: "Quelle est la capitale de la Corée du Nord ?", reponse: "pyongyang" },
  { question: "Quelle est la capitale de la Tunisie ?", reponse: "tunis" },
  { question: "Quelle est la capitale de la Libye ?", reponse: "tripoli" },
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