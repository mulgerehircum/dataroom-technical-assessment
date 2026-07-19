export function getFileExtension(name: string): string {
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex <= 0) return "";
  return name.slice(dotIndex + 1);
}

export function stripExtension(name: string): string {
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex <= 0) return name;
  return name.slice(0, dotIndex);
}

/** Appends " (1)", " (2)", ... before the extension until the name is unique. */
export function dedupeName(desiredName: string, existingNames: string[]): string {
  const taken = new Set(existingNames);
  if (!taken.has(desiredName)) return desiredName;

  const extension = getFileExtension(desiredName);
  const base = stripExtension(desiredName);
  const suffix = extension ? `.${extension}` : "";

  let counter = 1;
  let candidate = `${base} (${counter})${suffix}`;
  while (taken.has(candidate)) {
    counter += 1;
    candidate = `${base} (${counter})${suffix}`;
  }
  return candidate;
}
