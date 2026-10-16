import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test.beforeEach(async ({ request }) => {
  await request.post("http://127.0.0.1:4329/__control", {
    data: { mode: "ok" },
  });
});

test("all steps update a scaled drawing and exported specification, then persist the same quote", async ({
  page,
  request,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/builder");
  const workspace = page.locator(".cz-workspace");
  const svg = workspace.getByTestId("strap-preview");
  await expect(svg).toBeVisible();
  expect((await svg.boundingBox())!.width).toBeGreaterThan(300);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(page.getByTestId("estimate-total")).toHaveText("$527.93");
  await page.getByRole("button", { name: /Polyester Low stretch/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /19.05 mm/ }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "previous buckle was removed" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Cut length (mm)", { exact: true }).fill("480");
  await expect(workspace.getByTestId("webbing-shape")).toHaveAttribute(
    "width",
    "480",
  );
  await expect(workspace.getByTestId("webbing-shape")).toHaveAttribute(
    "height",
    "19.05",
  );
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Red", exact: true }).click();
  await expect(workspace.getByTestId("webbing-shape")).toHaveAttribute(
    "fill",
    "#cc0000",
  );
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /3\/4" Side Release Buckle/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /Folded & stitched ends/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /Woven label/ }).click();
  await page.getByLabel("Label text").fill("TRAIL CO");
  await expect(svg.getByText("TRAIL CO", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Number of straps").fill("1000");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON" }).click();
  const download = await downloadPromise;
  const spec = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(spec.config).toMatchObject({
    material: "polyester",
    widthMm: 19.05,
    lengthMm: 480,
    quantity: 1000,
    ends: "folded",
    logo: { kind: "woven", text: "TRAIL CO" },
  });
  expect(spec.billOfMaterials.hardware[0].sku).toBe("BKL-SR-075");
  expect(await page.getByTestId("estimate-total").innerText()).toBe(
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(spec.pricing.quote.breakdown.total),
  );
  await page.getByRole("button", { name: "Print / PDF", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Custom strap · Spec v2" }),
  ).toBeVisible();
  await page.evaluate(() => {
    window.print = () => {
      document.body.dataset.printInvoked = "true";
    };
  });
  await page
    .getByRole("button", { name: "Print or save PDF", exact: true })
    .click();
  await expect(page.locator("body")).toHaveAttribute(
    "data-print-invoked",
    "true",
  );
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".cz-print-sheet")).toBeVisible();
  await expect(page.locator(".cz-print-tools")).toBeHidden();
  const pdf = await page.pdf({
    path: testInfo.outputPath("strap-spec.pdf"),
    format: "A4",
    printBackground: true,
  });
  expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
  await page.emulateMedia({ media: "screen" });
  await page.getByRole("button", { name: "Back to customizer" }).click();
  await page.getByLabel("Your name *", { exact: true }).fill("Test Customer");
  await page
    .getByLabel("Email *", { exact: true })
    .fill("customer@example.com");
  await page.getByLabel("Project name", { exact: true }).fill("Trail strap");
  await page
    .getByRole("button", { name: "Submit project", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Project submitted" }),
  ).toBeVisible();
  await expect(
    page.getByText("TEST-0001", { exact: true }).first(),
  ).toBeVisible();
  const projects = await (
    await request.get("http://127.0.0.1:4329/__projects")
  ).json();
  expect(projects).toHaveLength(1);
  expect(projects[0]).toMatchObject({
    contact_email: "customer@example.com",
    workflow_type: "specs",
    quantity: "1000",
  });
  expect(JSON.parse(projects[0].notes)).toEqual(spec);
  await page.screenshot({
    path: testInfo.outputPath("submitted.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("incompatible choices, invalid dimensions and minimum quantity prevent submission", async ({
  page,
}) => {
  await page.goto("/builder");
  await page
    .getByRole("navigation", { name: "Customizer steps" })
    .getByRole("button", { name: /Length$/ })
    .click();
  await page.getByLabel("Cut length (mm)", { exact: true }).fill("20");
  await expect(page.locator(".cz-workspace").getByRole("alert")).toContainText(
    "Length must",
  );
  await expect(
    page.getByRole("button", { name: "Continue", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Export JSON" }),
  ).toBeDisabled();
  await page.getByLabel("Cut length (mm)", { exact: true }).fill("600");
  await page
    .getByRole("navigation", { name: "Customizer steps" })
    .getByRole("button", { name: /Material$/ })
    .click();
  await page.getByRole("button", { name: /Elastic Flexible/ }).click();
  await page
    .getByRole("navigation", { name: "Customizer steps" })
    .getByRole("button", { name: /Hardware$/ })
    .click();
  await page.getByText(/incompatible options/, { exact: false }).click();
  await expect(
    page.getByRole("button", { name: /1" Cam Buckle/ }),
  ).toBeDisabled();
  await page
    .getByRole("navigation", { name: "Customizer steps" })
    .getByRole("button", { name: /Quantity$/ })
    .click();
  await page.getByLabel("Number of straps").fill("50");
  await expect(
    page.getByRole("status").filter({ hasText: "requires at least" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Customizer steps" })
    .getByRole("button", { name: /Review$/ })
    .click();
  await expect(
    page.getByRole("button", { name: "Submit project", exact: true }),
  ).toBeDisabled();
});

test("templates render and missing artwork degrades to a useful drawing", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/customizer/buckles/*.svg", (route) =>
    route.fulfill({ status: 404, body: "not found" }),
  );
  await page.goto("/builder");
  await expect(
    page
      .locator(".cz-workspace")
      .getByRole("status")
      .filter({ hasText: "Buckle artwork could not be loaded" }),
  ).toBeVisible();
  await expect(
    page.locator(".cz-workspace").getByTestId("webbing-shape"),
  ).toBeVisible();
  await page.getByText("Or start with a template", { exact: true }).click();
  await page.getByRole("button", { name: /Carry handle Short/ }).click();
  await expect(
    page.locator(".cz-workspace").getByTestId("webbing-shape"),
  ).toHaveAttribute("width", "300");
  await expect(
    page.locator(".cz-workspace").getByTestId("webbing-shape"),
  ).toHaveAttribute("height", "38.1");
  expect(errors).toEqual([]);
});

test("catalog outage offers exports and never reports a saved project", async ({
  page,
  request,
}) => {
  await request.post("http://127.0.0.1:4329/__control", {
    data: { mode: "catalog-error" },
  });
  await page.goto("/builder");
  await expect(
    page.getByRole("status").filter({ hasText: "Preview catalog" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Export JSON" })).toBeEnabled();
  await page
    .getByRole("navigation", { name: "Customizer steps" })
    .getByRole("button", { name: /Review$/ })
    .click();
  await expect(
    page.getByRole("button", { name: "Submit project", exact: true }),
  ).toBeDisabled();
});

test("failed persistence shows an error and preserves the design for retry", async ({
  page,
  request,
}) => {
  await page.goto("/builder");
  await page
    .getByRole("navigation", { name: "Customizer steps" })
    .getByRole("button", { name: /Review$/ })
    .click();
  await page.getByLabel("Your name *", { exact: true }).fill("Test Customer");
  await page
    .getByLabel("Email *", { exact: true })
    .fill("customer@example.com");
  await request.post("http://127.0.0.1:4329/__control", {
    data: { mode: "submit-error" },
  });
  await page
    .getByRole("button", { name: "Submit project", exact: true })
    .click();
  await expect(page.locator(".cz-workspace").getByRole("alert")).toContainText(
    "could not be saved",
  );
  await expect(
    page.getByRole("heading", { name: "Project submitted" }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Your name *", { exact: true })).toHaveValue(
    "Test Customer",
  );
  await request.post("http://127.0.0.1:4329/__control", {
    data: { mode: "ok" },
  });
  await page
    .getByRole("button", { name: "Submit project", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Project submitted" }),
  ).toBeVisible();
});
