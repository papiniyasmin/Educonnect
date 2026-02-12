"use client";

import { useState, useEffect } from "react";

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
  year?: string;
  curso?: string;
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/user", { credentials: "include" });
        if (!res.ok) {
          setUser(null);
        } else {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) {
        console.error("Erro ao buscar usuário:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  return { user, loading };
}
