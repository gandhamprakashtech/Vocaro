import { memo } from "react";
import { Heart, Pencil, Trash2 } from "lucide-react";
import type { VocabularyWord } from "../hooks/useVocabulary.ts";
import { formatDate, classNames } from "../utils/helpers.ts";

interface WordCardProps {
  word: VocabularyWord;
  onEdit?: (word: VocabularyWord) => void;
  onDelete?: (id: string) => void;
  onFavorite?: (id: string, current: boolean) => void;
}

const strengthColors = {
  strong: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  medium:
    "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
  weak: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
};

function WordCardBase({ word, onEdit, onDelete, onFavorite }: WordCardProps) {
  return (
    <div className="glass rounded-2xl p-4 animate-scale-in group hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
            {word.word}
          </h3>
          <p className="text-base text-indigo-600 dark:text-indigo-400 font-medium">
            {word.telugu_meaning}
          </p>
        </div>
        <button
          onClick={() => onFavorite?.(word.id, word.favorite)}
          className={classNames(
            "shrink-0 p-2 rounded-xl transition-all duration-200",
            word.favorite
              ? "text-red-500 bg-red-50 dark:bg-red-900/20"
              : "text-gray-300 dark:text-gray-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10"
          )}
        >
          <Heart
            className={classNames(
              "w-4 h-4 transition-transform",
              word.favorite ? "fill-current scale-110" : ""
            )}
          />
        </button>
      </div>

      {word.example_sentence && (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-3 line-clamp-2">
          “{word.example_sentence}”
        </p>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span
            className={classNames(
              "text-[11px] font-medium px-2 py-0.5 rounded-full",
              strengthColors[word.memory_strength]
            )}
          >
            {word.memory_strength}
          </span>
          {word.category && (
            <span className="text-[11px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              {word.category}
            </span>
          )}
        </div>
        <span className="text-[10px] text-gray-400">
          {formatDate(word.created_at)}
        </span>
      </div>

      <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <button
            onClick={() => onEdit(word)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(word.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

export const WordCard = memo(WordCardBase);
