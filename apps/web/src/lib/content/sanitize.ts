import sanitizeHtml from 'sanitize-html';
import { WORDPRESS_ORIGIN } from './schema';

export function publicResourceUrl(value: string, allowEmail = false): string | null {
  if (!value.trim()) return null;
  try {
    const url = new URL(value, WORDPRESS_ORIGIN);
    if (allowEmail && url.protocol === 'mailto:') return url.href;
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    if (/^(?:localhost|.*\.local|\[.*\]|\d+(?:\.\d+){0,3})$/i.test(url.hostname)) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function plainText(value: string): string {
  let result = '';
  sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
    textFilter(text) {
      result += `${text} `;
      return text;
    },
  });
  return result
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizePublicHtml(value: string) {
  const media = new Set<string>();
  const sources = new Set<string>();
  const html = sanitizeHtml(value, {
    allowedTags: [
      'p',
      'br',
      'hr',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'strong',
      'b',
      'em',
      'i',
      'u',
      's',
      'del',
      'sup',
      'sub',
      'mark',
      'blockquote',
      'pre',
      'code',
      'ul',
      'ol',
      'li',
      'dl',
      'dt',
      'dd',
      'div',
      'span',
      'a',
      'figure',
      'figcaption',
      'img',
      'table',
      'caption',
      'thead',
      'tbody',
      'tfoot',
      'tr',
      'th',
      'td',
      'video',
      'audio',
      'source',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'loading', 'decoding', 'referrerpolicy'],
      ol: ['start', 'reversed'],
      li: ['value'],
      th: ['scope', 'colspan', 'rowspan'],
      td: ['colspan', 'rowspan'],
      video: ['src', 'controls', 'preload', 'width', 'height'],
      audio: ['src', 'controls', 'preload'],
      source: ['src', 'type'],
    },
    allowedSchemes: ['https', 'http', 'mailto'],
    allowedSchemesByTag: {
      img: ['https', 'http'],
      video: ['https', 'http'],
      audio: ['https', 'http'],
      source: ['https', 'http'],
    },
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
    nonTextTags: [
      'script',
      'style',
      'textarea',
      'option',
      'noscript',
      'template',
      'iframe',
      'object',
      'form',
      'svg',
      'math',
    ],
    transformTags: {
      a(tagName, attribs) {
        const href = publicResourceUrl(attribs.href ?? '', true);
        if (href && !href.startsWith('mailto:')) sources.add(href);
        const rel = [
          ...new Set([
            'noopener',
            'noreferrer',
            ...(attribs.rel ?? '')
              .split(/\s+/)
              .filter((token) => ['nofollow', 'sponsored', 'ugc'].includes(token)),
          ]),
        ].join(' ');
        return {
          tagName,
          attribs: {
            ...(href ? { href } : {}),
            ...(attribs.title ? { title: attribs.title } : {}),
            rel,
          },
        };
      },
      img(tagName, attribs) {
        const src = publicResourceUrl(attribs.src ?? '');
        if (src) media.add(src);
        const dimensions = Object.fromEntries(
          ['width', 'height']
            .filter((key) => /^\d{1,5}$/.test(attribs[key] ?? '') && Number(attribs[key]) > 0)
            .map((key) => [key, attribs[key]]),
        );
        return {
          tagName,
          attribs: {
            ...(src ? { src } : {}),
            alt: attribs.alt ?? '',
            ...dimensions,
            loading: 'lazy',
            decoding: 'async',
            referrerpolicy: 'no-referrer',
          },
        };
      },
      '*': (tagName, attribs) => {
        if (!['video', 'audio', 'source'].includes(tagName)) return { tagName, attribs };
        const src = publicResourceUrl(attribs.src ?? '');
        if (src) media.add(src);
        return {
          tagName,
          attribs: {
            ...(src ? { src } : {}),
            ...(tagName === 'source'
              ? { type: attribs.type ?? '' }
              : { controls: '', preload: 'none' }),
          },
        };
      },
    },
    exclusiveFilter: (frame) => ['img', 'source'].includes(frame.tag) && !frame.attribs.src,
  });
  return { html, text: plainText(html), media: [...media], sources: [...sources] };
}
