import { sectionClasses } from '@/section/reference/classes';
import type { ComponentProps } from 'react';

import { cn } from '@/section/lib/utils';

type ContainerProps = ComponentProps<'div'>;

/** Constrains shared page content to the 1472px design column. */
function Container({ className, ...props }: ContainerProps) {
  return (
    <div
      className={sectionClasses(cn(
        'mx-auto w-[calc(100%-2.5rem)] max-w-content md:w-[calc(100%-4rem)] 3xl:w-full',
        className,
      ))}
      {...props}
    />
  );
}

export { Container };
