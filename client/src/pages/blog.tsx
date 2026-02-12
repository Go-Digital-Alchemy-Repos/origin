import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PenTool,
  Plus,
  FileText,
  Eye,
  ExternalLink,
  Loader2,
  Sparkles,
  BookOpen,
  BarChart3,
} from "lucide-react";

interface BlogStatus {
  exists: boolean;
  collectionId?: string;
  totalPosts: number;
  publishedPosts: number;
}

interface BlogPost {
  id: string;
  itemId: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  featuredImage: string;
  author: string;
  category: string;
  tags: string;
  publishedDate: string;
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
  updatedAt: string | null;
}

function formatDate(d: string | null): string {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return d;
  }
}

export default function BlogPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: sitesList } = useQuery<Array<{ id: string; name: string; slug: string }>>({
    queryKey: ["/api/user/sites"],
  });

  const [siteId, setSiteId] = useState<string | null>(null);

  useEffect(() => {
    if (sitesList?.length && !siteId) {
      setSiteId(sitesList[0].id);
    }
  }, [sitesList, siteId]);

  const { data: blogStatus, isLoading: statusLoading } = useQuery<BlogStatus>({
    queryKey: [`/api/cms/sites/${siteId}/blog/status`],
    enabled: !!siteId,
  });

  const { data: publishedPosts } = useQuery<BlogPost[]>({
    queryKey: [`/api/cms/public/blog/${siteId}/posts`],
    enabled: !!siteId && !!blogStatus?.exists,
  });

  const setupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/cms/sites/${siteId}/blog/setup`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Blog created", description: "Your blog is ready. Start writing posts!" });
      queryClient.invalidateQueries({ queryKey: [`/api/cms/sites/${siteId}/blog/status`] });
      queryClient.invalidateQueries({ queryKey: [`/api/cms/public/blog/${siteId}/posts`] });
    },
    onError: (err: any) => {
      toast({ title: "Setup failed", description: err.message || "Could not create blog", variant: "destructive" });
    },
  });

  if (!sitesList?.length) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <PenTool className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Create a site first to start blogging.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (statusLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!blogStatus?.exists) {
    return <BlogSetupWizard onSetup={() => setupMutation.mutate()} isPending={setupMutation.isPending} />;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-blog-title">Blog</h1>
          <p className="text-sm text-muted-foreground">Manage your blog posts and content</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation(`/app/collections/${blogStatus.collectionId}`)}
            data-testid="button-manage-collection"
          >
            <FileText className="mr-1 h-4 w-4" />
            Manage Collection
          </Button>
          <Button
            size="sm"
            onClick={() => setLocation(`/app/collections/${blogStatus.collectionId}`)}
            data-testid="button-new-post"
          >
            <Plus className="mr-1 h-4 w-4" />
            New Post
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-total-posts">{blogStatus.totalPosts}</p>
                <p className="text-xs text-muted-foreground">Total Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-100 dark:bg-green-900/30">
                <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-published-posts">{blogStatus.publishedPosts}</p>
                <p className="text-xs text-muted-foreground">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/30">
                <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-draft-posts">{blogStatus.totalPosts - blogStatus.publishedPosts}</p>
                <p className="text-xs text-muted-foreground">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
          <CardTitle className="text-base">Published Posts</CardTitle>
          {sitesList?.[0]?.slug && (
            <Button variant="ghost" size="sm" asChild>
              <a
                href={`/api/public-preview/${sitesList[0].slug}?page=blog`}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-preview-blog"
              >
                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                Preview Blog
              </a>
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {!publishedPosts?.length ? (
            <div className="p-8 text-center">
              <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-3">No published posts yet</p>
              <Button
                size="sm"
                onClick={() => setLocation(`/app/collections/${blogStatus.collectionId}`)}
                data-testid="button-write-first-post"
              >
                <Plus className="mr-1 h-4 w-4" />
                Write Your First Post
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead className="hidden md:table-cell">Author</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {publishedPosts.map((post) => (
                  <TableRow key={post.itemId} data-testid={`row-post-${post.itemId}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {post.featuredImage && (
                          <img
                            src={post.featuredImage}
                            alt=""
                            className="h-8 w-8 rounded object-cover"
                          />
                        )}
                        <div>
                          <span className="font-medium text-sm">{post.title}</span>
                          <span className="block text-xs text-muted-foreground">/blog/{post.slug}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {post.category ? (
                        <Badge variant="secondary" className="text-xs">{post.category}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {post.author || "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatDate(post.publishedDate || post.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setLocation(`/app/collections/${blogStatus.collectionId}/items/${post.itemId}`)
                        }
                        data-testid={`button-edit-post-${post.itemId}`}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BlogSetupWizard({ onSetup, isPending }: { onSetup: () => void; isPending: boolean }) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <PenTool className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Start Your Blog</CardTitle>
          <CardDescription>
            Set up a blog for your site in one click. This will create a Blog Posts collection with all the fields you need for publishing articles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted/50 p-4 space-y-2">
            <p className="text-sm font-medium">What gets created:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                <span><strong>Blog Posts</strong> collection with title, slug, body, excerpt, featured image, author, category, tags, and SEO fields</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                <span><strong>Blog page</strong> automatically created and published</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                <span><strong>Public templates</strong> for /blog listing and /blog/:slug detail with Article schema markup</span>
              </li>
            </ul>
          </div>
          <Button
            className="w-full"
            onClick={onSetup}
            disabled={isPending}
            data-testid="button-setup-blog"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Blog
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
