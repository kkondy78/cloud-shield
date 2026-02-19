'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

interface LogEntry {
    step: number;
    status: string;
    message: string;
    url?: string;
}

export default function APBPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [idea, setIdea] = useState('');
    const [keyword, setKeyword] = useState('SaaS pain point');
    const [noScrape, setNoScrape] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [githubUrl, setGithubUrl] = useState('');
    const [phase, setPhase] = useState<'input' | 'running' | 'done'>('input');
    const logsEndRef = useRef<HTMLDivElement>(null);

    // 인증 체크
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast({
                    title: "로그인이 필요합니다 🔒",
                    description: "APB 서비스를 이용하려면 먼저 로그인해주세요.",
                    variant: "destructive",
                });
                router.replace('/#login-section');
            } else {
                // 로그인 된 경우에만 세션 상태 저장 가능 (여기서는 단순 체크)
            }
        };
        checkAuth();
    }, [router, toast]);

    const scrollToBottom = () => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // 로딩 처리나 리다이렉트 대기 중에 보여줄 UI 심플하게 추가 가능하지만, 
    // 여기서는 일단 기존 로직 유지하되 필요하면 if (!session) return null; 추가 가능. 
    // Effect 안에서 체크하므로 초기 렌더링은 되지만 순식간에 이동함.
    // 더 확실한 차단을 위해 아래와 같이 session state 추가 권장.
    // 하지만 현재 코드는 복잡도를 낮추기 위해 유지.

    const runPipeline = async () => {
        if (!idea.trim() && !keyword.trim()) return;
        setIsRunning(true);
        setLogs([]);
        setGithubUrl('');
        setPhase('running');

        try {
            const res = await fetch('/api/apb/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idea: idea.trim(), keyword: keyword.trim(), noScrape }),
            });

            if (!res.body) throw new Error('No response body');

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                const lines = text.split('\n').filter(l => l.startsWith('data: '));

                for (const line of lines) {
                    try {
                        const entry: LogEntry = JSON.parse(line.slice(6));
                        setLogs(prev => [...prev, entry]);
                        if (entry.url) setGithubUrl(entry.url);
                        if (entry.status === 'done' || entry.status === 'error') {
                            setPhase('done');
                        }
                        setTimeout(scrollToBottom, 50);
                    } catch { /* ignore parse errors */ }
                }
            }
        } catch (err) {
            setLogs(prev => [...prev, { step: 99, status: 'error', message: `연결 오류: ${err}` }]);
            setPhase('done');
        } finally {
            setIsRunning(false);
        }
    };

    const reset = () => {
        setPhase('input');
        setLogs([]);
        setGithubUrl('');
        setIdea('');
    };

    const getLogColor = (status: string) => {
        switch (status) {
            case 'done': return 'text-emerald-400';
            case 'error': return 'text-red-400';
            case 'start': return 'text-cyan-400';
            default: return 'text-slate-400';
        }
    };

    const getStepLabel = (step: number) => {
        switch (step) {
            case 0: return '시작';
            case 1: return 'Reddit';
            case 2: return 'AI 생성';
            case 3: return '로컬 저장';
            case 4: return 'GitHub';
            case 99: return '완료';
            default: return '로그';
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50">
            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-600/10 blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-10">
                    <Link href="/" className="text-slate-500 hover:text-slate-300 text-sm mb-6 inline-flex items-center gap-1 transition-colors">
                        ← Cloud Shield 홈
                    </Link>
                    <div className="flex items-center gap-3 mt-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xl">
                            🤖
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">APB 플랫폼 빌더</h1>
                            <p className="text-slate-400 text-sm mt-0.5">아이디어 → AI 기획서 → GitHub 자동 업로드</p>
                        </div>
                    </div>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-2 mb-8">
                    {['아이디어 입력', 'AI 분석 중', '완료'].map((label, i) => {
                        const active = (phase === 'input' && i === 0) || (phase === 'running' && i === 1) || (phase === 'done' && i === 2);
                        const done = (phase === 'running' && i === 0) || (phase === 'done' && i <= 1);
                        return (
                            <div key={i} className="flex items-center gap-2">
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${active ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                                    done ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                        'bg-slate-800 text-slate-500 border border-slate-700'
                                    }`}>
                                    <span>{done ? '✓' : i + 1}</span>
                                    <span>{label}</span>
                                </div>
                                {i < 2 && <div className="w-8 h-px bg-slate-700" />}
                            </div>
                        );
                    })}
                </div>

                {/* Input Phase */}
                {phase === 'input' && (
                    <div className="space-y-6">
                        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-lg text-slate-100">💡 아이디어 입력</CardTitle>
                                <CardDescription className="text-slate-400">
                                    만들고 싶은 서비스나 해결하고 싶은 문제를 자유롭게 입력하세요
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Textarea
                                    id="idea-input"
                                    placeholder="예: 개발자가 앱 크래시를 실시간으로 감지하고 AI가 자동으로 수정 제안을 해주는 SaaS 플랫폼"
                                    value={idea}
                                    onChange={e => setIdea(e.target.value)}
                                    className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 min-h-[120px] resize-none focus:border-cyan-500/50 focus:ring-cyan-500/20"
                                />
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-lg text-slate-100">🔍 Reddit 시장 조사 (선택)</CardTitle>
                                <CardDescription className="text-slate-400">
                                    Reddit에서 관련 불편사항을 수집해 기획서에 반영합니다
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="no-scrape"
                                        checked={noScrape}
                                        onChange={e => setNoScrape(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 accent-cyan-500"
                                    />
                                    <label htmlFor="no-scrape" className="text-sm text-slate-400 cursor-pointer">
                                        Reddit 스크래핑 건너뛰기 (아이디어만으로 기획서 생성)
                                    </label>
                                </div>
                                {!noScrape && (
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1.5 block">검색 키워드</label>
                                        <Input
                                            id="keyword-input"
                                            placeholder="SaaS pain point"
                                            value={keyword}
                                            onChange={e => setKeyword(e.target.value)}
                                            className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/50"
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Button
                            id="run-pipeline-btn"
                            onClick={runPipeline}
                            disabled={!idea.trim() && !keyword.trim()}
                            className="w-full h-12 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-900/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            🚀 기획서 자동 생성 시작
                        </Button>
                    </div>
                )}

                {/* Running Phase */}
                {(phase === 'running' || phase === 'done') && (
                    <div className="space-y-6">
                        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
                                    {phase === 'running' ? (
                                        <>
                                            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                            파이프라인 실행 중...
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-emerald-400">✓</span>
                                            파이프라인 완료
                                        </>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {/* Progress Steps */}
                                <div className="grid grid-cols-4 gap-2 mb-6">
                                    {[
                                        { step: 1, label: 'Reddit 수집', icon: '🔍' },
                                        { step: 2, label: 'AI 기획서', icon: '🧠' },
                                        { step: 3, label: '로컬 저장', icon: '💾' },
                                        { step: 4, label: 'GitHub', icon: '🚀' },
                                    ].map(({ step, label, icon }) => {
                                        const isDone = logs.some(l => l.step === step && l.status === 'done');
                                        const isActive = logs.some(l => l.step === step) && !isDone;
                                        return (
                                            <div key={step} className={`p-3 rounded-lg border text-center transition-all ${isDone ? 'bg-emerald-500/10 border-emerald-500/30' :
                                                isActive ? 'bg-cyan-500/10 border-cyan-500/30 animate-pulse' :
                                                    'bg-slate-800/50 border-slate-700'
                                                }`}>
                                                <div className="text-xl mb-1">{isDone ? '✅' : icon}</div>
                                                <div className={`text-xs font-medium ${isDone ? 'text-emerald-400' : isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
                                                    {label}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Log Terminal */}
                                <div className="bg-slate-950 rounded-lg border border-slate-800 p-4 font-mono text-xs max-h-64 overflow-y-auto">
                                    {logs.map((log, i) => (
                                        <div key={i} className={`flex gap-2 mb-1 ${getLogColor(log.status)}`}>
                                            <span className="text-slate-600 shrink-0">
                                                [{getStepLabel(log.step)}]
                                            </span>
                                            <span>{log.message}</span>
                                        </div>
                                    ))}
                                    {isRunning && (
                                        <div className="flex gap-1 mt-2">
                                            <span className="animate-bounce text-cyan-400">▋</span>
                                        </div>
                                    )}
                                    <div ref={logsEndRef} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Result */}
                        {phase === 'done' && githubUrl && (
                            <Card className="bg-emerald-500/10 border-emerald-500/30 backdrop-blur-sm">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-2xl">🎉</span>
                                        <div>
                                            <p className="font-semibold text-emerald-400">기획서 생성 완료!</p>
                                            <p className="text-xs text-slate-400">GitHub에 자동 업로드되었습니다</p>
                                        </div>
                                    </div>
                                    <a
                                        href={githubUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        id="github-result-link"
                                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm text-cyan-400 hover:text-cyan-300 transition-colors break-all"
                                    >
                                        <span>🔗</span>
                                        <span>{githubUrl}</span>
                                    </a>
                                </CardContent>
                            </Card>
                        )}

                        {phase === 'done' && (
                            <Button
                                onClick={reset}
                                variant="outline"
                                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl"
                            >
                                ← 새 아이디어 입력
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
