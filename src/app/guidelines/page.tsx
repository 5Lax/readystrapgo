import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, FileText, Ruler, Palette, Settings } from "lucide-react";

const guidelines = [
  {
    icon: Ruler,
    title: "Dimensions",
    tips: [
      { text: "Specify length in inches or centimeters", good: true },
      { text: "Include tolerance requirements (e.g., +/- 0.125\")", good: true },
      { text: "Note finished vs. cut length if different", good: true },
      { text: "Vague dimensions like \"medium length\"", good: false },
    ],
  },
  {
    icon: Palette,
    title: "Colors",
    tips: [
      { text: "Provide Pantone PMS numbers when possible", good: true },
      { text: "Include physical color samples for matching", good: true },
      { text: "Specify if exact match is critical vs. close match OK", good: true },
      { text: "Describing colors as \"blue-ish\" or \"dark green\"", good: false },
    ],
  },
  {
    icon: Settings,
    title: "Hardware",
    tips: [
      { text: "Specify material (plastic, metal, zinc, etc.)", good: true },
      { text: "Include load/strength requirements", good: true },
      { text: "Note finish (matte, polished, brushed)", good: true },
      { text: "Generic requests like \"some kind of buckle\"", good: false },
    ],
  },
  {
    icon: FileText,
    title: "Documentation",
    tips: [
      { text: "Technical drawings with callouts", good: true },
      { text: "Bill of materials (BOM) spreadsheet", good: true },
      { text: "Reference photos of similar products", good: true },
      { text: "Verbal descriptions without visuals", good: false },
    ],
  },
];

const fileFormats = [
  { format: "PDF", description: "Tech packs, spec sheets, drawings", recommended: true },
  { format: "AI/EPS", description: "Adobe Illustrator vector files", recommended: true },
  { format: "DXF/DWG", description: "CAD drawings with dimensions", recommended: true },
  { format: "XLSX", description: "Bill of materials, specifications", recommended: true },
  { format: "PNG/JPG", description: "Reference photos, sketches", recommended: false },
  { format: "DOCX", description: "Written specifications", recommended: false },
];

export default function GuidelinesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Spec Guidelines</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Follow these guidelines to ensure accurate quotes and smooth production.
          The more detail you provide, the better we can serve you.
        </p>
      </div>

      {/* Best Practices */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Best Practices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guidelines.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <section.icon className="h-5 w-5 text-primary" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {section.tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-2">
                    {tip.good ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        tip.good ? "text-foreground" : "text-muted-foreground line-through"
                      }`}
                    >
                      {tip.text}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* File Formats */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Accepted File Formats</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {fileFormats.map((file) => (
            <Card
              key={file.format}
              className={file.recommended ? "border-primary/50" : ""}
            >
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-mono font-bold mb-2">{file.format}</div>
                <p className="text-xs text-muted-foreground">{file.description}</p>
                {file.recommended && (
                  <Badge className="mt-3 bg-primary" variant="default">
                    Recommended
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Template Download CTA */}
      <section className="text-center py-12 px-4 bg-card rounded-xl border">
        <h2 className="text-2xl font-bold mb-4">Need a Template?</h2>
        <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
          Download our pre-formatted spec sheet templates to ensure you include
          all the information needed for an accurate quote.
        </p>
        <a
          href="/templates"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Browse Templates
        </a>
      </section>
    </div>
  );
}
