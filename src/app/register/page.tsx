"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { assignUserRole } from "@/app/actions";
import { registerSchema, RegisterInput } from "@/lib/validations";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, ArrowRight, ArrowLeft, Check, X, Sparkles, UserCheck, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";

import { HoloLock } from "@/components/HoloLock";

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};

const springItem = {
  hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring" as const, stiffness: 80, damping: 20 } }
};

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Parallax / 3D Card Effect
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 150 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);
  const rotateX = useTransform(springY, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(springX, [-0.5, 0.5], ["-7deg", "7deg"]);

  useEffect(() => { setMounted(true); }, []);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "", adminCode: "" },
  });

  const watchPassword = watch("password", "");
  const watchConfirm = watch("confirmPassword", "");

  // Password Security Analysis
  const passwordScore = useMemo(() => {
    let score = 0;
    if (watchPassword.length >= 8) score++;
    if (/[A-Z]/.test(watchPassword)) score++;
    if (/[0-9]/.test(watchPassword)) score++;
    if (/[^A-Za-z0-9]/.test(watchPassword)) score++;
    if (watchPassword.length === 0) return 0;
    return score;
  }, [watchPassword]);

  const isPasswordMatch = watchPassword === watchConfirm && watchPassword.length > 0;
  const isPerfectMatch = isPasswordMatch && passwordScore === 4;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    cardRef.current.style.setProperty("--mouse-x", `${(mouseX / rect.width) * 100}%`);
    cardRef.current.style.setProperty("--mouse-y", `${(mouseY / rect.height) * 100}%`);
    const normalizedX = mouseX / rect.width - 0.5;
    const normalizedY = mouseY / rect.height - 0.5;
    x.set(normalizedX);
    y.set(normalizedY);
  }, [x, y]);

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  async function onSubmit(data: RegisterInput) {
    setIsLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      // Update displayName
      await updateProfile(cred.user, { displayName: data.fullName });
      
      const res = await assignUserRole(cred.user.uid, data.email, data.adminCode);
      if (!res.success) {
        setIsLoading(false);
        return;
      }
      if (res.role === "admin") router.push("/admin");
      else router.push("/my-tickets");
    } catch (err: any) {
      setIsLoading(false);
    }
  }

  if (!mounted || loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" suppressHydrationWarning>
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12" suppressHydrationWarning>
      
      {/* ━━━━━━━━━━ BACKGROUND VIVANT (Identique au Login) ━━━━━━━━━━ */}
      <div className="mesh-bg">
        <div className="mesh-bg-gradient opacity-60 dark:opacity-100" />
        <div className="bg-grid-modern" />
        <div className="absolute top-[20%] left-[20%] w-3 h-3 rounded-full bg-primary/40 blur-[2px] animate-blob-float" />
        <div className="absolute top-[60%] right-[20%] w-4 h-4 rounded-full bg-blue-500/40 blur-[3px] animate-blob-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-[20%] left-[40%] w-2 h-2 rounded-full bg-purple-500/40 blur-[1px] animate-blob-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Ripple Glow Validation Effect */}
      <AnimatePresence>
        {isPerfectMatch && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/10 blur-[100px] rounded-full pointer-events-none z-0"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFocused && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 bg-background/60 backdrop-blur-sm z-[5] pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
        
        {/* ━━━━━━━━━━ HERO SECTION IMMERSIVE (Identique au Login) ━━━━━━━━━━ */}
        <motion.div 
          className="hidden lg:flex flex-col justify-center"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={springItem} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-background/30 backdrop-blur-xl w-max mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold tracking-widest uppercase text-foreground/80">Neo Glass Intelligence</span>
          </motion.div>
          
          <motion.h1 variants={springItem} className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1] text-gradient-hero">
            Le futur du <br/>
            <span className="text-gradient-primary">support IT intelligent.</span>
          </motion.h1>
          
          <motion.p variants={springItem} className="text-lg text-muted-foreground leading-relaxed max-w-md mb-12">
            Une plateforme IA premium conçue pour les entreprises modernes. Fluidité absolue, sécurité maximale, design world-class.
          </motion.p>

          <motion.div variants={springItem}>
            <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/5 to-transparent border border-primary/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <h3 className="text-sm font-bold text-foreground mb-2">Déjà membre de l'organisation ?</h3>
                <p className="text-xs text-muted-foreground mb-4">Accédez à votre espace sécurisé en un clic.</p>
                <Button 
                  onClick={() => router.push("/")}
                  variant="outline"
                  className="rounded-xl border-primary/20 text-primary hover:bg-primary/10 group-hover:border-primary/50 transition-all font-semibold"
                >
                  <UserCheck className="w-4 h-4 mr-2" /> Retour à la connexion
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ━━━━━━━━━━ REGISTER CARD 3D (Design harmonisé) ━━━━━━━━━━ */}
        <motion.div 
          className="w-full max-w-md mx-auto"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
          style={{ perspective: 2000 }}
        >
          <motion.div style={{ rotateX, rotateY }} className="relative">
            <div 
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="bento-card glass-panel p-8 sm:p-10 relative overflow-hidden"
            >
              <button
                onClick={() => router.push("/")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-6 group"
              >
                <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
                Retour à la connexion
              </button>

              <div className="flex justify-center mb-8">
                <Image 
                  src="/omega-logo.png" alt="OMEGA" width={180} height={55} 
                  className="drop-shadow-xl dark:drop-shadow-[0_0_20px_rgba(220,38,38,0.2)] object-contain" priority 
                />
              </div>

              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Création d'accès</h2>
                <p className="text-sm text-muted-foreground mt-2">Initialisez votre profil sécurisé.</p>
              </div>

              <motion.div variants={staggerContainer} initial="hidden" animate="show" className="relative z-10">
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* FULL NAME */}
                  <motion.div className="space-y-1.5" variants={springItem}>
                    <Label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Nom Complet</Label>
                    <div onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}>
                      <Input placeholder="John Doe" {...register("fullName")} className="h-12 bg-background/50 backdrop-blur-sm border-border/50 text-foreground transition-all duration-300" />
                    </div>
                  </motion.div>

                  {/* EMAIL */}
                  <motion.div className="space-y-1.5" variants={springItem}>
                    <Label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Email Professionnel</Label>
                    <div onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}>
                      <Input placeholder="john@omegacompetence.com" {...register("email")} className="h-12 bg-background/50 backdrop-blur-sm border-border/50 text-foreground transition-all duration-300" />
                    </div>
                  </motion.div>

                  {/* PASSWORD & HOLOLOCK */}
                  <motion.div className="space-y-1.5" variants={springItem}>
                    <div className="flex items-end gap-3">
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Clé de sécurité</Label>
                        <div className="relative" onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}>
                          <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...register("password")} className="h-12 bg-background/50 backdrop-blur-sm border-border/50 text-foreground pr-11 transition-all duration-300" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground transition-colors">
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <HoloLock score={passwordScore} />
                    </div>
                    {/* Security Checklist */}
                    <div className="flex items-center justify-between text-[9px] mt-1 text-muted-foreground/60 font-mono uppercase">
                      <span className={watchPassword.length >= 8 ? "text-green-500 font-bold" : ""}>8+ Car</span>
                      <span className={/[A-Z]/.test(watchPassword) ? "text-green-500 font-bold" : ""}>Maj</span>
                      <span className={/[0-9]/.test(watchPassword) ? "text-green-500 font-bold" : ""}>Chiffre</span>
                      <span className={/[^A-Za-z0-9]/.test(watchPassword) ? "text-green-500 font-bold" : ""}>Spécial</span>
                    </div>
                  </motion.div>

                  {/* CONFIRM PASSWORD */}
                  <motion.div className="space-y-1.5 relative" variants={springItem}>
                    <Label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Confirmation</Label>
                    <div className="relative" onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}>
                      <Input 
                        type={showConfirm ? "text" : "password"} 
                        placeholder="••••••••" 
                        {...register("confirmPassword")} 
                        className={`h-12 bg-background/50 backdrop-blur-sm text-foreground pr-11 transition-all duration-300 ${isPasswordMatch ? 'border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.15)] focus:border-green-500' : 'border-border/50'}`} 
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-9 top-3.5 text-muted-foreground hover:text-foreground transition-colors">
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <div className="absolute right-3 top-3.5">
                        <AnimatePresence mode="wait">
                          {isPasswordMatch && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                              <Check className="h-4 w-4 text-green-500" strokeWidth={3} />
                            </motion.div>
                          )}
                          {watchConfirm.length > 0 && !isPasswordMatch && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                              <X className="h-4 w-4 text-red-500" strokeWidth={3} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>

                  {/* ADMIN TOKEN (OPTIONAL) */}
                  <motion.div className="space-y-1.5 pt-4 border-t border-border/50" variants={springItem}>
                    <Label className="text-[10px] font-bold tracking-widest uppercase text-primary flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" /> Jeton Administrateur (Optionnel)
                    </Label>
                    <div onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}>
                      <Input type="password" placeholder="Code d'élévation..." {...register("adminCode")} className="h-12 bg-background/50 backdrop-blur-sm border-border/50 text-foreground transition-all duration-300" />
                    </div>
                  </motion.div>

                  <motion.div variants={springItem} className="pt-2">
                    <Button 
                      type="submit" 
                      disabled={isLoading || !isPerfectMatch}
                      className="neo-button w-full h-12 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_10px_30px_-10px_rgba(220,38,38,0.5)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Finaliser l'inscription <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></>}
                    </Button>
                  </motion.div>
                  
                </form>
                
                {/* Mobile Only Login Link */}
                <div className="mt-6 text-center lg:hidden">
                  <button onClick={() => router.push("/")} className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" /> Retour à la connexion
                  </button>
                </div>

              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>

    </div>
  );
}
