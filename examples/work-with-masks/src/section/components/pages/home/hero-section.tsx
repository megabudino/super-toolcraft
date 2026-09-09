import { sectionClasses } from '@/section/reference/classes';
import { Container } from '@/section/components/container';
import Logos from '@/section/components/logos';
import { cn } from '@/section/lib/utils';

import styles from './hero-section.module.css';
import { HeroVideoReveal } from './hero-video-reveal';
import { heroContent, partnerLogos } from './hero-content';

export function HeroSection({ isToolcraftPreview = false }: { isToolcraftPreview?: boolean } = {}) {
  return (
    <section
      className={sectionClasses(cn(
        'relative isolate overflow-x-clip text-grey-2',
        !isToolcraftPreview && '-mt-(--sticky-header-height)',
      ))}
      aria-labelledby="hero-title"
      data-toolcraft-hero-section=""
    >
      <div
        className={sectionClasses(cn(
          'relative isolate pt-12 sm:pt-16',
          styles.section,
          !isToolcraftPreview &&
            'min-h-svh pt-[calc(var(--sticky-header-height)+3rem)] [--hero-header-overlap:var(--sticky-header-height)] sm:pt-[calc(var(--sticky-header-height)+4rem)]',
        ))}
      >
        <Container className="relative z-10">
          <header className={sectionClasses("mx-auto flex w-full max-w-300 flex-col gap-10 sm:gap-12 md:flex-row md:items-start md:justify-between md:gap-8 xl:max-w-344 xl:gap-16")}>
            <h1
              className={sectionClasses(cn(
                'flex shrink-0 animate-in flex-col font-heading text-feature-title leading-display font-medium tracking-[-0.03em] duration-1000 fade-in-0 fill-mode-backwards motion-reduce:animate-none md:text-5xl md:leading-[1.1] xl:text-display-64 xl:leading-none xl:tracking-[-0.025em]',
                styles.heading,
              ))}
              data-toolcraft-hero-heading=""
              id="hero-title"
            >
              <span className={sectionClasses("block")}>{heroContent.heading[0]}</span>
              <span className={sectionClasses("block")}>{heroContent.heading[1]}</span>
            </h1>

            <div
              className={sectionClasses(cn(
                'grid w-full max-w-136 min-w-0 animate-in gap-4 text-[17px] tracking-tight delay-200 duration-1000 fade-in-0 fill-mode-backwards motion-reduce:animate-none md:max-w-[50%] md:gap-6 md:text-xl md:tracking-[-0.03em] xl:max-w-136 xl:text-2xl',
                styles.rightCopy,
              ))}
              data-toolcraft-hero-right-copy=""
            >
              <p
                className={sectionClasses(cn('leading-tight font-medium', styles.rightLead))}
                data-toolcraft-hero-right-lead=""
              >
                {heroContent.lead}
              </p>
              <p
                className={sectionClasses(cn('leading-tight text-grey-30', styles.rightBody))}
                data-toolcraft-hero-right-body=""
              >
                {heroContent.body}
              </p>
            </div>
          </header>

          <Logos
            className={cn(
              'mx-auto mt-20 w-full max-w-300 min-w-0 gap-y-8 md:mt-24 xl:mt-32 xl:max-w-none',
              styles.logos,
            )}
            data-toolcraft-hero-logos=""
            layout="grid"
            logos={partnerLogos}
            title={
              <span className={sectionClasses("font-normal text-grey-40")}>
                <span className={sectionClasses("font-medium text-foreground")}>{heroContent.captionEmphasis}</span>{' '}
                {heroContent.captionRest}
              </span>
            }
            titleWrapperClassName="w-full justify-start text-left md:justify-center md:text-center"
            variant="column"
          />
        </Container>
      </div>

      <Container className="relative z-10">
        {/* The Toolcraft preview freezes this footage; ship its first frame only. */}
        <HeroVideoReveal className={styles.video}>
          <img
            alt=""
            aria-hidden="true"
            data-hero-media-preview=""
            className={sectionClasses("relative left-1/2 block aspect-120/67 h-auto w-screen max-w-none -translate-x-1/2 object-cover")}
            height={1080}
            src={heroContent.previewSrc}
            width={1920}
          />
        </HeroVideoReveal>
      </Container>
    </section>
  );
}
