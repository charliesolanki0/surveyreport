import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { format } from "date-fns";

export const Route = createFileRoute("/report/$id")({
  component: ReportView,
});

type Report = {
  id: string;
  property_address: string;
  survey_date: string;
  surveyor_name: string;
  report_text: string;
  created_at: string;
};

function ReportView() {
  const { id } = useParams({ from: "/report/$id" });
  const [report, setReport] = useState<Report | null | "missing">(null);

  useEffect(() => {
    supabase
      .from("reports")
      .select("id, property_address, survey_date, surveyor_name, report_text, created_at")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => setReport(data ?? "missing"));
  }, [id]);

  const copyToClipboard = async () => {
    if (!report || report === "missing") return;
    await navigator.clipboard.writeText(report.report_text);
    toast.success("Copied to clipboard");
  };

  const downloadPdf = () => {
    if (!report || report === "missing") return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 56;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = pageWidth - margin * 2;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Survey Report", margin, margin);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(report.property_address, margin, margin + 18);
    doc.text(
      `Surveyed ${format(new Date(report.survey_date), "d MMM yyyy")} · ${report.surveyor_name}`,
      margin, margin + 32,
    );

    doc.setFontSize(11);
    const lines = doc.splitTextToSize(report.report_text, maxWidth);
    let y = margin + 60;
    const lineHeight = 14;
    for (const line of lines) {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    }

    const safeName = report.property_address.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    doc.save(`survey-report-${safeName}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>
        </Button>

        {report === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : report === "missing" ? (
          <p className="text-sm text-muted-foreground">Report not found.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-serif text-4xl">{report.property_address}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Surveyed {format(new Date(report.survey_date), "d MMM yyyy")} · {report.surveyor_name}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" /> Copy
                </Button>
                <Button size="sm" onClick={downloadPdf}>
                  <Download className="h-4 w-4" /> Download PDF
                </Button>
              </div>
            </div>

            <article className="mt-10 rounded-lg border border-border bg-card p-8 sm:p-10">
              <pre className="whitespace-pre-wrap font-sans text-[15px] leading-7 text-foreground">
                {report.report_text}
              </pre>
            </article>
          </>
        )}
      </main>
    </div>
  );
}
