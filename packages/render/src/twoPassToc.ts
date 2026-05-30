export type RenderHtmlToPdf = (html: string) => Promise<Uint8Array>;

export async function runTwoPassToc(
  _html: string,
  _renderHtmlToPdf: RenderHtmlToPdf,
): Promise<Uint8Array> {
  throw new Error("runTwoPassToc: not implemented");
}
