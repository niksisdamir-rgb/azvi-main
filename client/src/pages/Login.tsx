import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/GlassCard";
import { CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { REGISTER_PATH } from "@/const";
import { useAuth0 } from "@auth0/auth0-react";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [, setLocation] = useLocation();
    const utils = trpc.useUtils();
    const { loginWithRedirect, isLoading } = useAuth0();

    const loginMutation = trpc.auth.login.useMutation({
        onSuccess: () => {
            toast.success("Logged in successfully");
            utils.auth.me.invalidate();
            setLocation("/");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to login");
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        loginMutation.mutate({ username, password });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#050505] p-4 font-sans selection:bg-orange-500/30">
            {/* Ambient Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-600/10 blur-[130px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-700/10 blur-[130px] rounded-full animate-pulse [animation-delay:2s]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,100,0,0.03)_0%,transparent_70%)]" />
            </div>

            <GlassCard variant="login" className="w-full max-w-md relative z-10 border-white/5 shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50" />
                
                <GlassCardHeader className="space-y-3 pb-8 text-center pt-8">
                    <div className="flex flex-col items-center space-y-4 mb-2">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 shadow-inner">
                            <img src="/azvirt-35years-bg.webp" alt="AzVirt 35 years logo" className="w-14 h-14 rounded-xl object-cover shadow-2xl" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-3xl font-black text-white tracking-tighter uppercase">AzVirt <span className="text-orange-500">DMS</span></span>
                            <div className="h-0.5 w-12 bg-orange-600 mx-auto rounded-full" />
                        </div>
                    </div>
                    <GlassCardTitle className="text-xl font-bold text-white/90">Authentication Portal</GlassCardTitle>
                    <CardDescription className="text-gray-400 max-w-[280px] mx-auto text-balance">
                        Secure access to the document management system
                    </CardDescription>
                </GlassCardHeader>

                <GlassCardContent className="space-y-6">
                    {/* Primary SSO Method */}
                    <div className="space-y-4">
                        <Button
                            variant="default"
                            type="button"
                            onClick={() => loginWithRedirect()}
                            className="w-full h-12 bg-orange-600 hover:bg-orange-500 text-white font-bold transition-all shadow-[0_0_30px_rgba(234,88,12,0.2)] hover:shadow-[0_0_40px_rgba(234,88,12,0.3)] active:scale-[0.98] border border-orange-400/20"
                            disabled={loginMutation.isPending || isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center space-x-3">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Initializing...</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center space-x-3">
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                                    </svg>
                                    <span>Sign in with AzVirt Auth</span>
                                </div>
                            )}
                        </Button>
                    </div>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#0a0a0a] px-3 text-gray-500 font-medium tracking-widest">or legacy access</span>
                        </div>
                    </div>

                    {/* Secondary Legacy Login */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="username" className="text-gray-400 text-[10px] font-bold uppercase tracking-widest ml-1">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Employee ID"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoComplete="username"
                                className="h-11 border-white/5 bg-white/5 text-white placeholder:text-gray-600 focus:border-orange-500/30 focus:ring-0 transition-all rounded-xl"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-gray-400 text-[10px] font-bold uppercase tracking-widest ml-1">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                className="h-11 border-white/5 bg-white/5 text-white placeholder:text-gray-600 focus:border-orange-500/30 focus:ring-0 transition-all rounded-xl"
                            />
                        </div>
                        <Button
                            type="submit"
                            variant="ghost"
                            className="w-full h-11 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-white/70 hover:text-white transition-all rounded-xl mt-2"
                            disabled={loginMutation.isPending}
                        >
                            {loginMutation.isPending ? "Connecting..." : "Legacy Sign In"}
                        </Button>
                    </form>
                </GlassCardContent>

                <CardFooter className="flex flex-col space-y-4 pt-6 pb-8">
                    {import.meta.env.VITE_ENABLE_DEV_BYPASS === 'true' && (
                        <div className="w-full group">
                            <button
                                type="button"
                                onClick={() => loginMutation.mutate({ username: "developer", password: "4433" })}
                                className="w-full py-2 text-[10px] text-orange-500/50 hover:text-orange-500 font-bold uppercase tracking-[0.2em] transition-all border-t border-white/5 pt-4"
                                disabled={loginMutation.isPending}
                            >
                                [ Internal Dev Bypass ]
                            </button>
                        </div>
                    )}
                    
                    <div className="text-[11px] text-gray-500 text-center w-full uppercase tracking-tighter">
                        Proprietary System — AzVirt LLC. © {new Date().getFullYear()}
                    </div>
                </CardFooter>
            </GlassCard>
        </div>
    );
}
