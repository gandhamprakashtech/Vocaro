import { useCallback, useEffect, useState } from "react";
import { supabase } from "../services/supabase.ts";
import type { User } from "@supabase/supabase-js";

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
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWords = useCallback(async () => {
    if (!user) {
      setWords([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: err } = await supabase
      .from("vocabulary")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (err) {
      setError(err.message);
    } else {
      setWords(data as VocabularyWord[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

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
    if (!user) return "Not authenticated";
    const { error: err } = await supabase.from("vocabulary").insert([
      {
        ...wordData,
        user_id: user.id,
        memory_strength: "weak",
        revision_count: 0,
        favorite: false,
      },
    ]);
    if (err) return err.message;
    await fetchWords();
    return null;
  };

  const updateWord = async (
    id: string,
    updates: Partial<VocabularyWord>
  ): Promise<string | null> => {
    const { error: err } = await supabase
      .from("vocabulary")
      .update(updates)
      .eq("id", id);
    if (err) return err.message;
    await fetchWords();
    return null;
  };

  const deleteWord = async (id: string): Promise<string | null> => {
    const { error: err } = await supabase
      .from("vocabulary")
      .delete()
      .eq("id", id);
    if (err) return err.message;
    await fetchWords();
    return null;
  };

  const toggleFavorite = async (id: string, current: boolean) => {
    await updateWord(id, { favorite: !current });
  };

  const searchWords = (query: string) => {
    if (!query.trim()) return words;
    const q = query.toLowerCase();
    return words.filter(
      (w) =>
        w.word.toLowerCase().includes(q) ||
        w.telugu_meaning.includes(q)
    );
  };

  const filterWords = (
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
  };

  return {
    words,
    loading,
    error,
    addWord,
    updateWord,
    deleteWord,
    toggleFavorite,
    searchWords,
    filterWords,
    refresh: fetchWords,
  };
}
