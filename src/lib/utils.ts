import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const REPOSITORY_URL = "https://github.com/adybag14-cyber/Abliteration";

export function handbookUrl(path: string) {
  return `${REPOSITORY_URL}/blob/main/${path}`;
}
