import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Search, FileText, ChevronRight, ArrowLeft, CheckCircle2, XCircle, ClipboardCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DocEntry } from "@shared/schema";
import { useState } from "react";

function useIsSuperAdmin() {
  const { data } = useQuery<{ user: { role: string } }>({
    queryKey: ["/api/user/me"],
  });
  return data?.user?.role === "SUPER_ADMIN";
}

const categoryLabels: Record<string, string> = {
  "getting-started": "Getting Started",
  architecture: "Architecture",
  modules: "Modules",
  "api-reference": "API Reference",
  guides: "Guides",
  help: "Help",
};

interface ChecklistItem {
  file: string;
  label: string;
  area: string;
  exists: boolean;
  sizeBytes: number;
}

interface ChecklistData {
  items: ChecklistItem[];
  total: number;
  covered: number;
}

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<DocEntry | null>(null);
  const isSuperAdmin = useIsSuperAdmin();

  const { data: docs, isLoading } = useQuery<DocEntry[]>({
    queryKey: ["/api/docs"],
  });

  const filteredDocs = docs?.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [...new Set(docs?.map((d) => d.category) || [])];

  if (selectedDoc) {
    return (
      <div className="p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedDoc(null)}
          className="mb-4"
          data-testid="button-back-to-docs"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Docs
        </Button>
        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{categoryLabels[selectedDoc.category] || selectedDoc.category}</Badge>
              <Badge variant="outline">{selectedDoc.type === "developer" ? "Developer" : "Help"}</Badge>
              {selectedDoc.tags?.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-doc-title">
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
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-docs-title">Docs Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Developer documentation and help guides for the ORIGIN platform.
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search docs..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-docs"
          />
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all-docs">All</TabsTrigger>
          <TabsTrigger value="developer" data-testid="tab-developer-docs">Developer</TabsTrigger>
          <TabsTrigger value="help" data-testid="tab-help-docs">Help</TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="checklist" data-testid="tab-docs-checklist">
              <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" />
              Checklist
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <DocsList
            docs={filteredDocs}
            isLoading={isLoading}
            categories={categories}
            onSelect={setSelectedDoc}
          />
        </TabsContent>
        <TabsContent value="developer" className="mt-4">
          <DocsList
            docs={filteredDocs?.filter((d) => d.type === "developer")}
            isLoading={isLoading}
            categories={categories}
            onSelect={setSelectedDoc}
          />
        </TabsContent>
        <TabsContent value="help" className="mt-4">
          <DocsList
            docs={filteredDocs?.filter((d) => d.type === "help")}
            isLoading={isLoading}
            categories={categories}
            onSelect={setSelectedDoc}
          />
        </TabsContent>
        {isSuperAdmin && (
          <TabsContent value="checklist" className="mt-4">
            <DocsChecklist />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function DocsChecklist() {
  const { data, isLoading } = useQuery<ChecklistData>({
    queryKey: ["/api/docs/checklist"],
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ClipboardCheck className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">Could not load checklist.</p>
        </CardContent>
      </Card>
    );
  }

  const areas = [...new Set(data.items.map((i) => i.area))];
  const pct = Math.round((data.covered / data.total) * 100);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold" data-testid="text-checklist-title">Documentation Coverage</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {data.covered} of {data.total} system docs present
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-32 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                  data-testid="progress-coverage"
                />
              </div>
              <Badge variant={pct === 100 ? "default" : "secondary"} data-testid="badge-coverage-pct">
                {pct}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {areas.map((area) => {
        const areaItems = data.items.filter((i) => i.area === area);
        const areaCovered = areaItems.filter((i) => i.exists).length;
        return (
          <div key={area}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{area}</h3>
              <Badge variant="outline" className="text-[10px]">
                {areaCovered}/{areaItems.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {areaItems.map((item) => (
                <Card key={item.file} data-testid={`checklist-item-${item.file}`}>
                  <CardContent className="flex items-center gap-3 p-4">
                    {item.exists ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" data-testid={`icon-check-${item.file}`} />
                    ) : (
                      <XCircle className="h-5 w-5 shrink-0 text-muted-foreground/40" data-testid={`icon-missing-${item.file}`} />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{item.label}</h4>
                      <p className="text-xs text-muted-foreground">
                        {item.file}
                        {item.exists && item.sizeBytes > 0 && (
                          <span className="ml-2">
                            ({(item.sizeBytes / 1024).toFixed(1)} KB)
                          </span>
                        )}
                      </p>
                    </div>
                    <Badge variant={item.exists ? "default" : "outline"} className="shrink-0">
                      {item.exists ? "Present" : "Missing"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DocsList({
  docs,
  isLoading,
  categories,
  onSelect,
}: {
  docs?: DocEntry[];
  isLoading: boolean;
  categories: string[];
  onSelect: (doc: DocEntry) => void;
}) {
  if (isLoading) {
    return (
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
    );
  }

  if (!docs?.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">No docs found.</p>
        </CardContent>
      </Card>
    );
  }

  const grouped = categories
    .map((cat) => ({
      category: cat,
      items: docs.filter((d) => d.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.category}>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {categoryLabels[group.category] || group.category}
          </h3>
          <div className="space-y-2">
            {group.items.map((doc) => (
              <Card
                key={doc.id}
                className="cursor-pointer hover-elevate"
                onClick={() => onSelect(doc)}
                data-testid={`card-doc-${doc.slug}`}
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
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {doc.type === "developer" ? "Dev" : "Help"}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
