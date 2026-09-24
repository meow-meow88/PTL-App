// Convert an operator-selected slip to a data URL without relying on FileReader
// event callbacks, which can fail before the request is sent on some mobile browsers.
export async function readEvidenceFile(file: File): Promise<string> {
  if (!file.size || file.size > 4_000_000) throw new Error(`ไฟล์ ${file.name} ต้องมีขนาดไม่เกิน 4 MB`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return `data:${file.type};base64,${btoa(binary)}`;
}
