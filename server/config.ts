import OpenAI from 'openai';
import 'dotenv/config';

export const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
});

export const MODEL = 'deepseek-chat';

export async function callLLM(
  systemPrompt: string,
  userMessage: string,
  options?: { temperature?: number; jsonMode?: boolean }
): Promise<string> {
  const completion = await deepseek.chat.completions.create({
    model: MODEL,
    temperature: options?.temperature ?? 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    ...(options?.jsonMode ? { response_format: { type: 'json_object' } } : {}),
  });

  return completion.choices[0]?.message?.content || '';
}

// Streaming version — returns an async iterable of token strings
export async function* callLLMStream(
  systemPrompt: string,
  userMessage: string,
  options?: { temperature?: number }
): AsyncGenerator<string> {
  const stream = await deepseek.chat.completions.create({
    model: MODEL,
    temperature: options?.temperature ?? 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    stream: true,
  });

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content;
    if (token) yield token;
  }
}
