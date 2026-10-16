import { parseConfig, validateConfig } from "./rules";
import { createSpec } from "./spec";
import type { Catalog, Contact } from "./types";

export function parseContact(value: unknown): Contact {
  if (!value || typeof value !== "object")
    throw new Error("Enter your name and email.");
  const c = value as Record<string, unknown>;
  if (
    typeof c.name !== "string" ||
    !c.name.trim() ||
    c.name.length > 100 ||
    typeof c.email !== "string" ||
    c.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim()) ||
    typeof c.company !== "string" ||
    c.company.length > 150 ||
    typeof c.projectName !== "string" ||
    c.projectName.length > 150
  )
    throw new Error(
      "Enter a valid contact name and email; keep project and company names under 150 characters.",
    );
  return {
    name: c.name.trim(),
    email: c.email.trim(),
    company: c.company.trim(),
    projectName: c.projectName.trim(),
  };
}
export function prepareSubmission(
  configInput: unknown,
  contactInput: unknown,
  expectedTotal: unknown,
  catalog: Catalog,
) {
  if (catalog.source !== "live")
    throw new Error("Connect the live catalog before submitting a project.");
  const config = parseConfig(configInput);
  const contact = parseContact(contactInput);
  const errors = validateConfig(config, catalog);
  if (errors.length) throw new Error(errors.join(" "));
  const spec = createSpec(config, catalog);
  const quote = spec.pricing.quote;
  if (!quote || !quote.available || !quote.meetsMinimum)
    throw new Error("Choose a region whose minimum order quantity is met.");
  if (
    typeof expectedTotal !== "number" ||
    !Number.isFinite(expectedTotal) ||
    Math.abs(quote.breakdown.total - expectedTotal) > 0.01
  )
    throw new Error(
      "Catalog pricing has changed. Review the refreshed estimate before submitting again.",
    );
  // Same fields as /upload. The complete versioned spec is stored atomically with the project,
  // avoiding a partial file upload that can leave a project without manufacturing details.
  return {
    workflow_type: "specs",
    project_name: contact.projectName || "Custom strap",
    description: spec.summary,
    quantity: String(config.quantity),
    contact_name: contact.name,
    contact_email: contact.email,
    contact_company: contact.company || null,
    notes: JSON.stringify(spec, null, 2),
    source: null,
  };
}
