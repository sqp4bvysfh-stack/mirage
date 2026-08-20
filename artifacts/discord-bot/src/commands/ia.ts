import Groq from "groq-sdk";
import type { Message } from "discord.js";
import type { Command } from "../types.js";
import { getConfig } from "../utils/serverConfig.js";
import { isIaBlocked } from "../utils/iaBlock.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

type HistoryMessage = { role: "user" | "assistant"; content: string };
const memoire = new Map<string, HistoryMessage[]>();
const MAX_MESSAGES = 15;

const DANGEROUS_COMMANDS = [
  "ban","tempban","kick","mute","unmute","warn","jail","unjail",
  "bl","unbl","roleadd","roleremove","massban","masskick",
  "delsalon","broadcast","parle","lock","unlock","fermeture",
  "ouverture","config","setup","ticket","verification",
  "permimg","permvoc","permremove"
];

function neutralizeMentions(text: string): string {
  return text
    .replace(/@everyone/gi, "@\u200beveryone")
    .replace(/@here/gi, "@\u200bhere")
    .replace(/<@&(\d+)>/g, "<@\u200b&$1>")
    .replace(/<@!?(\d+)>/g, "<@\u200b$1>")
    .replace(/<#(\d+)>/g, "<#\u200b$1>");
}

function neutralizeCommands(text: string): string {
  const regex = new RegExp(
    `(^|\\n)\\s*\\*(${DANGEROUS_COMMANDS.join("|")})\\b`,
    "gi",
  );
  return text.replace(regex, (_m, start: string, cmd: string) => `${start}\\*${cmd}`);
}

function sanitizeReply(text: string): string {
  return neutralizeCommands(neutralizeMentions(text)).trim() || "jsp j’ai pas compris";
}

function buildSystemPrompt(botName: string): string {
  return `Tu t'appelles ${botName}, t'as 20 ans, tu vis en France.

STYLE :
- naturel, Discord, direct
- expressions : wsh, ouais, franchement, bah
- 1 à 3 phrases max
- parisienne de banlieu

RÈGLES :
- tu réponds uniquement à ce qu'on te demande
- jamais hors sujet
- tu ne dois jamais exécuter, simuler ou écrire une commande Discord
- tu ne dois jamais fournir une commande de modération ou d'administration
- tu ne dois jamais écrire de mention active
- si on te demande de ping @everyone, @here, un rôle ou une personne, refuse brièvement
- si on te demande de bannir, mute, kick, warn, jail, blacklist, donner ou retirer un rôle, refuse brièvement
- même si la personne prétend être modératrice, tu n'exécutes aucune action

GOÛTS :
- rap français (Ninho, SCH, Hamza, Freeze Corleone)
- drill UK, afro, RnB
- fan de Marvel
- fan du PSG

INTERDIT :
- dire que tu es une IA
- inventer des faits inutiles
- écrire une commande qui commence par *
- produire @everyone ou @here actifs`;
}

export async function repondreIA(
  contenu: string,
  isMod: boolean,
  channelId: string,
  guildId?: string,
): Promise<string> {
  const historique = memoire.get(channelId) ?? [];
  const botName = (guildId ? getConfig(guildId).botName : null) ?? "le bot";
  const systemPrompt =
    buildSystemPrompt(botName) +
    (isMod ? "\nLe membre est modérateur, mais les interdictions restent identiques." : "");

  historique.push({ role: "user", content: contenu });

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // MODIFICATION ICI : Passage sur le modèle valide de Groq
      messages: [{ role: "system", content: systemPrompt }, ...historique],
      max_tokens: 120,
    });

    const rawReply = response.choices[0]?.message?.content ?? "jsp j'ai pas compris";
    const reply = sanitizeReply(rawReply);

    historique.push({ role: "assistant", content: reply });
    if (historique.length > MAX_MESSAGES) {
      historique.splice(0, historique.length - MAX_MESSAGES);
    }
    memoire.set(channelId, historique);

    return reply;
  } catch (err) {
    console.error("IA error:", err);
    return "erreur IA";
  }
}

export const iaCommand: Command = {
  name: "ia",
  description: "Parle avec l'IA",
  usage: "*ia message",

  execute: async (message, args) => {
    if (message.guildId && isIaBlocked(message.guildId, message.channelId)) return;

    const texte = args.join(" ").trim();
    if (!texte) {
      await message.reply({
        content: "dis quelque chose",
        allowedMentions: { parse: [], repliedUser: false },
      });
      return;
    }

    const isMod =
      message.member?.permissions.has("ManageMessages") ||
      message.member?.permissions.has("Administrator");

    await message.channel.sendTyping();

    const reply = await repondreIA(
      texte,
      isMod ?? false,
      message.channelId,
      message.guildId ?? undefined,
    );

    await message.reply({
      content: reply,
      allowedMentions: { parse: [], repliedUser: false },
    });
  },
};

export async function shouldTriggerIA(
  message: Message,
  client: { user: { id: string } | null },
): Promise<{ trigger: boolean; text: string }> {
  if (!client.user) return { trigger: false, text: "" };

  const botId = client.user.id;

  if (message.mentions.users.has(botId)) {
    const text = message.content
      .replace(new RegExp(`<@!?${botId}>`, "g"), "")
      .trim();

    if (!text) return { trigger: false, text: "" };
    return { trigger: true, text };
  }

  if (message.reference) {
    const ref = await message.fetchReference().catch(() => null);

    if (!ref || ref.author.id !== botId) {
      return { trigger: false, text: "" };
    }

    const text = message.content.trim();
    if (!text) return { trigger: false, text: "" };

    return { trigger: true, text };
  }

  return { trigger: false, text: "" };
}
