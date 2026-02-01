import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const services = [
  {
    title: "Custom Manufacturing",
    description: "End-to-end strap production from design to delivery",
    features: [
      "6 global manufacturing regions",
      "MOQs from 250 to 10,000+ units",
      "Full color matching",
      "Custom hardware sourcing",
      "Quality inspection included",
    ],
    badge: "Core Service",
  },
  {
    title: "Design Assistance",
    description: "Expert help bringing your strap concept to life",
    features: [
      "Technical drawing creation",
      "Material recommendations",
      "Hardware selection guidance",
      "Prototype development",
      "Cost optimization",
    ],
    badge: "Popular",
  },
  {
    title: "AI Spec Parsing",
    description: "Automated extraction from photos and documents",
    features: [
      "Photo-to-BOM conversion",
      "PDF spec sheet parsing",
      "Dimension estimation",
      "Component identification",
      "Instant quote generation",
    ],
    badge: "New",
  },
  {
    title: "Sample Kits",
    description: "Physical samples shipped to evaluate materials",
    features: [
      "Webbing swatches",
      "Hardware samples",
      "Color ring sets",
      "Material spec sheets",
      "Free with orders",
    ],
  },
  {
    title: "White Label",
    description: "Custom branding and packaging for resellers",
    features: [
      "Branded hang tags",
      "Custom packaging",
      "Private labeling",
      "Drop shipping",
      "Retail-ready options",
    ],
  },
  {
    title: "Rush Production",
    description: "Expedited manufacturing for tight deadlines",
    features: [
      "USA production: 5-7 days",
      "Air freight options",
      "Priority scheduling",
      "Dedicated PM support",
      "Premium pricing",
    ],
  },
];

export default function ServicesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Our Services</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          From concept to production, we provide comprehensive strap manufacturing
          services tailored to your needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service.title} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle>{service.title}</CardTitle>
                {service.badge && (
                  <Badge
                    variant={service.badge === "New" ? "default" : "secondary"}
                    className={service.badge === "New" ? "bg-primary" : ""}
                  >
                    {service.badge}
                  </Badge>
                )}
              </div>
              <CardDescription>{service.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
