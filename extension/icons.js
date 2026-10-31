// Shared 16px outline icons. Paths are static extension assets, never page input.
const paths={
  popout:'<path d="M9 2h5v5M14 2 7 9M6 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3"/>',
  dock:'<rect x="2" y="2" width="12" height="12" rx="2"/><path d="M10 2v12M5 6l2 2-2 2"/>',
  sun:'<circle cx="8" cy="8" r="3"/><path d="M8 1v1M8 14v1M1 8h1M14 8h1M3 3l.7.7m8.6 8.6.7.7M13 3l-.7.7m-8.6 8.6L3 13"/>',
  moon:'<path d="M13.7 9.1A6 6 0 0 1 6.9 2.3a6 6 0 1 0 6.8 6.8Z"/>',
  plus:'<path d="M8 3v10M3 8h10"/>',
  select:'<path d="M5 2H3a1 1 0 0 0-1 1v2m9-3h2a1 1 0 0 1 1 1v2M2 11v2a1 1 0 0 0 1 1h2"/><path d="m7 7 6.5 2.5-2.8 1.2-1.2 2.8L7 7Z"/>',
  arrow:'<path d="M3 8h10M9 4l4 4-4 4"/>',
  page:'<rect x="2" y="3" width="12" height="10" rx="2"/><path d="M2 6h12"/>',
  check:'<path d="m3 8 3 3 7-7"/>',
  download:'<path d="M8 2v8m-3-3 3 3 3-3M3 11v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2"/>',
  edit:'<path d="m9.5 3.5 3 3M3 13l1-4 7-7a1.4 1.4 0 0 1 2 2l-7 7-3 1Z"/>',
  trash:'<path d="M2.5 4h11M6 4V2.5h4V4M4 4l.6 9h6.8l.6-9M6.5 6.5v4M9.5 6.5v4"/>',
  frame:'<path d="M6 2H3a1 1 0 0 0-1 1v3m8-4h3a1 1 0 0 1 1 1v3M2 10v3a1 1 0 0 0 1 1h3m4 0h3a1 1 0 0 0 1-1v-3"/><rect x="6" y="6" width="4" height="4" rx=".5"/>'
};
export function icon(name){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','icon');svg.setAttribute('viewBox','0 0 16 16');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.5');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');svg.innerHTML=paths[name]||paths.frame;return svg;}
