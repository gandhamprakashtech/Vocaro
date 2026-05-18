export const APP_NAME = "WordVault";

export const MEMORY_STRENGTHS = {
  strong: "Strong",
  medium: "Medium",
  weak: "Weak",
} as const;

export type MemoryStrength = keyof typeof MEMORY_STRENGTHS;

export const WORD_CATEGORIES = [
  "General",
  "Academic",
  "Business",
  "Technology",
  "Daily Life",
  "Literature",
  "Science",
  "Other",
] as const;

export const ROUTES = {
  login: "/login",
  signup: "/signup",
  dashboard: "/",
  addWord: "/add",
  vocabulary: "/vocabulary",
  flashcards: "/flashcards",
  weeklyRecap: "/recap",
  profile: "/profile",
  reminders: "/reminders",
} as const;
