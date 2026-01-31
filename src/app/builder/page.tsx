"use client";

import { useState, useEffect, useMemo } from "react";
import {
  getHardwareCatalog,
  getWebbingCatalog,
  getPricingRules,
  calculateQuote,
  HardwareItem,
  WebbingItem,
  PricingRule,
  QuoteResult,
} from "@/lib/actions/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// =====================================================
// Types
// =====================================================

interface StrapType {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface SelectedHardware {
  item: HardwareItem;
  qty: number;
}

// =====================================================
// Constants
// =====================================================

const STRAP_TYPES: StrapType[] = [
  { id: "sternum", name: "Sternum Strap", description: "Backpack chest straps with adjustable fit", icon: "🎒" },
  { id: "dog-collar", name: "Dog Collar", description: "Pet collars with quick-release buckles", icon: "🐕" },
  { id: "lanyard", name: "Lanyard", description: "ID badges, keys, and small items", icon: "🏷️" },
  { id: "luggage", name: "Luggage Strap", description: "Secure bags and cases during travel", icon: "🧳" },
  { id: "camera", name: "Camera Strap", description: "Comfortable straps for cameras and gear", icon: "📷" },
  { id: "custom", name: "Custom", description: "Build something unique to your specs", icon: "✨" },
];

const STEPS = [
  { id: 1, name: "Type", description: "Select strap type" },
  { id: 2, name: "Dimensions", description: "Set length & width" },
  { id: 3, name: "Material", description: "Choose webbing" },
  { id: 4, name: "Hardware", description: "Add components" },
  { id: 5, name: "Quote", description: "Compare regions" },
];

const REGION_FLAGS: Record<string, string> = {
  usa: "🇺🇸",
  mexico: "🇲🇽",
  taiwan: "🇹🇼",
  vietnam: "🇻🇳",
  cambodia: "🇰🇭",
  china: "🇨🇳",
};

const HARDWARE_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "buckle", label: "Buckles" },
  { id: "ring", label: "Rings" },
  { id: "slider", label: "Sliders" },
  { id: "snap", label: "Snaps" },
  { id: "other", label: "Other" },
];

// =====================================================
// Component
// =====================================================

export default function BuilderPage() {
  // Data state
  const [hardware, setHardware] = useState<HardwareItem[]>([]);
  const [webbing, setWebbing] = useState<WebbingItem[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);

  // Configuration state
  const [strapType, setStrapType] = useState<string | null>(null);
  const [length, setLength] = useState(24);
  const [width, setWidth] = useState<number | null>(null);
  const [plies, setPlies] = useState(1);
  const [selectedWebbing, setSelectedWebbing] = useState<WebbingItem | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedHardware, setSelectedHardware] = useState<SelectedHardware[]>([]);
  const [quantity, setQuantity] = useState(500);
  const [hardwareFilter, setHardwareFilter] = useState("all");

  // Quote state
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [calculatingQuote, setCalculatingQuote] = useState(false);

  // =====================================================
  // Data fetching
  // =====================================================

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [hardwareRes, webbingRes, pricingRes] = await Promise.all([
        getHardwareCatalog(),
        getWebbingCatalog(),
        getPricingRules(),
      ]);

      if (hardwareRes.data) setHardware(hardwareRes.data);
      if (webbingRes.data) setWebbing(webbingRes.data);
      if (pricingRes.data) setPricingRules(pricingRes.data);

      if (hardwareRes.error || webbingRes.error || pricingRes.error) {
        toast.error("Failed to load catalog data");
      }

      setLoading(false);
    }
    fetchData();
  }, []);

  // =====================================================
  // Computed values
  // =====================================================

  const availableWidths = useMemo(() => {
    const widths = [...new Set(webbing.map((w) => w.width))].sort((a, b) => a - b);
    return widths;
  }, [webbing]);

  const filteredWebbing = useMemo(() => {
    if (!width) return webbing;
    return webbing.filter((w) => w.width === width);
  }, [webbing, width]);

  const groupedWebbing = useMemo(() => {
    const groups: Record<string, WebbingItem[]> = {};
    filteredWebbing.forEach((w) => {
      if (!groups[w.material]) groups[w.material] = [];
      groups[w.material].push(w);
    });
    return groups;
  }, [filteredWebbing]);

  const filteredHardware = useMemo(() => {
    let items = hardware;

    // Filter by category
    if (hardwareFilter !== "all") {
      items = items.filter((h) => h.category === hardwareFilter);
    }

    // Filter by compatible width
    if (width) {
      items = items.filter((h) => {
        const widthOptions = h.width_options || [];
        return widthOptions.length === 0 || widthOptions.includes(width);
      });
    }

    return items;
  }, [hardware, hardwareFilter, width]);

  const hardwareSubtotal = useMemo(() => {
    return selectedHardware.reduce((total, sh) => {
      const basePrice = sh.item.price_tiers["1"] || 0;
      return total + basePrice * sh.qty;
    }, 0);
  }, [selectedHardware]);

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        return strapType !== null;
      case 2:
        return width !== null && length >= 4 && length <= 72;
      case 3:
        return selectedWebbing !== null && selectedColor !== null;
      case 4:
        return true; // Hardware is optional
      case 5:
        return quantity >= 50;
      default:
        return false;
    }
  }, [currentStep, strapType, width, length, selectedWebbing, selectedColor, quantity]);

  // =====================================================
  // Quote calculation
  // =====================================================

  useEffect(() => {
    if (currentStep === 5 && selectedWebbing) {
      calculateQuoteAsync();
    }
  }, [currentStep, selectedWebbing, length, plies, selectedHardware, quantity]);

  async function calculateQuoteAsync() {
    if (!selectedWebbing) return;

    setCalculatingQuote(true);

    const result = await calculateQuote({
      webbingId: selectedWebbing.id,
      lengthInches: length,
      color: selectedColor || "",
      plies,
      hardware: selectedHardware.map((sh) => ({ id: sh.item.id, qty: sh.qty })),
      quantity,
    });

    if (result.data) {
      setQuoteResult(result.data);
    } else {
      toast.error(result.error || "Failed to calculate quote");
    }

    setCalculatingQuote(false);
  }

  // =====================================================
  // Handlers
  // =====================================================

  function handleAddHardware(item: HardwareItem) {
    const existing = selectedHardware.find((sh) => sh.item.id === item.id);
    if (existing) {
      setSelectedHardware(
        selectedHardware.map((sh) =>
          sh.item.id === item.id ? { ...sh, qty: sh.qty + 1 } : sh
        )
      );
    } else {
      setSelectedHardware([...selectedHardware, { item, qty: 1 }]);
    }
  }

  function handleRemoveHardware(itemId: string) {
    setSelectedHardware(selectedHardware.filter((sh) => sh.item.id !== itemId));
  }

  function handleUpdateHardwareQty(itemId: string, qty: number) {
    if (qty <= 0) {
      handleRemoveHardware(itemId);
    } else {
      setSelectedHardware(
        selectedHardware.map((sh) =>
          sh.item.id === itemId ? { ...sh, qty } : sh
        )
      );
    }
  }

  function formatMaterialName(material: string): string {
    const names: Record<string, string> = {
      nylon: "Nylon 6/6",
      polyester: "Polyester",
      polypropylene: "Polypropylene",
      elastic: "Elastic",
      uhmwpe: "UHMWPE / Dyneema",
    };
    return names[material] || material;
  }

  function getWebbingPriceRange(items: WebbingItem[]): string {
    const prices = items.flatMap((w) => Object.values(w.price_per_yard_by_region));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return `$${min.toFixed(2)} - $${max.toFixed(2)}/yd`;
  }

  // =====================================================
  // Step Indicator
  // =====================================================

  function renderStepIndicator() {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                  disabled={step.id > currentStep}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    currentStep >= step.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  } ${step.id < currentStep ? "cursor-pointer hover:bg-primary/80" : ""}`}
                >
                  {step.id}
                </button>
                <span className="mt-2 text-xs font-medium hidden sm:block">
                  {step.name}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`w-8 sm:w-16 h-1 mx-2 rounded ${
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // =====================================================
  // Step 1: Strap Type
  // =====================================================

  function renderStep1() {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">What are you building?</h2>
          <p className="text-muted-foreground mt-2">
            Select the type of strap to get started
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {STRAP_TYPES.map((type) => (
            <Card
              key={type.id}
              className={`cursor-pointer transition-all hover:border-primary ${
                strapType === type.id ? "border-primary ring-2 ring-primary/20" : ""
              }`}
              onClick={() => setStrapType(type.id)}
            >
              <CardContent className="pt-6 text-center">
                <div className="text-4xl mb-3">{type.icon}</div>
                <h3 className="font-semibold">{type.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {type.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // =====================================================
  // Step 2: Dimensions
  // =====================================================

  function renderStep2() {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">Set Dimensions</h2>
          <p className="text-muted-foreground mt-2">
            Define the size of your strap
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-8">
            {/* Length */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Length</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={4}
                    max={72}
                    value={length}
                    onChange={(e) => setLength(Number(e.target.value))}
                    className="w-20 text-center"
                  />
                  <span className="text-muted-foreground">inches</span>
                </div>
              </div>
              <input
                type="range"
                min={4}
                max={72}
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>4" (10cm)</span>
                <span>{length}" ({(length * 2.54).toFixed(1)}cm)</span>
                <span>72" (183cm)</span>
              </div>
            </div>

            <Separator />

            {/* Width */}
            <div className="space-y-4">
              <Label className="text-base">Width</Label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {availableWidths.map((w) => (
                  <button
                    key={w}
                    onClick={() => {
                      setWidth(w);
                      setSelectedWebbing(null);
                      setSelectedColor(null);
                    }}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      width === w
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="font-semibold">{w}"</div>
                    <div className="text-xs text-muted-foreground">
                      {(w * 25.4).toFixed(0)}mm
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Plies */}
            <div className="space-y-4">
              <Label className="text-base">Plies (Layers)</Label>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlies(p)}
                    className={`p-4 rounded-lg border text-center transition-colors ${
                      plies === p
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="font-semibold text-lg">{p}</div>
                    <div className="text-xs text-muted-foreground">
                      {p === 1 ? "Single" : p === 2 ? "Double" : "Triple"}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                More plies = more strength and stiffness
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // =====================================================
  // Step 3: Material
  // =====================================================

  function renderStep3() {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">Choose Material</h2>
          <p className="text-muted-foreground mt-2">
            Select webbing material and color for your {width}" strap
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Material Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold">Material Type</h3>
            {Object.entries(groupedWebbing).map(([material, items]) => {
              const isSelected = selectedWebbing?.material === material;
              const avgStrength = Math.round(
                items.reduce((sum, w) => sum + w.specs.tensile_strength_lbs, 0) / items.length
              );

              return (
                <Card
                  key={material}
                  className={`cursor-pointer transition-all ${
                    isSelected ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"
                  }`}
                  onClick={() => {
                    setSelectedWebbing(items[0]);
                    setSelectedColor(null);
                  }}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{formatMaterialName(material)}</h4>
                        <p className="text-sm text-muted-foreground">
                          {avgStrength} lbs tensile strength
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {getWebbingPriceRange(items)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {items[0].color_options.length} colors
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Color Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold">Color</h3>
            {selectedWebbing ? (
              <Card>
                <CardContent className="py-4">
                  <div className="grid grid-cols-4 gap-3">
                    {selectedWebbing.color_options.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color.name)}
                        className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-all ${
                          selectedColor === color.name
                            ? "ring-2 ring-primary bg-primary/5"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-full border-2 border-border"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-xs text-center">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  Select a material to see colors
                </CardContent>
              </Card>
            )}

            {/* Selection Summary */}
            {selectedWebbing && selectedColor && (
              <Card className="bg-primary/5 border-primary">
                <CardContent className="py-4">
                  <h4 className="font-semibold mb-2">Selected</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Material:</span>
                      <span>{formatMaterialName(selectedWebbing.material)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Width:</span>
                      <span>{selectedWebbing.width}"</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Color:</span>
                      <span>{selectedColor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Strength:</span>
                      <span>{selectedWebbing.specs.tensile_strength_lbs} lbs</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // Step 4: Hardware
  // =====================================================

  function renderStep4() {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">Add Hardware</h2>
          <p className="text-muted-foreground mt-2">
            Select buckles, rings, and other components
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Hardware Catalog */}
          <div className="flex-1 space-y-4">
            <Tabs value={hardwareFilter} onValueChange={setHardwareFilter}>
              <TabsList className="w-full justify-start overflow-x-auto">
                {HARDWARE_CATEGORIES.map((cat) => (
                  <TabsTrigger key={cat.id} value={cat.id}>
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
              {filteredHardware.map((item) => {
                const isAdded = selectedHardware.some((sh) => sh.item.id === item.id);
                return (
                  <Card
                    key={item.id}
                    className={`cursor-pointer transition-all ${
                      isAdded ? "border-primary" : "hover:border-primary/50"
                    }`}
                    onClick={() => handleAddHardware(item)}
                  >
                    <CardContent className="py-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{item.name}</h4>
                          <p className="text-xs text-muted-foreground font-mono">
                            {item.sku}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          ${item.price_tiers["1"]?.toFixed(2)}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">
                          {item.specs.material}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {item.specs.load_rating_lbs} lbs
                        </Badge>
                      </div>
                      {isAdded && (
                        <div className="mt-2">
                          <Badge className="bg-primary">Added</Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* BOM Sidebar */}
          <div className="lg:w-80 lg:sticky lg:top-4 lg:self-start">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Bill of Materials</CardTitle>
                <CardDescription>
                  {selectedHardware.length} item{selectedHardware.length !== 1 ? "s" : ""} selected
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedHardware.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Click hardware items to add them
                  </p>
                ) : (
                  <>
                    {selectedHardware.map((sh) => (
                      <div
                        key={sh.item.id}
                        className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {sh.item.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ${sh.item.price_tiers["1"]?.toFixed(2)} each
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateHardwareQty(sh.item.id, sh.qty - 1);
                            }}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center text-sm">{sh.qty}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateHardwareQty(sh.item.id, sh.qty + 1);
                            }}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Hardware Subtotal</span>
                      <span>${hardwareSubtotal.toFixed(2)}/unit</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // Step 5: Quote Comparison
  // =====================================================

  function renderStep5() {
    const bestValue = quoteResult?.quotes.reduce((best, q) =>
      q.meetsMinimum && q.breakdown.perUnit < (best?.breakdown.perUnit ?? Infinity) ? q : best
    , null as typeof quoteResult.quotes[0] | null);

    const fastest = quoteResult?.quotes.reduce((fast, q) =>
      q.meetsMinimum && q.leadTimeMin < (fast?.leadTimeMin ?? Infinity) ? q : fast
    , null as typeof quoteResult.quotes[0] | null);

    return (
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">Compare Manufacturing Regions</h2>
          <p className="text-muted-foreground mt-2">
            See pricing, lead times, and minimums for each region
          </p>
        </div>

        {/* Quantity Selector */}
        <Card className="mb-8">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Label className="text-base font-semibold whitespace-nowrap">
                Order Quantity:
              </Label>
              <div className="flex-1 w-full">
                <input
                  type="range"
                  min={50}
                  max={20000}
                  step={50}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
              <Input
                type="number"
                min={50}
                max={20000}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-28 text-center"
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>50 units</span>
              <span>20,000 units</span>
            </div>
          </CardContent>
        </Card>

        {/* Region Cards */}
        {calculatingQuote ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Calculating quotes...</p>
          </div>
        ) : quoteResult ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quoteResult.quotes.map((quote) => {
              const isBestValue = bestValue?.region === quote.region;
              const isFastest = fastest?.region === quote.region && !isBestValue;

              return (
                <Card
                  key={quote.region}
                  className={`transition-all ${
                    !quote.meetsMinimum
                      ? "opacity-50"
                      : isBestValue
                      ? "border-green-500 ring-2 ring-green-500/20"
                      : isFastest
                      ? "border-blue-500 ring-2 ring-blue-500/20"
                      : ""
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{REGION_FLAGS[quote.region]}</span>
                        <CardTitle className="text-lg">{quote.regionLabel}</CardTitle>
                      </div>
                      <div className="flex gap-1">
                        {isBestValue && (
                          <Badge className="bg-green-600">Best Value</Badge>
                        )}
                        {isFastest && (
                          <Badge className="bg-blue-600">Fastest</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!quote.meetsMinimum && (
                      <div className="bg-amber-50 text-amber-800 text-sm p-2 rounded">
                        MOQ: {quote.moq.toLocaleString()} units
                      </div>
                    )}

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Unit Cost:</span>
                        <span className="font-semibold">
                          ${quote.breakdown.perUnit.toFixed(2)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Webbing:</span>
                        <span>${quote.breakdown.webbingCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Hardware:</span>
                        <span>${quote.breakdown.hardwareCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Labor:</span>
                        <span>${quote.breakdown.laborCost.toFixed(2)}</span>
                      </div>
                      {quote.breakdown.toolingCost > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tooling:</span>
                          <span>${quote.breakdown.toolingCost.toFixed(2)}</span>
                        </div>
                      )}
                      {quote.breakdown.volumeDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Volume Discount:</span>
                          <span>-${quote.breakdown.volumeDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping:</span>
                        <span>${quote.breakdown.shippingCost.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-base">
                        <span>Total Landed:</span>
                        <span>${quote.breakdown.total.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Lead Time:</span>
                        <span>{quote.leadTimeMin}-{quote.leadTimeMax} weeks</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">MOQ:</span>
                        <span>{quote.moq.toLocaleString()} units</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Configure your strap to see quotes
          </div>
        )}
      </div>
    );
  }

  // =====================================================
  // Navigation
  // =====================================================

  function renderNavigation() {
    return (
      <div className="flex justify-between items-center mt-8 pt-6 border-t">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(currentStep - 1)}
          disabled={currentStep === 1}
        >
          Back
        </Button>

        {currentStep < 5 ? (
          <Button onClick={() => setCurrentStep(currentStep + 1)} disabled={!canProceed}>
            Continue
          </Button>
        ) : (
          <Button
            onClick={() => {
              toast.success("Quote saved! Check your dashboard.");
            }}
            disabled={!quoteResult}
          >
            Save Quote
          </Button>
        )}
      </div>
    );
  }

  // =====================================================
  // Main Render
  // =====================================================

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground">Loading catalog...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Strap Configurator</h1>
        <p className="text-muted-foreground mt-2">
          Design your custom strap and get instant quotes from 6 manufacturing regions
        </p>
      </div>

      {renderStepIndicator()}

      <div className="min-h-[500px]">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
      </div>

      {renderNavigation()}
    </div>
  );
}
