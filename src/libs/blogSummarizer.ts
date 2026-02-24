import { env } from '@config/env.js';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: env.GROQ_API_KEY });
export const summarizeBlogWithAI = async (title: string, content: string) => {
  const prompt = `
Summarize the following blog in 5–6 simple sentences.
Keep it clear, beginner-friendly, and professional.

Title: ${title}

Blog Content:
${content}
`;

  const response = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: prompt,
      },
    ],
    model: 'llama-3.3-70b-versatile',
  });
  return response.choices[0]?.message?.content;
};
