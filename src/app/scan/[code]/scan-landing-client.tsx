"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ScanSample {
  id: string;
  sp_item_id: number;
  scan_code: string;
  title: string;
  item_type: string | null;
  brand: string | null;
  status: string | null;
  photo_url: string | null;
  specs: Record<string, string>;
  project_name: string | null;
}

interface Props {
  sample: ScanSample;
  scanCount: number;
}

type ViewMode = "external" | "internal";
type InternalTab = "inspect" | "compare" | "inventory" | "history";

export default function ScanLandingClient({ sample, scanCount }: Props) {
  // Mode: external (vendor/customer) vs internal (A+ employee)
  const [mode, setMode] = useState<ViewMode>("external");
  const [internalTab, setInternalTab] = useState<InternalTab>("inspect");

  // Feedback state (external)
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);
  const [feedbackType, setFeedbackType] = useState("comment");
  const [submitting, setSubmitting] = useState(false);

  // Inventory state (internal)
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("");
  const [inventoryNote, setInventoryNote] = useState("");
  const [inventorySaved, setInventorySaved] = useState(false);

  // Compare state (internal)
  const [compareCode, setCompareCode] = useState("");
  const [compareSample, setCompareSample] = useState<ScanSample | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState("");

  async function submitFeedback() {
    if (!email || !comment) return;
    setSubmitting(true);

    const supabase = createClient();
    await supabase.from("scan_feedback").insert({
      sample_id: sample.id,
      scan_code: sample.scan_code,
      email,
      name: name || null,
      company: company || null,
      feedback_type: feedbackType,
      comment,
      rating: rating || null,
    });

    setFeedbackSent(true);
    setSubmitting(false);
  }

  async function loadCompareSample() {
    if (!compareCode.trim()) return;
    setCompareLoading(true);
    setCompareError("");

    const supabase = createClient();
    const { data, error } = await supabase
      .from("scan_samples")
      .select("*")
      .eq("scan_code", compareCode.trim().toUpperCase())
      .single();

    if (error || !data) {
      setCompareError(`Sample "${compareCode}" not found`);
      setCompareSample(null);
    } else {
      setCompareSample(data);
    }
    setCompareLoading(false);
  }

  const statusColor: Record<string, string> = {
    Active: "bg-green-100 text-green-800",
    "In Review": "bg-yellow-100 text-yellow-800",
    Approved: "bg-blue-100 text-blue-800",
    Rejected: "bg-red-100 text-red-800",
    Archived: "bg-gray-100 text-gray-600",
  };

  const locations = [
    "Warehouse A",
    "Warehouse B",
    "QC Lab",
    "Sample Room",
    "Meeting Room",
    "Shipped Out",
    "Office",
  ];

  // =========================================================================
  // Shared: Sample Info Card
  // =========================================================================
  function SampleCard({ s, compact }: { s: ScanSample; compact?: boolean }) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border p-${compact ? "4" : "6"}`}>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {s.item_type && (
            <div>
              <div className="text-gray-500 text-xs">Type</div>
              <div className="font-medium">{s.item_type}</div>
            </div>
          )}
          {s.brand && (
            <div>
              <div className="text-gray-500 text-xs">Brand</div>
              <div className="font-medium">{s.brand}</div>
            </div>
          )}
          {s.status && (
            <div>
              <div className="text-gray-500 text-xs">Status</div>
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[s.status] || "bg-gray-100 text-gray-600"}`}
              >
                {s.status}
              </span>
            </div>
          )}
          {s.project_name && (
            <div>
              <div className="text-gray-500 text-xs">Project</div>
              <div className="font-medium">{s.project_name}</div>
            </div>
          )}
        </div>

        {s.specs && Object.keys(s.specs).length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="text-xs font-medium text-gray-700 mb-1">Specs</div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {Object.entries(s.specs).map(([key, value]) => (
                <div key={key}>
                  <span className="text-gray-500">{key}:</span>{" "}
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // INTERNAL VIEW
  // =========================================================================
  if (mode === "internal") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Internal Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-mono text-blue-600 uppercase tracking-wider">
              {sample.scan_code} -- Internal View
            </div>
            <h1 className="text-xl font-bold text-gray-900">{sample.title}</h1>
          </div>
          <button
            onClick={() => setMode("external")}
            className="text-xs text-gray-400 hover:text-gray-600 border rounded-lg px-3 py-1"
          >
            Switch to External View
          </button>
        </div>

        {/* Internal Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
          {(
            [
              { key: "inspect", label: "Inspect" },
              { key: "compare", label: "Compare" },
              { key: "inventory", label: "Inventory" },
              { key: "history", label: "Scan History" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setInternalTab(tab.key)}
              className={`flex-1 text-sm font-medium py-2 px-3 rounded-lg transition-colors ${
                internalTab === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ---- INSPECT TAB ---- */}
        {internalTab === "inspect" && (
          <div className="space-y-4">
            {sample.photo_url && (
              <div className="rounded-xl overflow-hidden shadow-sm border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sample.photo_url} alt={sample.title} className="w-full h-64 object-cover" />
              </div>
            )}
            <SampleCard s={sample} />
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="text-sm font-medium text-gray-700 mb-3">Quick Actions</div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setInternalTab("compare")}
                  className="border rounded-lg px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Compare with Another
                </button>
                <button
                  onClick={() => setInternalTab("inventory")}
                  className="border rounded-lg px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Update Inventory
                </button>
                <button className="border rounded-lg px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  Change Status
                </button>
                <button className="border rounded-lg px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  Add to Project
                </button>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
              <span className="font-medium">Scan Stats:</span> This sample has been scanned{" "}
              <span className="font-bold">{scanCount}</span> time{scanCount !== 1 ? "s" : ""}.
            </div>
          </div>
        )}

        {/* ---- COMPARE TAB ---- */}
        {internalTab === "compare" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="text-sm font-medium text-gray-700 mb-3">
                Compare {sample.scan_code} with:
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={compareCode}
                  onChange={(e) => setCompareCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadCompareSample()}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                  placeholder="Enter scan code (e.g., INJ-002)"
                />
                <button
                  onClick={loadCompareSample}
                  disabled={compareLoading}
                  className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {compareLoading ? "..." : "Load"}
                </button>
              </div>
              {compareError && (
                <div className="mt-2 text-sm text-red-600">{compareError}</div>
              )}
            </div>

            {/* Side by side comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-mono text-gray-500 mb-2 text-center">
                  {sample.scan_code}
                </div>
                <SampleCard s={sample} compact />
              </div>
              <div>
                {compareSample ? (
                  <>
                    <div className="text-xs font-mono text-gray-500 mb-2 text-center">
                      {compareSample.scan_code}
                    </div>
                    <SampleCard s={compareSample} compact />
                  </>
                ) : (
                  <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
                    <div className="text-gray-400 text-sm">
                      Enter a scan code above to compare
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Spec diff (when both loaded) */}
            {compareSample && sample.specs && compareSample.specs && (
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="text-sm font-medium text-gray-700 mb-3">
                  Specification Comparison
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b">
                      <th className="pb-2">Spec</th>
                      <th className="pb-2">{sample.scan_code}</th>
                      <th className="pb-2">{compareSample.scan_code}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(
                      new Set([
                        ...Object.keys(sample.specs),
                        ...Object.keys(compareSample.specs),
                      ])
                    ).map((key) => {
                      const a = sample.specs[key] || "--";
                      const b = compareSample.specs[key] || "--";
                      const isDiff = a !== b;
                      return (
                        <tr key={key} className={`border-b last:border-0 ${isDiff ? "bg-yellow-50" : ""}`}>
                          <td className="py-2 text-gray-500">{key}</td>
                          <td className="py-2 font-medium">{a}</td>
                          <td className="py-2 font-medium">{b}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ---- INVENTORY TAB ---- */}
        {internalTab === "inventory" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="text-sm font-medium text-gray-700 mb-4">
                Update Inventory for {sample.scan_code}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Number of units"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Location</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Select location...</option>
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Notes</label>
                  <textarea
                    value={inventoryNote}
                    onChange={(e) => setInventoryNote(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Optional notes (e.g., moved to QC for testing)"
                  />
                </div>

                {!inventorySaved ? (
                  <button
                    onClick={() => setInventorySaved(true)}
                    className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-blue-700"
                  >
                    Save Inventory Update
                  </button>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center text-sm text-green-800 font-medium">
                    Inventory updated! (Demo -- would write to SharePoint in production)
                  </div>
                )}
              </div>
            </div>

            <SampleCard s={sample} compact />
          </div>
        )}

        {/* ---- SCAN HISTORY TAB ---- */}
        {internalTab === "history" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="text-sm font-medium text-gray-700 mb-4">
                Scan History for {sample.scan_code}
              </div>
              <div className="text-sm text-gray-500 mb-4">
                Total scans: <span className="font-bold text-gray-900">{scanCount}</span>
              </div>

              {/* Demo scan history entries */}
              <div className="space-y-3">
                <div className="text-xs text-gray-400 uppercase tracking-wider">
                  Recent Scans (demo data)
                </div>
                {[
                  { time: "Just now", device: "Your device", city: "Current session" },
                  { time: "2 hours ago", device: "iPhone 15", city: "Dallas, TX" },
                  { time: "Yesterday", device: "Android", city: "Dallas, TX" },
                  { time: "Feb 24", device: "Windows PC", city: "Shenzhen, CN" },
                ].map((scan, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{scan.time}</div>
                      <div className="text-xs text-gray-500">{scan.device}</div>
                    </div>
                    <div className="text-xs text-gray-500">{scan.city}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-xs text-gray-400 text-center">
                Full scan history will pull from scan_logs table in production
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 mt-8">
          A+ Products International -- Internal
        </div>
      </div>
    );
  }

  // =========================================================================
  // EXTERNAL VIEW (vendor / customer / unauthenticated)
  // =========================================================================
  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-xs font-mono text-gray-400 uppercase tracking-wider">
          {sample.scan_code}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">
          {sample.title}
        </h1>
      </div>

      {/* Photo */}
      {sample.photo_url && (
        <div className="rounded-xl overflow-hidden mb-6 shadow-sm border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sample.photo_url}
            alt={sample.title}
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      {/* Sample Info Card */}
      <SampleCard s={sample} />

      <div className="mt-4 mb-6 bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Times Scanned</span>
          <span className="font-medium">{scanCount}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => {
            setFeedbackType("comment");
            setShowFeedback(true);
          }}
          className="flex-1 bg-white border rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Leave Feedback
        </button>
        <button
          onClick={() => {
            setFeedbackType("approve");
            setShowFeedback(true);
          }}
          className="flex-1 bg-blue-600 rounded-xl px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Approve Sample
        </button>
      </div>

      {/* Feedback Form */}
      {showFeedback && !feedbackSent && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {feedbackType === "approve" ? "Approve Sample" : "Leave Feedback"}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="your@email.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-2xl transition-colors ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
                  >
                    *
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {feedbackType === "approve" ? "Approval Notes *" : "Comment *"}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                rows={3}
                placeholder={
                  feedbackType === "approve"
                    ? "Any notes for the approval..."
                    : "Your feedback on this sample..."
                }
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowFeedback(false)}
                className="flex-1 border rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitFeedback}
                disabled={!email || !comment || submitting}
                className="flex-1 bg-blue-600 rounded-lg px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting
                  ? "Submitting..."
                  : feedbackType === "approve"
                    ? "Submit Approval"
                    : "Submit Feedback"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {feedbackSent && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center mb-6">
          <div className="text-green-800 font-medium">
            {feedbackType === "approve"
              ? "Approval submitted! The team has been notified."
              : "Thank you for your feedback!"}
          </div>
        </div>
      )}

      {/* A+ Employee Link */}
      <div className="text-center mt-6">
        <button
          onClick={() => setMode("internal")}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          A+ Employee? Switch to Internal View
        </button>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 mt-4">
        A+ Products International
      </div>
    </div>
  );
}