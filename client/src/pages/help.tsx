import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HelpCircle, Search, FileText, ChevronRight, ArrowLeft, BookOpen, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DocEntry, MarketplaceInstall, MarketplaceItem } from "@shared/schema";
import { useState } from "react";

const categoryLabels: Record<string, string> = {
  "getting-started": "Getting Started",
  help: "Help & Guides",
  guides: "Guides",
  marketplace: "Marketplace",
  modules: "Modules",
};

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<DocEntry | null>(null);

  const { data: helpDocs, isLoading: docsLoading } = useQuery<DocEntry[]>({
    queryKey: ["/api/docs", "help-resources"],
    queryFn: async () => {
      const res = await fetch("/api/docs?type=help");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  const { data: installs } = useQuery<MarketplaceInstall[]>({
    queryKey: ["/api/marketplace/installs"],
  });

  const { data: allItems } = useQuery<MarketplaceItem[]>({
    queryKey: ["/api/marketplace/items"],
  });

  const installedItemIds = new Set((installs || []).filter(i => i.enabled).map(i => i.itemId));
  const installedItems = (allItems || []).filter(item => installedItemIds.has(item.id));
  const installedDocSlugs = new Set(installedItems.map(i => i.docSlug).filter(Boolean));

  const filteredDocs = (helpDocs || []).filter((d) => {
    const matchesSearch =
      !searchQuery ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.content.toLowerCase().includes(searchQuery.toLowerCase());

    if (d.category === "marketplace") {
      return matchesSearch && installedDocSlugs.has(d.slug);
    }

    return matchesSearch;
  });

  const categories = [...new Set(filteredDocs.map((d) => d.category))];

  if (selectedDoc) {
    return (
      <div className="p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedDoc(null)}
          className="mb-4"
          data-testid="button-back-to-help"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Help
        </Button>
        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{categoryLabels[selectedDoc.category] || selectedDoc.category}</Badge>
              {selectedDoc.tags?.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-help-doc-title">
              {selectedDoc.title}
            </h1>
            <div className="prose prose-sm dark:prose-invert mt-6 max-w-none">
              {selectedDoc.content.split("\n").map((line, i) => {
                if (line.startsWith("## ")) {
                  return <h2 key={i} className="text-lg font-semibold mt-6 mb-2">{line.replace("## ", "")}</h2>;
                }
                if (line.startsWith("### ")) {
                  return <h3 key={i} className="text-base font-semibold mt-4 mb-1">{line.replace("### ", "")}</h3>;
                }
                if (line.startsWith("- ")) {
                  return <li key={i} className="ml-4 text-sm text-muted-foreground">{line.replace("- ", "")}</li>;
                }
                if (line.startsWith("```")) {
                  return <code key={i} className="block rounded-md bg-muted px-3 py-2 text-xs font-mono my-2">{line.replace(/```/g, "")}</code>;
                }
                if (line.trim() === "") return <br key={i} />;
                return <p key={i} className="text-sm leading-relaxed text-muted-foreground">{line}</p>;
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-help-title">Help & Resources</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Guides, tutorials, and documentation for your workspace.
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search help articles..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-help"
          />
        </div>
      </div>

      {docsLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredDocs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <HelpCircle className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No help articles found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => {
            const items = filteredDocs.filter((d) => d.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {categoryLabels[cat] || cat}
                </h3>
                <div className="space-y-2">
                  {items.map((doc) => (
                    <Card
                      key={doc.id}
                      className="cursor-pointer hover-elevate"
                      onClick={() => setSelectedDoc(doc)}
                      data-testid={`card-help-${doc.slug}`}
                    >
                      <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{doc.title}</h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {doc.content.substring(0, 120)}...
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
