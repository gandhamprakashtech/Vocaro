import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ArrowLeft,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.tsx";
import { useVocabulary } from "../hooks/useVocabulary.ts";
import type { VocabularyWord } from "../hooks/useVocabulary.ts";
import { ROUTES } from "../utils/constants.ts";
import { showToast } from "../components/Toast.tsx";
import { EmptyState } from "../components/EmptyState.tsx";
import { LoadingSkeleton } from "../components/LoadingSkeleton.tsx";
import { WordCard } from "../components/WordCard.tsx";

type FilterType = "recent" | "strong" | "weak" | "favorites";

export default function Vocabulary() {
  const { user } = useAuth();
  const {
    loading,
    updateWord,
    deleteWord,
    toggleFavorite,
    searchWords,
    filterWords,
  } = useVocabulary(user);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("recent");
  const [showFilters, setShowFilters] = useState(false);
  const [editingWord, setEditingWord] = useState<VocabularyWord | null>(null);
  const [editWord, setEditWord] = useState("");
  const [editMeaning, setEditMeaning] = useState("");
  const [editSentence, setEditSentence] = useState("");

  const filtered = searchQuery.trim()
    ? searchWords(searchQuery)
    : filterWords(activeFilter);

  const handleDelete = async (id: string) => {
    const err = await deleteWord(id);
    if (err) showToast(err, "error");
    else showToast("Word deleted", "success");
  };

  const openEdit = (w: VocabularyWord) => {
    setEditingWord(w);
    setEditWord(w.word);
    setEditMeaning(w.telugu_meaning);
    setEditSentence(w.example_sentence || "");
  };

  const saveEdit = async () => {
    if (!editingWord) return;
    const err = await updateWord(editingWord.id, {
      word: editWord,
      telugu_meaning: editMeaning,
      example_sentence: editSentence || null,
    });
    if (err) showToast(err, "error");
    else {
      showToast("Word updated", "success");
      setEditingWord(null);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
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
            Vocabulary
          </h1>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <SlidersHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search words..."
          className="w-full pl-11 pr-4 py-3 rounded-xl glass text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex gap-2 flex-wrap animate-slide-up">
          {(["recent", "strong", "weak", "favorites"] as FilterType[]).map(
            (f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                  activeFilter === f
                    ? "bg-indigo-600 text-white shadow-md"
                    : "glass text-gray-600 dark:text-gray-400 hover:shadow-md"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            )
          )}
        </div>
      )}

      {/* Word Count */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {filtered.length} {filtered.length === 1 ? "word" : "words"}
      </p>

      {/* Word List */}
      {loading ? (
        <LoadingSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={
            searchQuery
              ? "No words found"
              : "Your vocabulary is empty"
          }
          description={
            searchQuery
              ? "Try a different search term"
              : "Start by adding your first word!"
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((word, i) => (
            <div
              key={word.id}
              className="animate-slide-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <WordCard
                word={word}
                onEdit={openEdit}
                onDelete={handleDelete}
                onFavorite={toggleFavorite}
              />
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingWord && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm glass rounded-2xl p-5 space-y-4 animate-slide-up">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Edit Word
            </h3>
            <input
              type="text"
              value={editWord}
              onChange={(e) => setEditWord(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 outline-none text-sm text-gray-900 dark:text-gray-100"
              placeholder="English word"
            />
            <input
              type="text"
              value={editMeaning}
              onChange={(e) => setEditMeaning(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 outline-none text-sm text-gray-900 dark:text-gray-100"
              placeholder="Telugu meaning"
            />
            <textarea
              value={editSentence}
              onChange={(e) => setEditSentence(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 outline-none text-sm text-gray-900 dark:text-gray-100 resize-none"
              rows={2}
              placeholder="Example sentence"
            />
            <div className="flex gap-3">
              <button
                onClick={saveEdit}
                className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setEditingWord(null)}
                className="flex-1 py-3 rounded-xl glass text-gray-600 dark:text-gray-400 font-medium text-sm hover:shadow-md transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
