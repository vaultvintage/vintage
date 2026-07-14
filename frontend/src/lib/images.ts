// Verified Unsplash photo URLs used as themed backgrounds behind the
// dark + neon overlay on marketing pages. All return image/jpeg (checked).
const q = "?w=1600&q=70&auto=format&fit=crop";

export const IMG = {
  vault: `https://images.unsplash.com/photo-1601597111158-2fceff292cdc${q}`,
  money: `https://images.unsplash.com/photo-1563986768609-322da13575f3${q}`,
  calculator: `https://images.unsplash.com/photo-1554224155-6726b3ff858f${q}`,
  house: `https://images.unsplash.com/photo-1560520653-9e0e4c89eb11${q}`,
  coins: `https://images.unsplash.com/photo-1579621970563-ebec7560ff3e${q}`,
  handshake: `https://images.unsplash.com/photo-1521791136064-7986c2920216${q}`,
  earth: `https://images.unsplash.com/photo-1451187580459-43490279c0fa${q}`,
  phone: `https://images.unsplash.com/photo-1556740738-b6a63e27c4df${q}`,
  laptop: `https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3${q}`,
};

/** Build an inline style that feeds a background image to `.media-panel` / `.page-hero`. */
export function bgImage(url: string, extra?: React.CSSProperties): React.CSSProperties {
  return { ...(extra || {}), ["--img" as string]: `url("${url}")` } as React.CSSProperties;
}
