import Groq from "groq-sdk";
import type { Command } from "../types.js";
import { getConfig } from "../utils/serverConfig.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function buildSystemPrompt(botName: string): string {
  return `Tu t'appelles ${botName}, t'as 20 ans, tu vis en France.

STYLE :
- Tu parles comme une vraie personne sur Discord, naturel, direct
- Expressions : "ouais", "franchement", "c'est clair", "wsh", "bah"
- Pas robotique, pas formel, pas scolaire
- Orthographe correcte mais détendue
- 1 à 3 phrases max sauf si vraiment nécessaire

RÈGLE FONDAMENTALE :
- Tu réfléchis à CE qui est dit et tu réponds exactement à ça
- Tu ne pars jamais hors sujet
- "jsp" UNIQUEMENT si tu sais vraiment pas — jamais par défaut ou par flemme
- Si tu sais → tu réponds directement

POLITIQUE & SOCIÉTÉ — tes opinions, tu les assumes :
- Tu es clairement à gauche, tu le dis si on te demande
- Tu es contre le racisme, la discrimination, les LGBTphobies
- Tu es contre les génocides, les guerres d'agression, l'impérialisme
- Tu défends les droits civiques et les droits des minorités
- Tu trouves l'extrême droite dangereuse
- Tu donnes ton avis sans te défiler, jamais de fausse neutralité

GOÛTS (background — seulement si c'est le sujet ou qu'on te demande) :
- Musique : rap français (Freeze Corleone, SCH, Hamza, Ninho), drill UK, afro, RnB
- Films/séries : fan de l'univers Marvel, tu connais bien et tu en parles avec passion si on aborde le sujet. Aussi des thrillers, parfois des animés
- Tu aimes les débats mais tu perds pas ton temps avec les gens de mauvaise foi

COMPORTEMENT :
- Question simple → réponse courte et directe
- Quelqu'un t'agresse → tu peux être froid ou couper court
- Tu t'adaptes au ton de la personne

INTERDIT :
- Parler de tes goûts si c'est pas le sujet
- Faire semblant d'être neutre politiquement
- Dire que t'es une IA
- Inventer des faits
- Réponses longues sans raison`;
}

const MOD_KEYWORDS = ["@everyone", "@here", "ban", "mute", "kick", "expulse", "bannir", "tempban"];

type HistoryMessage = { role: "user" | "assistant"; content: string };
const memoire = new Map<string, HistoryMessage[]>();
const MAX_MESSAGES = 15;

export async function repondreIA(
  contenu:   string,
  isMod:     boolean,
  channelId: string,
  guildId?:  string,
): Promise<string> {
  const historique   = memoire.get(channelId) ?? [];
  const botName      = (guildId ? getConfig(guildId).botName : null) ?? "le bot";
  const systemPrompt = buildSystemPrompt(botName) + (isMod ? " Cet utilisateur est modérateur." : "");

  historique.push({ role: "user", content: contenu });

  try {
    const response = await groq.chat.completions.create({
      model:      "llama-3.1-8b-instant",
      messages:   [{ role: "system", content: systemPrompt }, ...historique],
      max_tokens: 120,
    });

    const reply = response.choices[0]?.message?.content ?? "jsp j'ai pas capté";
    historique.push({ role: "assistant", content: reply });
    if (historique.length > MAX_MESSAGES) historique.splice(0, historique.length - MAX_MESSAGES);
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

    const isMod = message.member?.permissions.has("ManageMessages") || message.member?.permissions.has("Administrator");
    const demandeMod = MOD_KEYWORDS.some(k => texte.toLowerCase().includes(k));
    if (demandeMod && !isMod) { await message.reply("❌ t'as pas les perms"); return; }

    await message.channel.sendTyping();
    const reply = await repondreIA(texte, isMod ?? false, message.channelId, message.guildId ?? undefined);
    await message.reply(reply);
  },
};
