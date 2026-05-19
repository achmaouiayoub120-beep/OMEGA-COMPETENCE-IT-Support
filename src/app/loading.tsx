"use client";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background relative overflow-hidden" suppressHydrationWarning>
      <div className="absolute inset-0 bg-grid-pattern opacity-15 pointer-events-none" />
      
      <div className="aurora-orb-red absolute -top-40 -right-40 animate-aurora-breathe opacity-20" />
      <div className="aurora-orb-blue absolute -bottom-40 -left-40 animate-aurora-drift opacity-15" />
      
      <motion.div 
        className="relative z-10 flex flex-col items-center gap-10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Image 
          src="/omega-logo.png" 
          alt="OMEGA COMPETENCE" 
          width={240} 
          height={75} 
          className="drop-shadow-xl dark:drop-shadow-[0_0_30px_rgba(220,38,38,0.2)]" 
          priority 
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
          </div>
          <div className="space-y-1.5 text-center mt-2">
            <p className="text-[11px] font-bold tracking-[0.25em] text-foreground/70 uppercase">
              Initialisation du Système
            </p>
            <p className="text-[10px] text-muted-foreground animate-pulse tracking-widest uppercase">
              Connexion sécurisée en cours...
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
