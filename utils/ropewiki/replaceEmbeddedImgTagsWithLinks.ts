import { ROPEWIKI_ORIGIN } from "@/constants/ropewikiOrigin";

/** Matches Ropewiki/MediaWiki-style &lt;img ...&gt; (single-line tags). */
const IMG_TAG_RE = /<img\b[^>]*>/gi;

function escapeHtmlText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtmlAttrDoubleQuoted(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function extractQuotedAttr(tag: string, name: string): string | null {
  const d = new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, "i");
  const s = new RegExp(`\\b${name}\\s*=\\s*'([^']*)'`, "i");
  return tag.match(d)?.[1] ?? tag.match(s)?.[1] ?? null;
}

/** Unquoted attribute value (rare). */
function extractUnquotedAttr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*([^\\s>]+)`, "i"));
  return m?.[1] ?? null;
}

function extractSrc(tag: string): string | null {
  return extractQuotedAttr(tag, "src") ?? extractUnquotedAttr(tag, "src");
}

function resolveToAbsoluteUrl(rawSrc: string): string {
  const trimmed = rawSrc.trim();
  if (!trimmed) return "";
  try {
    return new URL(trimmed, ROPEWIKI_ORIGIN).href;
  } catch {
    return trimmed;
  }
}

/**
 * Replaces embedded &lt;img&gt; tags in Ropewiki HTML fragments with &lt;a href&gt; links
 * so the app does not load arbitrary images inline (escapes, relative URLs, etc.).
 * Tapping the link opens the image URL via RenderHtml’s default {@link Linking.openURL}.
 */
export function replaceEmbeddedImgTagsWithLinks(html: string): string {
  return html.replace(IMG_TAG_RE, (tag) => {
    const srcRaw = extractSrc(tag);
    if (!srcRaw) {
      return "";
    }
    const href = resolveToAbsoluteUrl(srcRaw);
    const altRaw = extractQuotedAttr(tag, "alt") ?? extractUnquotedAttr(tag, "alt");
    const label =
      altRaw != null && altRaw.trim() !== ""
        ? escapeHtmlText(altRaw.trim())
        : "View image";
    return `<a href="${escapeHtmlAttrDoubleQuoted(href)}">${label}</a>`;
  });
}
