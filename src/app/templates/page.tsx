import { Badge } from "@/components/ui/badge";

export default function TemplatesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="container mx-auto px-4 text-center">
        <Badge variant="secondary" className="mb-4 text-sm">
          Coming Soon
        </Badge>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
          Templates
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Browse our collection of pre-designed strap templates.
        </p>
      </div>
    </div>
  );
}
