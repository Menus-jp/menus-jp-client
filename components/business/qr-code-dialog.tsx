"use client";

import React, { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Download, Copy, Check } from "lucide-react";
import { QRCode } from "@/lib/types/business";

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCode: QRCode | null | undefined;
  businessName: string;
}

export function QRCodeDialog({
  open,
  onOpenChange,
  qrCode,
  businessName,
}: QRCodeDialogProps) {
  const [copied, setCopied] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleCopyLink = async () => {
    if (!qrCode?.url_encoded) return;
    try {
      await navigator.clipboard.writeText(qrCode.url_encoded);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = async () => {
    if (!qrCode?.qr_code_image) return;
    setDownloading(true);
    try {
      const response = await fetch(qrCode.qr_code_image);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${businessName}-qr-code.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to download:", err);
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!qrCode) return;

    const shareText = `${businessName}のQRコードを確認してください！\n${qrCode.url_encoded}`;

    if (navigator.share) {
      try {
        // For mobile devices that support native share
        const blob = await (await fetch(qrCode.qr_code_image)).blob();
        const file = new File([blob], `${businessName}-qr-code.png`, {
          type: "image/png",
        });

        await navigator.share({
          title: `${businessName} QR Code`,
          text: shareText,
          files: [file],
        });
      } catch (err) {
        // Fallback to text sharing if file sharing fails
        try {
          await navigator.share({
            title: `${businessName} QR Code`,
            text: shareText,
            url: qrCode.url_encoded,
          });
        } catch (shareErr) {
          console.error("Share failed:", shareErr);
        }
      }
    } else {
      // Fallback for desktop: copy to clipboard
      await handleCopyLink();
    }
  };

  if (!qrCode) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{businessName} QR Code</DialogTitle>
          <DialogDescription>
            Scan this QR code to access {businessName}'s menu and information
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-6">
          {/* QR Code Image */}
          <div className="bg-white p-4 rounded-xl border border-[var(--border-color)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={qrCode.qr_code_image}
              alt={`${businessName} QR Code`}
              className="w-64 h-64 object-contain"
            />
          </div>

          {/* URL Display */}
          <div className="w-full">
            <p className="text-xs text-[var(--text-tertiary)] mb-2">
              Business URL
            </p>
            <div className="flex items-center gap-2 bg-[var(--bg-lighter)] rounded-lg p-3 border border-[var(--border-color)]">
              <input
                type="text"
                readOnly
                value={qrCode.url_encoded}
                className="flex-1 bg-transparent text-xs text-[var(--text-dark)] outline-none truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center justify-center p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-dark)] transition-colors"
                title="Copy URL"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex gap-2">
            <Button
              onClick={handleShare}
              className="flex-1 bg-[var(--accent-gold)] hover:bg-[var(--accent-yellow)] text-white font-semibold text-sm h-10 rounded-xl border-0"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button
              onClick={handleDownload}
              disabled={downloading}
              variant="outline"
              className="flex-1 text-sm h-10 rounded-xl border-[var(--border-color)] hover:border-gray-400"
            >
              <Download className="h-4 w-4 mr-2" />
              {downloading ? "Downloading..." : "Download"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
