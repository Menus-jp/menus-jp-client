import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { BusinessNotice } from "@/lib/api/business-notices";

interface NoticeAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (text: string, expires_at?: string | null) => Promise<void>;
  loading?: boolean;
  notice?: BusinessNotice | null;
}

export function NoticeAddDialog({ open, onOpenChange, onSubmit, loading, notice }: NoticeAddDialogProps) {
  const [text, setText] = useState("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (notice) {
      setText(notice.text);
      setExpiresAt(notice.expires_at ? notice.expires_at.split("T")[0] : "");
    } else {
      setText("");
      setExpiresAt("");
    }
    setError(null);
  }, [notice, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!text.trim()) {
      setError("お知らせ内容を入力してください / Please enter a notice.");
      return;
    }
    // Pass only the date string (YYYY-MM-DD) as expires_at
    try {
      await onSubmit(
        text.trim(),
        expiresAt || null
      );
      setText("");
      setExpiresAt("");
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || "Failed to add notice");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {notice ? "お知らせを編集 / Edit Notice" : "お知らせを追加 / Add Notice"}
            </DialogTitle>
          </DialogHeader>
          <textarea
            className="w-full border rounded p-2 mt-4 min-h-[80px]"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="お知らせ内容を入力 / Enter notice text"
            disabled={loading}
            maxLength={300}
            required
          />
          <div className="mt-4">
            <label className="block text-xs font-medium mb-1">有効期限 / Expires At (optional)</label>
            <input
              type="date"
              className="w-full border rounded p-2"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              disabled={loading}
            />
          </div>
          {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={loading}>
              {notice ? "保存 / Save" : "追加 / Add"}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                キャンセル / Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
