import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
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

const USER_CACHE_KEY = "wordvault:user";

function readCachedUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User;
    return parsed?.id ? parsed : null;
  } catch {
    return null;
  }
}

function persistUser(user: User | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      window.localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(USER_CACHE_KEY);
    }
  } catch {
    // Ignore storage failures (private mode or blocked storage).
  }
}

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data as UserProfile | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const cachedUserRef = useRef<User | null>(readCachedUser());
  const [user, setUser] = useState<User | null>(cachedUserRef.current);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(() => !cachedUserRef.current);

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
        persistUser(u);
        setLoading(false);
        if (u) {
          fetchProfile(u.id)
            .then((p) => {
              if (active) setProfile(p);
            })
            .catch((err) => {
              console.error("Error fetching profile on init:", err);
            });
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Error initializing auth session:", err);
        if (active) setLoading(false);
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
      persistUser(u);
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
      setLoading(false);
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
    persistUser(null);
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
