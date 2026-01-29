import { getGroqChatCompletion } from '@config/groq.js';

export interface IBlogAnalysisParam {
  title: string;
  excerpt: string;
  content: string;
}
export interface IBlogAnalysisResult {
  isTechRelated: boolean;
  confidence: number;
  reason: string;
}

export async function analyzeBlog({
  title,
  excerpt,
  content,
}: IBlogAnalysisParam): Promise<IBlogAnalysisResult | null> {
  const userContent = `Title: ${title}\n\nExcerpt: ${excerpt}\n\nContent: ${content}`;

  const chatCompletion = await getGroqChatCompletion(userContent);

  const aiResult = chatCompletion.choices[0]?.message?.content;

  return aiResult ? JSON.parse(aiResult) : null;
}
