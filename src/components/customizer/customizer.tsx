"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  Printer,
  RotateCcw,
} from "lucide-react";
import { submitStrapProject } from "@/app/builder/actions";
import {
  endsNames,
  materialNames,
  materialNotes,
  templates,
  widthInMm,
} from "@/lib/customizer/catalog";
import {
  applyTemplate,
  changeConfig,
  findWebbing,
  hardwareIssue,
  lengthBounds,
  validateConfig,
  validateTemplate,
} from "@/lib/customizer/rules";
import { money, priceStrap } from "@/lib/customizer/pricing";
import { createSpec } from "@/lib/customizer/spec";
import type { Catalog, Contact, StrapConfig } from "@/lib/customizer/types";
import { StrapPreview } from "./preview";
import { CustomizerErrorBoundary } from "./error-boundary";

const steps = [
  "Material",
  "Width",
  "Length",
  "Color",
  "Hardware",
  "Strap ends",
  "Logo",
  "Quantity",
  "Review",
];
function initialConfig(catalog: Catalog): StrapConfig {
  const template = templates.find(
    (t) => validateTemplate(t, catalog).length === 0,
  );
  if (template) return applyTemplate(template, catalog);
  const webbing = catalog.webbing.find(
    (w) => w.active && w.color_options.length,
  );
  return {
    material: webbing?.material ?? "nylon",
    widthMm: webbing ? widthInMm(webbing.width) : 25.4,
    lengthMm: 600,
    color: webbing?.color_options[0]?.name ?? "Black",
    hardwareId: null,
    ends: webbing?.material === "uhmwpe" ? "folded" : "sealed",
    logo: { kind: "none", text: "" },
    quantity: 500,
    region: catalog.rules[0]?.region ?? "usa",
  };
}
export function Customizer({ catalog }: { catalog: Catalog }) {
  return (
    <CustomizerErrorBoundary>
      <CustomizerWorkspace catalog={catalog} />
    </CustomizerErrorBoundary>
  );
}
function CustomizerWorkspace({ catalog }: { catalog: Catalog }) {
  const router = useRouter();
  const [config, setConfig] = useState(() => initialConfig(catalog));
  const [step, setStep] = useState(0);
  const [notice, setNotice] = useState("");
  const [printView, setPrintView] = useState(false);
  const [contact, setContact] = useState<Contact>({
    name: "",
    email: "",
    company: "",
    projectName: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [sampleNumber, setSampleNumber] = useState("");
  const inFlight = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const webbing = findWebbing(config, catalog);
  const issues = validateConfig(config, catalog);
  let pricing: ReturnType<typeof priceStrap> | null = null;
  let priceError = "";
  if (!issues.length) {
    try {
      pricing = priceStrap(config, catalog);
    } catch (error) {
      priceError =
        error instanceof Error ? error.message : "Estimate unavailable.";
    }
  }
  const quote = pricing?.quotes.find((q) => q.region === config.region);
  const spec =
    !issues.length && !priceError ? createSpec(config, catalog) : null;
  const bounds = lengthBounds(config);
  const hardware = catalog.hardware.find((h) => h.id === config.hardwareId);
  const allWidths = [
    ...new Set(catalog.webbing.map((w) => widthInMm(w.width))),
  ].sort((a, b) => a - b);
  const materials = [
    ...new Set(catalog.webbing.filter((w) => w.active).map((w) => w.material)),
  ];
  const buckles = catalog.hardware.filter(
    (h) => h.active && h.category === "buckle",
  );
  const unavailable = buckles.filter((h) => hardwareIssue(h, config));

  function change(patch: Partial<StrapConfig>) {
    const next = changeConfig(config, patch, catalog);
    setConfig(next.config);
    setNotice(next.messages.join(" "));
    setSubmitError("");
    setSampleNumber("");
  }
  function goTo(next: number) {
    setStep(next);
    requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      if (window.innerWidth <= 900)
        heading.current?.parentElement?.scrollIntoView({ block: "start" });
    });
  }
  function download() {
    if (!spec) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(spec, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "readystrapgo-spec.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!quote || issues.length || inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setSubmitError("");
    try {
      const result = await submitStrapProject(
        config,
        contact,
        quote.breakdown.total,
      );
      if (result.error) {
        setSubmitError(result.error);
        if (result.error.includes("pricing has changed")) router.refresh();
      } else setSampleNumber(result.sampleNumber!);
    } catch {
      setSubmitError(
        "The connection was interrupted. Your design is still here; please try again.",
      );
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }
  const choice = (active: boolean) =>
    `cz-choice${active ? " is-selected" : ""}`;
  const breakdown = quote
    ? ([
        ["Webbing", quote.breakdown.webbingCost],
        ["Hardware", quote.breakdown.hardwareCost],
        ["Assembly", quote.breakdown.laborCost],
        ["Tooling", quote.breakdown.toolingCost],
        ["Ends & label allowance", quote.breakdown.finishingCost],
        ["Label setup allowance", quote.breakdown.logoSetupCost],
        ["Volume discount", -quote.breakdown.volumeDiscount],
        ["Estimated shipping", quote.breakdown.shippingCost],
      ] as const)
    : [];
  const summary = (
    <dl className="cz-spec-list">
      <div>
        <dt>Webbing</dt>
        <dd>
          {materialNames[config.material]} · {config.widthMm} mm
        </dd>
      </div>
      <div>
        <dt>Cut length</dt>
        <dd>{config.lengthMm} mm · single ply</dd>
      </div>
      <div>
        <dt>Color</dt>
        <dd>{config.color}</dd>
      </div>
      <div>
        <dt>Hardware</dt>
        <dd>
          {hardware?.name ?? "None"}
          {hardware ? ` (${hardware.sku}) × 1` : ""}
        </dd>
      </div>
      <div>
        <dt>Strap ends</dt>
        <dd>{endsNames[config.ends]}</dd>
      </div>
      <div>
        <dt>Logo</dt>
        <dd>
          {config.logo.kind === "woven"
            ? `Woven label: “${config.logo.text}” · 40 × 10 mm`
            : "None"}
        </dd>
      </div>
      <div>
        <dt>Quantity</dt>
        <dd>{config.quantity.toLocaleString()} straps</dd>
      </div>
      <div>
        <dt>Production</dt>
        <dd>
          {quote?.regionLabel ?? config.region}
          {quote
            ? ` · ${quote.leadTimeMin}–${quote.leadTimeMax} weeks estimated`
            : ""}
        </dd>
      </div>
    </dl>
  );

  return (
    <div className={`customizer${printView ? " is-print-view" : ""}`}>
      <div className="cz-workspace">
        <div className="cz-intro">
          <div>
            <p className="cz-eyebrow">READYSTRAPGO / DESIGN STUDIO</p>
            <h1>Make it your strap.</h1>
            <p>
              Choose the details. See the design. Send it into production
              review.
            </p>
          </div>
          <span className="cz-badge">
            <span /> LIVE SPECIFICATION
          </span>
        </div>
        {catalog.source === "seed" && (
          <div className="cz-notice" role="status">
            <strong>Preview catalog</strong> — live catalog access is
            unavailable. These seed prices are estimates. Design and export are
            available; project submission requires a connection.
          </div>
        )}
        <nav className="cz-steps" aria-label="Customizer steps">
          {steps.map((name, index) => (
            <button
              type="button"
              key={name}
              onClick={() => goTo(index)}
              aria-current={step === index ? "step" : undefined}
              disabled={submitting}
            >
              <span>
                {index < step ? (
                  <Check size={13} />
                ) : (
                  String(index + 1).padStart(2, "0")
                )}
              </span>
              {name}
            </button>
          ))}
        </nav>
        <div className="cz-layout">
          <section className="cz-controls" aria-label="Strap options">
            <fieldset disabled={submitting} className="cz-fields">
              <div className="cz-section-title">
                <p className="cz-eyebrow">
                  STEP {String(step + 1).padStart(2, "0")} / 09
                </p>
                <h2 ref={heading} tabIndex={-1}>
                  {steps[step]}
                </h2>
              </div>
              {step === 0 && (
                <>
                  <p className="cz-help">
                    Start with the feel and performance of your webbing.
                  </p>
                  <div className="cz-options">
                    {materials.map((material) => (
                      <button
                        type="button"
                        key={material}
                        className={choice(config.material === material)}
                        aria-pressed={config.material === material}
                        onClick={() => change({ material })}
                      >
                        <strong>{materialNames[material] ?? material}</strong>
                        <span>
                          {materialNotes[material] ??
                            "Available catalog webbing"}
                        </span>
                      </button>
                    ))}
                  </div>
                  <details className="cz-templates">
                    <summary>Or start with a template</summary>
                    <div className="cz-options">
                      {templates.map((template) => {
                        const errors = validateTemplate(template, catalog);
                        return (
                          <button
                            type="button"
                            key={template.id}
                            disabled={!!errors.length}
                            className="cz-choice"
                            onClick={() => {
                              setConfig(applyTemplate(template, catalog));
                              setNotice(
                                `${template.name} loaded. Every choice and dimension is ready to edit.`,
                              );
                              setSampleNumber("");
                              setSubmitError("");
                            }}
                          >
                            <strong>{template.name}</strong>
                            <span>
                              {errors.join(" ") || template.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </details>
                </>
              )}
              {step === 1 && (
                <>
                  <p className="cz-help">
                    The buckle slot must match the exact webbing width.
                  </p>
                  <div className="cz-options cz-options-width">
                    {allWidths.map((width) => {
                      const available = catalog.webbing.some(
                        (w) =>
                          w.active &&
                          w.material === config.material &&
                          widthInMm(w.width) === width,
                      );
                      return (
                        <button
                          type="button"
                          key={width}
                          className={choice(config.widthMm === width)}
                          disabled={!available}
                          aria-pressed={config.widthMm === width}
                          onClick={() => change({ widthMm: width })}
                        >
                          <strong>{width} mm</strong>
                          <span>
                            {available
                              ? `${(width / 25.4).toFixed(2)} in`
                              : "Unavailable in this material"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="cz-help">
                    Catalog widths are inch sizes converted exactly to mm. A
                    1-inch strap is 25.4 mm.
                  </p>
                </>
              )}
              {step === 2 && (
                <>
                  <p className="cz-help">
                    Total cut webbing length before assembly, including the end
                    turnbacks shown in the drawing. Buckle length is separate.
                  </p>
                  <label className="cz-label" htmlFor="strap-length">
                    Cut length (mm)
                  </label>
                  <div className="cz-measure">
                    <input
                      id="strap-length"
                      type="number"
                      min={Math.ceil(bounds.min)}
                      max={bounds.max}
                      step="1"
                      value={
                        Number.isFinite(config.lengthMm) ? config.lengthMm : ""
                      }
                      onChange={(e) =>
                        change({
                          lengthMm:
                            e.target.value === ""
                              ? NaN
                              : Number(e.target.value),
                        })
                      }
                    />
                    <span>mm</span>
                  </div>
                  <input
                    aria-label="Cut length slider"
                    className="cz-range"
                    type="range"
                    min={Math.ceil(bounds.min)}
                    max={bounds.max}
                    step="1"
                    value={
                      Number.isFinite(config.lengthMm)
                        ? config.lengthMm
                        : bounds.min
                    }
                    onChange={(e) =>
                      change({ lengthMm: Number(e.target.value) })
                    }
                  />
                  <div className="cz-range-label">
                    <span>{Math.ceil(bounds.min)} mm minimum</span>
                    <span>{bounds.max} mm maximum</span>
                  </div>
                  <p className="cz-help">
                    The minimum allows room for the selected hardware and end
                    finish.
                  </p>
                </>
              )}
              {step === 3 && (
                <>
                  <p className="cz-help">
                    Colors available in{" "}
                    {materialNames[config.material]?.toLowerCase()} at{" "}
                    {config.widthMm} mm.
                  </p>
                  <div className="cz-colors">
                    {webbing?.color_options.map((color) => (
                      <button
                        type="button"
                        key={color.name}
                        aria-pressed={config.color === color.name}
                        className={choice(config.color === color.name)}
                        onClick={() => change({ color: color.name })}
                      >
                        <span
                          className="cz-swatch"
                          style={{ backgroundColor: color.hex }}
                        >
                          {config.color === color.name && (
                            <Check
                              size={16}
                              style={{
                                color: ["White", "Yellow", "Gray"].includes(
                                  color.name,
                                )
                                  ? "#111"
                                  : "#fff",
                              }}
                            />
                          )}
                        </span>
                        <strong>{color.name}</strong>
                      </button>
                    ))}
                  </div>
                  <p className="cz-help">
                    Screen colors are illustrative. A physical sample confirms
                    the final color.
                  </p>
                </>
              )}
              {step === 4 && (
                <>
                  <p className="cz-help">
                    Compatible buckles for {config.widthMm} mm{" "}
                    {materialNames[config.material]?.toLowerCase()} webbing.
                  </p>
                  <div className="cz-options">
                    <button
                      type="button"
                      className={choice(config.hardwareId === null)}
                      aria-pressed={config.hardwareId === null}
                      onClick={() => change({ hardwareId: null })}
                    >
                      <strong>No buckle</strong>
                      <span>Webbing and selected end finishing</span>
                    </button>
                    {buckles
                      .filter((h) => !hardwareIssue(h, config))
                      .map((h) => (
                        <button
                          type="button"
                          key={h.id}
                          className={choice(config.hardwareId === h.id)}
                          aria-pressed={config.hardwareId === h.id}
                          onClick={() => change({ hardwareId: h.id })}
                        >
                          <strong>{h.name}</strong>
                          <span>
                            {h.specs.material} · {h.sku}
                          </span>
                        </button>
                      ))}
                  </div>
                  {unavailable.length > 0 && (
                    <details className="cz-templates">
                      <summary>
                        {unavailable.length} incompatible options
                      </summary>
                      <div className="cz-options">
                        {unavailable.map((h) => (
                          <button
                            type="button"
                            className="cz-choice"
                            key={h.id}
                            disabled
                          >
                            <strong>{h.name}</strong>
                            <span>{hardwareIssue(h, config)}</span>
                          </button>
                        ))}
                      </div>
                    </details>
                  )}
                </>
              )}
              {step === 5 && (
                <>
                  <p className="cz-help">
                    Choose how both cut ends are finished. Turnbacks are
                    included in your cut length.
                  </p>
                  <div className="cz-options">
                    {(["sealed", "folded", "loops"] as const).map((ends) => (
                      <button
                        type="button"
                        key={ends}
                        className={choice(config.ends === ends)}
                        aria-pressed={config.ends === ends}
                        disabled={
                          ends === "sealed" && config.material === "uhmwpe"
                        }
                        onClick={() => change({ ends })}
                      >
                        <strong>{endsNames[ends]}</strong>
                        <span>
                          {ends === "sealed"
                            ? config.material === "uhmwpe"
                              ? "Not offered for UHMWPE"
                              : "No turnback · included in assembly"
                            : ends === "folded"
                              ? "15 mm turnback per end · +$0.15 per strap allowance"
                              : "40 mm turnback per end · +$0.30 per strap allowance"}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {step === 6 && (
                <>
                  <p className="cz-help">
                    Add a centered woven label. This text mockup reserves a 40 ×
                    10 mm area; final artwork is confirmed during review.
                  </p>
                  <div className="cz-options">
                    {(["none", "woven"] as const).map((kind) => (
                      <button
                        type="button"
                        key={kind}
                        className={choice(config.logo.kind === kind)}
                        aria-pressed={config.logo.kind === kind}
                        onClick={() =>
                          change({
                            logo: {
                              kind,
                              text: config.logo.text || "YOUR BRAND",
                            },
                          })
                        }
                      >
                        <strong>
                          {kind === "none" ? "No logo" : "Woven label"}
                        </strong>
                        <span>
                          {kind === "none"
                            ? "Keep it simple"
                            : "+$0.25 per strap + $35 setup allowance"}
                        </span>
                      </button>
                    ))}
                  </div>
                  {config.logo.kind === "woven" && (
                    <>
                      <label className="cz-label" htmlFor="logo-text">
                        Label text
                      </label>
                      <input
                        id="logo-text"
                        maxLength={20}
                        value={config.logo.text}
                        onChange={(e) =>
                          change({
                            logo: { ...config.logo, text: e.target.value },
                          })
                        }
                      />
                      <p className="cz-help">
                        Up to 20 characters. Label pricing is an estimate.
                      </p>
                    </>
                  )}
                </>
              )}
              {step === 7 && (
                <>
                  <p className="cz-help">
                    Quantity changes hardware tiers and volume discounts
                    immediately.
                  </p>
                  <label className="cz-label" htmlFor="strap-quantity">
                    Number of straps
                  </label>
                  <input
                    id="strap-quantity"
                    type="number"
                    min="50"
                    max="20000"
                    step="1"
                    value={
                      Number.isFinite(config.quantity) ? config.quantity : ""
                    }
                    onChange={(e) =>
                      change({
                        quantity:
                          e.target.value === "" ? NaN : Number(e.target.value),
                      })
                    }
                  />
                  <div className="cz-quantity-presets">
                    {[100, 500, 1000, 5000].map((quantity) => (
                      <button
                        type="button"
                        key={quantity}
                        aria-pressed={config.quantity === quantity}
                        onClick={() => change({ quantity })}
                      >
                        {quantity.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <p className="cz-help">
                    50–20,000 whole units. Each production region has its own
                    minimum; see your live estimate.
                  </p>
                </>
              )}
              {step === 8 && (
                <>
                  <p className="cz-help">
                    Review the specification, export a copy, or send it to A+
                    Products for production review.
                  </p>
                  {summary}
                  <p className="cz-help">
                    Cut length is measured before assembly. Final fit, artwork,
                    and production details are confirmed with your sample.
                  </p>
                </>
              )}
              {notice && (
                <p className="cz-notice" role="status">
                  {notice}
                </p>
              )}
              {issues.length > 0 && (
                <div className="cz-notice cz-error" role="alert">
                  {issues.map((issue) => (
                    <p key={issue}>{issue}</p>
                  ))}
                </div>
              )}
              {priceError && (
                <p className="cz-notice cz-error" role="alert">
                  {priceError}
                </p>
              )}
              <div className="cz-navigation">
                <button
                  type="button"
                  className="cz-button cz-secondary"
                  disabled={step === 0}
                  onClick={() => goTo(step - 1)}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                {step < 8 && (
                  <button
                    type="button"
                    className="cz-button"
                    disabled={issues.length > 0 || !!priceError}
                    onClick={() => goTo(step + 1)}
                  >
                    Continue <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </fieldset>
            {step === 8 && (
              <div className="cz-intake">
                <h3>Send your specification</h3>
                {sampleNumber ? (
                  <div className="cz-success" role="status">
                    <Check size={24} />
                    <h4>Project submitted</h4>
                    <p>
                      Your reference is <strong>{sampleNumber}</strong>. Keep a
                      copy of your specification for your records.
                    </p>
                    <button
                      type="button"
                      className="cz-button cz-secondary"
                      onClick={download}
                    >
                      Download your spec
                    </button>
                  </div>
                ) : (
                  <form onSubmit={submit}>
                    <fieldset disabled={submitting}>
                      <label className="cz-label" htmlFor="contact-name">
                        Your name *
                      </label>
                      <input
                        id="contact-name"
                        autoComplete="name"
                        required
                        maxLength={100}
                        value={contact.name}
                        onChange={(e) =>
                          setContact({ ...contact, name: e.target.value })
                        }
                      />
                      <label className="cz-label" htmlFor="contact-email">
                        Email *
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        autoComplete="email"
                        required
                        maxLength={254}
                        value={contact.email}
                        onChange={(e) =>
                          setContact({ ...contact, email: e.target.value })
                        }
                      />
                      <label className="cz-label" htmlFor="contact-company">
                        Company
                      </label>
                      <input
                        id="contact-company"
                        autoComplete="organization"
                        maxLength={150}
                        value={contact.company}
                        onChange={(e) =>
                          setContact({ ...contact, company: e.target.value })
                        }
                      />
                      <label className="cz-label" htmlFor="project-name">
                        Project name
                      </label>
                      <input
                        id="project-name"
                        maxLength={150}
                        value={contact.projectName}
                        onChange={(e) =>
                          setContact({
                            ...contact,
                            projectName: e.target.value,
                          })
                        }
                      />
                      {submitError && (
                        <p className="cz-notice cz-error" role="alert">
                          {submitError}
                        </p>
                      )}
                      <button
                        className="cz-button cz-submit"
                        type="submit"
                        disabled={
                          catalog.source !== "live" ||
                          !quote?.meetsMinimum ||
                          issues.length > 0 ||
                          !!priceError
                        }
                      >
                        {submitting ? "Submitting…" : "Submit project"}
                        <ArrowRight size={16} />
                      </button>
                      <p className="cz-help">
                        {catalog.source !== "live"
                          ? "Submission is unavailable with the preview catalog. Export your spec and attach it through the project intake when connected."
                          : "This sends your spec and contact details to the project intake. It does not place an order or charge you."}
                      </p>
                      <a href="/upload" className="cz-link">
                        Open project intake
                      </a>
                    </fieldset>
                  </form>
                )}
              </div>
            )}
          </section>
          <aside className="cz-live" aria-label="Live preview and estimate">
            <CustomizerErrorBoundary>
              <StrapPreview config={config} catalog={catalog} />
            </CustomizerErrorBoundary>
            <div className="cz-export">
              <button type="button" disabled={!spec} onClick={download}>
                <Download size={16} /> Export JSON
              </button>
              <button
                type="button"
                disabled={!spec}
                onClick={() => setPrintView(true)}
              >
                <Printer size={16} /> Print / PDF
              </button>
            </div>
            <section className="cz-estimate">
              <div className="cz-estimate-heading">
                <div>
                  <p className="cz-eyebrow">LIVE ESTIMATE · USD</p>
                  <p className="cz-unit" aria-live="polite">
                    {quote ? money(quote.breakdown.perUnit) : "—"}
                    <span> / strap</span>
                  </p>
                </div>
                <span className="cz-small-tag">
                  {catalog.source === "seed"
                    ? "PREVIEW RATES"
                    : "CATALOG RATES"}
                </span>
              </div>
              <label className="cz-label" htmlFor="production-region">
                Production region
              </label>
              <select
                id="production-region"
                value={config.region}
                disabled={submitting}
                onChange={(e) => change({ region: e.target.value })}
              >
                {catalog.rules.map((rule) => {
                  const q = pricing?.quotes.find(
                    (q) => q.region === rule.region,
                  );
                  const minimum = Math.max(
                    rule.moq,
                    webbing?.moq_by_region[rule.region] ?? 0,
                  );
                  return (
                    <option
                      key={rule.region}
                      value={rule.region}
                      disabled={!!pricing && !q}
                    >
                      {q?.regionLabel ?? rule.region.toUpperCase()} · min{" "}
                      {minimum}
                      {q ? ` · ${money(q.breakdown.perUnit)}/ea` : ""}
                    </option>
                  );
                })}
              </select>
              {!quote && (
                <p className="cz-help">
                  {issues.length
                    ? "Complete the valid specification to see an estimate."
                    : "This material has no price in the selected region. Choose another region."}
                </p>
              )}
              {quote && (
                <>
                  {!quote.meetsMinimum && (
                    <p className="cz-notice" role="status">
                      This region requires at least {quote.moq.toLocaleString()}{" "}
                      straps. Increase quantity or choose another region before
                      submitting.
                    </p>
                  )}
                  <details className="cz-price-details">
                    <summary>
                      Price breakdown for {config.quantity.toLocaleString()}{" "}
                      straps
                    </summary>
                    <dl>
                      {breakdown.map(([label, amount]) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>{money(amount)}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                  <div className="cz-total">
                    <span>Estimated total</span>
                    <strong data-testid="estimate-total">
                      {money(quote.breakdown.total)}
                    </strong>
                  </div>
                  <p className="cz-help">
                    {quote.leadTimeMin}–{quote.leadTimeMax} weeks estimated ·
                    MOQ {quote.moq.toLocaleString()}
                  </p>
                </>
              )}
              <p className="cz-fine">
                Includes estimated shipping; excludes tax. Finishing and label
                allowances are provisional. Final pricing is confirmed during
                review.
              </p>
            </section>
          </aside>
        </div>
      </div>
      <section
        className="cz-print-sheet"
        aria-label="Printable strap specification"
      >
        <div className="cz-print-tools">
          <button
            type="button"
            className="cz-button cz-secondary"
            onClick={() => setPrintView(false)}
          >
            <RotateCcw size={16} /> Back to customizer
          </button>
          <button
            type="button"
            className="cz-button"
            onClick={() => window.print()}
          >
            <Printer size={16} /> Print or save PDF
          </button>
          <p>Choose “Save as PDF” in your browser’s print dialog.</p>
        </div>
        <p className="cz-eyebrow">READYSTRAPGO / TECHNICAL SPECIFICATION</p>
        <h1>Custom strap · Spec v2</h1>
        <p>
          readystrapgo.com · Dimensions in millimetres ·{" "}
          {catalog.source === "seed" ? "Preview catalog" : "Live catalog"}
        </p>
        <CustomizerErrorBoundary>
          <StrapPreview config={config} catalog={catalog} />
        </CustomizerErrorBoundary>
        {summary}
        <p>{spec?.lengthDefinition}</p>
        {quote && (
          <>
            <h2>Estimate · {quote.regionLabel}</h2>
            <dl className="cz-spec-list">
              {breakdown.map(([label, amount]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{money(amount)}</dd>
                </div>
              ))}
              <div>
                <dt>Estimated total / per strap</dt>
                <dd>
                  {money(quote.breakdown.total)} /{" "}
                  {money(quote.breakdown.perUnit)}
                </dd>
              </div>
            </dl>
            {!quote.meetsMinimum && (
              <p>Minimum order quantity not met: {quote.moq} required.</p>
            )}
          </>
        )}
        <p className="cz-fine">
          {spec?.pricing.note} Buckle artwork is schematic. Woven label is a
          text mockup; final artwork and assembly details require sample
          approval.
        </p>
        {sampleNumber && <p>Project reference: {sampleNumber}</p>}
      </section>
    </div>
  );
}
