import { sectionClasses } from '@/section/reference/classes';
'use client';

import { useEffect, useRef, useState, type ComponentProps } from 'react';

import { cn } from '@/section/lib/utils';

import styles from './sticky-header.module.css';
import { useHeroViewport } from '@/section/reference/viewport-context';

type StickyHeaderProps = ComponentProps<'header'>;

function StickyHeader({ children, className, ...props }: StickyHeaderProps) {
  const { scrollRef } = useHeroViewport();
  const [hasScrolled, setHasScrolled] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = triggerRef.current;

    if (!trigger) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry) {
        setHasScrolled(!entry.isIntersecting);
      }
    }, { root: scrollRef.current });

    observer.observe(trigger);

    return () => observer.disconnect();
  }, [scrollRef]);

  return (
    <>
      <div ref={triggerRef} className={sectionClasses("pointer-events-none -mt-px h-px w-full")} aria-hidden="true" />
      <header
        className={sectionClasses(cn('sticky top-0 z-50 py-2', styles.header, className))}
        data-scrolled={hasScrolled}
        {...props}
      >
        {children}
      </header>
    </>
  );
}

export { StickyHeader };
