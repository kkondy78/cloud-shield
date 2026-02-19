import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AuthProviderButtons } from '@/components/auth-provider-buttons';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-cyan-500/20">
      {/* Background Gradient Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        <div className="max-w-5xl w-full space-y-16 animate-in fade-in zoom-in duration-700">

          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="inline-block rounded-full bg-slate-900/50 border border-slate-800 px-4 py-1.5 backdrop-blur-md mb-4">
              <span className="text-xs font-semibold text-cyan-400 tracking-wider uppercase">
                v1.0 Alpha Release
              </span>
            </div>

            <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight">
              Welcome to <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
                Cloud Shield
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-xl text-slate-400 leading-relaxed">
              The ultimate self-healing testing platform. <br />
              We detect, diagnose, and fix issues before your users even notice.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Button size="lg" variant="outline" className="border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white rounded-full px-8 backdrop-blur-sm">
                Documentation
              </Button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
            <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm hover:bg-slate-900/60 transition-colors duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-cyan-900/30 flex items-center justify-center mb-4 border border-cyan-800/50">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <CardTitle className="text-2xl text-slate-100">Performance Mission</CardTitle>
                <CardDescription className="text-slate-400 pt-2">
                  Maximize development efficiency with AI-driven automated testing and real-time monitoring.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm hover:bg-slate-900/60 transition-colors duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-purple-900/30 flex items-center justify-center mb-4 border border-purple-800/50">
                  <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <CardTitle className="text-2xl text-slate-100">Quality Vision</CardTitle>
                <CardDescription className="text-slate-400 pt-2">
                  Becoming the industry standard for reliable, self-healing application deployment pipelines.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Sign Up Section */}
          <div id="login-section" className="max-w-md mx-auto w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-100">Start Your Journey</h2>
              <p className="text-slate-500 mt-2">Sign in to access the APB Platform.</p>
            </div>

            <div className="space-y-4">
              <AuthProviderButtons />
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center text-slate-600 text-sm pt-8">
            <p>&copy; 2026 Cloud Shield Inc. All rights reserved.</p>
          </footer>
        </div>
      </div>
    </div>
  );
}