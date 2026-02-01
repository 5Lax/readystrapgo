"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Upload,
  CloudUpload,
  Download,
  Camera,
  SlidersHorizontal,
  Package,
  Zap,
  Globe,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

const howItWorksSteps = [
  {
    icon: Upload,
    title: "Upload Your Spec",
    description: "PDF, tech pack, drawing, or even a photo",
  },
  {
    icon: Zap,
    title: "AI Extracts Your BOM",
    description: "Materials, hardware, and dimensions parsed instantly",
  },
  {
    icon: Globe,
    title: "Compare 6 Regions",
    description: "See pricing from USA to Asia side by side",
  },
];

const helpCards = [
  {
    icon: Download,
    title: "Download Our Template",
    description: "Grab our spec sheet template and fill in your strap details",
    cta: "Get Template",
    href: "/templates",
  },
  {
    icon: Camera,
    title: "Send Us Photos",
    description: "Upload photos and AI identifies components automatically",
    cta: "Upload Photos",
    href: "/photos",
  },
  {
    icon: SlidersHorizontal,
    title: "Use Our Builder",
    description: "Configure your strap step-by-step with our guided builder",
    cta: "Start Building",
    href: "/builder",
  },
  {
    icon: Package,
    title: "Order Samples",
    description: "Get a sample kit shipped to see materials firsthand",
    cta: "View Samples",
    href: "/samples",
  },
];

const capabilities = [
  "Nylon",
  "Polyester",
  "Polypropylene",
  "Elastic",
  "UHMWPE",
  "200+ Hardware Options",
  "Printing",
  "Padding",
  "Reflective",
  "Hook & Loop",
  "Ultrasonic Welding",
];

export default function Home() {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      router.push("/upload");
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      router.push("/upload");
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
            Custom Straps.{" "}
            <span className="text-primary">Instant Quotes.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Upload your spec sheet and get pricing across 6 manufacturing regions in seconds.
          </p>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-8 md:p-12 transition-all duration-200 cursor-pointer
              ${isDragging
                ? "border-primary bg-primary/10"
                : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50"
              }
            `}
            onClick={handleBrowseClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.ai,.dxf,.xlsx,.xls,.png,.jpg,.jpeg"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-4">
              <div className={`p-4 rounded-full transition-colors ${isDragging ? "bg-primary/20" : "bg-muted"}`}>
                <CloudUpload className={`h-10 w-10 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground">
                  Drag & drop your spec sheet here
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  PDF, AI, DXF, Excel, or image
                </p>
              </div>
              <Button
                className="mt-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBrowseClick();
                }}
              >
                Browse Files
              </Button>
            </div>
          </div>

          {/* Help Link */}
          <div className="mt-8 space-y-3">
            <button
              onClick={() => scrollToSection("help")}
              className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              Don&apos;t have a spec sheet?
              <ChevronDown className="h-4 w-4" />
            </button>
            <p className="text-sm text-muted-foreground">
              No spec? Start with a{" "}
              <Link href="/templates" className="text-primary hover:underline">
                template
              </Link>
              !
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorksSteps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section id="help" className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
            No spec sheet? No problem.
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            We have multiple ways to help you get started with your custom strap project.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {helpCards.map((card, index) => (
              <Link
                key={index}
                href={card.href}
                className="group p-6 rounded-xl border border-border/50 bg-card hover:border-primary/50 hover:bg-card/80 transition-all"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                  <card.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {card.description}
                </p>
                <span className="inline-flex items-center text-sm font-medium text-primary group-hover:gap-2 transition-all">
                  {card.cta}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
            Manufacturing Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="p-6 rounded-xl border border-border/50 bg-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <h3 className="text-xl font-semibold text-foreground">Made in USA</h3>
              </div>
              <ul className="space-y-2 text-muted-foreground">
                <li>Quick-turn 1-3 weeks</li>
                <li>No duties or import fees</li>
                <li>Local QC and communication</li>
              </ul>
            </div>
            <div className="p-6 rounded-xl border border-border/50 bg-card">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold text-foreground">Global Manufacturing</h3>
              </div>
              <ul className="space-y-2 text-muted-foreground">
                <li>Taiwan, Vietnam, Cambodia, China, Mexico</li>
                <li>MOQs from 250 to 2,000+ units</li>
                <li>Competitive pricing at scale</li>
              </ul>
            </div>
          </div>

          {/* Capability Badges */}
          <div className="flex flex-wrap justify-center gap-3">
            {capabilities.map((capability, index) => (
              <span
                key={index}
                className="px-4 py-2 rounded-full text-sm font-medium bg-muted text-foreground border border-border/50"
              >
                {capability}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Ready to get your strap quoted?
          </h2>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg px-8"
            onClick={scrollToTop}
          >
            Get Strapped
          </Button>
        </div>
      </section>
    </div>
  );
}
