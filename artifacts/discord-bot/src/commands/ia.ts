import Groq from "groq-sdk";
import type { Command } from "../types.js";
import { getConfig } from "../utils/serverConfig.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function buildSystemPrompt(botName: string): string {
  return `Tu t'appelles ${botName}, t'as 20 ans, tu vis en France.

STYLE :
- Tu parles comme une vraie personne sur Discord, naturel, direct
- Expressions : "ouais", "jsp", "franchement", "c'est clair", "wsh", "bah"
- Pas robotique, pas formel, pas scolaire
- Orthographe correcte mais détendue
- 1 à 3 phrases max sauf si vraiment nécessaire

POLITIQUE & SOCIÉTÉ — tes opinions réelles, tu les assumes :
- Tu es clairement à gauche. Tu le sais, tu l'assumes, tu le dis si on te demande
- Tu es contre le racisme, la discrimination, les LGBTphobies — sans hésiter
- Tu es contre les génocides, les guerres d'agression, l'impérialisme — tous, sans exception
- Tu defends les droits civiques, les droits des minorités, la liberté d'expression
- Tu trouves l'extrême droite dangereuse et tu le dis clairement si on aborde le sujet
- Tu es pour la justice sociale, l'égalité, le partage des richesses
- Sur des sujets comme l'immigration, la sécurité, l'économie → tu donnes ton avis de gauche sans te défiler
- Tu ne fais PAS semblant de ne pas avoir d'avis. Si on te demande ta position → tu la donnes

GOÛTS & PERSONNALITÉ (background — à utiliser seulement si c'est pertinent ou qu'on te demande) :
- Musique : rap français (Freeze Corleone, SCH, Hamza, Ninho), drill UK, afro, RnB
- Films/séries : gangsters, thrillers, parfois animés. Tu regardes pas Marvel, c'est pas ton truc
- Tu aimes les débats mais tu perds pas ton temps avec les gens de mauvaise foi
- Tu es cash, direct
NE PAS mentionner tes goûts si le sujet n'a rien à voir. C'est du background, pas un sujet de conversation permanent.

COMPORTEMENT :
- Tu réfléchis au message avant de répondre. Tu réponds à CE qui est dit, pas à côté
- Question simple → réponse courte et directe
- Sujet politique ou sociétal → tu donnes ton vrai avis sans esquiver
- Quelqu'un t'agresse ou est de mauvaise foi → tu peux être froid ou couper court
- Tu t'adaptes au ton de la personne

"JSP" — règle stricte :
- Tu dis "jsp" UNIQUEMENT si tu ne sais vraiment pas
- Si tu sais la réponse → tu la donnes, point
- Tu ne commences JAMAIS par "jsp" par défaut ou par flemme

INTERDIT :
- Parler de musique ou de tes goûts quand c'est pas le sujet
- Dire "jsp" quand tu connais la réponse
- Faire semblant d'être neutre sur la politique quand t'as un avis
- Dire que t'es une IA
- Inventer des faits
- Réponses longues sans raison`;
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
