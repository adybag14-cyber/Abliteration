import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const REPOSITORY_URL = "https://github.com/adybag14-cyber/Abliteration";
export const CXX_NIGHTLY_TAG = `${REPOSITORY_URL}/releases/tag/cxx-nightly`;
export const CXX_NIGHTLY_DOWNLOAD = `${REPOSITORY_URL}/releases/download/cxx-nightly`;

/** Default first-hour archives. Compiler is in the filename so GCC/Clang never collide. */
export const cxxDefaultArchives = [
  { id: "windows", label: "Windows x64", file: "abliterate-cxx-windows-x64-msvc.zip" },
  { id: "linux", label: "Linux x64", file: "abliterate-cxx-linux-x64-gcc15.tar.gz" },
  { id: "macos", label: "macOS Apple Silicon", file: "abliterate-cxx-macos-arm64-llvm.tar.gz" },
] as const;

export function cxxDownload(file: string) {
  return `${CXX_NIGHTLY_DOWNLOAD}/${file}`;
}

export function handbookUrl(path: string) {
  return `${REPOSITORY_URL}/blob/main/${path}`;
}
