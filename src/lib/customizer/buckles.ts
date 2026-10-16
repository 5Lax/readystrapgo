import entries from "./buckles.json";
import type { BuckleAsset } from "./types";

export const buckleAssets: BuckleAsset[] = entries as BuckleAsset[];
export const getBuckleAsset = (sku?: string) =>
  buckleAssets.find((asset) => asset.id === sku);

/** Read only metadata. Never inject SVG markup into the document. */
export function readBuckleSvg(source: string, asset: BuckleAsset): BuckleAsset {
  const attr = (tag: string, key: string) =>
    tag.match(new RegExp(`\\b${key}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1];
  const root = source.match(/<svg\b[^>]*>/i)?.[0];
  const viewBox = (root && attr(root, "viewBox"))
    ?.trim()
    .split(/[\s,]+/)
    .map(Number);
  if (
    !viewBox ||
    viewBox.length !== 4 ||
    !viewBox.every(Number.isFinite) ||
    viewBox[2] <= 0 ||
    viewBox[3] <= 0
  )
    throw new Error("Buckle SVG needs a finite, positive mm viewBox.");
  const anchors = {} as BuckleAsset["anchors"];
  for (const side of ["left", "right"] as const) {
    const circle = source
      .match(/<circle\b[^>]*>/gi)
      ?.find((tag) => attr(tag, "id") === `anchor-${side}`);
    const x = circle ? Number(attr(circle, "cx") ?? NaN) : NaN;
    const y = circle ? Number(attr(circle, "cy") ?? NaN) : NaN;
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      x < viewBox[0] ||
      x > viewBox[0] + viewBox[2] ||
      y < viewBox[1] ||
      y > viewBox[1] + viewBox[3]
    )
      throw new Error(`Buckle SVG needs anchor-${side} inside its viewBox.`);
    anchors[side] = { x, y };
  }
  if (
    anchors.right.x <= anchors.left.x ||
    Math.abs(anchors.right.y - anchors.left.y) > 0.01
  )
    throw new Error(
      "Buckle anchors must run left to right on the same horizontal axis.",
    );
  return { ...asset, anchors, viewBox: viewBox as BuckleAsset["viewBox"] };
}
