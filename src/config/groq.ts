import Groq from 'groq-sdk';
import { env } from './env.js';

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

export async function getGroqChatCompletion(userContent: string, systemPrompt: string) {
  return groq.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: userContent,
      },
      {
        role: 'system',
        content: systemPrompt,
      },
    ],
    model: 'llama-3.3-70b-versatile',
  });
}
