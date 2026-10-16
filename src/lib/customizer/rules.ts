import { widthInMm } from "./catalog";
import type { HardwareItem } from "../actions/catalog";
import type { Catalog, StrapConfig, StrapTemplate } from "./types";

export function findWebbing(config: StrapConfig, catalog: Catalog) {
  return catalog.webbing.find(
    (w) =>
      w.active &&
      w.material === config.material &&
      widthInMm(w.width) === config.widthMm,
  );
}
export function hardwareIssue(
  item: HardwareItem,
  config: Pick<StrapConfig, "material" | "widthMm">,
): string | null {
  if (!item.active || item.category !== "buckle")
    return "This part is not an available buckle.";
  if (!item.width_options?.some((w) => widthInMm(w) === config.widthMm))
    return `Requires ${item.width_options?.map(widthInMm).join(" / ") || "an unspecified"} mm webbing.`;
  if (config.material === "elastic" && item.type === "cam")
    return "Cam teeth are not offered with elastic webbing.";
  if (config.material === "uhmwpe")
    return "UHMWPE buckle retention needs a custom review; choose no buckle.";
  return null;
}
export function lengthBounds(
  config: Pick<StrapConfig, "ends" | "hardwareId" | "widthMm">,
) {
  return {
    min: Math.ceil(
      Math.max(
        100,
        config.ends === "loops"
          ? config.widthMm * 4 + 100
          : config.hardwareId
            ? 200
            : 100,
      ),
    ),
    max: 2000,
  };
}
export function validateConfig(
  config: StrapConfig,
  catalog: Catalog,
): string[] {
  const errors: string[] = [];
  const webbing = findWebbing(config, catalog);
  if (!webbing) errors.push("Choose an available webbing material and width.");
  if (webbing && !webbing.color_options.some((c) => c.name === config.color))
    errors.push("Choose a color offered for this webbing.");
  if (!["sealed", "folded", "loops"].includes(config.ends))
    errors.push("Choose a valid end finish.");
  if (config.ends === "sealed" && config.material === "uhmwpe")
    errors.push("UHMWPE requires folded ends or sewn loops.");
  const bounds = lengthBounds(config);
  if (
    !Number.isFinite(config.lengthMm) ||
    config.lengthMm < bounds.min ||
    config.lengthMm > bounds.max
  )
    errors.push(
      `Length must be ${Math.ceil(bounds.min)}–${bounds.max} mm for these ends and hardware.`,
    );
  if (
    !Number.isInteger(config.quantity) ||
    config.quantity < 50 ||
    config.quantity > 20000
  )
    errors.push("Quantity must be a whole number from 50 to 20,000.");
  if (config.hardwareId) {
    const item = catalog.hardware.find((h) => h.id === config.hardwareId);
    const issue = item
      ? hardwareIssue(item, config)
      : "The selected buckle is missing from the catalog. Choose another buckle or none.";
    if (issue) errors.push(issue);
  }
  if (!["none", "woven"].includes(config.logo.kind))
    errors.push("Choose a valid logo option.");
  if (
    config.logo.kind === "woven" &&
    (!config.logo.text.trim() || config.logo.text.length > 20)
  )
    errors.push("Enter 1–20 characters for the woven label.");
  if (!catalog.rules.some((r) => r.region === config.region))
    errors.push("Choose an available manufacturing region.");
  return errors;
}
export function validateTemplate(
  template: StrapTemplate,
  catalog: Catalog,
): string[] {
  const hardware = template.hardwareSku
    ? catalog.hardware.find((h) => h.sku === template.hardwareSku)
    : null;
  if (template.hardwareSku && !hardware)
    return [`${template.name}: missing catalog part ${template.hardwareSku}.`];
  return validateConfig(
    {
      ...template,
      hardwareId: hardware?.id ?? null,
      color:
        catalog.webbing.find(
          (w) =>
            w.material === template.material &&
            widthInMm(w.width) === template.widthMm,
        )?.color_options[0]?.name ?? "",
      logo: { kind: "none", text: "" },
      quantity: 500,
      region: catalog.rules[0]?.region ?? "",
    },
    catalog,
  );
}
export function applyTemplate(
  template: StrapTemplate,
  catalog: Catalog,
): StrapConfig {
  const errors = validateTemplate(template, catalog);
  if (errors.length) throw new Error(errors.join(" "));
  const webbing = catalog.webbing.find(
    (w) =>
      w.material === template.material &&
      widthInMm(w.width) === template.widthMm,
  )!;
  return {
    material: template.material,
    widthMm: template.widthMm,
    lengthMm: template.lengthMm,
    color: webbing.color_options[0].name,
    hardwareId:
      catalog.hardware.find((h) => h.sku === template.hardwareSku)?.id ?? null,
    ends: template.ends,
    logo: { kind: "none", text: "" },
    quantity: 500,
    region:
      catalog.rules.find((r) => r.region === "usa")?.region ??
      catalog.rules[0].region,
  };
}
/** Clear dependent choices when upstream options change; announce every adjustment. */
export function changeConfig(
  current: StrapConfig,
  patch: Partial<StrapConfig>,
  catalog: Catalog,
) {
  const config = { ...current, ...patch };
  const messages: string[] = [];
  if (patch.material !== undefined || patch.widthMm !== undefined) {
    let webbing = findWebbing(config, catalog);
    if (!webbing) {
      webbing = catalog.webbing.find(
        (w) => w.active && w.material === config.material,
      );
      if (webbing) {
        config.widthMm = widthInMm(webbing.width);
        messages.push(
          `Width changed to ${config.widthMm} mm for this material.`,
        );
      }
    }
    if (
      webbing &&
      !webbing.color_options.some((c) => c.name === config.color)
    ) {
      config.color = webbing.color_options[0]?.name ?? "";
      messages.push(`Color changed to ${config.color} for this webbing.`);
    }
    const buckle = catalog.hardware.find((h) => h.id === config.hardwareId);
    if (config.hardwareId && (!buckle || hardwareIssue(buckle, config))) {
      config.hardwareId = null;
      messages.push(
        "The previous buckle was removed because it does not match this material and width.",
      );
    }
    if (config.material === "uhmwpe" && config.ends === "sealed") {
      config.ends = "folded";
      messages.push("UHMWPE uses folded & stitched ends.");
    }
  }
  return { config, messages };
}
/** Narrow untrusted JSON before any geometry, quote, or persistence code runs. */
export function parseConfig(value: unknown): StrapConfig {
  if (!value || typeof value !== "object")
    throw new Error("Invalid strap specification.");
  const c = value as Record<string, unknown>;
  const logo = c.logo as Record<string, unknown> | undefined;
  if (
    typeof c.material !== "string" ||
    typeof c.widthMm !== "number" ||
    typeof c.lengthMm !== "number" ||
    typeof c.color !== "string" ||
    (c.hardwareId !== null && typeof c.hardwareId !== "string") ||
    !["sealed", "folded", "loops"].includes(String(c.ends)) ||
    typeof c.quantity !== "number" ||
    typeof c.region !== "string" ||
    !logo ||
    !["none", "woven"].includes(String(logo.kind)) ||
    typeof logo.text !== "string"
  )
    throw new Error("Invalid strap specification.");
  return {
    material: c.material,
    widthMm: c.widthMm,
    lengthMm: c.lengthMm,
    color: c.color,
    hardwareId: c.hardwareId,
    ends: c.ends as StrapConfig["ends"],
    quantity: c.quantity,
    region: c.region,
    logo: { kind: logo.kind as StrapConfig["logo"]["kind"], text: logo.text },
  };
}
