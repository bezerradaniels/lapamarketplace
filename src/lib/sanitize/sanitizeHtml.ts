import DOMPurify from 'dompurify'

// The product rich-text editor only emits a small set of formatting tags.
// We allow exactly those and strip ALL attributes (no `style`, no event
// handlers like `onclick`/`onmouseover`, no `href`/`src`). This is the
// security boundary for any store-owner-supplied HTML rendered on a catalog.
const ALLOWED_TAGS = ['ul', 'ol', 'li', 'p', 'br', 'strong', 'em', 'b', 'i']

/**
 * Sanitizes untrusted HTML (e.g. a product description authored by a lojista)
 * before it is rendered with `dangerouslySetInnerHTML`.
 *
 * A regex-based tag allow-list is NOT sufficient: it filters tag *names* but
 * leaves event-handler attributes (`<p onmouseover=...>`) intact, which is a
 * stored-XSS vector. DOMPurify parses the DOM and removes every disallowed
 * tag and attribute, including all event handlers.
 */
export function sanitizeRichText(html: string | null | undefined): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
  })
}
