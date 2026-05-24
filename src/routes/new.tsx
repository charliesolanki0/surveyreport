import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/new")({
  component: NewSurvey,
});

const PROPERTY_TYPES = ["Detached house", "Semi-detached house", "Terraced house", "Bungalow", "Flat / Apartment", "Maisonette", "Commercial"];
const AGES = ["Pre-1900", "1900–1929", "1930–1945", "1946–1979", "1980–1999", "2000–present"];
const SECTIONS = ["Roof", "Walls & structure", "Damp & drainage", "Electrical & services"] as const;
const RATINGS = ["Good", "Fair", "Poor", "Critical"] as const;
type Rating = (typeof RATINGS)[number];

const WORKER_URL = "https://YOUR_WORKER.workers.dev/generate";

function NewSurvey() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [address, setAddress] = useState("");
  const [surveyDate, setSurveyDate] = useState(new Date().toISOString().slice(0, 10));
  const [propertyType, setPropertyType] = useState("");
  const [age, setAge] = useState("");
  const [surveyorName, setSurveyorName] = useState("");

  // Step 2
  const [conditions, setConditions] = useState<Record<string, { rating: Rating | ""; notes: string }>>(
    Object.fromEntries(SECTIONS.map((s) => [s, { rating: "", notes: "" }]))
  );

  // Step 3
  const [defects, setDefects] = useState<string[]>([]);
  const [defectInput, setDefectInput] = useState("");
  const [actions, setActions] = useState<string[]>([]);
  const [actionInput, setActionInput] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const addTag = (val: string, list: string[], setter: (v: string[]) => void, clear: () => void) => {
    const v = val.trim();
    if (v && !list.includes(v)) setter([...list, v]);
    clear();
  };

  const step1Valid = address && surveyDate && propertyType && age && surveyorName;

  const handleGenerate = async () => {
    setSubmitting(true);
    const payload = {
      property: { address, surveyDate, propertyType, age, surveyorName },
      conditions,
      defects,
      actions,
      additionalNotes,
    };

    let reportText = "";
    try {
      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Worker returned ${res.status}`);
      const data = await res.json().catch(() => null);
      reportText = (data && (data.report || data.text)) || (await res.text());
    } catch (err) {
      console.error(err);
      toast.error("Could not reach the report generator. Saving a draft instead.");
      reportText = buildPlaceholderReport(payload);
    }

    const { data, error } = await supabase
      .from("reports")
      .insert({
        property_address: address,
        survey_date: surveyDate,
        surveyor_name: surveyorName,
        survey_input: payload,
        report_text: reportText,
      })
      .select("id")
      .single();

    setSubmitting(false);
    if (error || !data) {
      toast.error(error?.message ?? "Failed to save report");
      return;
    }
    toast.success("Report generated");
    navigate({ to: "/report/$id", params: { id: data.id } });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-serif text-4xl">New survey</h1>
        <p className="mt-1 text-sm text-muted-foreground">Step {step} of 3</p>

        {/* Progress */}
        <div className="mt-4 flex gap-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className={`h-1 flex-1 rounded-full ${n <= step ? "bg-navy" : "bg-border"}`} />
          ))}
        </div>

        <div className="mt-10 rounded-lg border border-border bg-card p-6 sm:p-8">
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold">Property details</h2>
              <div>
                <Label htmlFor="address">Property address</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1.5" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="date">Survey date</Label>
                  <Input id="date" type="date" value={surveyDate} onChange={(e) => setSurveyDate(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="surveyor">Surveyor name</Label>
                  <Input id="surveyor" value={surveyorName} onChange={(e) => setSurveyorName(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>Property type</Label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Approximate age</Label>
                  <Select value={age} onValueChange={setAge}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {AGES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Condition ratings</h2>
              {SECTIONS.map((s) => (
                <div key={s} className="space-y-3 border-b border-border pb-5 last:border-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Label className="text-base">{s}</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {RATINGS.map((r) => {
                        const active = conditions[s].rating === r;
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setConditions((c) => ({ ...c, [s]: { ...c[s], rating: r } }))}
                            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                              active
                                ? "border-navy bg-navy text-navy-foreground"
                                : "border-border bg-background hover:bg-accent"
                            }`}
                          >
                            {r}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <Textarea
                    placeholder="Notes…"
                    value={conditions[s].notes}
                    onChange={(e) => setConditions((c) => ({ ...c, [s]: { ...c[s], notes: e.target.value } }))}
                  />
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Defects & recommendations</h2>

              <TagInput
                label="Key defects"
                placeholder="Add defect and press Enter"
                value={defectInput}
                setValue={setDefectInput}
                tags={defects}
                setTags={setDefects}
                onAdd={() => addTag(defectInput, defects, setDefects, () => setDefectInput(""))}
              />

              <TagInput
                label="Recommended actions"
                placeholder="Add action and press Enter"
                value={actionInput}
                setValue={setActionInput}
                tags={actions}
                setTags={setActions}
                onAdd={() => addTag(actionInput, actions, setActions, () => setActionInput(""))}
              />

              <div>
                <Label htmlFor="notes">Additional notes</Label>
                <Textarea id="notes" rows={5} value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} className="mt-1.5" />
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep(step - 1)}
              disabled={step === 1 || submitting}
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !step1Valid}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleGenerate} disabled={submitting}>
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : "Generate Report"}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function TagInput({
  label, placeholder, value, setValue, tags, setTags, onAdd,
}: {
  label: string; placeholder: string; value: string;
  setValue: (v: string) => void; tags: string[];
  setTags: (t: string[]) => void; onAdd: () => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5 flex gap-2">
        <Input
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd(); } }}
        />
        <Button type="button" variant="outline" onClick={onAdd}>Add</Button>
      </div>
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((t) => (
            <Badge key={t} variant="secondary" className="gap-1 py-1.5 pl-3 pr-1.5">
              {t}
              <button
                type="button"
                onClick={() => setTags(tags.filter((x) => x !== t))}
                className="rounded-full p-0.5 hover:bg-background"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function buildPlaceholderReport(p: {
  property: { address: string; surveyDate: string; propertyType: string; age: string; surveyorName: string };
  conditions: Record<string, { rating: string; notes: string }>;
  defects: string[]; actions: string[]; additionalNotes: string;
}) {
  const lines: string[] = [];
  lines.push(`BUILDING SURVEY REPORT`);
  lines.push(``);
  lines.push(`Property: ${p.property.address}`);
  lines.push(`Type: ${p.property.propertyType} (${p.property.age})`);
  lines.push(`Survey date: ${p.property.surveyDate}`);
  lines.push(`Surveyor: ${p.property.surveyorName}`);
  lines.push(``);
  lines.push(`CONDITION SUMMARY`);
  for (const [section, { rating, notes }] of Object.entries(p.conditions)) {
    lines.push(``);
    lines.push(`${section} — ${rating || "Not rated"}`);
    if (notes) lines.push(notes);
  }
  if (p.defects.length) {
    lines.push(``);
    lines.push(`KEY DEFECTS`);
    p.defects.forEach((d) => lines.push(`• ${d}`));
  }
  if (p.actions.length) {
    lines.push(``);
    lines.push(`RECOMMENDED ACTIONS`);
    p.actions.forEach((a) => lines.push(`• ${a}`));
  }
  if (p.additionalNotes) {
    lines.push(``);
    lines.push(`ADDITIONAL NOTES`);
    lines.push(p.additionalNotes);
  }
  lines.push(``);
  lines.push(`(Draft report — generated locally. Configure the AI worker endpoint for full reports.)`);
  return lines.join("\n");
}
