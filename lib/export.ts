/**
 * Client-side export helpers: CSV and JSON download.
 */

export function downloadFile(
  content: string,
  filename: string,
  mimeType: string,
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export interface ExportRow {
  niche: string;
  question: string;
  polyYes: number;
  signalProb: number;
  divergence: number;
  detail: string;
}

export function exportCSV(rows: ExportRow[], filename = "divergences.csv") {
  const header = "niche,question,poly_yes,signal_prob,divergence,detail";
  const lines = rows.map(
    (r) =>
      `${r.niche},"${r.question.replace(/"/g, '""')}",${r.polyYes},${r.signalProb},${r.divergence},"${(r.detail ?? "").replace(/"/g, '""')}"`
  );
  downloadFile([header, ...lines].join("\n"), filename, "text/csv");
}

export function exportJSON(rows: ExportRow[], filename = "divergences.json") {
  downloadFile(JSON.stringify(rows, null, 2), filename, "application/json");
}
