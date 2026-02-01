"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Camera,
  Upload,
  X,
  Check,
  Loader2,
  Pencil,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "analyzing" | "complete" | "error";
}

interface DetectedComponent {
  id: string;
  type: "webbing" | "buckle" | "ring" | "slider" | "snap" | "other";
  name: string;
  confidence: number;
  details: string;
  editable: boolean;
}

interface AnalysisResult {
  imageId: string;
  components: DetectedComponent[];
  dimensions: {
    estimatedLength: string;
    estimatedWidth: string;
  };
  material: string;
  confidence: number;
}

const MOCK_COMPONENTS: DetectedComponent[] = [
  {
    id: "1",
    type: "webbing",
    name: "Nylon Webbing",
    confidence: 0.92,
    details: '1" width, appears to be 6/6 nylon',
    editable: true,
  },
  {
    id: "2",
    type: "buckle",
    name: "Side Release Buckle",
    confidence: 0.88,
    details: "Plastic, dual-adjust style",
    editable: true,
  },
  {
    id: "3",
    type: "slider",
    name: "Tri-Glide Slider",
    confidence: 0.85,
    details: "Metal, appears to be zinc alloy",
    editable: true,
  },
];

export default function PhotosPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [editingComponent, setEditingComponent] = useState<string | null>(null);

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

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );
    handleFiles(files);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    const newImages: UploadedImage[] = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      status: "pending" as const,
    }));

    setImages((prev) => [...prev, ...newImages]);

    // Start analysis for each image
    newImages.forEach((img) => analyzeImage(img));
  };

  const analyzeImage = async (image: UploadedImage) => {
    // Update status to analyzing
    setImages((prev) =>
      prev.map((img) =>
        img.id === image.id ? { ...img, status: "analyzing" } : img
      )
    );

    // Simulate AI analysis delay
    await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 1500));

    // Mock analysis result
    const result: AnalysisResult = {
      imageId: image.id,
      components: MOCK_COMPONENTS.map((c) => ({
        ...c,
        id: `${image.id}-${c.id}`,
        confidence: c.confidence + (Math.random() * 0.1 - 0.05),
      })),
      dimensions: {
        estimatedLength: `${Math.floor(18 + Math.random() * 24)}"`,
        estimatedWidth: `${(0.75 + Math.random() * 0.5).toFixed(2)}"`,
      },
      material: "Nylon 6/6",
      confidence: 0.85 + Math.random() * 0.1,
    };

    setAnalysisResults((prev) => [...prev, result]);
    setImages((prev) =>
      prev.map((img) =>
        img.id === image.id ? { ...img, status: "complete" } : img
      )
    );
  };

  const removeImage = (imageId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
    setAnalysisResults((prev) => prev.filter((r) => r.imageId !== imageId));
  };

  const getComponentIcon = (type: string) => {
    const icons: Record<string, string> = {
      webbing: "🎗️",
      buckle: "🔗",
      ring: "⭕",
      slider: "📏",
      snap: "🔘",
      other: "🔧",
    };
    return icons[type] || "🔧";
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "text-green-500";
    if (confidence >= 0.75) return "text-yellow-500";
    return "text-orange-500";
  };

  const allAnalyzed = images.length > 0 && images.every((img) => img.status === "complete");
  const totalComponents = analysisResults.reduce(
    (sum, r) => sum + r.components.length,
    0
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">AI-Powered Analysis</span>
        </div>
        <h1 className="text-3xl font-bold">Upload Strap Photos</h1>
        <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
          Take photos of an existing strap and our AI will identify the components,
          materials, and dimensions automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-xl p-8 md:p-12 transition-all duration-200 cursor-pointer
              ${
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50"
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-4">
              <div
                className={`p-4 rounded-full transition-colors ${
                  isDragging ? "bg-primary/20" : "bg-muted"
                }`}
              >
                <Camera
                  className={`h-10 w-10 ${
                    isDragging ? "text-primary" : "text-muted-foreground"
                  }`}
                />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-foreground">
                  Drop photos here or click to browse
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  JPG, PNG, or HEIC up to 10MB each
                </p>
              </div>
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Select Photos
              </Button>
            </div>
          </div>

          {/* Tips */}
          <Card className="border-dashed">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Tips for best results:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Photograph on a plain, contrasting background</li>
                    <li>Include close-ups of buckles and hardware</li>
                    <li>Place a ruler or coin for scale reference</li>
                    <li>Ensure good lighting without harsh shadows</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Uploaded Images */}
          {images.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Uploaded Photos</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="relative group rounded-lg overflow-hidden border bg-muted aspect-square"
                  >
                    <img
                      src={image.preview}
                      alt="Uploaded strap"
                      className="w-full h-full object-cover"
                    />
                    {/* Status Overlay */}
                    {image.status === "analyzing" && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                          <p className="text-sm font-medium">Analyzing...</p>
                        </div>
                      </div>
                    )}
                    {image.status === "complete" && (
                      <div className="absolute top-2 right-2">
                        <div className="p-1 rounded-full bg-green-500">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                    {/* Remove Button */}
                    <button
                      onClick={() => removeImage(image.id)}
                      className="absolute top-2 left-2 p-1 rounded-full bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {analysisResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Detected Components</h3>
              {analysisResults.map((result) => (
                <Card key={result.imageId}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Analysis Results
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={getConfidenceColor(result.confidence)}
                      >
                        {Math.round(result.confidence * 100)}% confidence
                      </Badge>
                    </div>
                    <CardDescription>
                      Estimated: {result.dimensions.estimatedLength} x{" "}
                      {result.dimensions.estimatedWidth} • {result.material}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.components.map((component) => (
                      <div
                        key={component.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">
                            {getComponentIcon(component.type)}
                          </span>
                          <div>
                            <p className="font-medium">{component.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {component.details}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm ${getConfidenceColor(
                              component.confidence
                            )}`}
                          >
                            {Math.round(component.confidence * 100)}%
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              setEditingComponent(
                                editingComponent === component.id
                                  ? null
                                  : component.id
                              )
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="lg:sticky lg:top-4 lg:self-start space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Summary</CardTitle>
              <CardDescription>
                {images.length === 0
                  ? "Upload photos to get started"
                  : allAnalyzed
                  ? "Ready to generate quote"
                  : "Analyzing your photos..."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Photos uploaded</span>
                  <span className="font-medium">{images.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Components found</span>
                  <span className="font-medium">{totalComponents}</span>
                </div>
                {analysisResults.length > 0 && (
                  <>
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Est. Length</span>
                      <span className="font-medium">
                        {analysisResults[0]?.dimensions.estimatedLength}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Est. Width</span>
                      <span className="font-medium">
                        {analysisResults[0]?.dimensions.estimatedWidth}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Material</span>
                      <span className="font-medium">
                        {analysisResults[0]?.material}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <Button
                  className="w-full"
                  disabled={!allAnalyzed}
                  onClick={() => router.push("/builder")}
                >
                  Continue to Builder
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Review and adjust in the configurator
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="py-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                No photos available?
              </p>
              <Link href="/builder">
                <Button variant="outline" size="sm">
                  Start from scratch
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
