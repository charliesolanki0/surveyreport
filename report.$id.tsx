// Local-only report store (no external services).
export type StoredReport = {
  id: string;
  property_address: string;
  survey_date: string;
  surveyor_name: string;
  survey_input: unknown;
  report_text: string;
  created_at: string;
};

const KEY = "surveyreport.reports.v1";

function read(): StoredReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredReport[]) : [];
  } catch {
    return [];
  }
}

function write(reports: StoredReport[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(reports));
}

export function listReports(): StoredReport[] {
  return read().sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getReport(id: string): StoredReport | null {
  return read().find((r) => r.id === id) ?? null;
}

export function createReport(input: Omit<StoredReport, "id" | "created_at">): StoredReport {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  const report: StoredReport = { ...input, id, created_at: new Date().toISOString() };
  write([report, ...read()]);
  return report;
}
