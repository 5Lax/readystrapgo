"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    category: "Ordering",
    questions: [
      {
        q: "What are the minimum order quantities (MOQs)?",
        a: "MOQs vary by manufacturing region. USA production starts at 250 units, while overseas facilities typically require 1,000-2,000 units. Use our configurator to see exact MOQs for your specific strap design.",
      },
      {
        q: "How do I get a quote?",
        a: "Upload your spec sheet, use our photo AI tool, or build your strap in our configurator. You'll receive instant quotes across all 6 manufacturing regions with pricing, lead times, and MOQs.",
      },
      {
        q: "Can I order samples before a full production run?",
        a: "Yes! We offer sample kits with webbing swatches and hardware samples. For custom designs, we can produce pre-production samples (typically 5-10 units) before committing to a full order.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept credit cards, ACH bank transfer, and wire transfer. Orders over $10,000 may qualify for net-30 terms after credit approval.",
      },
    ],
  },
  {
    category: "Production",
    questions: [
      {
        q: "What are typical lead times?",
        a: "USA production: 1-3 weeks. Mexico: 2-4 weeks. Asia (Taiwan, Vietnam, Cambodia, China): 4-8 weeks. Lead times depend on complexity, quantity, and current capacity.",
      },
      {
        q: "Can you match a specific color?",
        a: "Yes, we can match Pantone colors or physical samples. For critical color matching, we recommend approving a lab dip sample before production. Standard colors are available without matching fees.",
      },
      {
        q: "Do you offer custom hardware?",
        a: "We have 200+ standard hardware options and can source or manufacture custom hardware. Custom tooling may require additional lead time and setup costs.",
      },
      {
        q: "What quality standards do you follow?",
        a: "All products undergo inspection before shipping. We can accommodate specific testing requirements (tensile strength, colorfastness, etc.) and provide test reports upon request.",
      },
    ],
  },
  {
    category: "Shipping",
    questions: [
      {
        q: "Where do you ship?",
        a: "We ship worldwide. Domestic (USA) orders typically ship via UPS or FedEx. International orders can ship via air or sea freight depending on urgency and volume.",
      },
      {
        q: "Are duties and import fees included in quotes?",
        a: "Quotes show landed cost estimates including estimated duties for US delivery. Actual duties may vary. USA-made products have no import duties for domestic customers.",
      },
      {
        q: "Can you ship directly to my customers (drop shipping)?",
        a: "Yes, we offer white-label drop shipping services. Products can be packaged with your branding and shipped directly to your customers or retail partners.",
      },
    ],
  },
  {
    category: "Technical",
    questions: [
      {
        q: "What file formats do you accept for specs?",
        a: "We accept PDF, AI, DXF, DWG, XLSX, and images. Our AI can also parse photos of existing straps to identify components and dimensions.",
      },
      {
        q: "How accurate is the AI photo analysis?",
        a: "Our AI typically achieves 85-95% accuracy for component identification. All AI-generated specs should be reviewed and confirmed before production. Complex designs may require manual verification.",
      },
      {
        q: "Can you help design my strap from scratch?",
        a: "Absolutely. Use our step-by-step configurator or contact us for design assistance. We can help with material selection, hardware recommendations, and technical drawings.",
      },
    ],
  },
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Find answers to common questions about our strap manufacturing services.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        {faqs.map((category) => (
          <div key={category.category}>
            <h2 className="text-xl font-bold mb-4 text-primary">
              {category.category}
            </h2>
            <div className="space-y-2">
              {category.questions.map((faq, index) => {
                const id = `${category.category}-${index}`;
                const isOpen = openItems.includes(id);
                return (
                  <div
                    key={id}
                    className="border rounded-lg overflow-hidden bg-card"
                  >
                    <button
                      onClick={() => toggleItem(id)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-medium pr-4">{faq.q}</span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4">
                        <p className="text-muted-foreground">{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Contact CTA */}
      <div className="text-center mt-16 py-12 px-4 bg-card rounded-xl border max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
        <p className="text-muted-foreground mb-6">
          Our team is here to help with any questions about your strap project.
        </p>
        <a
          href="/contact"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Contact Us
        </a>
      </div>
    </div>
  );
}
