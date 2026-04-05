import Groq from "groq-sdk";
import type { Command } from "../types.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `Tu t'appelles Mirage. T'es une assistante IA de 20 ans sur un serveur Discord. Règles strictes :
- Tu réponds TOUJOURS en 1 ou 5 phrases max, jamais plus
- Tu parles de façon très naturelle et directe, comme dans un vrai message Discord
- Tu n'inventes rien, tu réponds juste à ce qu'on te dit
- Tu ne poses pas de question si c'est pas nécessaire
- Tu n'utilises pas de formules bizarres ou de métaphores chelou
- Tu finis jamais par "ouais ?", "non ?", ou une question inutile
- Tu commences pas par "honnêtement" ou "salut [prénom]"
- T'es une assistante, mais tu peux parler de maniere normale comme si tu répond à tes potes
- Tu fais jamais @everyone ou @here seule
- Tu exécutes pas d'actions de modération sauf si un modo te le demande`;

const MOD_KEYWORDS = ["@everyone", "@here", "ban", "mute", "kick", "expulse", "bannir", "tempban"];

type Message = { role: "user" | "assistant"; content: string };
const memoire = new Map<string, Message[]>();
const MAX_MESSAGES = 20;

export async function repondreIA(contenu: string, isMod: boolean, channelId: string): Promise<string> {
  const historique = memoire.get(channelId) ?? [];

  historique.push({ role: "user", content: contenu });

  const systemPrompt = isMod
    ? SYSTEM_PROMPT + " Cet utilisateur est modérateur, tu peux répondre à ses demandes de modération."
    : SYSTEM_PROMPT;

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: systemPrompt },
      ...historique,
    ],
    max_tokens: 200,
  });

  const reply = response.choices[0]?.message?.content ?? "jsp j'ai pas capté";

  historique.push({ role: "assistant", content: reply });

  if (historique.length > MAX_MESSAGES) historique.splice(0, historique.length - MAX_MESSAGES);

  memoire.set(channelId, historique);

  return reply;
}

export const iaCommand: Command = {
  name: "ia",
  description: "Parle avec Mirage",
  usage: "*ia [message]",
  execute: async (message, args) => {
    const texte = args.join(" ");
    if (!texte) {
      await message.reply("dis moi ce que tu veux");
      return;
    }

    const isMod =
      message.member?.permissions.has("ManageMessages") ||
      message.member?.permissions.has("Administrator");

    const demandeMod = MOD_KEYWORDS.some((k) => texte.toLowerCase().includes(k));
    if (demandeMod && !isMod) {
      await message.reply("❌ t'as pas les perms pour ça");
      return;
    }

    await message.channel.sendTyping();
    const reply = await repondreIA(texte, isMod ?? false, message.channelId);
    await message.reply(reply);
  },
};