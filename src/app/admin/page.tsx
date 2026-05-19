"use client";

import { useEffect, useState, useMemo, startTransition, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { getAllTickets, updateTicketStatus } from "@/app/actions";
import { CommandMenu } from "@/components/command-menu";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  ShieldCheck, Search, Activity, Clock, CheckCircle2, AlertCircle, MoreVertical, LayoutGrid
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};

const springCard = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 100, damping: 15 } }
};

export default function AdminDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tickets, setTickets] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push("/");
      else if (role !== "admin") router.push("/my-tickets");
      else loadTickets();
    }
  }, [user, role, authLoading, router]);

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

  async function loadTickets() {
    setFetching(true);
    const res = await getAllTickets();
    if (res.success) setTickets(res.tickets);
    setFetching(false);
  }

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const matchesSearch = ticket.title?.toLowerCase().includes(search.toLowerCase()) || ticket.id?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    startTransition(() => {
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    });
    try {
      const res = await updateTicketStatus(id, newStatus);
      if (res.success && res.ticket) {
        setTickets(prev => prev.map(t => t.id === id ? res.ticket : t));
        toast.success("Mise à jour synchronisée", { description: "Le nœud réseau a bien été actualisé." });
      } else throw new Error();
    } catch {
      toast.error("Erreur de synchronisation", { description: "La requête a été rejetée." });
      loadTickets();
    }
  };

  const stats = useMemo(() => {
    const total = tickets.length;
    const resolved = tickets.filter(t => t.status === "resolved").length;
    const open = tickets.filter(t => t.status === "open").length;
    const urgent = tickets.filter(t => t.status === "open" && t.priority === "high").length;
    return { total, resolved, open, urgent };
  }, [tickets]);

  const chartData = useMemo(() => {
    if (tickets.length === 0) return [];
    const groups: Record<string, { created: number; resolved: number }> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      groups[d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })] = { created: 0, resolved: 0 };
    }
    tickets.forEach(t => {
      const dateStr = new Date(t.submittedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      if (groups[dateStr]) {
        groups[dateStr].created += 1;
        if (t.status === "resolved") groups[dateStr].resolved += 1;
      }
    });
    return Object.entries(groups).map(([name, data]) => ({ name, ...data }));
  }, [tickets]);

  if (!mounted || authLoading || (user && role !== "admin")) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-x-hidden">
      <div className="mesh-bg opacity-30 dark:opacity-100 pointer-events-none">
        <div className="mesh-bg-gradient" />
      </div>

      <Navbar />

      <main 
        ref={mainRef}
        onMouseMove={handleMouseMove}
        className="flex-1 container mx-auto px-4 md:px-8 py-10 max-w-[1400px] relative z-10"
      >
        <motion.div variants={staggerContainer} initial="hidden" animate="show">
          
          <motion.div variants={springCard} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 bg-background/50 backdrop-blur-md mb-4">
                <LayoutGrid className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Console Administrateur</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-foreground tracking-tight mb-2">Neural <span className="text-gradient-primary">Core</span></h1>
              <p className="text-muted-foreground text-sm max-w-md leading-relaxed">Supervision IA des incidents. Gestion des requêtes réseau en temps réel.</p>
            </div>
          </motion.div>

          {fetching && tickets.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-36 rounded-3xl" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <motion.div variants={springCard}>
                  <Card className="bento-card border-none">
                    <CardHeader className="pb-2 pt-6">
                      <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Activity className="h-4 w-4 text-foreground/50" /> Volume Global
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-6">
                      <div className="text-5xl font-black text-foreground tracking-tighter">{stats.total}</div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={springCard}>
                  <Card className="bento-card border-none">
                    <CardHeader className="pb-2 pt-6">
                      <CardTitle className="text-[11px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" /> Flux Actifs
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-6">
                      <div className="text-5xl font-black text-foreground tracking-tighter">{stats.open}</div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={springCard}>
                  <Card className="bento-card border-none">
                    <CardHeader className="pb-2 pt-6">
                      <CardTitle className="text-[11px] font-bold text-orange-500 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-500" /> Anomalies Critiques
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-6">
                      <div className="text-5xl font-black text-foreground tracking-tighter">{stats.urgent}</div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={springCard}>
                  <Card className="bento-card border-none">
                    <CardHeader className="pb-2 pt-6">
                      <CardTitle className="text-[11px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" /> Nœuds Résolus
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-6">
                      <div className="text-5xl font-black text-foreground tracking-tighter">{stats.resolved}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <motion.div variants={springCard} className="lg:col-span-2">
                  <Card className="bento-card border-none h-full flex flex-col">
                    <CardHeader className="border-b border-border/50 pb-5">
                      <CardTitle className="text-sm font-semibold text-foreground">Télémétrie du Système</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground mt-1">Analyse prédictive des 7 derniers jours.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 flex-1 min-h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(355 85% 55%)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(355 85% 55%)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" className="opacity-50" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--card)', backdropFilter: 'blur(16px)', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
                            itemStyle={{ color: 'var(--foreground)', fontSize: '13px', fontWeight: 600 }}
                            labelStyle={{ color: 'var(--muted-foreground)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}
                          />
                          <Area type="monotone" dataKey="created" name="Requêtes" stroke="hsl(355 85% 55%)" strokeWidth={3} fillOpacity={1} fill="url(#colorCreated)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={springCard}>
                  <Card className="bento-card border-none h-full flex flex-col">
                    <CardHeader className="border-b border-border/50 pb-5">
                      <CardTitle className="text-sm font-semibold text-foreground">Matrice de Filtrage</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground mt-1">Isoler les anomalies réseau.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Identification</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
                          <Input 
                            placeholder="Titre, UID..." 
                            className="pl-10 h-12 bg-background/50 border-border/50 text-foreground rounded-xl"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">État du flux</label>
                        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
                          <SelectTrigger className="w-full h-12 bg-background/50 border-border/50 text-foreground rounded-xl">
                            <SelectValue placeholder="Tous les statuts" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border rounded-xl shadow-2xl">
                            <SelectItem value="all">Tous les états</SelectItem>
                            <SelectItem value="open">Anomalies Actives</SelectItem>
                            <SelectItem value="resolved">Noeuds Réparés</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Criticité</label>
                        <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val || "all")}>
                          <SelectTrigger className="w-full h-12 bg-background/50 border-border/50 text-foreground rounded-xl">
                            <SelectValue placeholder="Toutes les priorités" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border rounded-xl shadow-2xl">
                            <SelectItem value="all">Toutes criticités</SelectItem>
                            <SelectItem value="high">Alerte Rouge</SelectItem>
                            <SelectItem value="medium">Avertissement</SelectItem>
                            <SelectItem value="low">Standard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              <motion.div variants={springCard}>
                <Card className="bento-card border-none overflow-hidden">
                  {filteredTickets.length === 0 ? (
                    <div className="py-32 flex flex-col items-center justify-center text-center">
                      <motion.div 
                        animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }} 
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="mb-8 relative"
                      >
                        <div className="absolute inset-0 bg-primary/20 blur-[40px] rounded-full scale-150" />
                        <ShieldCheck className="h-24 w-24 text-primary relative z-10 opacity-80" strokeWidth={0.5} />
                      </motion.div>
                      <h3 className="text-xl font-bold text-foreground mb-3">Le système est parfaitement opérationnel.</h3>
                      <p className="text-sm text-muted-foreground max-w-[300px] leading-relaxed">Aucune anomalie détectée dans ce secteur. Tous les nœuds fonctionnent à capacité maximale.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-background/40 backdrop-blur-md border-b border-border/50 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                          <tr>
                            <th className="px-6 py-5">Entité & Signature</th>
                            <th className="px-6 py-5">Criticité</th>
                            <th className="px-6 py-5">État</th>
                            <th className="px-6 py-5">Horodatage</th>
                            <th className="px-6 py-5 text-right">Contrôle</th>
                          </tr>
                        </thead>
                        <motion.tbody 
                          variants={staggerContainer}
                          initial="hidden"
                          animate="show"
                          className="divide-y divide-border/30"
                        >
                          <AnimatePresence>
                            {filteredTickets.map((ticket) => (
                              <motion.tr 
                                key={ticket.id}
                                variants={springCard}
                                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                                className="group hover:bg-muted/30 transition-colors duration-300 relative"
                              >
                                <td className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_10px_var(--primary)]" />
                                
                                <td className="px-6 py-5 font-medium">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-foreground truncate max-w-[280px] font-semibold text-sm">{ticket.title}</span>
                                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{ticket.id.substring(0, 8)}</span>
                                  </div>
                                </td>
                                
                                <td className="px-6 py-5">
                                  {ticket.priority === 'high' && <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-none shadow-[0_0_15px_rgba(249,115,22,0.15)]">Critique</Badge>}
                                  {ticket.priority === 'medium' && <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none shadow-[0_0_15px_rgba(59,130,246,0.15)]">Alerte</Badge>}
                                  {ticket.priority === 'low' && <Badge variant="outline" className="border-border text-muted-foreground bg-background/50">Normale</Badge>}
                                </td>

                                <td className="px-6 py-5">
                                  {ticket.status === 'open' ? (
                                    <div className="flex items-center gap-2">
                                      <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                      </span>
                                      <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">Actif</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                                      <span className="text-[11px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest">Résolu</span>
                                    </div>
                                  )}
                                </td>

                                <td className="px-6 py-5">
                                  <div className="flex flex-col gap-1.5">
                                    <span className="text-xs font-semibold text-foreground/80">{ticket.submittedBy.split('@')[0]}</span>
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(ticket.submittedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </td>

                                <td className="px-6 py-5 text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-background rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 inline-flex items-center justify-center cursor-pointer shadow-sm border border-transparent hover:border-border/50">
                                        <MoreVertical className="h-4 w-4" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[180px] bg-popover/90 backdrop-blur-xl border-border/50 text-foreground shadow-2xl rounded-xl p-2">
                                      {ticket.status === 'open' ? (
                                        <DropdownMenuItem 
                                          className="text-green-600 dark:text-green-400 focus:bg-green-500/10 rounded-lg cursor-pointer text-xs font-bold py-2.5 mb-1"
                                          onClick={() => handleStatusChange(ticket.id, 'resolved')}
                                        >
                                          <CheckCircle2 className="mr-2 h-4 w-4" /> Purger l'anomalie
                                        </DropdownMenuItem>
                                      ) : (
                                        <DropdownMenuItem 
                                          className="text-orange-600 dark:text-orange-400 focus:bg-orange-500/10 rounded-lg cursor-pointer text-xs font-bold py-2.5 mb-1"
                                          onClick={() => handleStatusChange(ticket.id, 'open')}
                                        >
                                          <AlertCircle className="mr-2 h-4 w-4" /> Réactiver le flux
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                        </motion.tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </motion.div>
            </>
          )}
        </motion.div>
      </main>
      
      <CommandMenu />
    </div>
  );
}
