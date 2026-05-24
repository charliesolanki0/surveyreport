import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/new" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-navy text-navy-foreground">
            <FileText className="h-4 w-4" />
          </div>
          <span className="text-base font-semibold tracking-tight">SurveyReport</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard">Dashboard</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/new">New survey</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
