import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  FileText,
  FolderOpen,
  Link2,
  ArrowLeft,
  Pencil,
} from "lucide-react";
import type { Menu, MenuItem } from "@shared/schema";

interface MenuWithItems extends Menu {
  items: MenuItem[];
}

interface TreeNode extends MenuItem {
  children: TreeNode[];
  depth: number;
}

function buildTree(items: MenuItem[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const item of items) {
    map.set(item.id, { ...item, children: [], depth: 0 });
  }

  for (const item of items) {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      const parent = map.get(item.parentId)!;
      node.depth = parent.depth + 1;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortChildren = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder);
    for (const n of nodes) sortChildren(n.children);
  };
  sortChildren(roots);

  return roots;
}

function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];
  const walk = (list: TreeNode[], depth: number) => {
    for (const n of list) {
      result.push({ ...n, depth });
      walk(n.children, depth + 1);
    }
  };
  walk(nodes, 0);
  return result;
}

function treeToReorderPayload(
  nodes: TreeNode[],
  parentId: string | null = null,
): Array<{ id: string; parentId: string | null; sortOrder: number }> {
  const result: Array<{ id: string; parentId: string | null; sortOrder: number }> = [];
  nodes.forEach((node, index) => {
    result.push({ id: node.id, parentId, sortOrder: index });
    result.push(...treeToReorderPayload(node.children, node.id));
  });
  return result;
}

const ITEM_TYPE_OPTIONS = [
  { value: "page", label: "Page", icon: FileText },
  { value: "collection_list", label: "Collection", icon: FolderOpen },
  { value: "collection_item", label: "Collection Item", icon: FileText },
  { value: "external_url", label: "External URL", icon: ExternalLink },
];

function ItemTypeIcon({ type }: { type: string }) {
  const opt = ITEM_TYPE_OPTIONS.find((o) => o.value === type);
  if (!opt) return null;
  const Icon = opt.icon;
  return <Icon className="h-3.5 w-3.5 text-muted-foreground" />;
}

export default function MenusPage() {
  const { toast } = useToast();

  const { data: meData } = useQuery<{
    user: { id: string; role: string; name: string; email: string };
    activeWorkspaceId: string | null;
    workspaces: Array<{ id: string; name: string; slug: string; role: string; plan: string }>;
  }>({ queryKey: ["/api/user/me"] });

  useEffect(() => {
    if (meData && !meData.activeWorkspaceId && meData.workspaces.length > 0) {
      apiRequest("POST", "/api/user/select-workspace", { workspaceId: meData.workspaces[0].id })
        .then(() => queryClient.invalidateQueries({ queryKey: ["/api/user/me"] }));
    }
  }, [meData]);

  const { data: sitesList } = useQuery<Array<{ id: string; name: string; slug: string }>>({
    queryKey: ["/api/user/sites"],
    enabled: !!meData?.activeWorkspaceId,
  });

  const activeSite = sitesList?.[0];

  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuSlot, setNewMenuSlot] = useState<string>("none");
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const [editMenuName, setEditMenuName] = useState("");
  const [editMenuSlot, setEditMenuSlot] = useState<string>("none");
  const [deleteMenuId, setDeleteMenuId] = useState<string | null>(null);

  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [itemLabel, setItemLabel] = useState("");
  const [itemType, setItemType] = useState("page");
  const [itemTarget, setItemTarget] = useState("");
  const [itemOpenNew, setItemOpenNew] = useState(false);
  const [itemParentId, setItemParentId] = useState<string | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [dragItemId, setDragItemId] = useState<string | null>(null);

  const { data: menusList, isLoading: menusLoading } = useQuery<Menu[]>({
    queryKey: ["/api/cms/sites", activeSite?.id, "menus"],
    enabled: !!activeSite?.id,
    queryFn: async () => {
      const res = await fetch(`/api/cms/sites/${activeSite!.id}/menus`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load menus");
      return res.json();
    },
  });

  const { data: activeMenu, isLoading: menuLoading } = useQuery<MenuWithItems>({
    queryKey: ["/api/cms/menus", selectedMenuId],
    enabled: !!selectedMenuId,
    queryFn: async () => {
      const res = await fetch(`/api/cms/menus/${selectedMenuId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load menu");
      return res.json();
    },
  });

  const { data: pageOptions } = useQuery<Array<{ id: string; title: string; slug: string }>>({
    queryKey: ["/api/cms/sites", activeSite?.id, "pages"],
    enabled: !!activeSite?.id,
    queryFn: async () => {
      const res = await fetch(`/api/cms/sites/${activeSite!.id}/pages`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const createMenuMutation = useMutation({
    mutationFn: async (data: { name: string; slot: string | null }) => {
      const res = await apiRequest("POST", `/api/cms/sites/${activeSite!.id}/menus`, data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cms/sites", activeSite?.id, "menus"] });
      setCreateMenuOpen(false);
      setNewMenuName("");
      setNewMenuSlot("none");
      setSelectedMenuId(data.id);
      toast({ title: "Menu created" });
    },
    onError: () => {
      toast({ title: "Failed to create menu", variant: "destructive" });
    },
  });

  const updateMenuMutation = useMutation({
    mutationFn: async (data: { name: string; slot: string | null }) => {
      const res = await apiRequest("PATCH", `/api/cms/menus/${selectedMenuId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cms/sites", activeSite?.id, "menus"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cms/menus", selectedMenuId] });
      setEditMenuOpen(false);
      toast({ title: "Menu updated" });
    },
    onError: () => {
      toast({ title: "Failed to update menu", variant: "destructive" });
    },
  });

  const deleteMenuMutation = useMutation({
    mutationFn: async (menuId: string) => {
      await apiRequest("DELETE", `/api/cms/menus/${menuId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cms/sites", activeSite?.id, "menus"] });
      if (deleteMenuId === selectedMenuId) setSelectedMenuId(null);
      setDeleteMenuId(null);
      toast({ title: "Menu deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete menu", variant: "destructive" });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: { label: string; type: string; target: string | null; openInNewTab: boolean; parentId: string | null }) => {
      const res = await apiRequest("POST", `/api/cms/menus/${selectedMenuId}/items`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cms/menus", selectedMenuId] });
      setAddItemOpen(false);
      resetItemForm();
      toast({ title: "Item added" });
    },
    onError: () => {
      toast({ title: "Failed to add item", variant: "destructive" });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async (data: { label: string; type: string; target: string | null; openInNewTab: boolean }) => {
      const res = await apiRequest("PATCH", `/api/cms/menus/${selectedMenuId}/items/${editItemId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cms/menus", selectedMenuId] });
      setEditItemId(null);
      resetItemForm();
      toast({ title: "Item updated" });
    },
    onError: () => {
      toast({ title: "Failed to update item", variant: "destructive" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await apiRequest("DELETE", `/api/cms/menus/${selectedMenuId}/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cms/menus", selectedMenuId] });
      setDeleteItemId(null);
      toast({ title: "Item deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete item", variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (tree: Array<{ id: string; parentId: string | null; sortOrder: number }>) => {
      await apiRequest("PUT", `/api/cms/menus/${selectedMenuId}/reorder`, { tree });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cms/menus", selectedMenuId] });
    },
  });

  const resetItemForm = () => {
    setItemLabel("");
    setItemType("page");
    setItemTarget("");
    setItemOpenNew(false);
    setItemParentId(null);
  };

  const openEditItem = (item: MenuItem) => {
    setEditItemId(item.id);
    setItemLabel(item.label);
    setItemType(item.type);
    setItemTarget(item.target || "");
    setItemOpenNew(item.openInNewTab);
  };

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const tree = activeMenu ? buildTree(activeMenu.items) : [];
  const flatList = flattenTree(tree);

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDragItemId(itemId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", itemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      const sourceId = e.dataTransfer.getData("text/plain");
      if (!sourceId || sourceId === targetId || !activeMenu) return;

      const moveItem = (
        nodes: TreeNode[],
        srcId: string,
        tgtId: string,
      ): TreeNode[] => {
        let srcNode: TreeNode | null = null;
        const removeSource = (list: TreeNode[]): TreeNode[] =>
          list.reduce<TreeNode[]>((acc, n) => {
            if (n.id === srcId) {
              srcNode = n;
              return acc;
            }
            return [...acc, { ...n, children: removeSource(n.children) }];
          }, []);

        const updatedTree = removeSource(nodes);
        if (!srcNode) return nodes;

        const insertAfter = (list: TreeNode[]): TreeNode[] => {
          const result: TreeNode[] = [];
          for (const n of list) {
            result.push({ ...n, children: insertAfter(n.children) });
            if (n.id === tgtId) result.push(srcNode!);
          }
          return result;
        };

        return insertAfter(updatedTree);
      };

      const newTree = moveItem(tree, sourceId, targetId);
      const payload = treeToReorderPayload(newTree);
      reorderMutation.mutate(payload);
      setDragItemId(null);
    },
    [activeMenu, tree, reorderMutation],
  );

  const handleIndent = useCallback(
    (itemId: string, direction: "indent" | "outdent") => {
      if (!activeMenu) return;
      const flat = flattenTree(tree);
      const idx = flat.findIndex((n) => n.id === itemId);
      if (idx < 0) return;

      const item = flat[idx];
      let newParentId: string | null = null;

      if (direction === "indent" && idx > 0) {
        for (let i = idx - 1; i >= 0; i--) {
          if (flat[i].depth <= item.depth) {
            newParentId = flat[i].id;
            break;
          }
        }
      } else if (direction === "outdent" && item.parentId) {
        const parent = flat.find((n) => n.id === item.parentId);
        newParentId = parent?.parentId ?? null;
      }

      if (direction === "indent" && !newParentId) return;
      if (direction === "outdent" && newParentId === item.parentId) return;

      const updateParent = (nodes: TreeNode[], id: string, newPid: string | null): TreeNode[] => {
        let movedNode: TreeNode | null = null;
        const remove = (list: TreeNode[]): TreeNode[] =>
          list.reduce<TreeNode[]>((acc, n) => {
            if (n.id === id) {
              movedNode = n;
              return acc;
            }
            return [...acc, { ...n, children: remove(n.children) }];
          }, []);

        let updatedTree = remove(nodes);
        if (!movedNode) return nodes;

        if (!newPid) {
          updatedTree.push(movedNode);
          return updatedTree;
        }

        const addToParent = (list: TreeNode[]): TreeNode[] =>
          list.map((n) =>
            n.id === newPid
              ? { ...n, children: [...n.children, movedNode!] }
              : { ...n, children: addToParent(n.children) },
          );

        return addToParent(updatedTree);
      };

      const newTree = updateParent(tree, itemId, newParentId);
      const payload = treeToReorderPayload(newTree);
      reorderMutation.mutate(payload);
    },
    [activeMenu, tree, reorderMutation],
  );

  const handleMoveUp = useCallback(
    (itemId: string) => {
      if (!activeMenu) return;

      const moveSibling = (nodes: TreeNode[]): TreeNode[] => {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === itemId && i > 0) {
            const newNodes = [...nodes];
            [newNodes[i - 1], newNodes[i]] = [newNodes[i], newNodes[i - 1]];
            return newNodes;
          }
          const result = moveSibling(nodes[i].children);
          if (result !== nodes[i].children) {
            return nodes.map((n) => (n.id === nodes[i].id ? { ...n, children: result } : n));
          }
        }
        return nodes;
      };

      const newTree = moveSibling(tree);
      const payload = treeToReorderPayload(newTree);
      reorderMutation.mutate(payload);
    },
    [activeMenu, tree, reorderMutation],
  );

  const handleMoveDown = useCallback(
    (itemId: string) => {
      if (!activeMenu) return;

      const moveSibling = (nodes: TreeNode[]): TreeNode[] => {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === itemId && i < nodes.length - 1) {
            const newNodes = [...nodes];
            [newNodes[i], newNodes[i + 1]] = [newNodes[i + 1], newNodes[i]];
            return newNodes;
          }
          const result = moveSibling(nodes[i].children);
          if (result !== nodes[i].children) {
            return nodes.map((n) => (n.id === nodes[i].id ? { ...n, children: result } : n));
          }
        }
        return nodes;
      };

      const newTree = moveSibling(tree);
      const payload = treeToReorderPayload(newTree);
      reorderMutation.mutate(payload);
    },
    [activeMenu, tree, reorderMutation],
  );

  if (!activeSite) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-semibold" data-testid="text-menus-title">Menus</h1>
        <p className="mt-2 text-sm text-muted-foreground">Create a site first to manage navigation menus.</p>
      </div>
    );
  }

  if (selectedMenuId && activeMenu) {
    return (
      <div className="p-6">
        <div className="mb-4 flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => setSelectedMenuId(null)} data-testid="button-back-menus">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Menus
          </Button>
          <h1 className="text-lg font-semibold" data-testid="text-menu-name">{activeMenu.name}</h1>
          {activeMenu.slot && (
            <Badge variant="secondary" data-testid="badge-menu-slot">{activeMenu.slot}</Badge>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditMenuName(activeMenu.name);
                setEditMenuSlot(activeMenu.slot || "none");
                setEditMenuOpen(true);
              }}
              data-testid="button-edit-menu"
            >
              <Pencil className="mr-1 h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              size="sm"
              onClick={() => {
                resetItemForm();
                setAddItemOpen(true);
              }}
              data-testid="button-add-item"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Item
            </Button>
          </div>
        </div>

        {menuLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : flatList.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No menu items yet. Click "Add Item" to get started.</p>
          </Card>
        ) : (
          <Card className="divide-y">
            {flatList.map((node) => {
              const hasChildren = node.children.length > 0;
              const isExpanded = expandedNodes.has(node.id);
              const isHidden =
                node.parentId &&
                !expandedNodes.has(node.parentId) &&
                flatList.some((n) => n.id === node.parentId);

              if (isHidden) {
                const isAncestorCollapsed = (pid: string | null): boolean => {
                  if (!pid) return false;
                  if (!expandedNodes.has(pid)) return true;
                  const parent = flatList.find((n) => n.id === pid);
                  return parent ? isAncestorCollapsed(parent.parentId) : false;
                };
                if (isAncestorCollapsed(node.parentId)) return null;
              }

              return (
                <div
                  key={node.id}
                  className={`flex items-center gap-2 px-3 py-2 ${dragItemId === node.id ? "opacity-50" : ""}`}
                  style={{ paddingLeft: `${12 + node.depth * 24}px` }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, node.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, node.id)}
                  data-testid={`menu-item-row-${node.id}`}
                >
                  <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" data-testid={`grip-${node.id}`} />
                  {hasChildren ? (
                    <button
                      onClick={() => toggleExpand(node.id)}
                      className="shrink-0"
                      data-testid={`button-expand-${node.id}`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  ) : (
                    <div className="w-4" />
                  )}
                  <ItemTypeIcon type={node.type} />
                  <span className="flex-1 truncate text-sm" data-testid={`text-item-label-${node.id}`}>{node.label}</span>
                  {node.target && (
                    <span className="hidden max-w-[200px] truncate text-xs text-muted-foreground sm:inline" data-testid={`text-item-target-${node.id}`}>
                      {node.type === "external_url" ? node.target : node.target}
                    </span>
                  )}
                  {node.openInNewTab && (
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  )}
                  <div className="flex items-center gap-0.5" style={{ visibility: "visible" }}>
                    <Button variant="ghost" size="icon" onClick={() => handleMoveUp(node.id)} data-testid={`button-move-up-${node.id}`} title="Move up">
                      <ChevronRight className="h-3.5 w-3.5 -rotate-90" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleMoveDown(node.id)} data-testid={`button-move-down-${node.id}`} title="Move down">
                      <ChevronRight className="h-3.5 w-3.5 rotate-90" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleIndent(node.id, "indent")} data-testid={`button-indent-${node.id}`} title="Indent">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleIndent(node.id, "outdent")} data-testid={`button-outdent-${node.id}`} title="Outdent">
                      <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditItem(node)} data-testid={`button-edit-item-${node.id}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        resetItemForm();
                        setItemParentId(node.id);
                        setAddItemOpen(true);
                      }}
                      data-testid={`button-add-child-${node.id}`}
                      title="Add child"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteItemId(node.id)} data-testid={`button-delete-item-${node.id}`}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </Card>
        )}

        <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Menu Item</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label htmlFor="item-label">Label</Label>
                <Input
                  id="item-label"
                  value={itemLabel}
                  onChange={(e) => setItemLabel(e.target.value)}
                  placeholder="Menu item label"
                  data-testid="input-item-label"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Type</Label>
                <Select value={itemType} onValueChange={setItemType}>
                  <SelectTrigger data-testid="select-item-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {itemType === "page" && pageOptions && pageOptions.length > 0 ? (
                <div className="grid gap-1.5">
                  <Label>Page</Label>
                  <Select value={itemTarget} onValueChange={setItemTarget}>
                    <SelectTrigger data-testid="select-item-page">
                      <SelectValue placeholder="Select a page" />
                    </SelectTrigger>
                    <SelectContent>
                      {pageOptions.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="grid gap-1.5">
                  <Label htmlFor="item-target">
                    {itemType === "external_url" ? "URL" : "Target ID"}
                  </Label>
                  <Input
                    id="item-target"
                    value={itemTarget}
                    onChange={(e) => setItemTarget(e.target.value)}
                    placeholder={itemType === "external_url" ? "https://example.com" : "Enter target ID"}
                    data-testid="input-item-target"
                  />
                </div>
              )}
              {itemType === "external_url" && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={itemOpenNew}
                    onChange={(e) => setItemOpenNew(e.target.checked)}
                    data-testid="checkbox-open-new-tab"
                  />
                  Open in new tab
                </label>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={() =>
                  addItemMutation.mutate({
                    label: itemLabel,
                    type: itemType,
                    target: itemTarget || null,
                    openInNewTab: itemOpenNew,
                    parentId: itemParentId,
                  })
                }
                disabled={!itemLabel || addItemMutation.isPending}
                data-testid="button-confirm-add-item"
              >
                {addItemMutation.isPending ? "Adding..." : "Add Item"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editItemId} onOpenChange={(open) => { if (!open) { setEditItemId(null); resetItemForm(); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Menu Item</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-item-label">Label</Label>
                <Input
                  id="edit-item-label"
                  value={itemLabel}
                  onChange={(e) => setItemLabel(e.target.value)}
                  data-testid="input-edit-item-label"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Type</Label>
                <Select value={itemType} onValueChange={setItemType}>
                  <SelectTrigger data-testid="select-edit-item-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {itemType === "page" && pageOptions && pageOptions.length > 0 ? (
                <div className="grid gap-1.5">
                  <Label>Page</Label>
                  <Select value={itemTarget} onValueChange={setItemTarget}>
                    <SelectTrigger data-testid="select-edit-item-page">
                      <SelectValue placeholder="Select a page" />
                    </SelectTrigger>
                    <SelectContent>
                      {pageOptions.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-item-target">
                    {itemType === "external_url" ? "URL" : "Target ID"}
                  </Label>
                  <Input
                    id="edit-item-target"
                    value={itemTarget}
                    onChange={(e) => setItemTarget(e.target.value)}
                    data-testid="input-edit-item-target"
                  />
                </div>
              )}
              {itemType === "external_url" && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={itemOpenNew}
                    onChange={(e) => setItemOpenNew(e.target.checked)}
                    data-testid="checkbox-edit-open-new-tab"
                  />
                  Open in new tab
                </label>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={() =>
                  updateItemMutation.mutate({
                    label: itemLabel,
                    type: itemType,
                    target: itemTarget || null,
                    openInNewTab: itemOpenNew,
                  })
                }
                disabled={!itemLabel || updateItemMutation.isPending}
                data-testid="button-confirm-edit-item"
              >
                {updateItemMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={editMenuOpen} onOpenChange={setEditMenuOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Menu</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-menu-name">Name</Label>
                <Input
                  id="edit-menu-name"
                  value={editMenuName}
                  onChange={(e) => setEditMenuName(e.target.value)}
                  data-testid="input-edit-menu-name"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Slot</Label>
                <Select value={editMenuSlot} onValueChange={setEditMenuSlot}>
                  <SelectTrigger data-testid="select-edit-menu-slot">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="header">Header</SelectItem>
                    <SelectItem value="footer">Footer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() =>
                  updateMenuMutation.mutate({
                    name: editMenuName,
                    slot: editMenuSlot === "none" ? null : editMenuSlot,
                  })
                }
                disabled={!editMenuName || updateMenuMutation.isPending}
                data-testid="button-confirm-edit-menu"
              >
                {updateMenuMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteItemId} onOpenChange={(open) => { if (!open) setDeleteItemId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove this menu item and any children.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete-item">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteItemId && deleteItemMutation.mutate(deleteItemId)}
                data-testid="button-confirm-delete-item"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold" data-testid="text-menus-title">Menus</h1>
          <p className="text-sm text-muted-foreground">
            Manage navigation menus for {activeSite.name}
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateMenuOpen(true)} data-testid="button-create-menu">
          <Plus className="mr-1 h-3.5 w-3.5" />
          New Menu
        </Button>
      </div>

      {menusLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : !menusList || menusList.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No menus yet. Create one to start building your site navigation.</p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {menusList.map((menu) => (
            <Card
              key={menu.id}
              className="hover-elevate cursor-pointer p-4"
              onClick={() => setSelectedMenuId(menu.id)}
              data-testid={`card-menu-${menu.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-medium" data-testid={`text-menu-name-${menu.id}`}>{menu.name}</h3>
                  {menu.slot && (
                    <Badge variant="secondary" className="mt-1" data-testid={`badge-slot-${menu.id}`}>
                      {menu.slot}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteMenuId(menu.id);
                  }}
                  data-testid={`button-delete-menu-${menu.id}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createMenuOpen} onOpenChange={setCreateMenuOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Menu</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="menu-name">Name</Label>
              <Input
                id="menu-name"
                value={newMenuName}
                onChange={(e) => setNewMenuName(e.target.value)}
                placeholder="e.g., Main Navigation"
                data-testid="input-menu-name"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Slot</Label>
              <Select value={newMenuSlot} onValueChange={setNewMenuSlot}>
                <SelectTrigger data-testid="select-menu-slot">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="header">Header</SelectItem>
                  <SelectItem value="footer">Footer</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Assign a slot to automatically render this menu in the header or footer of your public site.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() =>
                createMenuMutation.mutate({
                  name: newMenuName,
                  slot: newMenuSlot === "none" ? null : newMenuSlot,
                })
              }
              disabled={!newMenuName || createMenuMutation.isPending}
              data-testid="button-confirm-create-menu"
            >
              {createMenuMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteMenuId} onOpenChange={(open) => { if (!open) setDeleteMenuId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Menu</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this menu and all its items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-menu">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMenuId && deleteMenuMutation.mutate(deleteMenuId)}
              data-testid="button-confirm-delete-menu"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
