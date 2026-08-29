"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays, Loader2 } from "lucide-react";

type CalendarSettingsProps = {
  feedUrl: string | null;
  eventCount: number;
  syncing: boolean;
  lastSynced: string | null;
  onSave: (url: string) => Promise<void>;
  onDisconnect: () => void;
  onRefresh: () => Promise<void>;
};

export function CalendarSettings({
  feedUrl,
  eventCount,
  syncing,
  lastSynced,
  onSave,
  onDisconnect,
  onRefresh,
}: CalendarSettingsProps) {
  const [open, setOpen] = useState(false);
  const [draftUrl, setDraftUrl] = useState(feedUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onSave(draftUrl.trim());
      setOpen(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not connect to that calendar link.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setDraftUrl(feedUrl ?? "");
          setError(null);
        }
      }}
    >
      <DialogTrigger
        render={
          <Button variant={feedUrl ? "default" : "outline"} size="sm" title="Connect Apple Calendar">
            <CalendarDays />
            Calendar
          </Button>
        }
      />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Connect Apple Calendar</DialogTitle>
          <DialogDescription>
            Paste your private iCal link. Events from Apple Calendar will appear on planner
            calendar pages. This stays in your browser only.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="ical-url">iCal subscription link</Label>
            <Input
              id="ical-url"
              placeholder="webcal://... or https://..."
              value={draftUrl}
              onChange={(event) => setDraftUrl(event.target.value)}
            />
          </div>

          <div className="bg-muted rounded-lg p-3 text-xs leading-relaxed">
            <p className="font-medium">How to get the link on Mac:</p>
            <ol className="text-muted-foreground mt-1 list-decimal space-y-1 pl-4">
              <li>Open the Calendar app</li>
              <li>Right-click your calendar → Settings</li>
              <li>Turn on Public Calendar and copy the link</li>
              <li>Paste it above — treat it like a password</li>
            </ol>
            <p className="text-muted-foreground mt-2">
              After syncing, open a <strong>monthly calendar page</strong> (click JAN, FEB, etc.
              on the left tabs) to see your events on each day.
            </p>
          </div>

          {feedUrl && (
            <p className="text-muted-foreground text-xs">
              Connected · {eventCount} events loaded
              {lastSynced ? ` · last synced ${new Date(lastSynced).toLocaleString()}` : ""}
            </p>
          )}

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <div className="flex gap-2">
            {feedUrl && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={syncing}
                  onClick={() => void onRefresh()}
                >
                  {syncing ? <Loader2 className="animate-spin" /> : "Refresh"}
                </Button>
                <Button variant="outline" size="sm" onClick={onDisconnect}>
                  Disconnect
                </Button>
              </>
            )}
          </div>
          <Button disabled={saving || !draftUrl.trim()} onClick={() => void handleSave()}>
            {saving ? <Loader2 className="animate-spin" /> : "Save & sync"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
