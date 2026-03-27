const specialFieldLabels: Record<string, string> = {
  alocadoPara: "Alocado Para",
};

export function formatFieldLabel(field: string) {
  const rawField = String(field || "").trim();
  if (!rawField) return "";

  if (specialFieldLabels[rawField]) {
    return specialFieldLabels[rawField];
  }

  const spaced = rawField
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
