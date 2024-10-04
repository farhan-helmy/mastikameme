import { Meme } from "@/db/schema";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ApiResponse<T> = {
  data: T | null;
  error: string | null;
};

export function createApiResponse<T>(
  data: T | null,
  error: string | null
): ApiResponse<T> {
  return { data, error };
}

export async function handleApiRequest<T>(
  requestFn: () => Promise<T>
): Promise<ApiResponse<T>> {
  try {
    const data = await requestFn();
    return createApiResponse<T>(data, null);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return createApiResponse<T>(null, errorMessage);
  }
}

export function getEnumFromImagePath(imagePath: string) {
  switch (imagePath) {
    case "/meme/mastika-1.jpg":
      return "MASTIKA_1";
    case "/meme/mastika-2.jpg":
      return "MASTIKA_2";
    case "/meme/mastika-3.jpg":
      return "MASTIKA_3";
    case "/meme/mastika-4.jpg":
      return "MASTIKA_4";
    default:
      return undefined;
  }
}

export function formatTemplateName(template: Meme["template"]) {
  if (!template) return "Custom";

  const [name, number] = template.split("_");
  return `${
    name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
  } ${number}`;
}
