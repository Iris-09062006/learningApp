export function documentTitleFromFilename(filename: string): string {
  const basename = filename.split(/[\\/]/).pop()?.trim() ?? "";
  const withoutExtension = basename.replace(/\.[^.]+$/, "").normalize("NFKC").trim();
  return (withoutExtension || "Tài liệu").slice(0, 150);
}
