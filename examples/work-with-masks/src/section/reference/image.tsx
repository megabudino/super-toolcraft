import type { ComponentProps } from 'react';
import { sectionClasses } from './classes';

/** The hero uses local SVG logos, so no Next image optimizer is required. */
export default function Image({ className, alt, ...props }: ComponentProps<'img'>) {
  return <img {...props} alt={alt ?? ''} className={sectionClasses(className)} />;
}
