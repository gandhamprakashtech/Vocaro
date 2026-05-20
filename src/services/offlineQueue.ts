import { supabase } from "./supabase.ts";
import {
  addOutboxItem,
  getOutboxItems,
  removeOutboxItems,
} from "./localDb.ts";
import type { VocabularyWord } from "../hooks/useVocabulary.ts";
import type { Reminder } from "../hooks/useReminders.ts";

export type OfflineAction =
  | { type: "vocabulary:add"; payload: VocabularyWord }
  | {
      type: "vocabulary:update";
      payload: { id: string; updates: Partial<VocabularyWord> };
    }
  | { type: "vocabulary:delete"; payload: { id: string } }
  | { type: "reminders:add"; payload: Reminder }
  | {
      type: "reminders:update";
      payload: { id: string; updates: Partial<Reminder> };
    }
  | { type: "reminders:delete"; payload: { id: string } };

export async function enqueueAction(action: OfflineAction): Promise<void> {
  await addOutboxItem({ type: action.type, payload: action.payload });
}

export async function flushOutbox(): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  const items = await getOutboxItems();
  const completed: number[] = [];

  for (const item of items) {
    try {
      switch (item.type) {
        case "vocabulary:add": {
          const payload = item.payload as VocabularyWord;
          const { error } = await supabase.from("vocabulary").insert([payload]);
          if (error) throw error;
          break;
        }
        case "vocabulary:update": {
          const payload = item.payload as {
            id: string;
            updates: Partial<VocabularyWord>;
          };
          const { error } = await supabase
            .from("vocabulary")
            .update(payload.updates)
            .eq("id", payload.id);
          if (error) throw error;
          break;
        }
        case "vocabulary:delete": {
          const payload = item.payload as { id: string };
          const { error } = await supabase
            .from("vocabulary")
            .delete()
            .eq("id", payload.id);
          if (error) throw error;
          break;
        }
        case "reminders:add": {
          const payload = item.payload as Reminder;
          const { error } = await supabase.from("reminders").insert([payload]);
          if (error) throw error;
          break;
        }
        case "reminders:update": {
          const payload = item.payload as {
            id: string;
            updates: Partial<Reminder>;
          };
          const { error } = await supabase
            .from("reminders")
            .update(payload.updates)
            .eq("id", payload.id);
          if (error) throw error;
          break;
        }
        case "reminders:delete": {
          const payload = item.payload as { id: string };
          const { error } = await supabase
            .from("reminders")
            .delete()
            .eq("id", payload.id);
          if (error) throw error;
          break;
        }
      }

      if (item.id) completed.push(item.id);
    } catch {
      break;
    }
  }

  await removeOutboxItems(completed);
}
