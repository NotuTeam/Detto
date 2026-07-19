"use client";

import { useState, useRef, useCallback } from "react";
import { Image as ImageIcon, X, Loader2 } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { createNote, getNoteImageSignature } from "../actions";
import { uploadAssetDirect, IMAGE_MAX_SIZE_MB, validateUploadSize } from "@/lib/upload-asset";
import { UploadOverlay } from "@/components/ui/UploadOverlay";
import { toast } from "sonner";

interface NoteComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function NoteComposer({ isOpen, onClose, onCreated }: NoteComposerProps) {
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePublicId, setImagePublicId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setMessage("");
    setImageUrl(null);
    setImagePublicId(null);
    setUploading(false);
    setSubmitting(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleImagePick = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const sizeError = validateUploadSize(file, IMAGE_MAX_SIZE_MB);
      if (sizeError) {
        toast.error(sizeError);
        if (fileRef.current) fileRef.current.value = "";
        return;
      }

      setUploading(true);
      setUploadProgress(0);
      try {
        const sigResult = await getNoteImageSignature();
        if (!sigResult.success || !sigResult.data) {
          toast.error("Failed to prepare upload");
          setUploading(false);
          setUploadProgress(null);
          return;
        }
        const result = await uploadAssetDirect(file, sigResult.data, "image", (pct) =>
          setUploadProgress(pct),
        );
        setImageUrl(result.secure_url);
        setImagePublicId(result.public_id);
      } catch {
        toast.error("Image upload failed. Please try again.");
      }
      setUploading(false);
      setUploadProgress(null);
      if (fileRef.current) fileRef.current.value = "";
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    if (!message.trim() && !imageUrl) return;
    setSubmitting(true);

    const result = await createNote({
      message: message.trim() || undefined,
      imageUrl: imageUrl || undefined,
      imagePublicId: imagePublicId || undefined,
    });

    if (result.success) {
      reset();
      onClose();
      onCreated();
    }
    setSubmitting(false);
  }, [message, imageUrl, imagePublicId, reset, onClose, onCreated]);

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="Leave a Note">
      <UploadOverlay progress={uploadProgress} />
      <div className="flex flex-col gap-4">
        {/* Image preview */}
        {imageUrl && (
          <div className="relative rounded-[var(--radius-md)] overflow-hidden">
            <img
              src={imageUrl}
              alt=""
              className="w-full max-h-50 object-cover"
            />
            <button
              onClick={() => {
                setImageUrl(null);
                setImagePublicId(null);
              }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Message input */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a sweet note..."
          rows={4}
          maxLength={500}
          className="w-full rounded-[var(--radius-md)] p-3 text-[0.9rem] resize-none outline-none"
          style={{
            background: "var(--surface-alt)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-subtle)",
          }}
        />

        {/* Actions row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleImagePick}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="p-2 rounded-full transition-colors cursor-pointer disabled:opacity-50"
              style={{
                background: "var(--surface-alt)",
                color: "var(--text-secondary)",
              }}
            >
              {uploading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <ImageIcon size={20} />
              )}
            </button>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {message.length}/500
            </span>
          </div>

          <Button
            size="sm"
            loading={submitting}
            disabled={(!message.trim() && !imageUrl) || uploading}
            onClick={handleSubmit}
          >
            Send
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
