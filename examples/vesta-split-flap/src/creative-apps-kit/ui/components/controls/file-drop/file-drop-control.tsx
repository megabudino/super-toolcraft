"use client";

import * as React from "react";
import { CloudArrowUpIcon, XIcon } from "@phosphor-icons/react";

import { cn } from "../../../lib/utils";
import { Button, Field } from "../../primitives";

export type FileDropPreview = {
  alt?: string;
  size?: {
    height: number;
    width: number;
  };
  src: string;
};

export type FileDropControlProps = {
  accept: string;
  onClear?: () => void;
  onFileSelect?: (file: File) => void;
  preview?: FileDropPreview;
};

function isDragLeavingCurrentTarget(event: React.DragEvent<HTMLElement>): boolean {
  const nextTarget = event.relatedTarget;

  return !(nextTarget instanceof Node && event.currentTarget.contains(nextTarget));
}

function getFileInputAccept(accept: string): string {
  return accept
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .flatMap((part) => {
      switch (part) {
        case "gif":
          return [".gif", "image/gif"];
        case "heic":
          return [".heic", "image/heic"];
        case "heif":
          return [".heif", "image/heif"];
        case "jpg":
        case "jpeg":
          return [".jpg", ".jpeg", "image/jpeg"];
        case "png":
          return [".png", "image/png"];
        case "svg":
          return [".svg", "image/svg+xml"];
        case "tif":
        case "tiff":
          return [".tif", ".tiff", "image/tiff"];
        case "webp":
          return [".webp", "image/webp"];
        default:
          return part.startsWith(".") || part.includes("/") ? [part] : [];
      }
    })
    .join(",");
}

function getPreviewImageStyle(size: FileDropPreview["size"]): React.CSSProperties {
  if (!size || size.height <= 0 || size.width <= 0) {
    return { width: "100%" };
  }

  const maxWidth = Math.max(1, (196 * size.width) / size.height);

  return {
    width: `min(100%, ${maxWidth.toFixed(2)}px)`,
  };
}

export function FileDropControl({
  accept,
  onClear,
  onFileSelect,
  preview,
}: FileDropControlProps): React.JSX.Element {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const hasPreview = Boolean(preview?.src);

  function handleFile(file: File | undefined): void {
    if (!file) {
      return;
    }

    onFileSelect?.(file);
  }

  function openFileDialog(): void {
    inputRef.current?.click();
  }

  function handleDropTargetKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    openFileDialog();
  }

  return (
    <Field className="min-w-0 gap-2">
      <input
        accept={getFileInputAccept(accept)}
        aria-hidden="true"
        className="hidden"
        onChange={(event) => {
          handleFile(event.currentTarget.files?.[0]);
          event.currentTarget.value = "";
        }}
        ref={inputRef}
        tabIndex={-1}
        type="file"
      />
      <div
        aria-label={hasPreview ? "Replace image file" : "Browse image file"}
        className={cn(
          "group/file-upload relative flex min-h-16 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-[color:color-mix(in_oklab,var(--border)_18%,transparent)] bg-[color:color-mix(in_oklab,var(--foreground)_3%,transparent)] text-center shadow-none transition-[background-color,border-color,box-shadow] duration-150 ease-out hover:border-[color:color-mix(in_oklab,var(--border)_35%,transparent)] hover:bg-[color:color-mix(in_oklab,var(--foreground)_6%,transparent)] data-[drag-over=true]:border-[color:color-mix(in_oklab,var(--link)_28%,transparent)] data-[drag-over=true]:bg-[color:color-mix(in_oklab,var(--link)_13%,transparent)] data-[drag-over=true]:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--background)]",
          hasPreview ? "overflow-hidden p-2" : "px-3 py-3",
        )}
        data-drag-over={dragOver}
        onClick={openFileDialog}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(event) => {
          if (isDragLeavingCurrentTarget(event)) {
            setDragOver(false);
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          handleFile(event.dataTransfer?.files?.[0]);
        }}
        onKeyDown={handleDropTargetKeyDown}
        role="button"
        tabIndex={0}
      >
        {hasPreview ? (
          <>
            <img
              alt={preview?.alt ?? ""}
              className="block h-auto max-h-[196px] max-w-full rounded-[calc(var(--radius-lg)-4px)] object-contain"
              draggable={false}
              height={preview?.size?.height}
              src={preview?.src}
              style={getPreviewImageStyle(preview?.size)}
              width={preview?.size?.width}
            />
            {onClear ? (
              <Button
                aria-label="Remove image"
                className="absolute top-3 right-3"
                onClick={(event) => {
                  event.stopPropagation();
                  onClear();
                }}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <XIcon className="drop-shadow-[0_2px_1px_color-mix(in_oklab,var(--background)_80%,transparent)]" />
              </Button>
            ) : null}
          </>
        ) : (
          <>
            <CloudArrowUpIcon
              className="size-6 flex-none text-[color:var(--muted-foreground)] transition-colors duration-150 ease-out group-data-[drag-over=true]/file-upload:text-[color:var(--link)]"
              weight="light"
            />
            <p className="m-0 flex max-w-full flex-col text-xs leading-tight text-[color:color-mix(in_oklab,var(--foreground)_60%,transparent)] transition-colors duration-150 ease-out group-hover/file-upload:text-[color:color-mix(in_oklab,var(--foreground)_85%,transparent)] group-data-[drag-over=true]/file-upload:text-[color:var(--link)]">
              <span>Click to upload an image</span>
              <span>or drag it onto the canvas</span>
            </p>
          </>
        )}
      </div>
    </Field>
  );
}
