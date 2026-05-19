"use server"

import { prisma } from "@/lib/prisma";

const ADMIN_SECRET_CODE = "OMEGA-COMPETENCE-2026";

export async function assignUserRole(uid: string, email: string, providedCode?: string) {
  try {
    const isAdmin = providedCode === ADMIN_SECRET_CODE;
    
    if (providedCode && !isAdmin) {
      return { success: false, error: "Invalid IT Support Access Code." };
    }

    const role = isAdmin ? "admin" : "employee";

    const user = await prisma.user.upsert({
      where: { id: uid },
      update: { role, email },
      create: { id: uid, email, role },
    });
    
    return { success: true, role: user.role };
  } catch (error) {
    console.error("Failed to set user role in SQLite", error);
    return { success: false, error: "Internal Server Error while setting role." };
  }
}

export async function getUserRole(uid: string, email: string) {
  try {
    let user = await prisma.user.findUnique({
      where: { id: uid },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { id: uid, email, role: "employee" },
      });
    }

    return { success: true, role: user.role };
  } catch (error) {
    console.error("Failed to get user role from SQLite", error);
    return { success: false, role: "employee" as const };
  }
}

export async function getTickets(userEmail: string) {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { submittedBy: userEmail },
      orderBy: { submittedAt: "desc" },
    });
    return {
      success: true,
      tickets: tickets.map(t => ({
        ...t,
        submittedAt: t.submittedAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error("Failed to fetch tickets from SQLite", error);
    return { success: false, tickets: [] };
  }
}

export async function getAllTickets() {
  try {
    let tickets = await prisma.ticket.findMany({
      orderBy: { submittedAt: "desc" },
    });

    if (tickets.length === 0) {
      const mockTickets = [
        { id: "tick-001", title: "Accès VPN impossible - Profil bloqué", description: "Impossible de se connecter au VPN d'entreprise depuis ce matin. Le message indique que le profil est bloqué.", priority: "high", status: "open", submittedBy: "direction@omega.com", submittedAt: new Date(Date.now() - 3600000) },
        { id: "tick-002", title: "Panne imprimante réseau au 2ème étage", description: "L'imprimante réseau principale du 2ème étage ne répond plus. Impossible d'imprimer des documents.", priority: "medium", status: "open", submittedBy: "support@omega.com", submittedAt: new Date(Date.now() - 7200000) },
        { id: "tick-003", title: "Problème d'activation Office 365 Pro", description: "Une licence Office 365 Pro demande d'être activée à nouveau, mais l'adresse e-mail professionnelle n'est pas reconnue.", priority: "low", status: "resolved", submittedBy: "rh@omega.com", submittedAt: new Date(Date.now() - 14400000) },
        { id: "tick-004", title: "Demande de matériel : Clavier mécanique", description: "Demande de clavier mécanique pour des raisons d'ergonomie suite à des douleurs aux poignets.", priority: "low", status: "open", submittedBy: "employee@test.com", submittedAt: new Date(Date.now() - 28800000) },
        { id: "tick-005", title: "Mise à jour système ERP OMEGA crashé", description: "Le serveur de l'ERP OMEGA s'est arrêté brutalement après la dernière mise à jour de sécurité automatique.", priority: "high", status: "open", submittedBy: "admin@omega.com", submittedAt: new Date(Date.now() - 86400000) }
      ];

      await prisma.ticket.createMany({
        data: mockTickets,
      });

      tickets = await prisma.ticket.findMany({
        orderBy: { submittedAt: "desc" },
      });
    }

    return {
      success: true,
      tickets: tickets.map(t => ({
        ...t,
        submittedAt: t.submittedAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error("Failed to fetch all tickets from SQLite", error);
    return { success: false, tickets: [] };
  }
}

export async function createTicket(data: { title: string; description: string; priority: string }, userEmail: string) {
  try {
    const ticket = await prisma.ticket.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: "open",
        submittedBy: userEmail,
      },
    });
    return {
      success: true,
      ticket: {
        ...ticket,
        submittedAt: ticket.submittedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Failed to create ticket in SQLite", error);
    return { success: false, error: "Failed to create ticket." };
  }
}

export async function updateTicketStatus(id: string, newStatus: string) {
  try {
    const ticket = await prisma.ticket.update({
      where: { id },
      data: { status: newStatus },
    });
    return {
      success: true,
      ticket: {
        ...ticket,
        submittedAt: ticket.submittedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Failed to update ticket status in SQLite", error);
    return { success: false, error: "Failed to update status." };
  }
}
