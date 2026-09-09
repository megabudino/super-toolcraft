import type { ProjectedLogo } from "./logo-sphere-model";

export type LogoSphereImageTransform = Readonly<{
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  rotationDeg?: 0 | 90 | 180 | 270;
}>;

export type LogoSphereCardStyle = Readonly<{
  cornerRadius: number;
  shadowBlur: number;
  shadowColor: string;
  shadowOffset: number;
  shadowOpacity: number;
  strokeColor: string;
  strokeWidth: number;
}>;

export type LogoSphereCardGeometry = Readonly<{
  cornerRadius: number;
  shadowBlur: number;
  shadowOffset: number;
  shadowSpread: number;
  strokeWidth: number;
}>;

export const defaultLogoSphereCardStyle: LogoSphereCardStyle = {
  cornerRadius: 12,
  shadowBlur: 16,
  shadowColor: "#171717",
  shadowOffset: 8,
  shadowOpacity: 0.28,
  strokeColor: "#D7D6D2",
  strokeWidth: 1.5,
};

export type LogoSphereImageSource = Readonly<{
  id: string;
  image: CanvasImageSource;
  sourceRect?: Readonly<{
    height: number;
    width: number;
    x: number;
    y: number;
  }>;
  transform?: LogoSphereImageTransform;
}>;

export function getLogoSphereCardGeometry(
  projected: Pick<ProjectedLogo, "size">,
  baseLogoSize: number,
  style: LogoSphereCardStyle,
): LogoSphereCardGeometry {
  const depthScale = projected.size / Math.max(1, baseLogoSize);

  return {
    cornerRadius: Math.min(
      projected.size / 2,
      Math.max(0, style.cornerRadius * depthScale),
    ),
    shadowBlur: Math.max(0, style.shadowBlur * depthScale),
    shadowOffset: Math.max(0, style.shadowOffset * depthScale),
    shadowSpread: Math.max(0, style.shadowBlur * depthScale * 0.18),
    strokeWidth: Math.max(0, style.strokeWidth),
  };
}
