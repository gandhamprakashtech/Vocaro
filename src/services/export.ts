import { jsPDF } from "jspdf";

export interface WordData {
  word: string;
  telugu_meaning: string;
  example_sentence?: string | null;
  category?: string | null;
  memory_strength: string;
  created_at: string;
}

export function exportAsJSON(words: WordData[]) {
  const blob = new Blob([JSON.stringify(words, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wordvault-export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportAsPDF(words: WordData[]) {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text("WordVault - Vocabulary Export", 20, 20);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
  doc.line(20, 35, 190, 35);

  let y = 45;
  words.forEach((w, i) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`${i + 1}. ${w.word}`, 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(`   Telugu: ${w.telugu_meaning}`, 25, y + 6);
    if (w.example_sentence) {
      doc.text(`   Eg: ${w.example_sentence}`, 25, y + 12);
    }
    doc.text(
      `   Strength: ${w.memory_strength} | Category: ${w.category || "-"}`,
      25,
      y + 18
    );
    y += 28;
  });

  doc.save(`wordvault-export-${Date.now()}.pdf`);
}
