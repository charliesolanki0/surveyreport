import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

type Report = {
  id: string;
  property_address: string;
  survey_date: string;
  created_at: string;
};

function Dashboard() {
  const [reports, setReports] = useState<Report[] | null>(null);

  useEffect(() => {
    supabase
      .from("reports")
      .select("id, property_address, survey_date, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => setReports(data ?? []));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl">Your reports</h1>
            <p className="mt-1 text-sm text-muted-foreground">All survey reports you've generated.</p>
          </div>
          <Button asChild>
            <Link to="/new"><Plus className="h-4 w-4" /> New survey</Link>
          </Button>
        </div>

        <div className="mt-10">
          {reports === null ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : reports.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
              <h3 className="mt-4 text-base font-medium">No reports yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Create your first survey report to get started.</p>
              <Button asChild className="mt-6">
                <Link to="/new">Start a new survey</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border bg-card">
              {reports.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div>
                    <p className="font-medium">{r.property_address}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Surveyed {format(new Date(r.survey_date), "d MMM yyyy")} ·
                      {" "}Created {format(new Date(r.created_at), "d MMM yyyy")}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/report/$id" params={{ id: r.id }}>View report</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
