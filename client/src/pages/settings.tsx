import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Save, Globe, Bell, Shield, Palette } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-settings-title">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your ORIGIN platform preferences.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">General</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input id="org-name" defaultValue="My Company" data-testid="input-org-name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="org-domain">Primary Domain</Label>
                <Input id="org-domain" defaultValue="mycompany.com" data-testid="input-org-domain" />
              </div>
              <Button size="sm" data-testid="button-save-general">
                <Save className="mr-1.5 h-3.5 w-3.5" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Appearance</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Label>Dark Mode</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Toggle between light and dark theme</p>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                  data-testid="switch-dark-mode"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Label>Compact Mode</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Reduce spacing for denser layouts</p>
                </div>
                <Switch data-testid="switch-compact-mode" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Notifications</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Receive updates about your sites</p>
                </div>
                <Switch defaultChecked data-testid="switch-email-notif" />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Label>Module Updates</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Get notified when modules have updates</p>
                </div>
                <Switch defaultChecked data-testid="switch-module-updates" />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Label>Security Alerts</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Critical security notifications</p>
                </div>
                <Switch defaultChecked data-testid="switch-security-alerts" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Security</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Add an extra layer of security</p>
                </div>
                <Badge variant="secondary">Not Configured</Badge>
              </div>
              <Separator />
              <div>
                <Label>API Keys</Label>
                <p className="text-xs text-muted-foreground mt-0.5 mb-3">Manage API access tokens</p>
                <Button variant="outline" size="sm" data-testid="button-manage-api-keys">
                  Manage Keys
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
