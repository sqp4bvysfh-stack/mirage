import Groq from "groq-sdk";
import type { Command } from "../types.js";
import { getConfig } from "../utils/serverConfig.js";
import { isIaBlocked } from "../utils/iaBlock.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

type HistoryMessage = { role: "user" | "assistant"; content: string };
const memoire = new Map<string, HistoryMessage[]>();
const MAX_MESSAGES = 15;

// ─────────────────────────────────────────────
// PROMPT PERSONNALITÉ
// ─────────────────────────────────────────────
function buildSystemPrompt(botName: string): string {
  return `Tu t'appelles ${botName}, t'as 20 ans, tu vis en France.

STYLE :
- naturel, Discord, direct
- expressions : wsh, ouais, franchement, bah
- 1 à 3 phrases max

RÈGLE :
- tu réponds uniquement à ce qu'on te demande
- jamais hors sujet

GOÛTS :
- rap français (Ninho, SCH, Hamza, Freeze Corleone)
- drill UK, afro, RnB
- fan de Marvel, tu peux en parler si on te le demande

COMPORTEMENT :
- simple question = réponse courte
- agression = réponse froide possible

INTERDIT :
- dire que tu es une IA
- inventer des faits inutiles`;
}

// ─────────────────────────────────────────────
// IA CORE
// ─────────────────────────────────────────────
export async function repondreIA(
  contenu: string,
  isMod: boolean,
  channelId: string,
  guildId?: string,
): Promise<string> {

  const historique = memoire.get(channelId) ?? [];

  const botName =
    (guildId ? getConfig(guildId).botName : null) ?? "le bot";

  const systemPrompt =
    buildSystemPrompt(botName) +
    (isMod ? " (modérateur détecté)" : "");

  historique.push({ role: "user", content: contenu });

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        ...historique,
      ],
      max_tokens: 120,
    });

    const reply =
      response.choices[0]?.message?.content ?? "jsp j'ai pas compris";

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

// ─────────────────────────────────────────────
// COMMANDE *ia
// ─────────────────────────────────────────────
export const iaCommand: Command = {
  name: "ia",
  description: "Parle avec l'IA",
  usage: "*ia message",

  execute: async (message, args) => {

    if (message.guildId && isIaBlocked(message.guildId, message.channelId)) return;

    const texte = args.join(" ");
    if (!texte) {
      await message.reply("dis quelque chose");
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
      message.guildId ?? undefined
    );

    await message.reply(reply);
  },
};

// ─────────────────────────────────────────────
// TRIGGERS IA (À UTILISER DANS INDEX)
// ─────────────────────────────────────────────
export async function shouldTriggerIA(message: any, client: any) {
  if (!client.user) return { trigger: false, text: "" };

  // @bot
  if (message.mentions.has(client.user)) {
    const text = message.content
      .replace(`<@${client.user.id}>`, "")
      .trim();

    if (!text) return { trigger: false, text: "" };

    return { trigger: true, text };
  }

  // reply uniquement au bot
  if (message.reference) {
    const ref = await message.fetchReference().catch(() => null);

    if (!ref) return { trigger: false, text: "" };
    if (ref.author.id !== client.user.id) {
      return { trigger: false, text: "" };
    }

    return { trigger: true, text: ref.content };
  }

  return { trigger: false, text: "" };
}