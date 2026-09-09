import { sectionClasses } from '@/section/reference/classes';
'use client';

import Image from '@/section/reference/image';
import { ReactNode, useEffect, useRef, useState } from 'react';

import { cva } from 'class-variance-authority';
import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  useInView,
  useReducedMotion,
} from 'motion/react';
import * as m from 'motion/react-m';

import { useHeroViewport } from '@/section/reference/viewport-context';
import { cn } from '@/section/lib/utils';

interface Logo {
  alt: string;
  height: number;
  src: string;
  width: number;
}

interface ILogosProps {
  animated?: boolean;
  className?: string;
  gap?: 'default' | 'wide';
  layout?: 'flow' | 'grid';
  logos: readonly Logo[];
  showSeparator?: boolean;
  title?: string | ReactNode;
  titleWrapperClassName?: string;
  useMask?: boolean;
  variant?: 'row' | 'column';
}

const logosVariants = cva('flex flex-col', {
  variants: {
    variant: {
      row: 'justify-between gap-x-8 gap-y-6 md:flex-row md:items-center lg:gap-x-12',
      column: 'gap-y-9',
    },
  },
  defaultVariants: {
    variant: 'column',
  },
});

const ulVariants = cva('flex items-center', {
  variants: {
    gap: {
      default: 'gap-x-9',
      wide: 'gap-x-9 md:gap-x-14 lg:gap-x-16 xl:gap-x-24',
    },
  },
  defaultVariants: {
    gap: 'default',
  },
});

const gridVisibleCount = 12;
const gridMobileVisibleCount = 4;
const gridTabletVisibleCount = 6;
const gridLaptopVisibleCount = 10;
const gridLogoRotationIntervalMs = 1250;
const gridLogoEnterDelay = 0.1;
const gridLogoTransitionDuration = 0.6;
const gridLogoPairDelayMs = gridLogoTransitionDuration * 1000;
const gridLogoEase = [0.23, 1, 0.32, 1] as const;

function getGridSlotClassName(slotIndex: number) {
  if (slotIndex < gridMobileVisibleCount) return 'flex';
  if (slotIndex < gridTabletVisibleCount) return 'hidden sm:flex';
  if (slotIndex < gridLaptopVisibleCount) return 'hidden md:flex';

  return 'hidden xl:flex';
}

function takeRandomItems<T>(items: readonly T[], count: number) {
  const shuffledItems = [...items];

  for (let index = shuffledItems.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledItems[index], shuffledItems[randomIndex]] = [
      shuffledItems[randomIndex],
      shuffledItems[index],
    ];
  }

  return shuffledItems.slice(0, count);
}

function getGridColumnCount(activeSlotCount: number) {
  if (activeSlotCount <= gridMobileVisibleCount) return 2;
  if (activeSlotCount <= gridTabletVisibleCount) return 3;
  if (activeSlotCount <= gridLaptopVisibleCount) return 5;

  return 6;
}

function getDistantGridSlot(
  slotIndexes: readonly number[],
  originSlotIndex: number,
  activeSlotCount: number,
) {
  const columnCount = getGridColumnCount(activeSlotCount);
  const originColumn = originSlotIndex % columnCount;
  const originRow = Math.floor(originSlotIndex / columnCount);
  let greatestDistance = -1;
  let distantSlotIndexes: number[] = [];

  slotIndexes.forEach((slotIndex) => {
    if (slotIndex === originSlotIndex) return;

    const column = slotIndex % columnCount;
    const row = Math.floor(slotIndex / columnCount);
    const distance = Math.abs(column - originColumn) + Math.abs(row - originRow);

    if (distance > greatestDistance) {
      greatestDistance = distance;
      distantSlotIndexes = [slotIndex];
      return;
    }

    if (distance === greatestDistance) {
      distantSlotIndexes.push(slotIndex);
    }
  });

  return takeRandomItems(distantSlotIndexes, 1)[0];
}

function Logos({
  className,
  title,
  titleWrapperClassName,
  logos,
  variant = 'row',
  gap = 'default',
  layout = 'flow',
  showSeparator = false,
  useMask = true,
  animated = true,
}: ILogosProps) {
  const { width: viewportWidth, animationSuspended } = useHeroViewport();
  const isGrid = layout === 'grid';
  const canMarquee = !isGrid && animated && logos.length > 4;
  const visibleCount = Math.min(logos.length, gridVisibleCount);
  const keyCounter = useRef(0);
  const lastRotatedGridSlotRef = useRef<number | null>(null);
  const gridRef = useRef<HTMLUListElement>(null);
  const isInView = useInView(gridRef);
  const shouldReduceMotion = useReducedMotion();
  const [gridItems, setGridItems] = useState(() =>
    Array.from({ length: visibleCount }, (_, index) => ({
      logoIndex: index,
      key: `${index}-${keyCounter.current++}`,
    })),
  );
  const [activeGridSlotCount, setActiveGridSlotCount] = useState(() =>
    Math.min(visibleCount, gridMobileVisibleCount),
  );
  const canBlurTransition = isGrid && animated && logos.length > visibleCount;

  useEffect(() => {
    if (!isGrid) return;

    const breakpointVisibleCount = viewportWidth >= 1280 ? gridVisibleCount
      : viewportWidth >= 768 ? gridLaptopVisibleCount
        : viewportWidth >= 640 ? gridTabletVisibleCount : gridMobileVisibleCount;
    setActiveGridSlotCount(Math.min(visibleCount, breakpointVisibleCount));
  }, [isGrid, viewportWidth, visibleCount]);

  useEffect(() => {
    lastRotatedGridSlotRef.current = null;
    setGridItems(
      Array.from({ length: visibleCount }, (_, index) => ({
        logoIndex: index,
        key: `${index}-${keyCounter.current++}`,
      })),
    );
  }, [logos, visibleCount]);

  useEffect(() => {
    if (!canBlurTransition || !isInView || animationSuspended) return;

    let pairedRotationTimer: number | null = null;

    const replaceGridSlot = (slotIndex: number) => {
      setGridItems((previousItems) => {
        const visibleLogoIndexes = new Set(previousItems.map(({ logoIndex }) => logoIndex));
        const hiddenLogoIndexes = logos
          .map((_, index) => index)
          .filter((index) => !visibleLogoIndexes.has(index));
        const logoIndex = takeRandomItems(hiddenLogoIndexes, 1)[0];

        if (logoIndex === undefined) return previousItems;

        const nextItems = [...previousItems];
        nextItems[slotIndex] = {
          logoIndex,
          key: `${slotIndex}-${keyCounter.current++}`,
        };

        return nextItems;
      });
    };

    const rotateGridPair = () => {
      const activeSlotIndexes = Array.from({ length: activeGridSlotCount }, (_, index) => index);
      const nextSlotCandidates = activeSlotIndexes.filter(
        (slotIndex) => slotIndex !== lastRotatedGridSlotRef.current,
      );
      const primarySlotIndex = takeRandomItems(
        nextSlotCandidates.length > 0 ? nextSlotCandidates : activeSlotIndexes,
        1,
      )[0];

      if (primarySlotIndex === undefined) return;

      const pairedSlotIndex = getDistantGridSlot(
        activeSlotIndexes,
        primarySlotIndex,
        activeGridSlotCount,
      );

      lastRotatedGridSlotRef.current = primarySlotIndex;
      replaceGridSlot(primarySlotIndex);

      if (pairedSlotIndex === undefined) return;

      pairedRotationTimer = window.setTimeout(() => {
        lastRotatedGridSlotRef.current = pairedSlotIndex;
        replaceGridSlot(pairedSlotIndex);
      }, gridLogoPairDelayMs);
    };

    const interval = window.setInterval(rotateGridPair, gridLogoRotationIntervalMs);

    return () => {
      window.clearInterval(interval);

      if (pairedRotationTimer !== null) {
        window.clearTimeout(pairedRotationTimer);
      }
    };
  }, [activeGridSlotCount, animationSuspended, canBlurTransition, isInView, logos.length, visibleCount]);

  return (
    <div className={sectionClasses(cn(logosVariants({ variant }), className))}>
      {title ? (
        <div className={sectionClasses(cn('flex items-center gap-x-2', titleWrapperClassName))}>
          <span
            className={sectionClasses(cn(
              'block text-base leading-snug font-medium tracking-tight text-pretty text-muted-foreground md:text-lg',
              variant === 'column' && 'w-full',
              variant === 'column' && !showSeparator && 'md:mx-auto',
            ))}
          >
            {title}
          </span>
          {showSeparator ? <span className={sectionClasses("w-auto grow bg-muted")} role="separator" /> : null}
        </div>
      ) : null}

      <div
        className={sectionClasses(cn(
          'grid grow',
          isGrid && 'w-full',
          canMarquee && '-mx-4 w-[calc(100%+2rem)] overflow-x-hidden md:mx-0 md:w-full',
          canMarquee &&
            useMask &&
            'mask-[linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]',
        ))}
      >
        <div
          className={sectionClasses(cn(
            'w-full',
            !isGrid && 'flex',
            canMarquee && 'h-6 animate-logos motion-reduce:animate-none',
          ))}
        >
          <ul
            className={sectionClasses(cn(
              isGrid
                ? 'grid w-full grid-cols-2 grid-rows-2 gap-y-3 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-6'
                : 'flex items-center',
              !isGrid && ulVariants({ gap }),
              variant === 'column' && !canMarquee && !isGrid && 'flex-wrap justify-center gap-y-8',
              canMarquee && gap === 'default' && 'px-4',
              canMarquee && gap === 'wide' && 'px-4 md:px-7 lg:px-8 xl:px-12',
            ))}
            aria-label="Partner brands"
            ref={gridRef}
          >
            {canBlurTransition ? (
              <LazyMotion features={domAnimation}>
                {gridItems.map(({ logoIndex, key }, slotIndex) => {
                  const logo = logos[logoIndex];

                  return (
                    <li
                      className={sectionClasses(cn(
                        'relative h-20 items-center justify-center',
                        getGridSlotClassName(slotIndex),
                      ))}
                      key={`logo-slot-${slotIndex}`}
                    >
                      <AnimatePresence initial={false}>
                        <m.div
                          animate={{
                            filter: 'blur(0px)',
                            opacity: 1,
                            transform: 'scale(1)',
                            transition: {
                              delay: shouldReduceMotion ? 0 : gridLogoEnterDelay,
                              duration: shouldReduceMotion ? 0.15 : gridLogoTransitionDuration,
                              ease: gridLogoEase,
                            },
                          }}
                          className={sectionClasses("absolute inset-0 flex items-center justify-center")}
                          exit={{
                            filter: shouldReduceMotion ? 'blur(0px)' : 'blur(5px)',
                            opacity: 0,
                            transform: shouldReduceMotion ? 'scale(1)' : 'scale(0.8)',
                            transition: {
                              duration: shouldReduceMotion ? 0.15 : gridLogoTransitionDuration,
                              ease: gridLogoEase,
                            },
                          }}
                          initial={{
                            filter: shouldReduceMotion ? 'blur(0px)' : 'blur(5px)',
                            opacity: 0,
                            transform: shouldReduceMotion ? 'scale(1)' : 'scale(1.2)',
                          }}
                          key={key}
                        >
                          <Image
                            className="h-auto w-auto max-w-full shrink-0"
                            src={logo.src}
                            alt={logo.alt}
                            width={logo.width}
                            height={logo.height}
                            loading="eager"
                          />
                        </m.div>
                      </AnimatePresence>
                    </li>
                  );
                })}
              </LazyMotion>
            ) : (
              logos.slice(0, visibleCount).map(({ src, alt, width, height }, index) => (
                <li
                  className={sectionClasses(cn(
                    isGrid && 'h-20 items-center justify-center',
                    isGrid && getGridSlotClassName(index),
                  ))}
                  key={`logo_${index}`}
                >
                  <Image
                    className={cn(
                      'w-auto shrink-0',
                      isGrid ? 'h-auto max-w-full' : 'h-6 max-w-none',
                    )}
                    src={src}
                    alt={alt}
                    width={width}
                    height={height}
                    loading="eager"
                  />
                </li>
              ))
            )}
          </ul>

          {canMarquee ? (
            <ul
              className={sectionClasses(cn(
                'flex items-center',
                ulVariants({ gap }),
                gap === 'default' && 'px-4',
                gap === 'wide' && 'px-4 md:px-7 lg:px-8 xl:px-12',
              ))}
              aria-hidden="true"
            >
              {logos.map(({ src, width, height }, index) => (
                <li key={`logo_${index}_duplicate`}>
                  <Image
                    className="h-6 w-auto max-w-none shrink-0"
                    src={src}
                    alt=""
                    width={width}
                    height={height}
                    loading="eager"
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default Logos;
