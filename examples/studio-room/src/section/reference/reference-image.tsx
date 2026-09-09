import type { CSSProperties, ImgHTMLAttributes } from 'react';
import { referenceClasses } from './reference-classes';

export interface StaticImageData {
  src: string;
  width: number;
  height: number;
  blurDataURL?: string;
}

export type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height'> & {
  src: string | StaticImageData;
  width?: number | `${number}`;
  height?: number | `${number}`;
  fill?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
  quality?: number;
  placeholder?: 'empty' | 'blur';
  blurDataURL?: string;
};

/** Static local assets retain Next Image's layout semantics, without a Next server. */
export function getImageProps({ src, fill, priority, unoptimized: _unoptimized,
  quality: _quality, placeholder: _placeholder, blurDataURL: _blur, style, ...props }: ImageProps) {
  const metadata = typeof src === 'string' ? undefined : src;
  const layout: CSSProperties = fill ? {
    position: 'absolute', height: '100%', width: '100%', left: 0, top: 0, right: 0,
    bottom: 0, color: 'transparent',
  } : { color: 'transparent' };
  return { props: {
    ...props,
    className: referenceClasses(props.className),
    src: metadata?.src ?? src as string,
    width: fill ? undefined : props.width ?? metadata?.width,
    height: fill ? undefined : props.height ?? metadata?.height,
    loading: props.loading ?? (priority ? 'eager' as const : 'lazy' as const),
    decoding: props.decoding ?? 'async' as const,
    fetchPriority: props.fetchPriority ?? (priority ? 'high' as const : undefined),
    style: { ...layout, ...style },
  }};
}

export default function ReferenceImage(props: ImageProps) {
  return <img {...getImageProps(props).props} />;
}
