import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Brain,
  ThumbsUp,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.tsx";
import { useVocabulary } from "../hooks/useVocabulary.ts";
import type { VocabularyWord } from "../hooks/useVocabulary.ts";
import { ROUTES } from "../utils/constants.ts";
import { showToast } from "../components/Toast.tsx";
import { EmptyState } from "../components/EmptyState.tsx";
import { FlashcardsSkeleton } from "../components/skeletons/FlashcardsSkeleton.tsx";
import { readCache, writeCache } from "../services/localDb.ts";

export default function Flashcards() {
  const { user } = useAuth();
  const { words, updateWord, loading } = useVocabulary(user);
  const navigate = useNavigate();

  const [reviewWords, setReviewWords] = useState<VocabularyWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [animating, setAnimating] = useState(false);

  const cacheKey = user?.id ? `flashcards:${user.id}` : "";

  useEffect(() => {
    const sorted = [...words].sort((a, b) => {
      const order = { weak: 0, medium: 1, strong: 2 };
      return order[a.memory_strength] - order[b.memory_strength];
    });
    setReviewWords(sorted);
  }, [words]);

  useEffect(() => {
    if (!user?.id) return;
    readCache<VocabularyWord[]>(cacheKey).then((cached) => {
      if (!cached || words.length > 0) return;
      setReviewWords(cached);
    });
  }, [cacheKey, user?.id, words.length]);

  useEffect(() => {
    if (!user?.id) return;
    if (reviewWords.length === 0) return;
    writeCache(cacheKey, reviewWords.slice(0, 20));
  }, [cacheKey, reviewWords, user?.id]);

  const current = reviewWords[currentIndex];

  const handleFlip = () => {
    if (animating) return;
    setAnimating(true);
    setFlipped(!flipped);
    setTimeout(() => setAnimating(false), 400);
  };

  const handleNext = useCallback(() => {
    if (currentIndex < reviewWords.length - 1) {
      setFlipped(false);
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, reviewWords.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setFlipped(false);
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const handleMark = useCallback(
    async (strength: "strong" | "medium" | "weak") => {
      if (!current) return;
      const err = await updateWord(current.id, {
        memory_strength: strength,
        revision_count: current.revision_count + 1,
        next_revision_date: new Date(
          Date.now() +
            (strength === "strong"
              ? 7
              : strength === "medium"
              ? 3
              : 1) *
              24 *
              60 *
              60 *
              1000
        ).toISOString(),
      });
      if (err) {
        showToast(err, "error");
      } else {
        showToast(
          `Marked as ${strength}`,
          strength === "strong" ? "success" : "info"
        );
        handleNext();
      }
    },
    [current, updateWord, handleNext]
  );

  if (loading) {
    return <FlashcardsSkeleton />;
  }

  if (reviewWords.length === 0) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(ROUTES.dashboard)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Revision
          </h1>
        </div>
        <EmptyState
          title="No words to revise"
          description="Add some words first, then come back to practice!"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(ROUTES.dashboard)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Revision
          </h1>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {currentIndex + 1} / {reviewWords.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-300"
          style={{
            width: `${((currentIndex + 1) / reviewWords.length) * 100}%`,
          }}
        />
      </div>

      {/* Flashcard */}
      <div className="perspective" onClick={handleFlip}>
        <div
          className={`relative w-full aspect-[3/2] cursor-pointer transition-transform duration-400 preserve-3d ${
            flipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Front */}
          <div className="absolute inset-0 glass rounded-3xl flex flex-col items-center justify-center p-8 backface-hidden">
            <Brain className="w-8 h-8 text-indigo-500 mb-4" />
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 text-center">
              {current?.word}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
              Tap to reveal meaning
            </p>
          </div>

          {/* Back */}
          <div className="absolute inset-0 glass rounded-3xl flex flex-col items-center justify-center p-8 backface-hidden rotate-y-180">
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
              {current?.telugu_meaning}
            </p>
            {current?.example_sentence && (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center mt-2 max-w-xs">
                “{current.example_sentence}”
              </p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
              Tap to see word
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-3 rounded-2xl glass hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={handleFlip}
          className="p-3 rounded-2xl glass hover:shadow-md transition-all"
        >
          <RotateCw className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </button>
        <button
          onClick={handleNext}
          disabled={currentIndex === reviewWords.length - 1}
          className="p-3 rounded-2xl glass hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Mark Buttons */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => handleMark("strong")}
          className="py-3 rounded-xl bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-medium text-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
        >
          <ThumbsUp className="w-4 h-4" />
          Strong
        </button>
        <button
          onClick={() => handleMark("medium")}
          className="py-3 rounded-xl bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-medium text-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
        >
          <Brain className="w-4 h-4" />
          Medium
        </button>
        <button
          onClick={() => handleMark("weak")}
          className="py-3 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-medium text-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
        >
          <AlertTriangle className="w-4 h-4" />
          Weak
        </button>
      </div>
    </div>
  );
}
