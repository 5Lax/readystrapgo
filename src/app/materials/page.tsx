import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const materials = [
  {
    name: "Nylon 6/6",
    description: "Industry standard for strength and durability",
    properties: ["High tensile strength", "Abrasion resistant", "UV stable"],
    widths: ['0.5"', '0.75"', '1"', '1.5"', '2"'],
    priceRange: "$0.45 - $1.20/yd",
  },
  {
    name: "Polyester",
    description: "Excellent color retention and weather resistance",
    properties: ["Low stretch", "Fade resistant", "Quick drying"],
    widths: ['0.5"', '0.75"', '1"', '1.5"', '2"'],
    priceRange: "$0.40 - $1.10/yd",
  },
  {
    name: "Polypropylene",
    description: "Lightweight and water resistant",
    properties: ["Floats in water", "Mold resistant", "Budget friendly"],
    widths: ['0.5"', '0.75"', '1"', '1.5"'],
    priceRange: "$0.30 - $0.85/yd",
  },
  {
    name: "Elastic",
    description: "Stretch webbing for adjustable fit",
    properties: ["2-way stretch", "Recovery", "Comfortable"],
    widths: ['0.75"', '1"', '1.5"'],
    priceRange: "$0.60 - $1.50/yd",
  },
  {
    name: "UHMWPE / Dyneema",
    description: "Ultra-high strength for technical applications",
    properties: ["15x stronger than steel", "Lightweight", "Cut resistant"],
    widths: ['0.5"', '0.75"', '1"'],
    priceRange: "$2.50 - $8.00/yd",
  },
];

const hardware = [
  {
    category: "Buckles",
    items: ["Side release", "Cam buckle", "Ladder lock", "Center release", "Magnetic"],
  },
  {
    category: "Rings",
    items: ["D-rings", "O-rings", "Rectangle rings", "Split rings", "Swivel rings"],
  },
  {
    category: "Sliders",
    items: ["Tri-glides", "Strap adjusters", "Tension locks", "Double bars"],
  },
  {
    category: "Snaps & Hooks",
    items: ["Snap hooks", "Lobster claws", "Carabiners", "Spring snaps", "Swivel snaps"],
  },
];

export default function MaterialsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Materials & Hardware</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Premium webbing materials and hardware components for every application.
          All materials available across our 6 global manufacturing regions.
        </p>
      </div>

      {/* Webbing Materials */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Webbing Materials</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((material) => (
            <Card key={material.name}>
              <CardHeader>
                <CardTitle>{material.name}</CardTitle>
                <CardDescription>{material.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Properties</p>
                  <div className="flex flex-wrap gap-2">
                    {material.properties.map((prop) => (
                      <Badge key={prop} variant="secondary">
                        {prop}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Available Widths</p>
                  <div className="flex flex-wrap gap-2">
                    {material.widths.map((width) => (
                      <Badge key={width} variant="outline">
                        {width}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Price range: </span>
                    <span className="font-medium">{material.priceRange}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Hardware */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Hardware Components</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {hardware.map((category) => (
            <Card key={category.category}>
              <CardHeader>
                <CardTitle className="text-lg">{category.category}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {category.items.map((item) => (
                    <li key={item} className="text-sm text-muted-foreground">
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-center text-muted-foreground mt-8">
          200+ hardware options available. Use our{" "}
          <a href="/builder" className="text-primary hover:underline">
            configurator
          </a>{" "}
          to explore the full catalog.
        </p>
      </section>
    </div>
  );
}
