"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Upload,
  Camera,
  X,
  FileText,
  Image,
  Printer,
  Check,
  ArrowRight,
} from "lucide-react";

// =====================================================
// Types
// =====================================================

type WorkflowType = "specs" | "sample" | null;

interface FileWithPreview extends File {
  preview?: string;
}

// =====================================================
// Constants
// =====================================================

const SPEC_FILE_TYPES = ".pdf,.ai,.svg,.png,.jpg,.jpeg,.dxf";
const PHOTO_FILE_TYPES = ".png,.jpg,.jpeg,.webp,.heic";

const TIMELINE_OPTIONS = [
  { value: "asap", label: "ASAP" },
  { value: "1-2-months", label: "1-2 months" },
  { value: "3-6-months", label: "3-6 months" },
  { value: "no-rush", label: "No rush" },
];

const SOURCE_OPTIONS = [
  { value: "google", label: "Google search" },
  { value: "social", label: "Social media" },
  { value: "trade-show", label: "Trade show" },
  { value: "referral", label: "Referral" },
  { value: "other", label: "Other" },
];

// =====================================================
// QR Code Component (Simple SVG-based)
// =====================================================

function QRCodeSVG({ value, size = 128 }: { value: string; size?: number }) {
  // Simple placeholder QR code pattern - in production, use a library like 'qrcode'
  // This creates a visual placeholder that looks like a QR code
  const cells = 21;
  const cellSize = size / cells;

  // Generate a deterministic pattern based on the value
  const pattern: boolean[][] = [];
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash = hash & hash;
  }

  for (let y = 0; y < cells; y++) {
    pattern[y] = [];
    for (let x = 0; x < cells; x++) {
      // Always add position detection patterns (corners)
      const isPositionPattern =
        (x < 7 && y < 7) || // Top-left
        (x >= cells - 7 && y < 7) || // Top-right
        (x < 7 && y >= cells - 7); // Bottom-left

      if (isPositionPattern) {
        // Create the position detection pattern
        const inOuter = x < 7 && y < 7
          ? (x === 0 || x === 6 || y === 0 || y === 6)
          : x >= cells - 7 && y < 7
          ? (x === cells - 7 || x === cells - 1 || y === 0 || y === 6)
          : (x === 0 || x === 6 || y === cells - 7 || y === cells - 1);
        const inInner = x < 7 && y < 7
          ? (x >= 2 && x <= 4 && y >= 2 && y <= 4)
          : x >= cells - 7 && y < 7
          ? (x >= cells - 5 && x <= cells - 3 && y >= 2 && y <= 4)
          : (x >= 2 && x <= 4 && y >= cells - 5 && y <= cells - 3);
        pattern[y][x] = inOuter || inInner;
      } else {
        // Random-ish pattern for the rest
        const seed = (hash + x * 31 + y * 37) % 100;
        pattern[y][x] = seed > 45;
      }
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="white" />
      {pattern.map((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <rect
              key={`${x}-${y}`}
              x={x * cellSize}
              y={y * cellSize}
              width={cellSize}
              height={cellSize}
              fill="black"
            />
          ) : null
        )
      )}
    </svg>
  );
}

// =====================================================
// File Drop Zone Component
// =====================================================

interface DropZoneProps {
  accept: string;
  files: FileWithPreview[];
  onFilesChange: (files: FileWithPreview[]) => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  multiple?: boolean;
}

function DropZone({
  accept,
  files,
  onFilesChange,
  icon,
  title,
  description,
  multiple = true,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFiles = useCallback(
    (fileList: FileList) => {
      const newFiles: FileWithPreview[] = Array.from(fileList).map((file) => {
        const fileWithPreview = file as FileWithPreview;
        if (file.type.startsWith("image/")) {
          fileWithPreview.preview = URL.createObjectURL(file);
        }
        return fileWithPreview;
      });
      onFilesChange(multiple ? [...files, ...newFiles] : newFiles);
    },
    [files, onFilesChange, multiple]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
      }
    },
    [processFiles]
  );

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = [...files];
      const removed = newFiles.splice(index, 1)[0];
      if (removed.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      onFilesChange(newFiles);
    },
    [files, onFilesChange]
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg group"
            >
              {file.preview ? (
                <img
                  src={file.preview}
                  alt={file.name}
                  className="w-10 h-10 object-cover rounded"
                />
              ) : (
                <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =====================================================
// Workflow Card Component
// =====================================================

interface WorkflowCardProps {
  type: "specs" | "sample";
  selected: boolean;
  onSelect: () => void;
}

function WorkflowCard({ type, selected, onSelect }: WorkflowCardProps) {
  const isSpecs = type === "specs";

  return (
    <Card
      onClick={onSelect}
      className={`
        cursor-pointer transition-all
        ${
          selected
            ? "border-primary ring-2 ring-primary/20"
            : "hover:border-primary/50"
        }
      `}
    >
      <CardHeader className="text-center pb-4">
        <div
          className={`
          w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4
          ${selected ? "bg-primary text-primary-foreground" : "bg-muted"}
        `}
        >
          {isSpecs ? (
            <Upload className="w-8 h-8" />
          ) : (
            <Camera className="w-8 h-8" />
          )}
        </div>
        <CardTitle className="text-xl">
          {isSpecs ? "Upload Your Specs" : "Document Your Sample"}
        </CardTitle>
        <CardDescription>
          {isSpecs
            ? "Have a tech pack, CAD file, or design? Upload it here."
            : "Have a physical sample? Photograph it and describe what you need."}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="text-sm text-muted-foreground space-y-2">
          {isSpecs ? (
            <>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                PDF, AI, SVG, DXF files
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                Image files (PNG, JPG)
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                Multiple file support
              </li>
            </>
          ) : (
            <>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                Photo from any angle
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                Detailed description
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                Get a sample label to mail
              </li>
            </>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

// =====================================================
// Sample Label Dialog
// =====================================================

interface SampleLabelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sampleNumber: string;
  contactName: string;
  date: string;
}

function SampleLabelDialog({
  open,
  onOpenChange,
  sampleNumber,
  contactName,
  date,
}: SampleLabelDialogProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sample Label</DialogTitle>
          <DialogDescription>
            Print this label and attach it to your sample before mailing.
          </DialogDescription>
        </DialogHeader>

        <div className="border-2 border-black rounded-lg p-6 bg-white print:border-4">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-2">
              <div className="text-2xl font-bold font-mono">{sampleNumber}</div>
              <div className="text-sm">
                <div className="font-medium">{contactName}</div>
                <div className="text-muted-foreground">{date}</div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <QRCodeSVG value={sampleNumber} size={80} />
            </div>
          </div>

          <Separator className="my-4" />

          <div className="text-sm space-y-1">
            <div className="font-semibold">Mail Sample To:</div>
            <div className="text-muted-foreground">
              ReadyStrap Go / A+
              <br />
              [Address Line 1]
              <br />
              [City, State ZIP]
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print Label
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =====================================================
// Main Upload Page Component
// =====================================================

export default function UploadPage() {
  // Workflow state
  const [workflowType, setWorkflowType] = useState<WorkflowType>(null);
  const [specFiles, setSpecFiles] = useState<FileWithPreview[]>([]);
  const [photoFiles, setPhotoFiles] = useState<FileWithPreview[]>([]);
  const [sampleDescription, setSampleDescription] = useState("");

  // Form state
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactCompany, setContactCompany] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [projectName, setProjectName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [timeline, setTimeline] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [source, setSource] = useState<string | undefined>(undefined);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sampleNumber, setSampleNumber] = useState("");
  const [showLabelDialog, setShowLabelDialog] = useState(false);

  // Validation
  const isFormValid =
    workflowType !== null &&
    contactName.trim() !== "" &&
    contactEmail.trim() !== "" &&
    contactEmail.includes("@") &&
    (workflowType === "specs"
      ? specFiles.length > 0
      : photoFiles.length > 0 || sampleDescription.trim() !== "");

  // Upload file to Supabase storage
  const uploadFile = async (
    supabase: ReturnType<typeof createClient>,
    file: File,
    projectId: string,
    type: "spec" | "photo"
  ): Promise<{ fileName: string; fileUrl: string; fileSize: number }> => {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${projectId}/${type}/${timestamp}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("project-files")
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("project-files").getPublicUrl(filePath);

    return {
      fileName: file.name,
      fileUrl: publicUrl,
      fileSize: file.size,
    };
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid || !workflowType) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      // Create Supabase client
      const supabase = createClient();

      // Generate sample number via RPC
      const { data: sampleNum, error: rpcError } = await supabase.rpc(
        "generate_sample_number"
      );

      if (rpcError) {
        throw new Error(`Failed to generate sample number: ${rpcError.message}`);
      }

      const generatedSampleNumber = sampleNum as string;

      // Get current user (may be null for anonymous)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Insert project record
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          sample_number: generatedSampleNumber,
          user_id: user?.id || null,
          workflow_type: workflowType,
          project_name: projectName || null,
          description: workflowType === "specs" ? null : null,
          sample_description:
            workflowType === "sample" ? sampleDescription : null,
          quantity: quantity || null,
          target_price: targetPrice || null,
          timeline: timeline || null,
          contact_name: contactName,
          contact_email: contactEmail,
          contact_company: contactCompany || null,
          contact_phone: contactPhone || null,
          notes: notes || null,
          source: source || null,
        })
        .select()
        .single();

      if (projectError) {
        throw new Error(`Failed to create project: ${projectError.message}`);
      }

      // Upload files
      const filesToUpload =
        workflowType === "specs" ? specFiles : photoFiles;
      const fileType = workflowType === "specs" ? "spec" : "photo";

      for (const file of filesToUpload) {
        const uploadedFile = await uploadFile(supabase, file, project.id, fileType);

        // Insert file record
        const { error: fileError } = await supabase
          .from("project_files")
          .insert({
            project_id: project.id,
            file_name: uploadedFile.fileName,
            file_url: uploadedFile.fileUrl,
            file_type: fileType,
            file_size: uploadedFile.fileSize,
          });

        if (fileError) {
          console.error("Failed to save file record:", fileError);
        }
      }

      // Success!
      setSampleNumber(generatedSampleNumber);
      setSubmitted(true);

      // Show label dialog for sample workflow
      if (workflowType === "sample") {
        setShowLabelDialog(true);
      }

      toast.success(
        `Project submitted successfully! Sample #: ${generatedSampleNumber}`
      );
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit project"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setWorkflowType(null);
    setSpecFiles([]);
    setPhotoFiles([]);
    setSampleDescription("");
    setContactName("");
    setContactEmail("");
    setContactCompany("");
    setContactPhone("");
    setProjectName("");
    setQuantity("");
    setTargetPrice("");
    setTimeline(undefined);
    setNotes("");
    setSource(undefined);
    setSubmitted(false);
    setSampleNumber("");
  };

  // Success view
  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Project Submitted!</h1>
          <p className="text-muted-foreground mb-2">
            Your sample number is:
          </p>
          <p className="text-2xl font-mono font-bold text-primary mb-6">
            {sampleNumber}
          </p>
          <p className="text-muted-foreground mb-8">
            We&apos;ll review your submission and get back to you within 1-2
            business days.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {workflowType === "sample" && (
              <Button onClick={() => setShowLabelDialog(true)}>
                <Printer className="w-4 h-4 mr-2" />
                View Sample Label
              </Button>
            )}
            <Button variant="outline" onClick={handleReset}>
              Submit Another Project
            </Button>
          </div>
        </div>

        <SampleLabelDialog
          open={showLabelDialog}
          onOpenChange={setShowLabelDialog}
          sampleNumber={sampleNumber}
          contactName={contactName}
          date={new Date().toLocaleDateString()}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Start Your Project
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Get your custom strap from concept to production. Choose how you want
          to share your design with us.
        </p>
      </div>

      {/* Workflow Selection */}
      <div className="max-w-3xl mx-auto mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <WorkflowCard
            type="specs"
            selected={workflowType === "specs"}
            onSelect={() => setWorkflowType("specs")}
          />
          <WorkflowCard
            type="sample"
            selected={workflowType === "sample"}
            onSelect={() => setWorkflowType("sample")}
          />
        </div>
      </div>

      {/* Workflow Content + Form */}
      {workflowType && (
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
          {/* Workflow-specific content */}
          <Card>
            <CardHeader>
              <CardTitle>
                {workflowType === "specs"
                  ? "Upload Your Files"
                  : "Document Your Sample"}
              </CardTitle>
              <CardDescription>
                {workflowType === "specs"
                  ? "Upload tech packs, CAD files, or design images"
                  : "Take photos and describe the sample you want to replicate"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {workflowType === "specs" ? (
                <>
                  <DropZone
                    accept={SPEC_FILE_TYPES}
                    files={specFiles}
                    onFilesChange={setSpecFiles}
                    icon={<Upload className="w-6 h-6" />}
                    title="Drag and drop your files here"
                    description="PDF, AI, SVG, DXF, PNG, or JPG"
                  />
                  <div className="text-center">
                    <Link
                      href="/templates"
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                    >
                      No spec sheet? Start with a template
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <DropZone
                    accept={PHOTO_FILE_TYPES}
                    files={photoFiles}
                    onFilesChange={setPhotoFiles}
                    icon={<Image className="w-6 h-6" />}
                    title="Upload photos of your sample"
                    description="PNG, JPG, WebP, or HEIC"
                  />
                  <div className="space-y-2">
                    <Label htmlFor="sampleDescription">
                      Describe the sample
                    </Label>
                    <Textarea
                      id="sampleDescription"
                      value={sampleDescription}
                      onChange={(e) => setSampleDescription(e.target.value)}
                      placeholder="Describe the material, dimensions, hardware, colors, and any modifications you need..."
                      rows={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Include as much detail as possible: measurements, material
                      preferences, hardware types, etc.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                How can we reach you about this project?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contactName"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactCompany">Company</Label>
                  <Input
                    id="contactCompany"
                    value={contactCompany}
                    onChange={(e) => setContactCompany(e.target.value)}
                    placeholder="Your company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Phone</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>
                Help us understand your needs better (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., Q4 Backpack Launch"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Estimated Quantity</Label>
                  <Input
                    id="quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g., 500-1000 units"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetPrice">Target Price (per unit)</Label>
                  <Input
                    id="targetPrice"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="e.g., $1.50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timeline">Timeline</Label>
                  <Select value={timeline} onValueChange={setTimeline}>
                    <SelectTrigger id="timeline" className="w-full">
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMELINE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">How did you hear about us?</Label>
                  <Select value={source} onValueChange={setSource}>
                    <SelectTrigger id="source" className="w-full">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any other information we should know..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setWorkflowType(null)}
            >
              Back
            </Button>
            <Button type="submit" disabled={!isFormValid || submitting}>
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Project"
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Sample Label Dialog */}
      <SampleLabelDialog
        open={showLabelDialog}
        onOpenChange={setShowLabelDialog}
        sampleNumber={sampleNumber}
        contactName={contactName}
        date={new Date().toLocaleDateString()}
      />
    </div>
  );
}
