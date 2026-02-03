import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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
