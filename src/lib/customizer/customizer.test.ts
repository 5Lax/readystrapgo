import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { seedCatalog, templates } from "./catalog";
import {
  applyTemplate,
  changeConfig,
  hardwareIssue,
  parseConfig,
  validateConfig,
  validateTemplate,
} from "./rules";
import { priceStrap } from "./pricing";
import { quoteFromCatalog } from "./quote-engine";
import { createSpec } from "./spec";
import { prepareSubmission } from "./intake";
import { buckleAssets, getBuckleAsset, readBuckleSvg } from "./buckles";
import { strapGeometry } from "./geometry";
import type { Catalog } from "./types";

const base = () => applyTemplate(templates[0], seedCatalog);
const contact = {
  name: "Test Customer",
  email: "test@example.com",
  company: "Test",
  projectName: "Utility",
};
const live = (): Catalog => ({
  ...structuredClone(seedCatalog),
  source: "live",
});

describe("catalog and template references", () => {
  it.each(templates)(
    "$name loads a complete valid specification",
    (template) => {
      expect(validateTemplate(template, seedCatalog)).toEqual([]);
      expect(
        validateConfig(applyTemplate(template, seedCatalog), seedCatalog),
      ).toEqual([]);
    },
  );
  it("reports the missing-part regression without dereferencing it", () => {
    const broken = { ...templates[2], hardwareSku: "missing-ring" };
    expect(validateTemplate(broken, seedCatalog)[0]).toContain("missing-ring");
    expect(() => applyTemplate(broken, seedCatalog)).toThrow("missing-ring");
  });
  it("validates every registered SVG, width, viewBox and anchor against the catalog", () => {
    for (const hardware of seedCatalog.hardware.filter(
      (h) => h.category === "buckle",
    )) {
      const asset = getBuckleAsset(hardware.sku);
      expect(asset, hardware.sku).toBeDefined();
      const source = readFileSync(`public${asset!.svgUrl}`, "utf8");
      expect(readBuckleSvg(source, asset!)).toEqual(asset);
      expect(
        hardware.width_options.map((w) => Math.round(w * 2540) / 100),
      ).toContain(asset!.widthMm);
    }
    expect(new Set(buckleAssets.map((a) => a.id)).size).toBe(
      buckleAssets.length,
    );
  });
  it("rejects missing/invalid SVG anchors rather than rendering nonsense", () => {
    const asset = buckleAssets[0];
    expect(() =>
      readBuckleSvg('<svg viewBox="0 0 50 30"></svg>', asset),
    ).toThrow("anchor-left");
    expect(() => readBuckleSvg('<svg viewBox="0 0 NaN 30"/>', asset)).toThrow(
      "viewBox",
    );
    expect(() =>
      readBuckleSvg(
        '<svg viewBox="0 0 50 30"><circle id="anchor-left" cx="2" cy="5"/><circle id="anchor-right" cx="1" cy="6"/></svg>',
        asset,
      ),
    ).toThrow("horizontal");
  });
});

describe("compatibility and state", () => {
  it("clears a buckle when the width changes and explains why", () => {
    const { config, messages } = changeConfig(
      base(),
      { widthMm: 38.1 },
      seedCatalog,
    );
    expect(config.hardwareId).toBeNull();
    expect(messages.join()).toContain("removed");
    expect(validateConfig(config, seedCatalog)).toEqual([]);
  });
  it("repairs dependent color and end choices on material change", () => {
    const { config, messages } = changeConfig(
      { ...base(), color: "Red" },
      { material: "uhmwpe" },
      seedCatalog,
    );
    expect(config.color).toBe("White");
    expect(config.ends).toBe("folded");
    expect(config.hardwareId).toBeNull();
    expect(messages).toHaveLength(3);
  });
  it("excludes cam buckles from elastic and all stock buckles from UHMWPE", () => {
    const cam = seedCatalog.hardware.find((h) => h.type === "cam")!;
    expect(hardwareIssue(cam, { ...base(), material: "elastic" })).toContain(
      "elastic",
    );
    expect(hardwareIssue(cam, { ...base(), material: "uhmwpe" })).toContain(
      "custom review",
    );
  });
  it.each([NaN, Infinity, -1, 0, 99, 2001])(
    "rejects invalid length %s",
    (lengthMm) => {
      expect(
        validateConfig({ ...base(), lengthMm }, seedCatalog).join(),
      ).toContain("Length must");
    },
  );
  it.each([NaN, Infinity, -10, 0, 49, 50.5, 20001])(
    "rejects invalid quantity %s",
    (quantity) => {
      expect(
        validateConfig({ ...base(), quantity }, seedCatalog).join(),
      ).toContain("whole number");
    },
  );
  it("enforces the extra room needed for end loops", () => {
    expect(
      validateConfig(
        {
          ...base(),
          hardwareId: null,
          ends: "loops",
          widthMm: 38.1,
          lengthMm: 200,
        },
        seedCatalog,
      ).join(),
    ).toContain("253–2000");
  });
  it("rejects missing parts, unavailable colors and blank labels", () => {
    expect(
      validateConfig(
        {
          ...base(),
          hardwareId: "missing",
          color: "Invisible",
          logo: { kind: "woven", text: " " },
        },
        seedCatalog,
      ),
    ).toHaveLength(3);
  });
  it("narrows untrusted input before use", () => {
    for (const input of [
      null,
      [],
      {},
      { ...base(), logo: null },
      { ...base(), widthMm: "25.4" },
    ])
      expect(() => parseConfig(input)).toThrow();
    expect(parseConfig({ ...base(), extra: "discard" })).toEqual(base());
  });
});

describe("one quote path", () => {
  it("preserves catalog tiers/labor/discounts and includes hardware shipping weight", () => {
    const quote = priceStrap(
      { ...base(), lengthMm: 914.4, quantity: 100 },
      seedCatalog,
    ).quotes.find((q) => q.region === "usa")!;
    expect(quote.breakdown).toMatchObject({
      webbingCost: 42,
      hardwareCost: 46,
      laborCost: 35,
      toolingCost: 0,
      shippingCost: 53.09,
      total: 176.09,
      perUnit: 1.76,
    });
  });
  it("adds explicit finishing and logo allowances through the same engine", () => {
    const config = {
      ...base(),
      ends: "loops" as const,
      logo: { kind: "woven" as const, text: "TEST" },
    };
    const q = priceStrap(config, seedCatalog).quotes.find(
      (q) => q.region === "usa",
    )!;
    const plain = priceStrap(base(), seedCatalog).quotes.find(
      (q) => q.region === "usa",
    )!;
    expect(q.breakdown.finishingCost).toBe(275);
    expect(q.breakdown.logoSetupCost).toBe(35);
    expect(q.breakdown.total - plain.breakdown.total).toBeCloseTo(310);
  });
  it("honors both material and regional minimums", () => {
    const catalog = live();
    catalog.webbing.find(
      (w) => w.material === "nylon" && w.width === 1,
    )!.moq_by_region.usa = 750;
    const q = priceStrap(base(), catalog).quotes.find(
      (q) => q.region === "usa",
    )!;
    expect(q.moq).toBe(750);
    expect(q.meetsMinimum).toBe(false);
  });
  it("never treats missing regional webbing prices as free", () => {
    const catalog = live();
    delete catalog.webbing.find((w) => w.material === "nylon" && w.width === 1)!
      .price_per_yard_by_region.usa;
    expect(
      priceStrap(base(), catalog).quotes.some((q) => q.region === "usa"),
    ).toBe(false);
  });
  it("rejects missing, duplicate, mismatched or negative hardware at the engine boundary", () => {
    const result = priceStrap(base(), seedCatalog);
    for (const hardware of [
      [{ id: "absent", qty: 1 }],
      [{ id: "BKL-SR-100", qty: -1 }],
      [{ id: "BKL-SR-075", qty: 1 }],
      [
        { id: "BKL-SR-100", qty: 1 },
        { id: "BKL-SR-100", qty: 1 },
      ],
    ]) {
      expect(() =>
        quoteFromCatalog(
          { ...result.config, hardware },
          result.webbing!,
          seedCatalog.hardware,
          seedCatalog.rules,
        ),
      ).toThrow("hardware");
    }
  });
  it("uses identical config, quantities and prices in live display, JSON and intake", () => {
    const catalog = live();
    const config = {
      ...base(),
      quantity: 1000,
      logo: { kind: "woven" as const, text: "ACME" },
      ends: "folded" as const,
    };
    const display = priceStrap(config, catalog).quotes.find(
      (q) => q.region === config.region,
    )!;
    const exported = JSON.parse(JSON.stringify(createSpec(config, catalog)));
    const project = prepareSubmission(
      config,
      contact,
      display.breakdown.total,
      catalog,
    );
    const saved = JSON.parse(project.notes);
    expect(saved).toEqual(exported);
    expect(saved.pricing.quote).toEqual(display);
    expect(saved.config.quantity).toBe(1000);
    expect(saved.config.logo.text).toBe("ACME");
    expect(project.workflow_type).toBe("specs");
    expect(project.quantity).toBe("1000");
  });
  it("rejects fabricated totals, seed submissions, below-MOQ requests, and invalid contacts", () => {
    const catalog = live();
    const total = createSpec(base(), catalog).pricing.quote!.breakdown.total;
    expect(() =>
      prepareSubmission(base(), contact, total + 1, catalog),
    ).toThrow("pricing has changed");
    expect(() => prepareSubmission(base(), contact, NaN, catalog)).toThrow(
      "pricing has changed",
    );
    expect(() =>
      prepareSubmission(base(), contact, total, seedCatalog),
    ).toThrow("live catalog");
    expect(() =>
      prepareSubmission({ ...base(), quantity: 50 }, contact, total, catalog),
    ).toThrow("minimum order");
    expect(() =>
      prepareSubmission(
        base(),
        { ...contact, email: "invalid" },
        total,
        catalog,
      ),
    ).toThrow("valid contact");
  });
});

describe("millimetre geometry", () => {
  it.each([100, 480, 600, 2000])(
    "keeps the real aspect ratio at %s mm",
    (lengthMm) => {
      const g = strapGeometry({ ...base(), lengthMm }, buckleAssets[1]);
      expect(g.length / g.width).toBeCloseTo(lengthMm / 25.4);
    },
  );
  it("positions artwork by its anchors and supports a nonzero SVG origin", () => {
    const asset = {
      ...buckleAssets[1],
      viewBox: [-5, -10, 65, 50] as [number, number, number, number],
      anchors: { left: { x: 3, y: 5 }, right: { x: 50, y: 5 } },
    };
    const g = strapGeometry(base(), asset);
    expect(g.buckleX - asset.viewBox[0] + asset.anchors.left.x).toBe(616);
    expect(g.buckleY - asset.viewBox[1] + asset.anchors.left.y).toBe(12.7);
    expect(g.rightAnchorX).toBe(663);
  });
});
