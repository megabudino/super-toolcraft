import type { ComponentProps } from 'react';
import { sectionClasses } from './classes';

export default function Link({ className, ...props }: ComponentProps<'a'>) {
  return <a {...props} className={sectionClasses(className)} />;
}
