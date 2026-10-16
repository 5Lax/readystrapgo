"use client";
import { useEffect, useId, useState } from "react";
import { endsNames, materialNames } from "@/lib/customizer/catalog";
import { getBuckleAsset, readBuckleSvg } from "@/lib/customizer/buckles";
import { strapGeometry } from "@/lib/customizer/geometry";
import { findWebbing } from "@/lib/customizer/rules";
import type { BuckleAsset, Catalog, StrapConfig } from "@/lib/customizer/types";

export function StrapPreview({
  config,
  catalog,
}: {
  config: StrapConfig;
  catalog: Catalog;
}) {
  const hardware = catalog.hardware.find((h) => h.id === config.hardwareId);
  const candidate = getBuckleAsset(hardware?.sku);
  const asset = candidate?.widthMm === config.widthMm ? candidate : undefined;
  return (
    <PreviewDrawing
      key={asset?.svgUrl ?? config.hardwareId ?? "none"}
      config={config}
      catalog={catalog}
      initialAsset={asset}
    />
  );
}
function PreviewDrawing({
  config,
  catalog,
  initialAsset,
}: {
  config: StrapConfig;
  catalog: Catalog;
  initialAsset?: BuckleAsset;
}) {
  const [zoom, setZoom] = useState(1);
  const [asset, setAsset] = useState(initialAsset);
  const [assetError, setAssetError] = useState("");
  const id = useId().replaceAll(":", "");
  useEffect(() => {
    if (!initialAsset) return;
    const controller = new AbortController();
    fetch(initialAsset.svgUrl, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok)
          throw new Error("Buckle artwork could not be loaded.");
        return readBuckleSvg(await response.text(), initialAsset);
      })
      .then(setAsset)
      .catch((error) => {
        if (!controller.signal.aborted) {
          setAsset(undefined);
          setAssetError(
            error instanceof Error
              ? error.message
              : "Buckle artwork unavailable.",
          );
        }
      });
    return () => controller.abort();
  }, [initialAsset]);
  const g = strapGeometry(config, asset);
  const color =
    findWebbing(config, catalog)?.color_options.find(
      (c) => c.name === config.color,
    )?.hex ?? "#64748b";
  const hardware = catalog.hardware.find((h) => h.id === config.hardwareId);
  const warning =
    assetError ||
    (config.hardwareId && !initialAsset
      ? "Buckle artwork is unavailable. The part remains in your specification; the webbing is shown below."
      : "");
  return (
    <figure className="cz-preview" aria-label="Live strap technical drawing">
      <div className="cz-drawing-head">
        <span>FLAT PATTERN / 01</span>
        <span>ALL DIMENSIONS IN MM</span>
      </div>
      {warning && (
        <p role="status" className="cz-notice">
          {warning}
        </p>
      )}
      <div className="cz-zoom" aria-label="Drawing zoom">
        <span>Scale preserved at every zoom</span>
        {[1, 2, 4].map((level) => (
          <button
            type="button"
            key={level}
            aria-pressed={zoom === level}
            onClick={() => setZoom(level)}
          >
            {level}×
          </button>
        ))}
      </div>
      <div className="cz-drawing-window">
        <svg
          style={{ width: `${zoom * 100}%`, height: `${zoom * 240}px` }}
          data-testid="strap-preview"
          viewBox={g.viewBox}
          role="img"
          aria-labelledby={`${id}-title ${id}-desc`}
          preserveAspectRatio="xMidYMid meet"
        >
          <title
            id={`${id}-title`}
          >{`${config.color} ${config.material} strap, ${config.lengthMm} by ${config.widthMm} millimetres`}</title>
          <desc id={`${id}-desc`}>
            Proportional cut pattern with {endsNames[config.ends]},{" "}
            {hardware?.name ?? "no buckle"},{" "}
            {config.logo.kind === "woven"
              ? `woven label ${config.logo.text}`
              : "no logo"}
            . Buckle is shown separated by a 16 mm drawing gap. Quantity{" "}
            {config.quantity}.
          </desc>
          <defs>
            <pattern
              id={`${id}-weave`}
              width={config.material === "elastic" ? 3 : 1.5}
              height="2"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M0 0V2 M0 1H3"
                stroke="#fff"
                strokeWidth="0.18"
                opacity="0.22"
              />
            </pattern>
            <marker
              id={`${id}-arrow`}
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10" fill="none" stroke="#475569" />
            </marker>
          </defs>
          <g stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3">
            <line
              x1={-g.pad / 2}
              y1={g.width / 2}
              x2={g.totalWidth + g.pad / 2}
              y2={g.width / 2}
            />
          </g>
          <rect
            data-testid="webbing-shape"
            x="0"
            y="0"
            width={g.length}
            height={g.width}
            fill={color}
            stroke="#334155"
            strokeWidth="0.5"
          />
          <rect width={g.length} height={g.width} fill={`url(#${id}-weave)`} />
          {g.turnbackMm > 0 ? (
            [g.turnbackMm, g.length - g.turnbackMm].map((x) => (
              <g key={x} stroke="#e2e8f0" strokeWidth="0.5">
                <line
                  x1={x}
                  x2={x}
                  y1="1"
                  y2={g.width - 1}
                  strokeDasharray="2 1"
                />
                <rect
                  x={x - 4}
                  y="2"
                  width="8"
                  height={g.width - 4}
                  fill="none"
                />
                <path
                  d={`M${x - 4} 2L${x + 4} ${g.width - 2}M${x + 4} 2L${x - 4} ${g.width - 2}`}
                />
              </g>
            ))
          ) : (
            <g stroke="#94a3b8" strokeWidth="1">
              <line x1="0.5" x2="0.5" y1="0" y2={g.width} />
              <line
                x1={g.length - 0.5}
                x2={g.length - 0.5}
                y1="0"
                y2={g.width}
              />
            </g>
          )}
          {config.logo.kind === "woven" && (
            <g>
              <rect
                x={g.length / 2 - 20}
                y={g.width / 2 - 5}
                width="40"
                height="10"
                rx="1"
                fill="#f8fafc"
                stroke="#64748b"
                strokeWidth="0.4"
              />
              <text
                x={g.length / 2}
                y={g.width / 2 + 1.3}
                textAnchor="middle"
                fontSize="3.7"
                fill="#0f172a"
                textLength={config.logo.text.length > 12 ? 34 : undefined}
                lengthAdjust="spacingAndGlyphs"
              >
                {config.logo.text.slice(0, 20)}
              </text>
            </g>
          )}
          {asset && (
            <g>
              <image
                href={asset.svgUrl}
                x={g.buckleX}
                y={g.buckleY}
                width={asset.viewBox[2]}
                height={asset.viewBox[3]}
                onError={() => {
                  setAsset(undefined);
                  setAssetError(
                    "Buckle artwork could not be loaded. Webbing dimensions remain available.",
                  );
                }}
              />
              <g fill="#0d9488">
                <circle cx={g.length + 16} cy={g.width / 2} r="1" />
                <circle cx={g.rightAnchorX} cy={g.width / 2} r="1" />
              </g>
            </g>
          )}
          <g fill="none" stroke="#475569" strokeWidth="0.65">
            <path d={`M0 -4V${-g.pad * 0.8} M${g.length} -4V${-g.pad * 0.8}`} />
            <line
              x1="0"
              x2={g.length}
              y1={-g.pad * 0.65}
              y2={-g.pad * 0.65}
              markerStart={`url(#${id}-arrow)`}
              markerEnd={`url(#${id}-arrow)`}
            />
            <path
              d={`M-4 0H${-g.pad * 0.65} M-4 ${g.width}H${-g.pad * 0.65}`}
            />
            <line
              x1={-g.pad * 0.5}
              x2={-g.pad * 0.5}
              y1="0"
              y2={g.width}
              markerStart={`url(#${id}-arrow)`}
              markerEnd={`url(#${id}-arrow)`}
            />
          </g>
          <g fill="#334155" fontFamily="monospace" fontSize={g.fontSize}>
            <text x={g.length / 2} y={-g.pad * 0.8} textAnchor="middle">
              {config.lengthMm} mm CUT LENGTH
            </text>
            <text
              transform={`translate(${-g.pad * 0.7}, ${g.width / 2}) rotate(-90)`}
              textAnchor="middle"
            >
              {config.widthMm} mm
            </text>
            <text x="0" y={g.width + g.pad * 0.65}>
              {g.turnbackMm
                ? `${g.turnbackMm} mm TURNBACK / EACH END`
                : "HEAT-SEALED / BOTH ENDS"}
            </text>
            {asset && (
              <text
                x={g.totalWidth}
                y={g.width + g.pad * 1.15}
                textAnchor="end"
              >
                BUCKLE · {asset.widthMm} mm SLOT
              </text>
            )}
          </g>
        </svg>
      </div>
      <figcaption>
        <strong>
          {config.lengthMm} × {config.widthMm} mm ·{" "}
          {materialNames[config.material]} · {config.color} ·{" "}
          {config.quantity.toLocaleString("en-US")} units
        </strong>
        <span>
          Proportional mm drawing, fitted to view. Length includes turnbacks.
          Buckle is shown separately; artwork is schematic.
        </span>
      </figcaption>
    </figure>
  );
}
