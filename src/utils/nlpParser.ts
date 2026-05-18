export interface ParsedReminder {
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  priority: "low" | "medium" | "high";
}

/**
 * Parses conversational tasks into structured reminder data.
 * Examples:
 * - "Call Krishna sir at 6 PM" -> { title: "Call Krishna sir", date: "2026-05-18", time: "18:00", priority: "medium" }
 * - "Submit assignment tomorrow" -> { title: "Submit assignment", date: "2026-05-19", time: "09:00", priority: "medium" }
 * - "Buy books this evening urgent" -> { title: "Buy books", date: "2026-05-18", time: "18:00", priority: "high" }
 */
export function parseNaturalLanguage(text: string): ParsedReminder {
  const now = new Date();
  let title = text.trim();
  let date = new Date();
  let time = "09:00"; // default time
  let priority: "low" | "medium" | "high" = "medium";
  let dateDetected = false;

  const lowerText = text.toLowerCase();

  // 1. Priority Detection
  const highPriorityKeywords = ["urgent", "asap", "important", "high priority", "critical", "must do"];
  const lowPriorityKeywords = ["low priority", "leisure", "when free", "relax", "optional"];

  if (highPriorityKeywords.some((keyword) => lowerText.includes(keyword))) {
    priority = "high";
    // Strip keyword from title
    highPriorityKeywords.forEach((kw) => {
      const regex = new RegExp(`\\b${kw}\\b`, "gi");
      title = title.replace(regex, "");
    });
  } else if (lowPriorityKeywords.some((keyword) => lowerText.includes(keyword))) {
    priority = "low";
    lowPriorityKeywords.forEach((kw) => {
      const regex = new RegExp(`\\b${kw}\\b`, "gi");
      title = title.replace(regex, "");
    });
  }

  // 2. Date & Time Heuristics
  if (lowerText.includes("tomorrow")) {
    date.setDate(now.getDate() + 1);
    dateDetected = true;
    title = title.replace(/\btomorrow\b/gi, "");
  } else if (lowerText.includes("today")) {
    dateDetected = true;
    title = title.replace(/\btoday\b/gi, "");
  } else if (lowerText.includes("this evening")) {
    dateDetected = true;
    time = "18:00";
    title = title.replace(/\bthis evening\b/gi, "");
  } else if (lowerText.includes("tonight")) {
    dateDetected = true;
    time = "20:00";
    title = title.replace(/\btonight\b/gi, "");
  } else {
    // Days of the week
    const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    for (let i = 0; i < 7; i++) {
      const dayName = daysOfWeek[i];
      const dayRegex = new RegExp(`\\b(on\\s+)?${dayName}\\b`, "i");
      if (dayRegex.test(title)) {
        const currentDay = now.getDay();
        let daysToAdd = i - currentDay;
        if (daysToAdd <= 0) daysToAdd += 7; // Pushes to next week's day
        date.setDate(now.getDate() + daysToAdd);
        dateDetected = true;
        title = title.replace(dayRegex, "");
        break;
      }
    }
  }

  // 3. Time Regex Parsing
  // Matches expressions like "at 6:30 PM", "at 6PM", "at 18:00", "at 10 am"
  const timeRegex = /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i;
  const timeMatch = title.match(timeRegex);

  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : null;

    if (ampm) {
      if (ampm === "pm" && hours < 12) hours += 12;
      if (ampm === "am" && hours === 12) hours = 0;
    } else {
      // Default standard logic: if hours < 8, assume PM (e.g., "at 6" means 6 PM)
      if (hours < 8) hours += 12;
    }

    // Ensure valid hours
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      const padH = String(hours).padStart(2, "0");
      const padM = String(minutes).padStart(2, "0");
      time = `${padH}:${padM}`;
      title = title.replace(timeMatch[0], "");
    }
  }

  // 4. Default Date adjustment
  // If no date was specifically mentioned, and the parsed time is in the past for today,
  // we intelligently schedule it for tomorrow!
  if (!dateDetected) {
    const [h, m] = time.split(":").map(Number);
    const targetDate = new Date();
    targetDate.setHours(h, m, 0, 0);
    if (targetDate <= now) {
      date.setDate(now.getDate() + 1);
    }
  }

  // 5. Title Cleaning & Polishing
  // Trim spaces, remove words like "at", "on", "for" left over at the end
  title = title
    .replace(/\s+/g, " ")
    .replace(/\s+(at|on|for|by|in|with)$/i, "")
    .trim();

  // If title was stripped down to nothing, fallback to a sensible name
  if (!title) {
    title = "Quick Reminder";
  } else {
    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return {
    title,
    date: `${yyyy}-${mm}-${dd}`,
    time,
    priority,
  };
}
