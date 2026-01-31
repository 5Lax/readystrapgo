"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { StrapSpecs, Hardware, PriceBreakdown } from "@/lib/types";
import { calculatePrice, getQuantityDiscountLabel } from "@/lib/pricing";

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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { toast } from "sonner";

const STEPS = [
  { id: 1, name: "Strap Specs", description: "Define your strap dimensions" },
  { id: 2, name: "Hardware", description: "Select hardware components" },
  { id: 3, name: "Quantity", description: "Set your order quantity" },
  { id: 4, name: "Review", description: "Review and save your quote" },
];

const MATERIALS = [
  { value: "nylon", label: "Nylon" },
  { value: "polyester", label: "Polyester" },
  { value: "polypropylene", label: "Polypropylene" },
  { value: "cotton", label: "Cotton" },
  { value: "leather", label: "Leather" },
  { value: "neoprene", label: "Neoprene" },
];

const COLORS = [
  { value: "black", label: "Black" },
  { value: "navy", label: "Navy Blue" },
  { value: "red", label: "Red" },
  { value: "green", label: "Forest Green" },
  { value: "gray", label: "Gray" },
  { value: "tan", label: "Tan" },
  { value: "orange", label: "Safety Orange" },
  { value: "white", label: "White" },
];

const BUCKLE_TYPES = [
  { value: "none", label: "No Buckle" },
  { value: "side_release", label: "Side Release" },
  { value: "cam", label: "Cam Buckle" },
  { value: "ladder_lock", label: "Ladder Lock" },
  { value: "metal", label: "Metal Buckle" },
];

export default function BuilderPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const [strapSpecs, setStrapSpecs] = useState<StrapSpecs>({
    length: 36,
    width: 1,
    material: "nylon",
    color: "black",
  });

  const [hardware, setHardware] = useState<Hardware>({
    buckleType: "none",
    dRings: false,
    rivets: false,
    snaps: false,
    velcro: false,
    triGlide: false,
  });

  const [quantity, setQuantity] = useState(10);
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase.auth]);

  useEffect(() => {
    const breakdown = calculatePrice(strapSpecs, hardware, quantity);
    setPriceBreakdown(breakdown);
  }, [strapSpecs, hardware, quantity]);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveQuote = async () => {
    if (!user) {
      toast.error("Please sign in to save your quote");
      router.push("/login");
      return;
    }

    if (!priceBreakdown) return;

    setSaving(true);

    const { error } = await supabase.from("quotes").insert({
      user_id: user.id,
      strap_specs: strapSpecs,
      hardware: hardware,
      quantity: quantity,
      estimated_price: priceBreakdown.total,
      status: "draft",
    });

    setSaving(false);

    if (error) {
      toast.error("Failed to save quote: " + error.message);
      return;
    }

    toast.success("Quote saved successfully!");
    router.push("/dashboard");
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  currentStep >= step.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step.id}
              </div>
              <span className="mt-2 text-xs font-medium hidden sm:block">
                {step.name}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`w-12 sm:w-24 h-1 mx-2 rounded ${
                  currentStep > step.id ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Strap Specifications</CardTitle>
        <CardDescription>
          Define the dimensions and material for your custom strap
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="length">Length (inches)</Label>
            <Input
              id="length"
              type="number"
              min={6}
              max={120}
              value={strapSpecs.length}
              onChange={(e) =>
                setStrapSpecs({ ...strapSpecs, length: Number(e.target.value) })
              }
            />
            <p className="text-xs text-muted-foreground">
              Min: 6" / Max: 120"
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="width">Width (inches)</Label>
            <Select
              value={String(strapSpecs.width)}
              onValueChange={(value) =>
                setStrapSpecs({ ...strapSpecs, width: Number(value) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select width" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">1/2"</SelectItem>
                <SelectItem value="0.75">3/4"</SelectItem>
                <SelectItem value="1">1"</SelectItem>
                <SelectItem value="1.5">1-1/2"</SelectItem>
                <SelectItem value="2">2"</SelectItem>
                <SelectItem value="3">3"</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="material">Material</Label>
            <Select
              value={strapSpecs.material}
              onValueChange={(value) =>
                setStrapSpecs({ ...strapSpecs, material: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                {MATERIALS.map((material) => (
                  <SelectItem key={material.value} value={material.value}>
                    {material.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Select
              value={strapSpecs.color}
              onValueChange={(value) =>
                setStrapSpecs({ ...strapSpecs, color: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select color" />
              </SelectTrigger>
              <SelectContent>
                {COLORS.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    {color.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={handleNext}>Next Step</Button>
      </CardFooter>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Hardware Selection</CardTitle>
        <CardDescription>
          Choose the hardware components for your strap
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="buckleType">Buckle Type</Label>
          <Select
            value={hardware.buckleType}
            onValueChange={(value) =>
              setHardware({ ...hardware, buckleType: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select buckle type" />
            </SelectTrigger>
            <SelectContent>
              {BUCKLE_TYPES.map((buckle) => (
                <SelectItem key={buckle.value} value={buckle.value}>
                  {buckle.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div>
          <Label className="text-base">Additional Hardware</Label>
          <p className="text-sm text-muted-foreground mb-4">
            Select any additional hardware components
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: "dRings", label: "D-Rings", price: "$0.75" },
              { key: "rivets", label: "Rivets", price: "$0.35" },
              { key: "snaps", label: "Snap Fasteners", price: "$0.85" },
              { key: "velcro", label: "Velcro Strips", price: "$1.50" },
              { key: "triGlide", label: "Tri-Glide Adjuster", price: "$0.65" },
            ].map((item) => (
              <label
                key={item.key}
                className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                  hardware[item.key as keyof Hardware]
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={hardware[item.key as keyof Hardware] as boolean}
                    onChange={(e) =>
                      setHardware({ ...hardware, [item.key]: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="font-medium">{item.label}</span>
                </div>
                <Badge variant="secondary">{item.price}/unit</Badge>
              </label>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button onClick={handleNext}>Next Step</Button>
      </CardFooter>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Order Quantity</CardTitle>
        <CardDescription>
          How many straps do you need? Volume discounts apply!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            min={1}
            max={10000}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="text-lg"
          />
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <h4 className="font-medium">Volume Discount Tiers</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div
              className={`p-3 rounded-md border ${
                quantity >= 25 && quantity < 50
                  ? "border-primary bg-primary/10"
                  : "border-border"
              }`}
            >
              <div className="font-medium">25+ units</div>
              <div className="text-muted-foreground">5% discount</div>
            </div>
            <div
              className={`p-3 rounded-md border ${
                quantity >= 50 && quantity < 100
                  ? "border-primary bg-primary/10"
                  : "border-border"
              }`}
            >
              <div className="font-medium">50+ units</div>
              <div className="text-muted-foreground">10% discount</div>
            </div>
            <div
              className={`p-3 rounded-md border ${
                quantity >= 100
                  ? "border-primary bg-primary/10"
                  : "border-border"
              }`}
            >
              <div className="font-medium">100+ units</div>
              <div className="text-muted-foreground">15% discount</div>
            </div>
          </div>
          <p className="text-sm text-primary font-medium">
            {getQuantityDiscountLabel(quantity)}
          </p>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button onClick={handleNext}>Review Quote</Button>
      </CardFooter>
    </Card>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quote Summary</CardTitle>
          <CardDescription>
            Review your custom strap configuration and pricing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Strap Specifications
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Length:</span>
                  <span className="font-medium">{strapSpecs.length}"</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Width:</span>
                  <span className="font-medium">{strapSpecs.width}"</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Material:</span>
                  <span className="font-medium capitalize">
                    {strapSpecs.material}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Color:</span>
                  <span className="font-medium capitalize">
                    {COLORS.find((c) => c.value === strapSpecs.color)?.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Hardware
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Buckle:</span>
                  <span className="font-medium">
                    {BUCKLE_TYPES.find((b) => b.value === hardware.buckleType)
                      ?.label}
                  </span>
                </div>
                {hardware.dRings && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">D-Rings:</span>
                    <Badge variant="secondary">Included</Badge>
                  </div>
                )}
                {hardware.rivets && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rivets:</span>
                    <Badge variant="secondary">Included</Badge>
                  </div>
                )}
                {hardware.snaps && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Snaps:</span>
                    <Badge variant="secondary">Included</Badge>
                  </div>
                )}
                {hardware.velcro && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Velcro:</span>
                    <Badge variant="secondary">Included</Badge>
                  </div>
                )}
                {hardware.triGlide && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tri-Glide:</span>
                    <Badge variant="secondary">Included</Badge>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-4">
              Bill of Materials
            </h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priceBreakdown?.lineItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      ${item.unitPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      ${item.total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3}>Subtotal</TableCell>
                  <TableCell className="text-right">
                    ${priceBreakdown?.subtotal.toFixed(2)}
                  </TableCell>
                </TableRow>
                {priceBreakdown && priceBreakdown.quantityDiscount > 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-green-600">
                      Volume Discount
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      -${priceBreakdown.quantityDiscount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                )}
                <TableRow className="font-bold text-lg">
                  <TableCell colSpan={3}>Total</TableCell>
                  <TableCell className="text-right">
                    ${priceBreakdown?.total.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          <Button onClick={handleSaveQuote} disabled={saving}>
            {saving ? "Saving..." : "Save Quote"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Quote Builder</h1>
          <p className="text-muted-foreground">
            Design your custom strap and get an instant quote
          </p>
        </div>

        {renderStepIndicator()}

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}

        {priceBreakdown && currentStep < 4 && (
          <Card className="mt-6 bg-muted/30">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Estimated Total:</span>
                <span className="text-2xl font-bold">
                  ${priceBreakdown.total.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
