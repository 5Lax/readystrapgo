"use server";
import { createClient } from "@/lib/supabase/server";
import { loadLiveCatalog } from "@/lib/customizer/server";
import { prepareSubmission } from "@/lib/customizer/intake";

export async function submitStrapProject(
  config: unknown,
  contact: unknown,
  expectedTotal: unknown,
): Promise<
  | { sampleNumber: string; error?: never }
  | { error: string; sampleNumber?: never }
> {
  try {
    const catalog = await loadLiveCatalog();
    const row = prepareSubmission(config, contact, expectedTotal, catalog);
    const supabase = await createClient();
    const { data: sampleNumber, error: numberError } = await supabase.rpc(
      "generate_sample_number",
    );
    if (numberError || typeof sampleNumber !== "string" || !sampleNumber)
      return {
        error:
          "The project intake could not create a reference. Please try again or export your spec for the project intake page.",
      };
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("projects")
      .insert({
        ...row,
        sample_number: sampleNumber,
        user_id: user?.id ?? null,
      });
    if (error)
      return {
        error:
          "The project could not be saved. Your design is still here. Please retry or export the spec and use the project intake page.",
      };
    return { sampleNumber };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Submission failed. Please try again.",
    };
  }
}
