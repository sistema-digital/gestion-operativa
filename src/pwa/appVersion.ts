import { z } from "zod";

const appVersionSchema = z.object({
  version: z.string().min(1),
  summary: z.string().min(1),
  changes: z.array(z.string().min(1)).min(1),
  required: z.literal(true),
  appliesToAllUsers: z.boolean(),
  affectedFeatures: z.array(z.string().min(1)),
});

export type AppVersion = z.infer<typeof appVersionSchema>;

const versionUrl = (): string => `${import.meta.env.BASE_URL}version.json`;

export const fetchAppVersion = async (): Promise<AppVersion | null> => {
  try {
    const response = await fetch(versionUrl(), { cache: "no-store" });

    if (!response.ok) return null;

    const result = appVersionSchema.safeParse(await response.json());
    return result.success ? result.data : null;
  } catch {
    return null;
  }
};
