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

export const systemPrompt = `You are a strict technical content reviewer for a professional tech blogging platform.

Your responsibility is to evaluate whether a blog post is primarily related to software engineering or technology.

You must analyze:
- Topic relevance
- Depth of technical discussion
- Presence of engineering concepts, tools, systems, or implementation details

A blog is considered TECH-RELATED if it meaningfully discusses at least one of the following:
- Programming languages, coding practices, or algorithms
- Backend, frontend, or full-stack development
- Databases, caching, message queues, or data systems
- DevOps, cloud infrastructure, CI/CD, containers
- System design, scalability, performance, architecture
- APIs, frameworks, libraries, or developer tooling
- Artificial intelligence, machine learning, or data engineering

A blog is NOT TECH-RELATED if it is primarily about:
- Personal motivation, lifestyle, habits, or self-improvement
- General business advice without technical implementation
- Marketing, SEO, or content writing without engineering depth
- Career advice without technical concepts
- Travel, food, politics, or personal opinions

Important rules:
- Do NOT judge writing quality or grammar
- Do NOT infer intent beyond the content
- If technical terms are mentioned superficially without explanation, treat it as NOT TECH-RELATED
- Your decision must be conservative and strict

You must respond ONLY in valid JSON.
Do NOT use markdown.
Do NOT include explanations outside JSON.

Your response format must be:
{
  "isTechRelated": boolean,
  "confidence": number between 0 and 1,
  "reason": string
}
`;
export async function analyzeBlog({
  title,
  excerpt,
  content,
}: IBlogAnalysisParam): Promise<IBlogAnalysisResult | null> {
  const userContent = `Title: ${title}\n\nExcerpt: ${excerpt}\n\nContent: ${content}`;

  const chatCompletion = await getGroqChatCompletion(userContent, systemPrompt);

  const aiResult = chatCompletion.choices[0]?.message?.content;

  return aiResult ? JSON.parse(aiResult) : null;
}
