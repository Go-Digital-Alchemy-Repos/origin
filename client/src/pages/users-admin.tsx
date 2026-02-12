import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, MoreVertical, Shield, UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

const mockUsers = [
  { id: "1", name: "Alex Johnson", email: "alex@mycompany.com", role: "admin", status: "active" },
  { id: "2", name: "Sarah Chen", email: "sarah@mycompany.com", role: "editor", status: "active" },
  { id: "3", name: "Marcus Webb", email: "marcus@mycompany.com", role: "viewer", status: "active" },
  { id: "4", name: "Priya Patel", email: "priya@mycompany.com", role: "editor", status: "invited" },
];

const roleColors: Record<string, string> = {
  admin: "default",
  editor: "secondary",
  viewer: "outline",
};

export default function UsersAdminPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = mockUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-users-title">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage team members and permissions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="w-56 pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-users"
            />
          </div>
          <Button data-testid="button-invite-user">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Invite User
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between gap-4 p-4"
                data-testid={`row-user-${user.id}`}
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {user.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {user.status === "invited" && (
                    <Badge variant="outline" className="text-xs">
                      Pending
                    </Badge>
                  )}
                  <Badge variant={roleColors[user.role] as any}>
                    {user.role === "admin" && <Shield className="mr-1 h-3 w-3" />}
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" data-testid={`button-user-menu-${user.id}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit Role</DropdownMenuItem>
                      <DropdownMenuItem>Reset Password</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Remove User</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
