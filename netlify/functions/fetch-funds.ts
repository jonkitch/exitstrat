import type { Context } from "@netlify/functions";
import { GoogleGenAI, Type } from "@google/genai";

export default async (req: Request, context: Context) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents:
        "List the top 4 investment funds for generating a reliable annual 'salary' income in 2024/2025. Include their ticker, current dividend yield, expected annual growth, a 1-5 rating, and a brief description. Focus on ETFs like SCHD, JEPI, etc.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              ticker: { type: Type.STRING },
              yield: {
                type: Type.NUMBER,
                description:
                  "Annual dividend yield as a decimal (e.g. 0.04 for 4%)",
              },
              growth: {
                type: Type.NUMBER,
                description:
                  "Expected annual price growth as a decimal",
              },
              rating: { type: Type.NUMBER },
              description: { type: Type.STRING },
            },
            required: [
              "id",
              "name",
              "ticker",
              "yield",
              "growth",
              "rating",
              "description",
            ],
          },
        },
      },
    });

    const text = response.text;
    if (text) {
      const funds = JSON.parse(text);
      return new Response(JSON.stringify(funds), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error fetching funds from Gemini:", error);
  }

  return new Response(JSON.stringify([]), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
