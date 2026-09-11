import { GoogleGenAI } from '@google/genai';
import { RAG_CONFIG } from './config';

/**
 * Gemini API client — server-side only.
 * Never import this file in client components.
 */

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not defined. Add it to your .env.local file.'
    );
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Generate a response using Gemini (non-streaming) with fallback support.
 */
export async function generateAnswer(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const ai = getGeminiClient();
  const candidateModels = [
    RAG_CONFIG.generation.model,
    ...(RAG_CONFIG.generation.fallbackModels || []),
  ];

  let lastError: unknown;
  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: userMessage,
        config: {
          systemInstruction: systemPrompt,
          maxOutputTokens: RAG_CONFIG.generation.maxOutputTokens,
          temperature: RAG_CONFIG.generation.temperature,
        },
      });

      return response.text ?? '';
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[Gemini] Model ${model} failed: ${message}. Trying fallback...`);
    }
  }

  throw lastError;
}

/**
 * Generate a streaming response using Gemini with fallback support.
 */
export async function* generateAnswerStream(
  systemPrompt: string,
  userMessage: string
): AsyncGenerator<string> {
  const ai = getGeminiClient();
  const candidateModels = [
    RAG_CONFIG.generation.model,
    ...(RAG_CONFIG.generation.fallbackModels || []),
  ];

  let lastError: unknown;
  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContentStream({
        model,
        contents: userMessage,
        config: {
          systemInstruction: systemPrompt,
          maxOutputTokens: RAG_CONFIG.generation.maxOutputTokens,
          temperature: RAG_CONFIG.generation.temperature,
        },
      });

      for await (const chunk of response) {
        const text = chunk.text;
        if (text) {
          yield text;
        }
      }
      return;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[Gemini Stream] Model ${model} failed: ${message}. Trying fallback...`);
    }
  }

  throw lastError;
}
