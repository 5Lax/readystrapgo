import type { Metadata } from "next";
import { Customizer } from "@/components/customizer/customizer";
import { loadCatalog } from "@/lib/customizer/server";
import "./customizer.css";

export const metadata: Metadata = {
  title: "Strap Customizer | ReadyStrapGo",
  description:
    "Design your custom strap, compare estimates, and export a dimensioned specification.",
};
export const dynamic = "force-dynamic";

export default async function BuilderPage() {
  const catalog = await loadCatalog();
  return <Customizer catalog={catalog} />;
}
