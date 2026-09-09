'use client';

import { referenceClasses } from '@/section/reference/reference-classes';
import { Select } from '@base-ui/react/select';
import { Check, ChevronDown, Plus, X } from 'lucide-react';
import Image from '@/section/reference/reference-image';
import { useEffect, useRef, useState } from 'react';
import { useSectionViewport } from '@/section/reference/reference-surface';

import { cn } from '@/section/lib/utils';
import {
  defaultStylePreset,
  getStylePreset,
  stylePresetCategories,
  type StylePresetId,
} from '@/section/shared/config/style-presets';

export { stylePresets, type StylePresetId } from '@/section/shared/config/style-presets';

export interface StyleReference {
  file: File;
  id: string;
  previewUrl: string;
}

interface ReferenceStripProps {
  maxVisible: number;
  onAdd: () => void;
  onClear: () => void;
  onRemove: (id: string) => void;
  references: StyleReference[];
  variant: 'desktop' | 'mobile';
}

const popupClassName =
  'relative z-50 overflow-hidden rounded-2xl bg-white text-black shadow-[0_10px_20px_4px_rgba(0,0,0,0.25)] outline-none transition-[opacity,transform] duration-150 ease-out data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 motion-reduce:transition-none';

export function StylePresetSelect({
  onValueChange,
  value,
}: {
  onValueChange: (value: StylePresetId) => void;
  value: StylePresetId;
}) {
  const selectedPreset = getStylePreset(value) ?? defaultStylePreset;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLElement | null>(null);
  const isMobileViewport = useSectionViewport().width < 768;
  const [showScrollFade, setShowScrollFade] = useState(true);

  return (
    <Select.Root<StylePresetId>
      value={value}
      onOpenChange={(open) => {
        if (open) setShowScrollFade(true);
      }}
      onValueChange={(nextValue) => {
        if (nextValue) onValueChange(nextValue);
      }}
    >
      <Select.Trigger
        ref={(element) => {
          triggerRef.current = element;
          portalRef.current = element?.closest<HTMLElement>('[data-recraft-site-root]') ?? null;
        }}
        type="button"
        aria-label="Choose a style preset"
        className={referenceClasses("group flex h-11 min-w-11 shrink-0 cursor-pointer! touch-manipulation items-center gap-2 rounded-lg text-base leading-none font-semibold tracking-[-0.02em] text-black outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0 focus-visible:ring-inset")}
      >
        <Image
          className="size-10 rounded-lg border border-black/[0.16] object-cover"
          src={selectedPreset.thumbnail}
          alt=""
          width={40}
          height={40}
          aria-hidden="true"
        />
        <Select.Value className={referenceClasses("hidden whitespace-nowrap transition-opacity group-hover:opacity-75 min-[28rem]:inline")}>
          {selectedPreset.label}
        </Select.Value>
        <Select.Icon className={referenceClasses("mr-0.5 -ml-1 inline-flex transition-opacity group-hover:opacity-75")}>
          <ChevronDown
            className={referenceClasses("size-4 transition-transform duration-150 group-data-[popup-open]:rotate-180 motion-reduce:transition-none")}
            strokeWidth={3}
          />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal container={portalRef}>
        <Select.Positioner
          className={referenceClasses("z-50 outline-none")}
          side="top"
          align={isMobileViewport ? 'center' : 'start'}
          alignOffset={isMobileViewport ? 0 : -8}
          anchor={() => {
            if (!isMobileViewport) return triggerRef.current;

            const trigger = triggerRef.current;
            const form = trigger?.closest('form');
            if (!trigger || !form) return trigger;

            const formRect = form.getBoundingClientRect();
            const triggerRect = trigger.getBoundingClientRect();

            return {
              contextElement: form,
              getBoundingClientRect: () =>
                new DOMRect(formRect.left, triggerRect.top, formRect.width, triggerRect.height),
            };
          }}
          collisionPadding={isMobileViewport ? 16 : 5}
          sideOffset={8}
          alignItemWithTrigger={false}
        >
          <Select.Popup
            className={referenceClasses(cn(popupClassName, 'w-[min(38.5rem,calc(100cqw-2rem))] max-w-full'))}
          >
            <Select.List
              aria-label="Style presets"
              className={referenceClasses("max-h-[min(32rem,var(--available-height))] overflow-y-auto overscroll-contain p-4")}
              onScroll={(event) => {
                if (event.currentTarget.scrollTop > 1) setShowScrollFade(false);
              }}
            >
              {stylePresetCategories.map((category) => (
                <Select.Group className={referenceClasses("py-3 first:pt-0 last:pb-0")} key={category.id}>
                  <Select.GroupLabel className={referenceClasses("px-1 pb-2 text-[0.6875rem] leading-none font-semibold tracking-[0] text-black/60 uppercase")}>
                    {category.label}
                  </Select.GroupLabel>
                  <div className={referenceClasses("grid grid-cols-2 gap-2 min-[34rem]:grid-cols-3")}>
                    {category.presets.map((preset) => (
                      <Select.Item
                        className={referenceClasses("group relative flex cursor-pointer touch-manipulation items-center gap-2 rounded-xl border border-black/10 bg-transparent p-[0.3125rem] pr-[1.9375rem] outline-none data-[highlighted]:border-black/20 data-[highlighted]:bg-black/[0.03] data-[selected]:border-black/25 data-[selected]:bg-[#e9ff88]")}
                        key={preset.id}
                        value={preset.id}
                      >
                        <Image
                          className="size-[3.25rem] shrink-0 rounded-lg border border-black/[0.16] object-cover"
                          src={preset.thumbnail}
                          alt=""
                          width={52}
                          height={52}
                          aria-hidden="true"
                        />
                        <Select.ItemText className={referenceClasses("text-[0.8125rem] leading-[1.21] font-medium tracking-[-0.02em] text-balance")}>
                          {preset.label}
                        </Select.ItemText>
                        <Select.ItemIndicator className={referenceClasses("absolute top-1/2 right-[0.6875rem] flex size-[1.125rem] -translate-y-1/2 items-center justify-center text-black")}>
                          <Check
                            className={referenceClasses("size-[1.125rem]")}
                            strokeWidth={3}
                            strokeLinecap="butt"
                            strokeLinejoin="miter"
                            aria-hidden="true"
                          />
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </div>
                </Select.Group>
              ))}
            </Select.List>
            <div
              className={referenceClasses(cn(
                'pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(to_top,white_0%,rgba(255,255,255,0.9)_35%,transparent_100%)] transition-opacity duration-150 ease-out motion-reduce:transition-none',
                showScrollFade ? 'opacity-100' : 'opacity-0',
              ))}
              aria-hidden="true"
            />
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

export function ReferenceStrip({
  maxVisible,
  onAdd,
  onClear,
  onRemove,
  references,
  variant,
}: ReferenceStripProps) {
  const visibleReferences = references.slice(0, maxVisible);
  const overflowCount = Math.max(references.length - maxVisible, 0);

  return (
    <div
      className={referenceClasses(cn(
        'min-w-0 items-center gap-1',
        variant === 'desktop' ? 'hidden md:flex' : 'flex md:hidden',
      ))}
    >
      <button
        type="button"
        className={referenceClasses("flex size-10 shrink-0 cursor-pointer! touch-manipulation items-center justify-center rounded-lg border border-black/20 bg-white/20 text-black transition-colors outline-none hover:bg-white/40 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 active:scale-[0.97]")}
        onClick={onAdd}
        aria-label="Add style reference images"
      >
        <Plus className={referenceClasses("size-5")} aria-hidden="true" />
      </button>

      {visibleReferences.map((reference, index) => (
        <button
          type="button"
          className={referenceClasses("group relative flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 active:scale-[0.97]")}
          key={reference.id}
          onClick={() => onRemove(reference.id)}
          aria-label={`Remove style reference ${index + 1}: ${reference.file.name}`}
          title={`Remove ${reference.file.name}`}
        >
          <Image
            unoptimized
            className="size-10 rounded-lg border border-black/[0.16] object-cover"
            src={reference.previewUrl}
            alt=""
            width={40}
            height={40}
            aria-hidden="true"
          />
          <span className={referenceClasses("absolute top-0 right-0 flex size-4 cursor-pointer items-center justify-center rounded-full bg-black text-white shadow-sm")}>
            <X className={referenceClasses("size-2.5")} strokeWidth={2.5} aria-hidden="true" />
          </span>
        </button>
      ))}

      {overflowCount > 0 ? (
        <span
          className={referenceClasses("flex size-10 shrink-0 items-center justify-center rounded-lg border border-black/20 bg-white text-sm leading-none font-medium tracking-[-0.02em] text-black")}
          aria-label={`${overflowCount} additional style ${overflowCount === 1 ? 'reference' : 'references'}`}
        >
          +{overflowCount}
        </span>
      ) : null}

      <span className={referenceClasses("ml-[0.1875rem] hidden shrink-0 text-base font-semibold text-black/40 md:inline")}>
        or
      </span>
      <button
        type="button"
        className={referenceClasses("h-11 min-w-11 shrink-0 cursor-pointer! touch-manipulation rounded-lg px-1 text-sm leading-none font-semibold tracking-[-0.02em] text-[#222cde] outline-none focus-visible:ring-2 focus-visible:ring-[#222cde] focus-visible:ring-offset-2 active:scale-[0.97] md:text-base")}
        onClick={onClear}
        aria-label="Delete all style references"
      >
        <span className={referenceClasses("md:hidden")}>Clear</span>
        <span className={referenceClasses("hidden md:inline")}>Delete All References</span>
      </button>
    </div>
  );
}
