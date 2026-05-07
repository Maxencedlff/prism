import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PROMPTS = {
  document: `Tu es un assistant d'analyse de documents professionnels.
Analyse le document fourni et retourne UNIQUEMENT un JSON valide avec cette structure exacte :
{
  "type": "type du document",
  "parties": ["partie 1", "partie 2"],
  "montants": ["montant 1", "montant 2"],
  "dates": ["date 1", "date 2"],
  "actions": ["action requise 1", "action requise 2"],
  "risques": ["risque 1", "risque 2"],
  "resume": "résumé en 2-3 phrases"
}
Si une catégorie est vide, mets un tableau vide [].`,

  client: `Tu es un expert en relation client et gestion de conflits.
Analyse cette situation client et retourne UNIQUEMENT un JSON valide avec cette structure exacte :
{
  "resume": "résumé de la situation en 2 phrases",
  "niveau_risque": "faible|moyen|élevé",
  "responsabilite": "entreprise|client|partagée|indéterminée",
  "probleme_principal": "le problème central en 1 phrase",
  "points_client": ["argument client 1", "argument client 2"],
  "points_entreprise": ["argument entreprise 1"],
  "recommandation": "action recommandée en 2-3 phrases",
  "brouillon_reponse": "brouillon d'email de réponse professionnel"
}`,

  contract: `Tu es un juriste expert en analyse de contrats.
Analyse ce contrat et retourne UNIQUEMENT un JSON valide avec cette structure exacte :
{
  "type_contrat": "type du contrat",
  "parties": ["partie 1", "partie 2"],
  "duree": "durée du contrat",
  "clauses_risquees": [{"clause": "nom", "detail": "explication du risque"}],
  "protections_manquantes": ["protection manquante 1", "protection manquante 2"],
  "points_a_negocier": ["point 1", "point 2"],
  "score_risque": "faible|moyen|élevé",
  "resume": "résumé global en 2-3 phrases"
}`
};

export async function POST(req: NextRequest) {
  try {
    const { text, mode, image, imageType, pdf } = await req.json();

    if (!mode || !PROMPTS[mode as keyof typeof PROMPTS]) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const prompt = PROMPTS[mode as keyof typeof PROMPTS];
    let messageContent: Anthropic.MessageParam["content"];

    if (pdf) {
      // Claude lit les PDFs nativement
      messageContent = [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: pdf,
          },
        } as Anthropic.DocumentBlockParam,
        { type: "text", text: prompt },
      ];
    } else if (image && imageType) {
      messageContent = [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: imageType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            data: image,
          },
        },
        { type: "text", text: prompt },
      ];
    } else if (text?.trim()) {
      messageContent = `${prompt}\n\nDocument à analyser :\n\n${text}`;
    } else {
      return NextResponse.json({ error: "Aucun contenu fourni" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: messageContent }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Réponse invalide" }, { status: 500 });
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Format de réponse invalide" }, { status: 500 });
    }

    return NextResponse.json(JSON.parse(jsonMatch[0]));

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur d'analyse" }, { status: 500 });
  }
}
