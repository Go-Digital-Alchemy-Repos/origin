import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileUp,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowRight,
  FileText,
  Globe,
  Image,
  CornerDownRight,
} from "lucide-react";
import type { MigrationJob, MigrationLog } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type WizardStep = "upload" | "running" | "complete" | "history";

function formatDate(d: string | Date | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "completed"
      ? "default"
      : status === "failed"
        ? "destructive"
        : status === "running"
          ? "secondary"
          : "outline";

  const icon =
    status === "completed" ? (
      <CheckCircle2 className="h-3 w-3 mr-1" />
    ) : status === "failed" ? (
      <XCircle className="h-3 w-3 mr-1" />
    ) : status === "running" ? (
      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
    ) : (
      <Clock className="h-3 w-3 mr-1" />
    );

  return (
    <Badge variant={variant as any} data-testid="badge-job-status">
      {icon}
      {status}
    </Badge>
  );
}

export default function MigrationPage() {
  const [step, setStep] = useState<WizardStep>("upload");
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: sites } = useQuery<Array<{ id: string; name: string; slug: string }>>({
    queryKey: ["/api/cms/sites"],
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery<MigrationJob[]>({
    queryKey: ["/api/migration/jobs"],
  });

  const { data: activeJob } = useQuery<MigrationJob>({
    queryKey: [`/api/migration/jobs/${activeJobId}`],
    enabled: !!activeJobId && step === "running",
    refetchInterval: step === "running" ? 2000 : false,
  });

  const { data: jobLogs } = useQuery<MigrationLog[]>({
    queryKey: [`/api/migration/jobs/${activeJobId}/logs`],
    enabled: !!activeJobId && (step === "running" || step === "complete"),
    refetchInterval: step === "running" ? 2000 : false,
  });

  useEffect(() => {
    if (activeJob && activeJob.status !== "running" && step === "running") {
      setStep("complete");
      queryClient.invalidateQueries({ queryKey: ["/api/migration/jobs"] });
    }
  }, [activeJob, step]);

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !selectedSiteId) throw new Error("Select a site and file");

      const xmlContent = await selectedFile.text();
      const res = await apiRequest("POST", `/api/sites/${selectedSiteId}/migration/wp-import`, {
        xmlContent,
        fileName: selectedFile.name,
      });
      return res.json();
    },
    onSuccess: (job: MigrationJob) => {
      setActiveJobId(job.id);
      setStep(job.status === "completed" || job.status === "failed" ? "complete" : "running");
      queryClient.invalidateQueries({ queryKey: ["/api/migration/jobs"] });
      if (job.status === "completed") {
        toast({ title: "Import Complete", description: "WordPress content imported successfully." });
      } else if (job.status === "failed") {
        toast({ title: "Import Failed", description: "Check the logs for details.", variant: "destructive" });
      }
    },
    onError: (err: any) => {
      toast({ title: "Import Failed", description: err.message, variant: "destructive" });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".xml")) {
        toast({ title: "Invalid File", description: "Please select a WordPress XML export file.", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleViewJob = (job: MigrationJob) => {
    setActiveJobId(job.id);
    setStep(job.status === "running" ? "running" : "complete");
  };

  if (step === "running" || step === "complete") {
    const job = activeJob;
    const summary = (job?.summary || {}) as Record<string, any>;

    return (
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-migration-title">
              {step === "running" ? "Importing..." : "Import Complete"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {step === "running" ? "Your WordPress content is being imported." : "Review the import results below."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {job && <StatusBadge status={job.status} />}
            <Button
              variant="outline"
              onClick={() => {
                setStep("upload");
                setActiveJobId(null);
                setSelectedFile(null);
              }}
              data-testid="button-new-import"
            >
              New Import
            </Button>
          </div>
        </div>

        {step === "running" && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Processing WordPress export file...</p>
            </CardContent>
          </Card>
        )}

        {step === "complete" && job?.status === "completed" && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-pages-imported">{summary.pagesImported ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Pages Imported</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-posts-imported">{summary.postsImported ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Blog Posts</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <Image className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-media-processed">{summary.mediaProcessed ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Media Refs</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <CornerDownRight className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-redirects-created">{summary.redirectSuggestions ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Redirect Suggestions</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "complete" && job?.status === "failed" && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <XCircle className="h-10 w-10 text-destructive mb-4" />
              <p className="text-sm font-medium">Import failed</p>
              <p className="text-sm text-muted-foreground mt-1">
                {(summary as any)?.error || "Check the logs below for details."}
              </p>
            </CardContent>
          </Card>
        )}

        {jobLogs && jobLogs.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <h3 className="text-sm font-semibold">Import Log</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Level</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead className="w-40">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobLogs.map((log) => (
                      <TableRow key={log.id} data-testid={`log-row-${log.id}`}>
                        <TableCell>
                          <Badge
                            variant={
                              log.level === "error"
                                ? "destructive"
                                : log.level === "warn"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-xs"
                          >
                            {log.level}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{log.message}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(log.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "complete" && job?.status === "completed" && (summary.redirectSuggestions ?? 0) > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Redirect Suggestions Created</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Review and accept redirect suggestions on your site's Redirects page to preserve old WordPress URLs.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/app/redirects")} data-testid="button-view-redirects">
                  <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
                  View Redirects
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-migration-title">WordPress Migration</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Import pages, blog posts, and media from a WordPress XML export file.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">Step 1: Select Target Site</h2>
              <p className="text-sm text-muted-foreground mb-3">Choose which ORIGIN site will receive the imported content.</p>
              {!sites ? (
                <Skeleton className="h-9 w-64" />
              ) : sites.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sites found. Create a site first.</p>
              ) : (
                <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                  <SelectTrigger className="w-64" data-testid="select-target-site">
                    <SelectValue placeholder="Select a site..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-1">Step 2: Upload WordPress Export</h2>
              <p className="text-sm text-muted-foreground mb-3">
                In WordPress, go to Tools &rarr; Export &rarr; All content &rarr; Download Export File. Upload the resulting .xml file here.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xml"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-file-upload"
              />

              {!selectedFile ? (
                <div
                  className="border-2 border-dashed rounded-md p-8 text-center cursor-pointer hover-elevate"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="dropzone-upload"
                >
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium">Click to select your WordPress XML file</p>
                  <p className="text-xs text-muted-foreground mt-1">Maximum 50MB</p>
                </div>
              ) : (
                <div className="flex items-center gap-3 border rounded-md p-3" data-testid="file-selected-info">
                  <FileUp className="h-5 w-5 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    data-testid="button-remove-file"
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-1">Step 3: Import</h2>
              <p className="text-sm text-muted-foreground mb-3">
                Pages will be imported as ORIGIN pages (draft). Posts will be imported into the Blog collection. Redirect suggestions will be created for old WordPress URLs.
              </p>

              <Button
                onClick={() => importMutation.mutate()}
                disabled={!selectedSiteId || !selectedFile || importMutation.isPending}
                data-testid="button-start-import"
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Import...
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Start Import
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3">Import History</h2>
        {jobsLoading ? (
          <Card><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
        ) : !jobs || jobs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No previous imports.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id} data-testid={`row-job-${job.id}`}>
                      <TableCell className="font-medium">{job.fileName || "Unknown"}</TableCell>
                      <TableCell><StatusBadge status={job.status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(job.createdAt)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewJob(job)}
                          data-testid={`button-view-job-${job.id}`}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
