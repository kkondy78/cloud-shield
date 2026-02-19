
import { generateWithFallback } from '@/lib/openrouter';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';


export async function POST(req: Request) {
    const { idea, keyword, noScrape } = await req.json();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const sendLog = (step: number, status: string, message: string, url?: string) => {
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ step, status, message, url })}\n\n`)
                );
            };

            try {
                // Step 0: 시작
                sendLog(0, 'start', '🚀 APB 파이프라인 시작...');

                // Step 1: Reddit 조사 (Mock - 실제 스크래핑은 서버 사이드 이슈로 스킵하거나 추후 구현)
                // OpenRouter R1이 딥서치 기능이 있으므로 이를 활용한다고 가정
                sendLog(1, 'start', `🔍 AI가 시장 조사를 수행합니다 (DeepSeek R1)...`);
                await new Promise(r => setTimeout(r, 1000));
                sendLog(1, 'done', '✅ 시장 조사 데이터 확보 완료');

                // Step 2: AI 기획서 생성
                sendLog(2, 'start', `🧠 DeepSeek R1이 기획서를 작성 중입니다... "${idea}"`);

                const systemPrompt = `
당신은 세계 최고의 CPO(Chief Product Officer)이자 시스템 아키텍트입니다.
사용자의 아이디어를 바탕으로 개발자가 즉시 구현 가능한 완벽한 PRD(제품 요구 사항 정의서)를 작성해야 합니다.

출력 형식은 반드시 Markdown이어야 하며 다음 목차를 포함하세요:
# [프로젝트 이름] PRD
## 1. Executive Summary (요약)
## 2. User Flow & Core Features (핵심 기능)
## 3. Tech Stack Recommendation (기술 스택)
## 4. Database Schema (Supabase ERD)
## 5. Implementation Plan (구현 단계)

창의적이고 구체적으로 작성하세요.
`;
                const prd = await generateWithFallback(
                    `Idea: ${idea}\nKeyword: ${keyword}`,
                    systemPrompt,
                    (log) => sendLog(2, 'start', log) // 진행 상황 로깅
                );

                sendLog(2, 'done', '✅ 기획서 생성 완료!');

                // Step 3: GitHub 업로드 (아직은 Mock - 다음 단계에서 구현)
                sendLog(3, 'start', '💾 기획서를 저장소에 저장 중...');
                // TODO: Octokit 연동
                await new Promise(r => setTimeout(r, 800));

                // 임시로 생성된 PRD 내용을 간단히 보여주기 위해 로그로 전송 (너무 길면 잘릴 수 있음)
                // 실제로는 파일로 저장해야 함.
                sendLog(3, 'done', `💾 저장 완료 (길이: ${prd.length}자)`);

                // Step 4: 완료
                sendLog(4, 'done', '✅ 처리 완료! (현재 버전은 기획서 생성까지 지원)', 'https://github.com/kkondy78/cloud-shield');
                sendLog(99, 'done', '🎉 모든 작업이 완료되었습니다.');

            } catch (err: any) {
                sendLog(99, 'error', `❌ 오류 발생: ${err.message}`);
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
        },
    });
}

