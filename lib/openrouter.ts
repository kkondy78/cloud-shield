import { createClient } from '@supabase/supabase-js';

export type ModelConfig = {
    id: string;
    name: string;
    desc: string;
};

export const MODEL_PLAN: ModelConfig[] = [
    { id: "deepseek/deepseek-r1:free", name: "1순위: 딥시크 R1 (무료)", desc: "최고 지능 + 공짜" },
    { id: "deepseek/deepseek-r1-distill-llama-70b:free", name: "2순위: 딥시크 가성비 (무료)", desc: "빠름 + 공짜" },
    { id: "deepseek/deepseek-r1-distill-llama-70b", name: "3순위: 딥시크 가성비 (유료)", desc: "비상용 (매우 저렴)" }
];

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SITE_URL = 'https://cloud-shield.pages.dev';
const SITE_NAME = 'Cloud Shield APB';

export async function generateWithFallback(
    prompt: string,
    systemPrompt?: string,
    onProgress?: (log: string) => void
): Promise<string> {
    if (!OPENROUTER_API_KEY) {
        throw new Error('OpenRouter API Key is missing');
    }

    let finalError;

    for (const model of MODEL_PLAN) {
        try {
            if (onProgress) {
                onProgress(`🤖 모델 연결 시도: ${model.name} (${model.id})...`);
            }

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "HTTP-Referer": SITE_URL,
                    "X-Title": SITE_NAME,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: model.id,
                    messages: [
                        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.7,
                })
            });

            if (!response.ok) {
                // 429 (Rate Limit)이나 503 (Service Unavailable)인 경우 다음 모델 시도
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;

            if (!content) {
                throw new Error('No content received from API');
            }

            if (onProgress) {
                onProgress(`✅ 생성 성공! (${model.name})`);
            }

            return content;

        } catch (err: any) {
            const isRetryable = err.message.includes('429') || err.message.includes('503') || err.message.includes('free model');

            if (onProgress) {
                onProgress(`⚠️ ${model.name} 실패: ${err.message.slice(0, 100)}...`);
            }

            finalError = err;

            // 재시도 가능한 에러가 아니면 루프 중단하고 던질 수도 있지만,
            // OpenRouter의 경우 모델별 상태가 다르므로 일단 다 돌아보는게 낫다.
            continue;
        }
    }

    throw new Error(`All models failed. Last error: ${finalError?.message}`);
}
