"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserRole } from "@/app/actions";

export type UserRole = "admin" | "employee" | null;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Guard: if auth object is not available (e.g. during SSR), skip subscription
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Force token refresh to ensure role data is synchronized
          await currentUser.getIdToken(true);
          
          const res = await getUserRole(currentUser.uid, currentUser.email || "");
          if (res.success) {
            setRole(res.role as UserRole);
          } else {
            setRole("employee");
          }
        } catch (error) {
          console.error("Error fetching user role", error);
          setRole("employee");
        }
      } else {
        setRole(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, role, loading };
}
