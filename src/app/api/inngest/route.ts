import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { analyzeBrand } from "@/lib/inngest/functions/analyzeBrand";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [analyzeBrand],
});
