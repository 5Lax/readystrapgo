import type { BuckleAsset, StrapConfig } from "./types";

/** One SVG user unit = one mm. All parts share the same transform. */
export function strapGeometry(config: StrapConfig, asset?: BuckleAsset) {
  const length = Number.isFinite(config.lengthMm)
    ? Math.max(1, Math.min(2000, config.lengthMm))
    : 1;
  const width = Number.isFinite(config.widthMm)
    ? Math.max(1, config.widthMm)
    : 25.4;
  const gap = asset ? 16 : 0;
  const buckleX = asset
    ? length + gap - asset.anchors.left.x + asset.viewBox[0]
    : length;
  const buckleY = asset
    ? width / 2 - asset.anchors.left.y + asset.viewBox[1]
    : 0;
  const rightAnchorX = asset
    ? length + gap + asset.anchors.right.x - asset.anchors.left.x
    : length;
  const totalWidth = asset
    ? Math.max(rightAnchorX, buckleX + asset.viewBox[2])
    : length;
  const pad = Math.max(22, totalWidth * 0.07);
  const fontSize = Math.max(5, totalWidth / 65);
  return {
    length,
    width,
    buckleX,
    buckleY,
    rightAnchorX,
    totalWidth,
    pad,
    fontSize,
    viewBox: `${-pad} ${-pad * 1.3} ${totalWidth + pad * 2.4} ${width + pad * 3.3}`,
    turnbackMm:
      config.ends === "loops" ? 40 : config.ends === "folded" ? 15 : 0,
  };
}
