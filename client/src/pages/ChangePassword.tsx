import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/GlassCard";
import { CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ChangePassword() {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [, setLocation] = useLocation();
    const utils = trpc.useUtils();

    const changePasswordMutation = trpc.auth.changePassword.useMutation({
        onSuccess: () => {
            toast.success("Password changed successfully");
            utils.auth.me.invalidate();
            setLocation("/");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to change password");
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        const commonPasswords = ["password123", "admin123", "qwertyuiop", "123456789012", "changeme123", "password!123"];
        if (newPassword.length < 12 || commonPasswords.includes(newPassword)) {
            toast.error("Password must be at least 12 characters and not easily guessable");
            return;
        }

        changePasswordMutation.mutate({ oldPassword, newPassword });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#050505] p-4 font-sans selection:bg-orange-500/30">
            <GlassCard variant="login" className="w-full max-w-md relative z-10 border-white/5 shadow-2xl overflow-hidden">
                <GlassCardHeader className="space-y-3 pb-8 text-center pt-8">
                    <GlassCardTitle className="text-xl font-bold text-white/90">Change Password Required</GlassCardTitle>
                    <CardDescription className="text-orange-400 max-w-[280px] mx-auto text-balance font-medium">
                        You must change your password to continue using the system.
                    </CardDescription>
                </GlassCardHeader>

                <GlassCardContent className="space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-gray-400 text-[10px] font-bold uppercase tracking-widest ml-1">Current Password</Label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                required
                                className="h-11 border-white/5 bg-white/5 text-white placeholder:text-gray-600 focus:border-orange-500/30 focus:ring-0 transition-all rounded-xl"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-gray-400 text-[10px] font-bold uppercase tracking-widest ml-1">New Password (Min 12 chars)</Label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={12}
                                className="h-11 border-white/5 bg-white/5 text-white placeholder:text-gray-600 focus:border-orange-500/30 focus:ring-0 transition-all rounded-xl"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-gray-400 text-[10px] font-bold uppercase tracking-widest ml-1">Confirm New Password</Label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={12}
                                className="h-11 border-white/5 bg-white/5 text-white placeholder:text-gray-600 focus:border-orange-500/30 focus:ring-0 transition-all rounded-xl"
                            />
                        </div>
                        <Button
                            type="submit"
                            variant="ghost"
                            className="w-full h-11 border border-orange-500 bg-orange-500 hover:bg-orange-600 text-white transition-all rounded-xl mt-2 font-bold"
                            disabled={changePasswordMutation.isPending}
                        >
                            {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
                        </Button>
                    </form>
                </GlassCardContent>

                <CardFooter className="flex flex-col space-y-4 pt-6 pb-8">
                    <div className="text-[11px] text-gray-500 text-center w-full uppercase tracking-tighter">
                        Proprietary System — AzVirt LLC. © {new Date().getFullYear()}
                    </div>
                </CardFooter>
            </GlassCard>
        </div>
    );
}
