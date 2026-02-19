// lib/supabase.ts
// Cloudflare Pages Edge Runtime 호환 Supabase 클라이언트

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 빌드 타임에는 예외 발생하지 않도록 처리
export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
    })
    : null;

// Google OAuth 로그인
export async function signInWithGoogle() {
    if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.');
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
        },
    });
    if (error) throw error;
    return data;
}

// GitHub OAuth 로그인
export async function signInWithGitHub() {
    if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.');
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
        },
    });
    if (error) throw error;
    return data;
}

// 로그아웃
export async function signOut() {
    if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

// 현재 유저 가져오기
export async function getCurrentUser() {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}
