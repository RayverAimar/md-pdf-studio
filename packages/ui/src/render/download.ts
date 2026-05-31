/** Trigger a browser download of in-memory data via a transient object URL and anchor click. */
export function downloadBlob(data: BlobPart, fileName: string, mimeType: string): void {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
