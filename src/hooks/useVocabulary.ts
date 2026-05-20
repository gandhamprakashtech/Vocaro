import { useCallback, useEffect, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../services/supabase.ts";
import { queryClient } from "../lib/queryClient.ts";
import { readCache, writeCache } from "../services/localDb.ts";
import { enqueueAction } from "../services/offlineQueue.ts";
import { createId } from "../utils/id.ts";

export interface VocabularyWord {
  id: string;
  user_id: string;
  word: string;
  telugu_meaning: string;
  example_sentence: string | null;
  category: string | null;
  memory_strength: "strong" | "medium" | "weak";
  revision_count: number;
  created_at: string;
  next_revision_date: string | null;
  favorite: boolean;
}

interface UseVocabularyReturn {
  words: VocabularyWord[];
  loading: boolean;
  error: string | null;
  addWord: (
    word: Omit<VocabularyWord, "id" | "user_id" | "created_at" | "revision_count" | "next_revision_date" | "memory_strength" | "favorite">
  ) => Promise<string | null>;
  updateWord: (id: string, updates: Partial<VocabularyWord>) => Promise<string | null>;
  deleteWord: (id: string) => Promise<string | null>;
  toggleFavorite: (id: string, current: boolean) => Promise<void>;
  searchWords: (query: string) => VocabularyWord[];
  filterWords: (filter: "recent" | "strong" | "weak" | "favorites") => VocabularyWord[];
  refresh: () => Promise<void>;
}

export function useVocabulary(user: User | null): UseVocabularyReturn {
  type AddPayload = {
    data: Omit<
      VocabularyWord,
      | "id"
      | "user_id"
      | "created_at"
      | "revision_count"
      | "next_revision_date"
      | "memory_strength"
      | "favorite"
    >;
    clientId: string;
    createdAt: string;
  };

  type UpdatePayload = { id: string; updates: Partial<VocabularyWord> };
  type DeletePayload = { id: string };
  type MutationContext = { previous: VocabularyWord[] };

  const queryKey = useMemo(() => ["vocabulary", user?.id], [user?.id]);
  const cacheKey = user?.id ? `vocabulary:${user.id}` : "";

  const fetchWords = useCallback(async () => {
    if (!user?.id) return [] as VocabularyWord[];
    const { data, error: err } = await supabase
      .from("vocabulary")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (err) throw err;
    return (data || []) as VocabularyWord[];
  }, [user?.id]);

  const {
    data: words = [],
    isPending,
    error,
  } = useQuery<VocabularyWord[], Error>({
    queryKey,
    queryFn: fetchWords,
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    readCache<VocabularyWord[]>(cacheKey).then((cached) => {
      if (!active || !cached) return;
      queryClient.setQueryData(queryKey, cached);
    });
    return () => {
      active = false;
    };
  }, [cacheKey, queryKey, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    writeCache(cacheKey, words);
  }, [cacheKey, user?.id, words]);

  const addMutation = useMutation<
    { offline: boolean },
    Error,
    AddPayload,
    MutationContext
  >({
    mutationFn: async (payload) => {
      if (!user?.id) throw new Error("Not authenticated");

      const record: VocabularyWord = {
        id: payload.clientId,
        user_id: user.id,
        word: payload.data.word,
        telugu_meaning: payload.data.telugu_meaning,
        example_sentence: payload.data.example_sentence ?? null,
        category: payload.data.category ?? null,
        memory_strength: "weak",
        revision_count: 0,
        created_at: payload.createdAt,
        next_revision_date: null,
        favorite: false,
      };

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await enqueueAction({ type: "vocabulary:add", payload: record });
        return { offline: true };
      }

      const { error: err } = await supabase.from("vocabulary").insert([record]);
      if (err) throw err;
      return { offline: false };
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous =
        (queryClient.getQueryData<VocabularyWord[]>(queryKey) as
          | VocabularyWord[]
          | undefined) || [];

      const optimistic: VocabularyWord = {
        id: payload.clientId,
        user_id: user?.id || "",
        word: payload.data.word,
        telugu_meaning: payload.data.telugu_meaning,
        example_sentence: payload.data.example_sentence ?? null,
        category: payload.data.category ?? null,
        memory_strength: "weak",
        revision_count: 0,
        created_at: payload.createdAt,
        next_revision_date: null,
        favorite: false,
      };

      queryClient.setQueryData(queryKey, [optimistic, ...previous]);
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous);
      }
    },
    onSettled: () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateMutation = useMutation<
    { offline: boolean },
    Error,
    UpdatePayload,
    MutationContext
  >({
    mutationFn: async (payload) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await enqueueAction({ type: "vocabulary:update", payload });
        return { offline: true };
      }
      const { error: err } = await supabase
        .from("vocabulary")
        .update(payload.updates)
        .eq("id", payload.id);
      if (err) throw err;
      return { offline: false };
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous =
        (queryClient.getQueryData<VocabularyWord[]>(queryKey) as
          | VocabularyWord[]
          | undefined) || [];
      queryClient.setQueryData(
        queryKey,
        previous.map((word) =>
          word.id === payload.id ? { ...word, ...payload.updates } : word
        )
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous);
      }
    },
    onSettled: () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation<
    { offline: boolean },
    Error,
    DeletePayload,
    MutationContext
  >({
    mutationFn: async (payload) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await enqueueAction({ type: "vocabulary:delete", payload });
        return { offline: true };
      }
      const { error: err } = await supabase
        .from("vocabulary")
        .delete()
        .eq("id", payload.id);
      if (err) throw err;
      return { offline: false };
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous =
        (queryClient.getQueryData<VocabularyWord[]>(queryKey) as
          | VocabularyWord[]
          | undefined) || [];
      queryClient.setQueryData(
        queryKey,
        previous.filter((word) => word.id !== payload.id)
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous);
      }
    },
    onSettled: () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const addWord = async (
    wordData: Omit<
      VocabularyWord,
      | "id"
      | "user_id"
      | "created_at"
      | "revision_count"
      | "next_revision_date"
      | "memory_strength"
      | "favorite"
    >
  ): Promise<string | null> => {
    if (!user?.id) return "Not authenticated";
    const clientId = createId();
    const createdAt = new Date().toISOString();
    try {
      await addMutation.mutateAsync({ data: wordData, clientId, createdAt });
      return null;
    } catch (err: unknown) {
      return err instanceof Error ? err.message : "Insert failed";
    }
  };

  const updateWord = async (
    id: string,
    updates: Partial<VocabularyWord>
  ): Promise<string | null> => {
    try {
      await updateMutation.mutateAsync({ id, updates });
      return null;
    } catch (err: unknown) {
      return err instanceof Error ? err.message : "Update failed";
    }
  };

  const deleteWord = async (id: string): Promise<string | null> => {
    try {
      await deleteMutation.mutateAsync({ id });
      return null;
    } catch (err: unknown) {
      return err instanceof Error ? err.message : "Delete failed";
    }
  };

  const toggleFavorite = async (id: string, current: boolean) => {
    await updateWord(id, { favorite: !current });
  };

  const searchWords = useCallback((query: string) => {
    if (!query.trim()) return words;
    const q = query.toLowerCase();
    return words.filter(
      (w) =>
        w.word.toLowerCase().includes(q) ||
        w.telugu_meaning.includes(q)
    );
  }, [words]);

  const filterWords = useCallback((
    filter: "recent" | "strong" | "weak" | "favorites"
  ) => {
    switch (filter) {
      case "recent":
        return [...words].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case "strong":
        return words.filter((w) => w.memory_strength === "strong");
      case "weak":
        return words.filter((w) => w.memory_strength === "weak");
      case "favorites":
        return words.filter((w) => w.favorite);
    }
  }, [words]);

  return {
    words,
    loading: isPending,
    error: error instanceof Error ? error.message : null,
    addWord,
    updateWord,
    deleteWord,
    toggleFavorite,
    searchWords,
    filterWords,
    refresh: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  };
}
