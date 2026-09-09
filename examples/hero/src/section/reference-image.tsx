import type { ComponentPropsWithRef } from "react";
import { referenceClasses } from "./reference/reference-classes";

export type StaticImageData = { src: string; width: number; height: number };
type ReferenceImageProps = Omit<ComponentPropsWithRef<"img">, "src"> & {
  src: string | StaticImageData;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  unoptimized?: boolean;
};

export function getImageProps({ src, fill, priority, quality: _quality, unoptimized: _unoptimized, style, ...props }: ReferenceImageProps) {
  return { props: {
    ...props,
    src: typeof src === "string" ? src : src.src,
    width: props.width ?? (typeof src === "string" ? undefined : src.width),
    height: props.height ?? (typeof src === "string" ? undefined : src.height),
    ...(priority ? { fetchPriority: "high" as const } : {}),
    style: fill ? { position: "absolute" as const, height: "100%", width: "100%", inset: 0, ...style } : style,
  } };
}

export default function ReferenceImage(props: ReferenceImageProps) {
  return <img {...getImageProps(props).props} className={referenceClasses(props.className)} />;
}
