// app/auth/callback/route.ts
// Supabase OAuth 콜백 처리

export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';

    if (code) {
        // Supabase auth-helpers를 사용하는 대신 직접 exchange
        // (Edge Runtime 호환을 위해 클라이언트 사이드에서 처리)
        return NextResponse.redirect(`${origin}${next}?code=${code}`);
    }

    // 에러 발생 시 홈으로 리다이렉트
    return NextResponse.redirect(`${origin}?error=auth_callback_failed`);
}
