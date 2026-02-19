'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { signInWithGoogle, signInWithGitHub, supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Session } from '@supabase/supabase-js';

export function AuthProviderButtons() {
    const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
    const [isLoadingGitHub, setIsLoadingGitHub] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const router = useRouter();

    useEffect(() => {
        // 초기 세션 확인
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        // 인증 상태 변경 리스너
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleGitHub = async () => {
        setIsLoadingGitHub(true);
        setError(null);
        try {
            await signInWithGitHub();
        } catch (err: any) {
            setError(err.message || 'GitHub 로그인 실패');
            setIsLoadingGitHub(false);
        }
    };

    const handleGoogle = async () => {
        setIsLoadingGoogle(true);
        setError(null);
        try {
            await signInWithGoogle();
        } catch (err: any) {
            setError(err.message || 'Google 로그인 실패');
            setIsLoadingGoogle(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setSession(null);
    };

    if (session) {
        return (
            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="text-center space-y-2">
                    <p className="text-slate-300 text-sm">
                        환영합니다! <span className="text-cyan-400 font-semibold">{session.user.email}</span>님
                    </p>
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <p className="text-emerald-400 text-xs">✅ 인증되었습니다</p>
                    </div>
                </div>

                <Button
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-6 rounded-xl shadow-lg shadow-cyan-900/20 transition-all hover:scale-[1.02]"
                    onClick={() => router.push('/apb')}
                >
                    🚀 APB 시작하기
                </Button>

                <Button
                    variant="ghost"
                    className="w-full text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                    onClick={handleSignOut}
                >
                    로그아웃
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
                <Button
                    variant="outline"
                    type="button"
                    className="bg-white text-slate-900 hover:bg-gray-100 hover:text-slate-900 border-gray-200"
                    onClick={handleGitHub}
                    disabled={isLoadingGitHub}
                >
                    <Icons.gitHub className="mr-2 h-4 w-4" />
                    {isLoadingGitHub ? '로그인 중...' : 'GitHub'}
                </Button>
                <Button
                    variant="outline"
                    type="button"
                    className="bg-white text-slate-900 hover:bg-gray-100 hover:text-slate-900 border-gray-200"
                    onClick={handleGoogle}
                    disabled={isLoadingGoogle}
                >
                    <Icons.google className="mr-2 h-4 w-4" />
                    {isLoadingGoogle ? '로그인 중...' : 'Google'}
                </Button>
            </div>
            {error && (
                <p className="text-xs text-red-400 text-center">{error}</p>
            )}
        </div>
    );
}
