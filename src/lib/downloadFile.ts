/**
 * Download a file from a URL by fetching as blob, creating an object URL,
 * triggering a download via a temporary anchor, then revoking the URL.
 * Avoids opening in a new tab (and about:blank#blocked in some browsers).
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  const res = await fetch(url, { mode: "cors", credentials: "omit" });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
