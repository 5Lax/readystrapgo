// Local test double of the existing Supabase intake contract. Never used by application code.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
const catalog = JSON.parse(
  readFileSync(new URL("../catalog-snapshot.json", import.meta.url), "utf8"),
);
let mode = "ok";
let projects = [];
let sequence = 0;
createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "authorization, apikey, content-type, x-client-info, prefer",
  );
  if (req.method === "OPTIONS") {
    res.end();
    return;
  }
  const url = new URL(req.url, "http://127.0.0.1:4329");
  const send = (value, status = 200) => {
    res.statusCode = status;
    res.end(JSON.stringify(value));
  };
  if (url.pathname === "/__control") {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    mode = JSON.parse(raw || "{}").mode ?? "ok";
    projects = [];
    sequence = 0;
    send({ mode });
    return;
  }
  if (url.pathname === "/__projects") {
    send(projects);
    return;
  }
  if (url.pathname === "/rest/v1/rpc/generate_sample_number") {
    if (mode === "rpc-error") {
      send({ message: "Test RPC failure" }, 500);
      return;
    }
    sequence++;
    send(`TEST-${String(sequence).padStart(4, "0")}`);
    return;
  }
  if (url.pathname === "/rest/v1/projects" && req.method === "POST") {
    if (mode === "submit-error") {
      send({ message: "Test insert failure" }, 500);
      return;
    }
    let raw = "";
    for await (const chunk of req) raw += chunk;
    projects.push(JSON.parse(raw));
    send(null, 201);
    return;
  }
  const tables = {
    hardware_catalog: "hardware",
    webbing_catalog: "webbing",
    pricing_rules: "rules",
  };
  const key = tables[url.pathname.split("/").pop()];
  if (key) {
    send(
      mode === "catalog-error"
        ? { message: "Test catalog failure" }
        : catalog[key],
      mode === "catalog-error" ? 503 : 200,
    );
    return;
  }
  if (url.pathname.startsWith("/auth/")) {
    send({ user: null });
    return;
  }
  send({ ok: true });
}).listen(4329, "127.0.0.1");
