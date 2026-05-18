import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, RotateCcw, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.tsx";
import { useVocabulary } from "../hooks/useVocabulary.ts";
import { WORD_CATEGORIES, ROUTES } from "../utils/constants.ts";
import { showToast } from "../components/Toast.tsx";

export default function AddWord() {
  const { user } = useAuth();
  const { addWord } = useVocabulary(user);
  const navigate = useNavigate();

  const [word, setWord] = useState("");
  const [teluguMeaning, setTeluguMeaning] = useState("");
  const [exampleSentence, setExampleSentence] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !teluguMeaning.trim()) {
      showToast("Word and Telugu meaning are required", "warning");
      return;
    }

    setSaving(true);
    const err = await addWord({
      word: word.trim(),
      telugu_meaning: teluguMeaning.trim(),
      example_sentence: exampleSentence.trim() || null,
      category: category || null,
    });
    setSaving(false);

    if (err) {
      showToast(err, "error");
    } else {
      showToast("Word saved successfully!", "success");
      setWord("");
      setTeluguMeaning("");
      setExampleSentence("");
      setCategory("");
    }
  };

  const handleClear = () => {
    setWord("");
    setTeluguMeaning("");
    setExampleSentence("");
    setCategory("");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(ROUTES.dashboard)}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Add New Word
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Expand your vocabulary
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="glass rounded-2xl p-5 space-y-4">
          {/* English Word */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              English Word *
            </label>
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="e.g., Serendipity"
              required
              className="w-full px-4 py-3.5 rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 dark:focus:border-indigo-400 outline-none text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-colors"
              autoFocus
            />
          </div>

          {/* Telugu Meaning */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Telugu Meaning *
            </label>
            <input
              type="text"
              value={teluguMeaning}
              onChange={(e) => setTeluguMeaning(e.target.value)}
              placeholder="e.g., అనుకోని సంతోషం"
              required
              className="w-full px-4 py-3.5 rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 dark:focus:border-indigo-400 outline-none text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-colors"
            />
          </div>

          {/* Example Sentence */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Example Sentence
              <span className="text-gray-400 dark:text-gray-600 font-normal lowercase ml-1">
                (optional)
              </span>
            </label>
            <textarea
              value={exampleSentence}
              onChange={(e) => setExampleSentence(e.target.value)}
              placeholder="e.g., Finding that book was a serendipity."
              rows={3}
              className="w-full px-4 py-3.5 rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 dark:focus:border-indigo-400 outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-colors resize-none"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Category
              <span className="text-gray-400 dark:text-gray-600 font-normal lowercase ml-1">
                (optional)
              </span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 dark:focus:border-indigo-400 outline-none text-sm text-gray-900 dark:text-gray-100 transition-colors appearance-none"
            >
              <option value="">Select category</option>
              {WORD_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Word
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-6 py-3.5 rounded-xl glass text-gray-600 dark:text-gray-400 font-medium text-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Clear
          </button>
        </div>
      </form>

      {/* Tip */}
      <div className="glass rounded-2xl p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Pro Tip
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Add example sentences to help you remember words in context. This
            improves long-term retention!
          </p>
        </div>
      </div>
    </div>
  );
}
