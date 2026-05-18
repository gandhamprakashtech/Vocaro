import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../services/supabase.ts";

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, displayName?: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data as UserProfile | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const p = await fetchProfile(user.id);
    setProfile(p);
  };

  useEffect(() => {
    let active = true;

    async function initializeAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;

        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          const p = await fetchProfile(u.id);
          if (active) setProfile(p);
        }
      } catch (err) {
        console.error("Error initializing auth session:", err);
      } finally {
        setLoading(false);
      }
    }

    // Failsafe timeout to prevent infinite loading screens
    const failsafe = setTimeout(() => {
      setLoading(false);
    }, 5000);

    initializeAuth().then(() => clearTimeout(failsafe));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      if (!active) return;
      setUser(u);
      if (u) {
        try {
          const p = await fetchProfile(u.id);
          if (active) setProfile(p);
        } catch (err) {
          console.error("Error fetching profile on auth change:", err);
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (
    email: string,
    password: string
  ): Promise<string | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return error.message;

    // Verify profile exists in profiles table
    const p = await fetchProfile(data.user.id);
    if (!p) {
      // Profile missing — create it so table stays in sync
      await supabase.from("profiles").insert({
        user_id: data.user.id,
        email: data.user.email!,
      });
    }
    return null;
  };

  const signUp = async (
    email: string,
    password: string,
    displayName?: string
  ): Promise<string | null> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: displayName ? { data: { display_name: displayName } } : undefined,
    });
    if (error) return error.message;

    // The DB trigger will auto-create the profile.
    // As a fallback, insert manually if trigger hasn't fired yet.
    if (data.user) {
      const existing = await fetchProfile(data.user.id);
      if (!existing) {
        await supabase.from("profiles").insert({
          user_id: data.user.id,
          email: data.user.email!,
          display_name: displayName || null,
        });
      }
    }
    return null;
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
