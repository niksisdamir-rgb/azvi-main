import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/GlassCard";
import { CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LOGIN_PATH } from "@/const";
import { useAuth0 } from "@auth0/auth0-react";

export default function Register() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [, setLocation] = useLocation();
    const utils = trpc.useUtils();
    const { loginWithRedirect, isLoading } = useAuth0();

    const registerMutation = trpc.auth.register.useMutation({
        onSuccess: () => {
            toast.success("Account created successfully");
            utils.auth.me.invalidate();
            setLocation("/");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to register");
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        registerMutation.mutate({ username, password, name, email });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#050505] p-4 font-sans">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full" />
            </div>

            <GlassCard variant="login" className="w-full max-w-md relative z-10">
                <GlassCardHeader className="space-y-2 pb-8">
                    <div className="flex items-center space-x-2 mb-2">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">A</span>
                        </div>
                        <span className="text-2xl font-bold text-white tracking-tight">AzVirt DMS</span>
                    </div>
                    <GlassCardTitle className="text-2xl font-bold text-white">Create Account</GlassCardTitle>
                    <CardDescription className="text-gray-400">
                        Join the management system
                    </CardDescription>
                </GlassCardHeader>
                <GlassCardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-gray-300 text-sm font-medium">Full Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoComplete="name"
                                className="h-11 border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-orange-500/50 focus:ring-orange-500/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-300 text-sm font-medium">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="john@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                className="h-11 border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-orange-500/50 focus:ring-orange-500/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-gray-300 text-sm font-medium">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="johndoe123"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoComplete="username"
                                className="h-11 border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-orange-500/50 focus:ring-orange-500/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-300 text-sm font-medium">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                                className="h-11 border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-orange-500/50 focus:ring-orange-500/20"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-11 bg-orange-600 hover:bg-orange-500 text-white font-semibold shadow-[0_0_20px_rgba(234,88,12,0.3)] mt-2 active:scale-[0.98]"
                            disabled={registerMutation.isPending}
                        >
                            {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                        </Button>
                    </form>
                </GlassCardContent>
                <CardFooter className="flex flex-col space-y-4 pt-4 border-t border-white/5 mt-4">
                    <Button
                        variant="default"
                        type="button"
                        onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: "signup" } })}
                        className="w-full h-11 bg-[#eb5424] hover:bg-[#d44a1e] text-white font-semibold transition-all shadow-[0_0_20px_rgba(235,84,36,0.2)]"
                        disabled={registerMutation.isPending || isLoading}
                    >
                        {isLoading ? "Loading..." : "Sign Up with Auth0"}
                    </Button>
                    <div className="text-sm text-gray-400 text-center w-full">
                        Already have an account?{" "}
                        <Link href={LOGIN_PATH} className="text-orange-500 hover:text-orange-400 font-medium transition-colors">
                            Sign in
                        </Link>
                    </div>
                </CardFooter>
            </GlassCard>
        </div>
    );
}
