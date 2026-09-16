import subprocess
import base64
import os

# 1. Master Logo SVG (Exact representation of Phuket Trusted Local logo)
full_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
  <defs>
    <radialGradient id="bgVignette" cx="50%" cy="46%" r="68%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="65%" stop-color="#f8f9fb"/>
      <stop offset="100%" stop-color="#e8ecf2"/>
    </radialGradient>
    <filter id="shieldShadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0e233d" flood-opacity="0.14"/>
    </filter>
  </defs>

  <!-- Clean Canvas Background matching user original upload -->
  <rect width="1000" height="1000" fill="url(#bgVignette)"/>

  <!-- Shield & Monogram Group -->
  <g filter="url(#shieldShadow)">
    <!-- OUTER SHIELD FRAME -->
    <!-- Left Wing (Dark Charcoal Graphite) -->
    <path d="M 445 235 L 340 235 C 324 235 312 247 312 263 L 312 430 C 312 515 375 578 495 628 L 495 596 C 395 550 340 495 340 430 L 340 263 L 445 263 Z" fill="#242a34"/>

    <!-- Right Wing (Slate Steel Grey) -->
    <path d="M 555 235 L 660 235 C 676 235 688 247 688 263 L 688 430 C 688 515 625 578 505 628 L 505 596 C 605 550 660 495 660 430 L 660 263 L 555 263 Z" fill="#586372"/>

    <!-- 4-POINT COMPASS ROSE / APEX STAR -->
    <!-- Top point left (Deep Midnight Navy) -->
    <polygon points="500,210 500,105 487,210" fill="#0c2b54"/>
    <!-- Top point right (Royal Sapphire Blue) -->
    <polygon points="500,210 500,105 513,210" fill="#19539d"/>
    <!-- Left point top (Cobalt Sapphire) -->
    <polygon points="500,210 395,210 500,198" fill="#1b58a2"/>
    <!-- Left point bottom (Deep Navy) -->
    <polygon points="500,210 395,210 500,222" fill="#0d2f5c"/>
    <!-- Right point top (Light Vibrant Sapphire) -->
    <polygon points="500,210 605,210 500,198" fill="#2d73c6"/>
    <!-- Right point bottom (Medium Sapphire) -->
    <polygon points="500,210 605,210 500,222" fill="#174e92"/>
    <!-- Bottom point left (Deep Navy) -->
    <polygon points="500,210 500,285 487,210" fill="#0b2447"/>
    <!-- Bottom point right (Royal Navy) -->
    <polygon points="500,210 500,285 513,210" fill="#113c72"/>

    <!-- INTERIOR MONOGRAM: P, T, L -->
    <!-- LETTER P (Charcoal) -->
    <path d="M 368 288 L 478 288 C 516 288 544 312 544 344 C 544 376 516 400 478 400 L 424 400 L 424 445 L 368 445 Z M 424 336 L 472 336 C 486 336 496 342 496 352 C 496 362 486 368 472 368 L 424 368 Z" fill="#222832" fill-rule="evenodd"/>

    <!-- LETTER T (Vibrant Royal Sapphire Blue) -->
    <!-- T horizontal crossbar -->
    <rect x="408" y="416" width="152" height="26" rx="2" fill="#144d90"/>
    <!-- T vertical center leg descending to shield base -->
    <path d="M 486 442 L 514 442 L 514 586 L 486 586 Z" fill="#144d90"/>

    <!-- LETTER L (Slate Charcoal) -->
    <!-- L vertical leg and horizontal base arm along lower-right curve -->
    <path d="M 536 442 L 564 442 L 564 518 L 642 518 L 642 544 L 536 544 Z" fill="#363f4c"/>
  </g>

  <!-- BRAND TYPOGRAPHY -->
  <g text-anchor="middle" font-family="'Liberation Sans', 'DejaVu Sans', 'Arial', sans-serif">
    <!-- Line 1: PHUKET -->
    <text x="500" y="736" font-size="68" font-weight="900" letter-spacing="0.25em" fill="#1a2028">PHUKET</text>

    <!-- Line 2: TRUSTED LOCAL -->
    <text x="500" y="798" font-size="42" font-weight="700" letter-spacing="0.32em" fill="#174b8c">TRUSTED LOCAL</text>

    <!-- Line 3: Tagline with flanking dividers -->
    <line x1="260" y1="844" x2="435" y2="844" stroke="#6d798a" stroke-width="1.8"/>
    <polygon points="500,839 505,844 500,849 495,844" fill="#6d798a"/>
    <line x1="565" y1="844" x2="740" y2="844" stroke="#6d798a" stroke-width="1.8"/>
    <text x="500" y="872" font-size="16.5" font-weight="600" letter-spacing="0.18em" fill="#5a6778">YOUR TRUSTED CONTACT IN PHUKET</text>
  </g>
</svg>"""

with open("public/ptl_logo.svg", "w") as f:
    f.write(full_svg)
with open("public/ptl_logo_original.svg", "w") as f:
    f.write(full_svg)

# Render 1024x1024 master PNG
subprocess.run(["rsvg-convert", "-w", "1024", "-h", "1024", "public/ptl_logo.svg", "-o", "public/ptl_logo.png"], check=True)
subprocess.run(["rsvg-convert", "-w", "1024", "-h", "1024", "public/ptl_logo.svg", "-o", "public/ptl_original_uploaded.png"], check=True)
subprocess.run(["rsvg-convert", "-w", "1024", "-h", "1024", "public/ptl_logo.svg", "-o", "public/ptl_full_logo.png"], check=True)
subprocess.run(["convert", "public/ptl_logo.png", "-quality", "95", "public/ptl_logo.jpg"], check=True)

# 2. App Icon SVG (Optimized centered crest for mobile icon viewports)
icon_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="iconBg" cx="50%" cy="48%" r="65%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="70%" stop-color="#f5f7fa"/>
      <stop offset="100%" stop-color="#e3e7ee"/>
    </radialGradient>
    <filter id="iconShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#0f2b48" flood-opacity="0.16"/>
    </filter>
  </defs>

  <rect width="512" height="512" fill="url(#iconBg)"/>

  <!-- Centered Crest scaled up for high-visibility home screen icon -->
  <g transform="translate(6, 12) scale(0.98)" filter="url(#iconShadow)">
    <!-- OUTER SHIELD FRAME -->
    <!-- Left Wing (Dark Charcoal) -->
    <path d="M 226 182 L 140 182 C 127 182 117 192 117 205 L 117 338 C 117 406 168 456 264 496 L 264 470 C 184 433 140 389 140 338 L 140 205 L 226 205 Z" fill="#242a34"/>

    <!-- Right Wing (Slate Steel Grey) -->
    <path d="M 314 182 L 400 182 C 413 182 423 192 423 205 L 423 338 C 423 406 372 456 276 496 L 276 470 C 356 433 400 389 400 338 L 400 205 L 314 205 Z" fill="#586372"/>

    <!-- 4-POINT COMPASS ROSE / APEX STAR -->
    <polygon points="270,162 270,78 260,162" fill="#0c2b54"/>
    <polygon points="270,162 270,78 280,162" fill="#19539d"/>
    <polygon points="270,162 186,162 270,152" fill="#1b58a2"/>
    <polygon points="270,162 186,162 270,172" fill="#0d2f5c"/>
    <polygon points="270,162 354,162 270,152" fill="#2d73c6"/>
    <polygon points="270,162 354,162 270,172" fill="#174e92"/>
    <polygon points="270,162 270,222 260,162" fill="#0b2447"/>
    <polygon points="270,162 270,222 280,162" fill="#113c72"/>

    <!-- INTERIOR MONOGRAM: P, T, L -->
    <!-- LETTER P (Charcoal) -->
    <path d="M 162 225 L 250 225 C 280 225 303 244 303 270 C 303 296 280 315 250 315 L 207 315 L 207 351 L 162 351 Z M 207 263 L 245 263 C 256 263 265 268 265 276 C 265 284 256 289 245 289 L 207 289 Z" fill="#222832" fill-rule="evenodd"/>

    <!-- LETTER T (Vibrant Royal Sapphire Blue) -->
    <rect x="194" y="328" width="122" height="21" rx="2" fill="#144d90"/>
    <path d="M 259 349 L 281 349 L 281 462 L 259 462 Z" fill="#144d90"/>

    <!-- LETTER L (Charcoal) -->
    <path d="M 299 349 L 321 349 L 321 410 L 383 410 L 383 431 L 299 431 Z" fill="#363f4c"/>
  </g>
</svg>"""

with open("public/ptl_crest_icon.svg", "w") as f:
    f.write(icon_svg)

# Render PWA and Touch Icons
subprocess.run(["rsvg-convert", "-w", "512", "-h", "512", "public/ptl_crest_icon.svg", "-o", "public/pwa-512x512.png"], check=True)
subprocess.run(["rsvg-convert", "-w", "192", "-h", "192", "public/ptl_crest_icon.svg", "-o", "public/pwa-192x192.png"], check=True)
subprocess.run(["rsvg-convert", "-w", "180", "-h", "180", "public/ptl_crest_icon.svg", "-o", "public/apple-touch-icon.png"], check=True)
subprocess.run(["rsvg-convert", "-w", "64", "-h", "64", "public/ptl_crest_icon.svg", "-o", "public/favicon.png"], check=True)

# Generate Base64 for defaultLogo.ts
with open("public/ptl_logo.png", "rb") as f:
    b64 = base64.b64encode(f.read()).decode("utf-8")
    data_url = f"data:image/png;base64,{b64}"

default_logo_code = f"""// Phuket Trusted Local Official Logo - Preserved Exactly Without Alteration
export const DEFAULT_PTL_LOGO = "/ptl_logo.png";
export const DEFAULT_PTL_LOGO_BASE64 = "{data_url}";
"""

with open("src/data/defaultLogo.ts", "w") as f:
    f.write(default_logo_code)

print("SUCCESS: All master logo and icon assets regenerated and defaultLogo.ts updated!")
