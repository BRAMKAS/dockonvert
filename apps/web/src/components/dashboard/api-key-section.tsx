"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, RefreshCw, Loader2, AlertTriangle } from "lucide-react";
import { API_URL } from "@/lib/constants";

export function ApiKeySection() {
  const [copied, setCopied] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [keyPrefix, setKeyPrefix] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    // Check if we just registered (key shown once)
    const justCreated = localStorage.getItem("dk_api_key");
    if (justCreated) {
      setNewKey(justCreated);
      // Clear it — this is the only time they see it
      localStorage.removeItem("dk_api_key");
    }

    // Fetch key prefix from API
    const token = localStorage.getItem("dk_token");
    if (token) {
      fetch(`${API_URL}/auth/api-keys`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          const keys = data.keys || [];
          const active = keys.find((k: { is_active: number }) => k.is_active);
          if (active) setKeyPrefix(active.key_prefix);
        })
        .catch(() => {});
    }
  }, []);

  function handleCopy() {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleDismissKey() {
    setNewKey(null);
  }

  async function handleRegenerate() {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    const token = localStorage.getItem("dk_token");
    if (!token) return;
    setRegenerating(true);
    setShowConfirm(false);
    try {
      const res = await fetch(`${API_URL}/auth/api-keys/regenerate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.api_key) {
        setNewKey(data.api_key);
        setKeyPrefix(data.key_prefix);
      }
    } catch {
      // ignore
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>Manage your API keys for accessing the conversion endpoints</CardDescription>
          </div>
          {!newKey && (
            <Button size="sm" variant="outline" onClick={handleRegenerate} disabled={regenerating}>
              {regenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              {showConfirm ? "Confirm — old key will stop working" : "Regenerate Key"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Newly created key — shown once */}
        {newKey && (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-green-300 bg-green-50 p-4 dark:border-green-700 dark:bg-green-950/30">
              <div className="flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-300">
                <AlertTriangle className="h-4 w-4" />
                Copy your API key now — you won&apos;t be able to see it again
              </div>
              <div className="mt-3 flex gap-2">
                <Input readOnly value={newKey} className="font-mono text-sm" />
                <Button onClick={handleCopy} variant="outline" size="sm" className="shrink-0">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="mt-2 text-xs text-green-700 dark:text-green-400">
                Store this key securely. After you dismiss this, only the prefix will be visible.
              </p>
              <Button variant="ghost" size="sm" className="mt-2" onClick={handleDismissKey}>
                I&apos;ve saved my key
              </Button>
            </div>
          </div>
        )}

        {/* Existing key — prefix only */}
        {!newKey && (
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Default</span>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Full key is hidden for security. Regenerate if you need a new one.
                </p>
              </div>
            </div>
            <div className="mt-3">
              <Input
                readOnly
                value={keyPrefix ? `${keyPrefix}••••••••••••••••••••••••••••••` : "No active key"}
                className="font-mono text-sm text-muted-foreground"
              />
            </div>
          </div>
        )}

        {showConfirm && !regenerating && (
          <div className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            Click &quot;Confirm&quot; again to regenerate. Your current key will be deactivated immediately.
          </div>
        )}

        <div className="mt-6 rounded-lg border border-dashed p-4">
          <h4 className="text-sm font-medium">Quick Start</h4>
          <div className="mt-2 rounded-md bg-zinc-950 p-3 text-xs text-zinc-100">
            <pre className="overflow-x-auto font-mono">
{`curl -X POST ${API_URL}/v1/convert/markdown \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -F "file=@document.pdf"`}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
