import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

export interface GeneratedPdfResult {
  blob: Blob;
  url: string;
  filename: string;
}

/**
 * Recursively copies computed CSS properties from a live DOM tree to a cloned DOM tree.
 * This guarantees 100% fidelity even when stylesheets use CSS @layer (like Tailwind v4),
 * custom properties, or framework-specific rules that html2canvas cannot parse natively.
 */
/**
 * Recursively copies safe visual styles (colors, backgrounds, borders, radius)
 * from a live DOM tree to a cloned DOM tree.
 * 
 * CRITICAL FIXES FOR PROFESSIONAL PDF RENDERING:
 * 1. NEVER copies letter-spacing or word-spacing (prevents html2canvas from dropping spaces and colliding text)
 * 2. NEVER copies mobile getBoundingClientRect widths onto table cells (prevents tables from being squeezed into tiny mobile widths)
 * 3. NEVER copies font-family (ensures uniform typography across canvas rendering)
 * 4. Preserves 1-to-1 node structure by hiding interactive elements rather than removing them
 */
function syncComputedStylesRecursively(source: Element, target: Element) {
  if (!source || !target || source.nodeType !== Node.ELEMENT_NODE || target.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const sEl = source as HTMLElement;
  const tEl = target as HTMLElement;

  // If element is marked as non-printable, hide it gracefully
  if (sEl.getAttribute('data-no-print') === 'true' || tEl.getAttribute('data-no-print') === 'true') {
    tEl.style.display = 'none';
    tEl.style.visibility = 'hidden';
    return;
  }

  const computed = window.getComputedStyle(sEl);

  // ONLY copy visual appearance properties (colors, backgrounds, borders).
  // Strictly omit letter-spacing, word-spacing, font-family, width, height, and line-height.
  const visualProperties = [
    'background-color',
    'background-image',
    'background-size',
    'background-position',
    'background-repeat',
    'color',
    'font-weight',
    'font-style',
    'text-align',
    'text-transform',
    'text-decoration',
    'border-top-width', 'border-top-style', 'border-top-color',
    'border-right-width', 'border-right-style', 'border-right-color',
    'border-bottom-width', 'border-bottom-style', 'border-bottom-color',
    'border-left-width', 'border-left-style', 'border-left-color',
    'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius',
    'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'box-sizing',
    'vertical-align',
    'border-collapse',
    'opacity'
  ];

  for (const prop of visualProperties) {
    const val = computed.getPropertyValue(prop);
    if (val && val !== 'none' && val !== 'normal' && val !== 'auto' && val !== 'rgba(0, 0, 0, 0)') {
      tEl.style.setProperty(prop, val);
    }
  }

  // Ensure normal letter-spacing and word-spacing on every element
  tEl.style.letterSpacing = 'normal';
  tEl.style.wordSpacing = 'normal';

  // Preserve image aspect ratio if valid
  if (sEl.tagName === 'IMG') {
    tEl.style.maxWidth = '100%';
    tEl.style.objectFit = computed.objectFit || 'contain';
  }

  // Recurse children in 1-to-1 parallel
  const sChildren = Array.from(sEl.children);
  const tChildren = Array.from(tEl.children);
  const count = Math.min(sChildren.length, tChildren.length);
  for (let i = 0; i < count; i++) {
    syncComputedStylesRecursively(sChildren[i], tChildren[i]);
  }
}

export async function createPdfBlobFromElement(
  element: HTMLElement,
  filename: string,
  onProgress?: (msg: string) => void
): Promise<GeneratedPdfResult> {
  const prevScrollX = window.scrollX;
  const prevScrollY = window.scrollY;

  try {
    if (onProgress) onProgress('กำลังประมวลผลรูปภาพและโครงสร้างเอกสาร...');

    // Temporarily scroll to top so html2canvas doesn't offset from mobile window scroll
    window.scrollTo(0, 0);

    // Ensure all web fonts (Plus Jakarta Sans, Sarabun) are fully ready
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch {
        // Fallback gracefully
      }
    }

    // Small delay to ensure any dynamic rendering is stable
    await new Promise((resolve) => setTimeout(resolve, 200));

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Check if element has multiple distinct pages marked with [data-pdf-page]
    let distinctPages = Array.from(element.querySelectorAll<HTMLElement>('[data-pdf-page]'));
    if (distinctPages.length <= 1 && element.parentElement) {
      const parentPages = Array.from(element.parentElement.querySelectorAll<HTMLElement>(':scope > [data-pdf-page], [data-pdf-page]'));
      if (parentPages.length > 1) {
        distinctPages = parentPages;
      }
    }

    // PDF typography & layout reset to prevent any font squishing or character overlapping
    const injectPdfNormalization = (clonedDoc: Document) => {
      const resetStyle = clonedDoc.createElement('style');
      resetStyle.textContent = `
        * {
          letter-spacing: normal !important;
          word-spacing: normal !important;
          font-variant-ligatures: none !important;
          text-rendering: geometricPrecision !important;
          -webkit-font-smoothing: antialiased !important;
        }
        body, div, p, span, h1, h2, h3, h4, th, td, a {
          font-family: 'Plus Jakarta Sans', 'Sarabun', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
        }
        p, span, td, th {
          line-height: 1.5 !important;
        }
        table {
          width: 100% !important;
          border-collapse: collapse !important;
        }
        [data-no-print="true"] {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
        }
      `;
      clonedDoc.head.appendChild(resetStyle);
    };

    if (distinctPages.length > 1) {
      for (let i = 0; i < distinctPages.length; i++) {
        if (onProgress) onProgress(`กำลังสร้างหน้า ${i + 1} จาก ${distinctPages.length}...`);
        const pageEl = distinctPages[i];
        const pageNum = pageEl.getAttribute('data-pdf-page') || String(i + 1);

        const pageCanvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 1024,
          scrollX: 0,
          scrollY: 0,
          onclone: (clonedDoc) => {
            const headStyles = document.querySelectorAll('style, link[rel="stylesheet"]');
            headStyles.forEach((tag) => clonedDoc.head.appendChild(tag.cloneNode(true)));
            injectPdfNormalization(clonedDoc);

            // Hide all other pages in cloned doc so only the active page occupies the viewport
            clonedDoc.querySelectorAll('[data-pdf-page]').forEach((otherEl) => {
              if (otherEl.getAttribute('data-pdf-page') !== pageNum) {
                (otherEl as HTMLElement).style.display = 'none';
              }
            });

            // Synchronize computed styles from live page element to cloned page element BEFORE hiding
            const clonedPageEl = (clonedDoc.querySelector(`[data-pdf-page="${pageNum}"]`) || clonedDoc.body.querySelector(`[data-pdf-page="${pageNum}"]`)) as HTMLElement;
            if (clonedPageEl && pageEl) {
              syncComputedStylesRecursively(pageEl, clonedPageEl);
              clonedPageEl.style.position = 'relative';
              clonedPageEl.style.width = '794px';
              clonedPageEl.style.maxWidth = '794px';
              clonedPageEl.style.minWidth = '794px';
              clonedPageEl.style.margin = '0 auto';
              clonedPageEl.style.boxSizing = 'border-box';
              clonedPageEl.style.backgroundColor = '#ffffff';
              clonedPageEl.style.boxShadow = 'none';
              clonedPageEl.style.border = 'none';
              clonedPageEl.style.display = 'block';
            }

            clonedDoc.querySelectorAll('[data-no-print="true"]').forEach((el) => {
              (el as HTMLElement).style.display = 'none';
            });
          },
        });

        const imgData = pageCanvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) pdf.addPage();

        const imgWidth = pageWidth;
        const imgHeight = (pageCanvas.height * pageWidth) / pageCanvas.width;
        const renderHeight = Math.min(imgHeight, pageHeight);
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, renderHeight, undefined, 'FAST');
      }

      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      return { blob, url, filename };
    }

    // Otherwise, capture single canvas with computed style synchronization
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution for crisp professional PDF text and tables
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1024,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      onclone: (clonedDoc) => {
        // 1. Copy all head styles and stylesheets
        const headStyles = document.querySelectorAll('style, link[rel="stylesheet"]');
        headStyles.forEach((tag) => {
          clonedDoc.head.appendChild(tag.cloneNode(true));
        });
        injectPdfNormalization(clonedDoc);

        // 2. Locate cloned target element
        const clonedTarget = element.id
          ? clonedDoc.getElementById(element.id) || clonedDoc.body.querySelector(`#${element.id}`)
          : null;

        if (clonedTarget && element) {
          // 3. Synchronize computed styles from live element to cloned element BEFORE hiding non-printable items
          syncComputedStylesRecursively(element, clonedTarget);

          // 4. Normalize cloned target element to standard A4 desktop layout
          const targetEl = clonedTarget as HTMLElement;
          targetEl.style.position = 'static';
          targetEl.style.left = '0';
          targetEl.style.top = '0';
          targetEl.style.visibility = 'visible';
          targetEl.style.opacity = '1';
          targetEl.style.transform = 'none';
          targetEl.style.display = 'block';
          targetEl.style.width = '794px';
          targetEl.style.maxWidth = '794px';
          targetEl.style.minWidth = '794px';
          targetEl.style.margin = '0 auto';
          targetEl.style.boxSizing = 'border-box';
          targetEl.style.backgroundColor = '#ffffff';
        }

        // 5. Hide interactive-only elements (Delete buttons, Quick Estimate triggers, Molly banners)
        clonedDoc.querySelectorAll('[data-no-print="true"]').forEach((el) => {
          (el as HTMLElement).style.display = 'none';
        });
      },
    });

    if (onProgress) onProgress('กำลังสร้างไฟล์ PDF คุณภาพสูง...');

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    // Multi-page handling with tolerance (only add new page if more than 5mm overflow)
    while (heightLeft > 5) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);

    return { blob, url, filename };
  } catch (error) {
    console.error('Error generating PDF blob:', error);
    throw error;
  } finally {
    window.scrollTo(prevScrollX, prevScrollY);
  }
}

export async function generatePdfFromElement(
  element: HTMLElement,
  filename: string,
  onProgress?: (msg: string) => void
): Promise<GeneratedPdfResult> {
  const result = await createPdfBlobFromElement(element, filename, onProgress);

  // Try Web Share API first on mobile devices (iOS / Android)
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile && navigator.share && navigator.canShare) {
    try {
      const file = new File([result.blob], filename, { type: 'application/pdf' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: filename,
        });
        return result;
      }
    } catch (shareErr: any) {
      // If user dismissed share sheet (AbortError), don't throw error
      if (shareErr?.name === 'AbortError') {
        return result;
      }
      console.warn('Navigator share failed, falling back to download:', shareErr);
    }
  }

  // Standard download via hidden link
  try {
    const a = document.createElement('a');
    a.href = result.url;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 1000);
  } catch (downloadErr) {
    console.warn('Standard download link failed, attempting window.open:', downloadErr);
    window.open(result.url, '_blank');
  }

  return result;
}

export async function openPdfInNewTab(
  element: HTMLElement,
  filename: string,
  onProgress?: (msg: string) => void
): Promise<string> {
  const result = await createPdfBlobFromElement(element, filename, onProgress);
  // Open in new tab for direct viewing and native iOS actions
  const newTab = window.open(result.url, '_blank');
  if (!newTab) {
    // Popup was blocked, trigger download as fallback
    const a = document.createElement('a');
    a.href = result.url;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 1000);
  }
  return result.url;
}

export function triggerNativePrint() {
  window.print();
}

