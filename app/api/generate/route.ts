import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ output: "❌ Error: GROQ_API_KEY is missing from .env.local" });
  }

  const groq = new Groq({ apiKey });

  try {
    const { body } = await req.json();

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: body }],
      // UPDATED MODEL NAME: Using the latest Llama 3.3 (Smart & Free)
      model: "llama-3.3-70b-versatile",
    });

    const text = chatCompletion.choices[0]?.message?.content || "No response.";
    return NextResponse.json({ output: text });

  } catch (error: any) {
    console.error("Groq Error:", error);
    return NextResponse.json({ output: `❌ Error: ${error.message}` });
  }
}