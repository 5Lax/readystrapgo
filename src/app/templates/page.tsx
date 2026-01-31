"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  formats: string[];
  hardware: string[];
  material: string;
  previewImage: string;
  downloadFiles: {
    ai?: string;
    pdf?: string;
    svg?: string;
  };
}

const TEMPLATES: Template[] = [
  {
    id: "sternlinklite",
    name: "SternLinkLite Sternum Strap",
    category: "Sternum Straps",
    description:
      "Lightweight sternum strap with FIDLOCK center-release buckle. Full dimensional drawing, BOM table, and construction details.",
    formats: [".AI", ".PDF", ".SVG"],
    hardware: ["FIDLOCK buckle", "Tri-glide"],
    material: "15mm seatbelt webbing",
    previewImage: "/templates/sternlinklite-preview.svg",
    downloadFiles: {
      ai: "/templates/downloads/SternLinkLite_Techpack_01_09_25_download.ai",
    },
  },
  {
    id: "fidlock-dogcollar",
    name: "FIDLOCK Dog Collar",
    category: "Pet Products",
    description:
      "Premium dog collar with FIDLOCK magnetic buckle. Exploded hardware view, material cross-sections, and sizing chart.",
    formats: [".AI", ".PDF", ".SVG"],
    hardware: ["FIDLOCK V-buckle", "D-ring", "Tri-glide"],
    material: "25mm webbing + neoprene",
    previewImage: "/templates/fidlock-dogcollar-preview.svg",
    downloadFiles: {
      ai: "/templates/downloads/FIDLOCKDogCollar_Techpack_02_25_25_.ai",
    },
  },
  {
    id: "aplus-sternum",
    name: "A+ Sternum Strap w/ FIDLOCK",
    category: "Sternum Straps",
    description:
      "A+ Products sternum strap with FIDLOCK V-Buckle 20. Construction layout, wireframe view, and full component callouts.",
    formats: [".AI", ".PDF", ".SVG"],
    hardware: ["FIDLOCK V-Buckle 20", "Woojin Open TQ", "Elastic keeper"],
    material: "25mm webbing + reflective tracer",
    previewImage: "/templates/aplus-sternum-preview.svg",
    downloadFiles: {
      ai: "/templates/downloads/APLUSsternumstrap_techpackasset.ai",
    },
  },
];

const FORMAT_COLORS: Record<string, string> = {
  ".AI": "bg-orange-100 text-orange-700 border-orange-200",
  ".PDF": "bg-red-100 text-red-700 border-red-200",
  ".SVG": "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function TemplatesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [requestText, setRequestText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase.auth]);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requestText.trim()) {
      toast.error("Please describe the tech pack you need");
      return;
    }

    if (!user) {
      toast.error("Please sign in to submit a request");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("template_requests").insert({
      user_id: user.id,
      request_text: requestText.trim(),
    });

    setSubmitting(false);

    if (error) {
      toast.error("Failed to submit request: " + error.message);
      return;
    }

    setSubmitted(true);
    setRequestText("");
    toast.success("Request submitted! We'll review it shortly.");

    // Reset after 3 seconds
    setTimeout(() => setSubmitted(false), 3000);
  };

  const handleDownload = (template: Template) => {
    // For now, download the AI file directly
    if (template.downloadFiles.ai) {
      const link = document.createElement("a");
      link.href = template.downloadFiles.ai;
      link.download = template.downloadFiles.ai.split("/").pop() || "techpack.ai";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloading ${template.name}`);
    } else {
      toast.error("Download not available yet");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Strap Tech Packs
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            We believe great manufacturing starts with great documentation. Unlike most
            manufacturers who guard their production specs, we&apos;re sharing our
            production-grade technical drawings for free. Use them as templates,
            learn from them, or adapt them for your own projects.
          </p>

          {/* Format Badges */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-sm text-muted-foreground">Available in:</span>
            {[".AI", ".PDF", ".SVG"].map((format) => (
              <Badge
                key={format}
                variant="outline"
                className={`${FORMAT_COLORS[format]} font-mono text-xs px-3 py-1`}
              >
                {format}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Templates Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Template Cards */}
            {TEMPLATES.map((template) => (
              <Card key={template.id} className="flex flex-col overflow-hidden">
                {/* Preview Image */}
                <div
                  className="relative h-48 bg-slate-50 cursor-pointer group"
                  onClick={() => setLightboxImage(template.previewImage)}
                >
                  <Image
                    src={template.previewImage}
                    alt={template.name}
                    fill
                    className="object-contain p-2 transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-sm text-slate-600 bg-white/90 px-3 py-1 rounded-full">
                      Click to enlarge
                    </span>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {template.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {template.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  {/* Hardware Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {template.hardware.map((hw) => (
                      <Badge
                        key={hw}
                        variant="outline"
                        className="text-xs font-normal bg-slate-50"
                      >
                        {hw}
                      </Badge>
                    ))}
                  </div>

                  {/* Material Spec */}
                  <div className="font-mono text-xs text-muted-foreground bg-slate-50 px-3 py-2 rounded">
                    {template.material}
                  </div>

                  {/* Format Badges */}
                  <div className="flex gap-2">
                    {template.formats.map((format) => (
                      <Badge
                        key={format}
                        variant="outline"
                        className={`${FORMAT_COLORS[format]} text-xs font-mono`}
                      >
                        {format}
                      </Badge>
                    ))}
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => handleDownload(template)}
                  >
                    Download Tech Pack
                  </Button>
                </CardFooter>
              </Card>
            ))}

            {/* Request Card */}
            <Card className="flex flex-col border-dashed border-2">
              <CardHeader>
                <CardTitle className="text-lg">Request a Tech Pack</CardTitle>
                <CardDescription>
                  Don&apos;t see what you need? Tell us what you&apos;re looking for.
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <form onSubmit={handleRequestSubmit} className="space-y-4">
                  <Input
                    placeholder="e.g., Camera strap with quick-release, Dog leash with traffic handle..."
                    value={requestText}
                    onChange={(e) => setRequestText(e.target.value)}
                    disabled={submitting || submitted}
                    className="h-24 resize-none"
                    // Using textarea styling via className
                  />

                  <Button
                    type="submit"
                    variant={submitted ? "outline" : "default"}
                    className="w-full"
                    disabled={submitting || submitted || !requestText.trim()}
                  >
                    {submitting
                      ? "Submitting..."
                      : submitted
                      ? "Request Submitted!"
                      : "Submit Request"}
                  </Button>
                </form>

                <p className="text-xs text-muted-foreground mt-4">
                  <span className="font-medium">Popular requests:</span> Guitar straps,
                  luggage straps, medical device straps, harness systems
                </p>

                {!user && (
                  <p className="text-xs text-amber-600 mt-2">
                    <Link href="/login" className="underline hover:no-underline">
                      Sign in
                    </Link>{" "}
                    to submit a request
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-12 bg-primary/5">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0">
            <CardContent className="py-8 text-center">
              <h2 className="text-2xl font-bold mb-3">
                Have Your Own Design?
              </h2>
              <p className="text-primary-foreground/80 mb-6 max-w-lg mx-auto">
                Upload your tech pack or design files and we&apos;ll provide a
                custom quote for manufacturing your straps.
              </p>
              <Button asChild variant="secondary" size="lg">
                <Link href="/upload">Upload Your Design</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <Image
              src={lightboxImage}
              alt="Tech pack preview"
              width={800}
              height={600}
              className="w-full h-auto object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
              onClick={() => setLightboxImage(null)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <p className="text-center text-white/70 mt-4 text-sm">
              Click anywhere to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
