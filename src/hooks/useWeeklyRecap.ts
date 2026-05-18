import { useMemo } from "react";
import type { VocabularyWord } from "./useVocabulary.ts";

export interface WeeklyRecap {
  wordsThisWeek: number;
  difficultWords: VocabularyWord[];
  mostRevised: VocabularyWord[];
  strongCount: number;
  mediumCount: number;
  weakCount: number;
  totalWords: number;
}

export function useWeeklyRecap(words: VocabularyWord[]): WeeklyRecap {
  return useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const wordsThisWeek = words.filter(
      (w) => w.created_at >= weekAgo
    ).length;

    const difficultWords = words
      .filter((w) => w.memory_strength === "weak")
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    const mostRevised = [...words]
      .sort((a, b) => b.revision_count - a.revision_count)
      .slice(0, 5);

    const strongCount = words.filter(
      (w) => w.memory_strength === "strong"
    ).length;
    const mediumCount = words.filter(
      (w) => w.memory_strength === "medium"
    ).length;
    const weakCount = words.filter(
      (w) => w.memory_strength === "weak"
    ).length;

    return {
      wordsThisWeek,
      difficultWords,
      mostRevised,
      strongCount,
      mediumCount,
      weakCount,
      totalWords: words.length,
    };
  }, [words]);
}
