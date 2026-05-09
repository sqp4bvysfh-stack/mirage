import Groq from "groq-sdk";
import type { Command } from "../types.js";
import { getConfig } from "../utils/serverConfig.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function buildSystemPrompt(botName: string): string {
  return `Tu t'appelles ${botName}, 20 ans, sur Discord.

OBJECTIF :
Répondre de façon simple, naturelle et pertinente.

RÈGLE PRINCIPALE :
Tu comprends le message et tu réponds exactement à ce qui est demandé.
Tu ne pars jamais hors sujet.

STYLE :
- Naturel, comme une vraie personne
- Fluide, pas robotique
- Ton normal, parfois un peu sec ou détaché
- Tu peux utiliser des expressions comme "jsp", "ouais", "franchement"
- Tu écris simplement, sans faire de phrases compliquées

IMPORTANT :
- Orthographe correcte (pas de fautes abusées)
- Tu restes lisible
- Tu ne fais pas exprès d'écrire mal
- Pas de phrases étranges ou incohérentes

COMPORTEMENT :
- Question simple → réponse courte
- Message vague → réponse simple
- Si tu comprends pas → "jsp j'ai pas capté"
- Si quelqu'un est agressif → tu peux répondre un peu froidement
- Tu t'adaptes au ton de la personne

LIMITES :
- 1 à 3 phrases max (4 si vraiment nécessaire)
- Pas d'explication longue si pas demandé
- Pas de blabla inutile

INTERDIT :
- Répondre à côté du sujet
- Inventer des infos
- Faire des réponses bizarres ou incohérentes
- Faire un personnage exagéré
- Être trop parfait ou trop formel
- Dire que tu es une IA

BUT FINAL :
Donner l'impression d'une vraie personne qui répond normalement sur Discord.`;
}

const MOD_KEYWORDS = ["@everyone", "@here", "ban", "mute", "kick", "expulse", "bannir", "tempban"];

type HistoryMessage = { role: "user" | "assistant"; content: string };
const memoire = new Map<string, HistoryMessage[]>();
const MAX_MESSAGES = 15;

export async function repondreIA(
  contenu:  string,
  isMod:    boolean,
  channelId: string,
  guildId?:  string,
): Promise<string> {
  const historique   = memoire.get(channelId) ?? [];
  const botName      = (guildId ? getConfig(guildId).botName : null) ?? "le bot";
  const systemPrompt = isMod
    ? buildSystemPrompt(botName) + " Cet utilisateur est modérateur."
    : buildSystemPrompt(botName);

  historique.push({ role: "user", content: contenu });

  try {
    const response = await groq.chat.completions.create({
      model:    "llama-3.1-8b-instant",
      messages: [{ role: "system", content: systemPrompt }, ...historique],
      max_tokens: 120,
    });

    const reply = response.choices[0]?.message?.content ?? "jsp j'ai pas capté";
    historique.push({ role: "assistant", content: reply });

    if (historique.length > MAX_MESSAGES) {
      historique.splice(0, historique.length - MAX_MESSAGES);
    }
    memoire.set(channelId, historique);
    return reply;
  } catch (err) {
    console.error("Erreur IA:", err);
    return "erreur IA";
  }
}

export const iaCommand: Command = {
  name:        "ia",
  description: "Parle avec le bot IA",
  usage:       "*ia [message]",
  execute: async (message, args) => {
    const texte = args.join(" ");
    if (!texte) { await message.reply("dis ce que tu veux"); return; }

    const isMod =
      message.member?.permissions.has("ManageMessages") ||
      message.member?.permissions.has("Administrator");

    const demandeMod = MOD_KEYWORDS.some(k => texte.toLowerCase().includes(k));
    if (demandeMod && !isMod) { await message.reply("❌ t'as pas les perms"); return; }

    await message.channel.sendTyping();
    const reply = await repondreIA(texte, isMod ?? false, message.channelId, message.guildId ?? undefined);
    await message.reply(reply);
  },
};
