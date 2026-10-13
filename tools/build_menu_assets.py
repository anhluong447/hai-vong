"""Generate clean SVG and graphical assets for Coastal Editorial Menu (Stage 5 / 02-menu.png)."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets/ui/coastal'
OUT.mkdir(parents=True, exist_ok=True)

# 1. Brand Mark (Wave/Sail insignia in luminous cyan #62d6d0)
brand_mark = '''<svg xmlns="http://www.w3.org/2000/svg" width="83" height="59" viewBox="0 0 96 64">
  <g fill="#62d6d0">
    <path d="M25 27 C16 25 15 15 23 11 C32 6 39 11 38 18 C37 28 31 34 21 38 L20 33 C26 31 29 28 30 25 C29 27 27 28 25 27 Z"/>
    <path d="M49 24 C39 22 41 10 48 7 C58 3 64 9 62 17 C61 26 54 33 44 36 L43 31 C48 29 53 24 53 21 C53 23 50 25 49 24 Z"/>
    <path d="M5 50 C23 33 37 39 53 43 C70 48 79 43 91 34 C82 51 69 55 49 49 C32 43 20 44 5 50 Z"/>
    <path d="M0 58 C18 48 32 50 51 56 C66 62 80 57 90 49 C79 63 62 67 44 60 C26 54 16 52 0 58 Z" opacity=".95"/>
  </g>
</svg>
'''
(OUT / 'brand-mark.svg').write_text(brand_mark, encoding='utf-8')

# 2. Nav Highlight (Yellow paintbrush stroke with dry brush edges and perforated binder holes)
holes = []
for i in range(6):
    cy = 13 + i * 9.8
    holes.append(f'<circle cx="13" cy="{cy:.1f}" r="3.2" fill="#06323d"/>')
    holes.append(f'<rect x="0" y="{cy-0.8:.1f}" width="13" height="1.6" fill="#06323d"/>')
holes_str = '\n    '.join(holes)

nav_highlight = f'''<svg xmlns="http://www.w3.org/2000/svg" width="320" height="75" viewBox="0 0 320 75">
  <defs>
    <linearGradient id="brushWash" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f5cb68"/>
      <stop offset="40%" stop-color="#f8dc84"/>
      <stop offset="85%" stop-color="#f4cb63"/>
      <stop offset="100%" stop-color="#ecc050" stop-opacity="0.15"/>
    </linearGradient>
    <filter id="brushRough" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.05 0.22" numOctaves="3" result="noise" seed="42"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="9" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>
  <g filter="url(#brushRough)">
    <path d="M 0 3 Q 160 0 300 2 C 314 14 316 46 304 71 Q 160 74 0 71 Z" fill="url(#brushWash)"/>
    <path d="M 296 8 Q 312 12 318 17" stroke="#f9de8a" stroke-width="2.5" fill="none" opacity="0.8"/>
    <path d="M 298 23 Q 315 28 320 34" stroke="#f3cb67" stroke-width="3" fill="none" opacity="0.85"/>
    <path d="M 293 42 Q 314 46 317 53" stroke="#f7d373" stroke-width="2" fill="none" opacity="0.75"/>
    <path d="M 291 58 Q 308 62 313 66" stroke="#eed068" stroke-width="2.5" fill="none" opacity="0.65"/>
  </g>
  <!-- Perforated notebook binder holes along left spine -->
  <g opacity="0.95">
    {holes_str}
  </g>
</svg>
'''
(OUT / 'nav-highlight.svg').write_text(nav_highlight, encoding='utf-8')

# 3. Nav Icons SVG Symbols (for the 5 menu tabs and resources)
icons = '''<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
  <symbol id="icon-cases" viewBox="0 0 48 32" fill="currentColor">
    <!-- Wave / Dossier Mark in cyan -->
    <path d="M9 14C4 13 4 8 8 6C13 3 17 6 16 9C16 14 13 17 8 19L7 17C10 16 12 14 12 13C12 14 11 15 10 14Z"/>
    <path d="M21 12C16 11 17 5 21 4C26 2 29 5 28 9C28 13 24 17 19 18L19 16C21 15 23 12 23 11C23 12 22 13 21 12Z"/>
    <path d="M2 25C10 17 17 20 25 22C33 24 37 22 43 17C39 26 33 28 23 25C15 22 9 22 2 25Z"/>
    <path d="M0 29C9 24 16 25 25 28C32 31 39 29 44 25C39 32 30 34 21 30C12 27 7 26 0 29Z"/>
  </symbol>
  <symbol id="icon-team" viewBox="0 0 32 32" fill="currentColor">
    <circle cx="15" cy="8" r="5"/><circle cx="5" cy="11" r="3.4"/><circle cx="26" cy="11" r="3.4"/>
    <path d="M6 28v-4c0-5 4-9 9-9s9 4 9 9v4zM1 28v-5c0-4 2-7 6-7l2 1c-3 2-5 6-5 11zM26 28c0-5-1-9-4-11l3-1c4 0 7 3 7 7v5z"/>
  </symbol>
  <symbol id="icon-calendar" viewBox="0 0 32 32" fill="currentColor">
    <!-- Calendar grid -->
    <path fill-rule="evenodd" d="M5 5h22a2 2 0 0 1 2 2v22H3V7a2 2 0 0 1 2-2ZM6 13v13h20V13Z"/>
    <rect x="8" y="2" width="3" height="7" rx="1"/><rect x="21" y="2" width="3" height="7" rx="1"/>
    <path d="M9 16h3v2H9zm6 0h3v2h-3zm6 0h3v2h-3zM9 21h3v2H9zm6 0h3v2h-3zm6 0h3v2h-3z"/>
  </symbol>
  <symbol id="icon-journal" viewBox="0 0 32 32" fill="currentColor">
    <!-- Open journal / book -->
    <path fill-rule="evenodd" d="M2 5c5-1 10 0 14 3c4-3 9-4 14-3v23c-5-1-10 0-14 3c-4-3-9-4-14-3ZM5 8v17c3 0 6 .5 9 2V10C11 8.5 8 8 5 8Zm13 2v17c3-1.5 6-2 9-2V8c-3 0-6 .5-9 2Z"/>
    <path d="M7 12l5 1v1l-5-1zm0 4l5 1v1l-5-1zm13-3l5-1v1l-5 1zm0 4l5-1v1l-5 1z"/>
  </symbol>
  <symbol id="icon-settings" viewBox="0 0 32 32" fill="currentColor">
    <path fill-rule="evenodd" d="M13 2h6l1 4 3 2 4-1 3 5-3 3v3l2 4-3 5-4-1-3 2-1 3h-5l-1-4-3-2-4 1-3-5 3-3v-3l-3-3 3-5 4 1 3-2zM16 10a6 6 0 1 0 0 12a6 6 0 0 0 0-12z"/>
  </symbol>
  <symbol id="icon-lightning" viewBox="0 0 24 28" fill="currentColor">
    <path d="M14 2L3 15h8L10 26l11-13h-8z"/>
  </symbol>
  <symbol id="icon-coin" viewBox="0 0 28 28" fill="currentColor">
    <path d="M3 18c4 5 18 5 22 0v4c-3 6-19 6-22 0zM3 11c4 5 18 5 22 0v4c-3 6-19 6-22 0z"/>
    <ellipse cx="14" cy="6" rx="11" ry="5"/>
  </symbol>
  <symbol id="icon-enter" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M25 4h4v16H13v6L3 17l10-8v6h12z"/>
  </symbol>
</svg>
'''
(OUT / 'nav-icons.svg').write_text(icons, encoding='utf-8')

# 4. Bottom Wave SVG
bottom_wave = '''<svg xmlns="http://www.w3.org/2000/svg" width="1672" height="200" viewBox="0 0 1672 200" preserveAspectRatio="none">
  <defs>
    <linearGradient id="waveGradDeep" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#074856" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#052832" stop-opacity="0.95"/>
    </linearGradient>
    <linearGradient id="waveGradMid" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#147281" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#073e4a" stop-opacity="0.85"/>
    </linearGradient>
    <linearGradient id="waveGradFoam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6ad5cf" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#2a8b97" stop-opacity="0.7"/>
    </linearGradient>
  </defs>
  <!-- Deep back wave -->
  <path class="coastal-wave-back" d="M 0 60 C 240 20 480 80 720 50 C 960 20 1200 70 1440 40 C 1560 25 1620 45 1672 55 L 1672 200 L 0 200 Z" fill="url(#waveGradDeep)"/>
  <!-- Middle wave -->
  <path class="coastal-wave-mid" d="M 0 85 C 220 55 440 105 700 75 C 920 45 1180 95 1420 65 C 1540 50 1610 70 1672 80 L 1672 200 L 0 200 Z" fill="url(#waveGradMid)"/>
  <!-- Foam crest wave -->
  <path class="coastal-wave-foam" d="M 0 110 C 200 80 460 125 720 95 C 980 65 1220 115 1460 85 C 1570 70 1620 90 1672 100 L 1672 200 L 0 200 Z" fill="url(#waveGradFoam)"/>
  <!-- Foam highlight crest strokes -->
  <path d="M 0 109 C 200 79 460 124 720 94 C 980 64 1220 114 1460 84 C 1570 69 1620 89 1672 99" fill="none" stroke="#e6f7f5" stroke-width="1.8" opacity="0.75"/>
</svg>
'''
(OUT / 'bottom-wave.svg').write_text(bottom_wave, encoding='utf-8')

# 5. Teal Mass SVG (Organic shape across the 13 anchor points)
teal_path = 'M 0 0 L 480 0 C 496.7 17.3, 550.0 73.8, 580.0 104.0 C 610.0 134.2, 624.0 155.7, 660.0 181.0 C 696.0 206.3, 751.3 235.8, 796.0 256.0 C 840.7 276.2, 887.3 285.2, 928.0 302.0 C 968.7 318.8, 1018.3 342.3, 1040.0 357.0 C 1061.7 371.7, 1062.7 368.2, 1058.0 390.0 C 1053.3 411.8, 1017.0 454.3, 1012.0 488.0 C 1007.0 521.7, 1043.0 557.3, 1028.0 592.0 C 1013.0 626.7, 948.3 667.8, 922.0 696.0 C 895.7 724.2, 897.0 742.0, 870.0 761.0 C 843.0 780.0, 794.5 792.8, 760.0 810.0 C 725.5 827.2, 679.2 855.0, 663.0 864.0 C 640 878, 480 915, 0 941 Z'

teal_mass = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1672" height="941" viewBox="0 0 1672 941">
  <defs>
    <radialGradient id="tealPigment" cx="35%" cy="40%" r="75%">
      <stop offset="0%" stop-color="#06374a"/>
      <stop offset="55%" stop-color="#063243"/>
      <stop offset="100%" stop-color="#0b4a59"/>
    </radialGradient>
    <filter id="tealGrain" x="0" y="0" width="1060" height="941" filterUnits="userSpaceOnUse">
      <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="4" seed="17" result="grain"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncR type="linear" slope="2" intercept="-.5"/><feFuncG type="linear" slope="2" intercept="-.5"/><feFuncB type="linear" slope="2" intercept="-.5"/></feComponentTransfer>
      <feComposite in2="SourceAlpha" operator="in"/>
    </filter>
    <filter id="pigmentSpeckle" x="0" y="0" width="1060" height="941" filterUnits="userSpaceOnUse">
      <feTurbulence type="fractalNoise" baseFrequency=".38 .51" numOctaves="3" seed="8"/>
      <feColorMatrix values="0 0 0 0 .25  0 0 0 0 .65  0 0 0 0 .72  0 0 0 5 -2.5"/>
      <feComposite in2="SourceAlpha" operator="in"/>
    </filter>
  </defs>
  <!-- Base organic pigment shape -->
  <path d="{teal_path}" fill="url(#tealPigment)"/>
  <!-- Paper/ink turbulence texture -->
  <path d="{teal_path}" fill="#000" filter="url(#tealGrain)" opacity="0.65" style="mix-blend-mode:soft-light"/>
  <path d="{teal_path}" fill="#fff" filter="url(#pigmentSpeckle)" opacity="0.055"/>
  <!-- Soft feathered highlight along the outer edge wash -->
  <path d="M 480 0 C 496.7 17.3, 550.0 73.8, 580.0 104.0 C 610.0 134.2, 624.0 155.7, 660.0 181.0 C 696.0 206.3, 751.3 235.8, 796.0 256.0 C 840.7 276.2, 887.3 285.2, 928.0 302.0 C 968.7 318.8, 1018.3 342.3, 1040.0 357.0 C 1061.7 371.7, 1062.7 368.2, 1058.0 390.0 C 1053.3 411.8, 1017.0 454.3, 1012.0 488.0 C 1007.0 521.7, 1043.0 557.3, 1028.0 592.0 C 1013.0 626.7, 948.3 667.8, 922.0 696.0 C 895.7 724.2, 897.0 742.0, 870.0 761.0 C 843.0 780.0, 794.5 792.8, 760.0 810.0 C 725.5 827.2, 679.2 855.0, 663.0 864.0"
        fill="none" stroke="#257280" stroke-width="2.5" opacity="0.35"/>
</svg>
'''
(OUT / 'teal-mass.svg').write_text(teal_mass, encoding='utf-8')

from build_menu_materials import main as build_materials
build_materials()
from build_menu_motion_assets import main as build_motion_materials
build_motion_materials()
print("All menu assets generated successfully in assets/ui/coastal/")
