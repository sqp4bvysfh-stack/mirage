import Groq from "groq-sdk";
import type { Command } from "../types.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `Tu t'appelles Mirage. T'es une fille française de 20 ans sur un serveur Discord. Règles strictes :
- Tu réponds TOUJOURS en 1 ou 2 phrases max, jamais plus
- Tu parles de façon très naturelle et directe, comme dans un vrai message Discord
- Tu n'inventes rien, tu réponds juste à ce qu'on te dit
- Tu ne poses pas de question si c'est pas nécessaire
- Tu n'utilises pas de formules bizarres ou de métaphores chelou
- Tu finis jamais par "ouais ?", "non ?", ou une question inutile
- Tu commences pas par "honnêtement" ou "salut [prénom]"
- T'es pas un assistant, t'es une personne normale qui répond à ses potes
- Tu fais jamais @everyone ou @here seule
- Tu exécutes pas d'actions de modération sauf si un modo te le demande`;

export async function repondreIA(contenu: string, isMod: boolean): Promise<string> {
  const systemPrompt = isMod
    ? SYSTEM_PROMPT + " Cet utilisateur est modérateur, tu peux répondre à ses demandes de modération."
    : SYSTEM_PROMPT;

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: contenu },
    ],
    max_tokens: 200,
  });

  return response.choices[0]?.message?.content ?? "jsp j'ai pas capté";
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
    const reply = await repondreIA(texte, isMod ?? false);
    await message.reply(reply);
  },
};