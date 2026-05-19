"use client";

import { useEffect, useState, startTransition, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { createTicket, getTickets } from "@/app/actions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ticketSchema, TicketInput } from "@/lib/validations";
import { CommandMenu } from "@/components/command-menu";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PlusCircle, Loader2, Clock, CheckCircle2, Zap, ArrowRight } from "lucide-react";

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

const springCard = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 100, damping: 15 } }
};

export default function EmployeeDashboard() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const [tickets, setTickets] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/");
      else {
        const email = user.email as string;
        async function loadTickets() {
          setFetching(true);
          const res = await getTickets(email);
          if (res.success) setTickets(res.tickets);
          setFetching(false);
        }
        loadTickets();
      }
    }
  }, [user, loading, router]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!mainRef.current) return;
    const cards = mainRef.current.querySelectorAll('.bento-card') as NodeListOf<HTMLElement>;
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--mouse-x", `${x}%`);
      card.style.setProperty("--mouse-y", `${y}%`);
    });
  }, []);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<TicketInput>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { title: "", description: "", priority: "low" },
  });

  async function onSubmit(data: TicketInput) {
    if (!user?.email) return;
    setIsSubmitting(true);
    try {
      const res = await createTicket(data, user.email);
      if (res.success && res.ticket) {
        startTransition(() => {
          setTickets(prev => [res.ticket, ...prev]);
        });
        toast.success("Requête transmise", { description: "Le nœud réseau a bien été enregistré par l'IA." });
        setDialogOpen(false);
        reset();
      } else {
        toast.error("Anomalie système", { description: res.error || "Impossible d'initialiser la requête." });
      }
    } catch {
      toast.error("Erreur critique", { description: "Échec de la communication avec le noyau." });
    }
    setIsSubmitting(false);
  }

  if (!mounted || loading || !user) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-x-hidden">
      <div className="mesh-bg opacity-30 dark:opacity-100 pointer-events-none">
        <div className="mesh-bg-gradient" />
      </div>

      <Navbar />

      <main 
        ref={mainRef}
        onMouseMove={handleMouseMove}
        className="flex-1 container mx-auto px-4 md:px-8 py-10 max-w-5xl relative z-10"
      >
        <motion.div variants={staggerContainer} initial="hidden" animate="show">
          <motion.div variants={springCard} className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 bg-background/50 backdrop-blur-md mb-4">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Espace Employé</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-foreground tracking-tight mb-2">Centre de <span className="text-gradient-primary">Support</span></h1>
              <p className="text-muted-foreground text-sm">Signalez une anomalie et suivez sa résolution en temps réel.</p>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger className="neo-button inline-flex items-center justify-center rounded-2xl bg-foreground hover:bg-foreground/90 text-background shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] transition-all h-12 px-6 font-semibold group border-none">
                  <PlusCircle className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-500" />
                  Initialiser Requête
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] bg-background/80 backdrop-blur-2xl border-border/50 text-foreground shadow-2xl p-0 overflow-hidden rounded-3xl">
                <div className="p-8 relative">
                  {/* Subtle glow inside modal */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
                  
                  <DialogHeader className="mb-8">
                    <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">Nouvelle Anomalie</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground mt-1">
                      L'IA de support analysera votre requête pour une priorisation optimale.
                    </DialogDescription>
                  </DialogHeader>

                  <AnimatePresence>
                    {isFocused && (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-background/40 backdrop-blur-[2px] z-[5] pointer-events-none rounded-3xl"
                      />
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
                    <div className="space-y-2" onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}>
                      <Label htmlFor="title" className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Sujet principal</Label>
                      <Input 
                        id="title" 
                        placeholder="Ex: Latence réseau au 3ème étage" 
                        {...register("title")} 
                        className="bg-card/50 backdrop-blur-md border-border/50 text-foreground focus:border-primary rounded-xl h-12 transition-all duration-300"
                      />
                      {errors.title && <p className="text-[10px] text-red-500 font-medium">{errors.title.message}</p>}
                    </div>

                    <div className="space-y-2" onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}>
                      <Label htmlFor="description" className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Diagnostic détaillé</Label>
                      <Textarea 
                        id="description" 
                        placeholder="Fournissez le maximum de contexte contextuel..." 
                        {...register("description")} 
                        className="bg-card/50 backdrop-blur-md border-border/50 text-foreground focus:border-primary rounded-xl min-h-[140px] resize-none transition-all duration-300"
                      />
                      {errors.description && <p className="text-[10px] text-red-500 font-medium">{errors.description.message}</p>}
                    </div>

                    <div className="space-y-2" onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}>
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Niveau de Criticité</Label>
                      <Select onValueChange={(val) => setValue("priority", (val || "low") as any)} defaultValue="low">
                        <SelectTrigger className="bg-card/50 backdrop-blur-md border-border/50 text-foreground rounded-xl h-12 transition-all duration-300">
                          <SelectValue placeholder="Évaluer l'impact..." />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border text-foreground rounded-xl shadow-2xl">
                          <SelectItem value="low">Standard (Gênant mais non bloquant)</SelectItem>
                          <SelectItem value="medium">Alerte (Impact partiel sur la prod)</SelectItem>
                          <SelectItem value="high">Critique (Blocage total du système)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-6 flex justify-end gap-3 border-t border-border/30 mt-6">
                      <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-xl font-semibold">
                        Annuler
                      </Button>
                      <Button type="submit" disabled={isSubmitting} className="neo-button bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold px-6">
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><ArrowRight className="mr-2 h-4 w-4" /> Transmettre</>}
                      </Button>
                    </div>
                  </form>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>

          {fetching ? (
            <div className="grid gap-5">
              {[1, 2, 3].map(i => <div key={i} className="skeleton h-28 w-full rounded-2xl" />)}
            </div>
          ) : tickets.length === 0 ? (
            <motion.div variants={springCard} className="mt-20 flex flex-col items-center text-center">
              <motion.div 
                animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }} 
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="relative mb-10"
              >
                <div className="absolute inset-0 bg-primary/10 blur-[50px] rounded-full scale-150" />
                <div className="h-32 w-32 rounded-full border border-border/50 bg-background/50 backdrop-blur-xl flex items-center justify-center relative z-10 shadow-2xl">
                  <CheckCircle2 className="h-12 w-12 text-primary opacity-80" />
                </div>
              </motion.div>
              <h3 className="text-3xl font-bold text-foreground mb-3 tracking-tight">Système Nominal</h3>
              <p className="text-muted-foreground text-sm max-w-sm leading-relaxed mb-8">
                Vous n'avez remonté aucune anomalie. L'intelligence artificielle d'OMEGA veille sur votre environnement.
              </p>
              <Button 
                variant="outline" 
                className="bg-transparent border-border hover:bg-muted text-foreground rounded-xl h-11 px-6 font-semibold"
                onClick={() => setDialogOpen(true)}
              >
                Signaler une nouvelle anomalie
              </Button>
            </motion.div>
          ) : (
            <motion.div variants={staggerContainer} className="grid gap-5">
              <AnimatePresence>
                {tickets.map((ticket) => (
                  <motion.div key={ticket.id} variants={springCard} layout>
                    <div className="bento-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-3 mb-2.5">
                          {ticket.status === 'open' ? (
                            <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                          )}
                          <h3 className="font-bold text-lg text-foreground truncate">{ticket.title}</h3>
                          {ticket.priority === 'high' && <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-none px-2 h-5 text-[9px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(249,115,22,0.15)]">Urgent</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed max-w-2xl">
                          {ticket.description}
                        </p>
                      </div>
                      
                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between shrink-0 gap-3 border-t border-border/50 md:border-t-0 pt-4 md:pt-0">
                        {ticket.status === 'open' ? (
                          <div className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-full border border-border">
                            <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">En traitement IA</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-full border border-border">
                            <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                            <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest">Résolu</span>
                          </div>
                        )}
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {new Date(ticket.submittedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
      </main>

      <CommandMenu />
    </div>
  );
}
