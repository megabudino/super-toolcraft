import { sectionClasses } from '@/section/reference/classes';
'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import { useRef, type ReactNode } from 'react';

import { cn } from '@/section/lib/utils';

import styles from './hero-video-reveal.module.css';
import { useHeroViewport } from '@/section/reference/viewport-context';

export function HeroVideoReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { scrollRef } = useHeroViewport();
  const frameRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: frameRef,
    container: scrollRef,
    layoutEffect: false,
    offset: ['start 0.85', 'start 0.25'],
  });
  const leftEdge = useTransform(scrollYProgress, (progress) => `${-100 * progress ** 3}%`);
  const rightEdge = useTransform(scrollYProgress, (progress) => `${100 * progress ** 3}%`);

  return (
    <div
      className={sectionClasses(cn('relative isolate mt-12 md:mt-16 lg:mt-20', className))}
      data-toolcraft-hero-media=""
      id="hero-media"
      ref={frameRef}
    >
      {children}
      {/* Only the masks move; the video keeps its dimensions and centered crop. */}
      <motion.div
        aria-hidden="true"
        className={sectionClasses(cn(styles.edge, styles.leftEdge))}
        style={{ x: leftEdge }}
      />
      <motion.div
        aria-hidden="true"
        className={sectionClasses(cn(styles.edge, styles.rightEdge))}
        style={{ x: rightEdge }}
      />
    </div>
  );
}
