const INLINE_CHAPTER_MARKER_REGEX = /第\s*[零一二三四五六七八九十百千万两〇0-9]+\s*[章回卷节部篇]/giu;
const INLINE_CHAPTER_BOUNDARY_CHAR_REGEX = /[。！？!?；;，,、”’」』）)\]】》〉]/u;

export function isLikelyChapterLineStart(rawContent, index) {
    if (!Number.isInteger(index) || index < 0) return false;
    if (index === 0) return true;

    let cursor = index - 1;
    while (cursor >= 0) {
        const ch = rawContent[cursor];
        if (ch === '\n' || ch === '\r') return true;
        if (!(/[\s\u3000\uFEFF]/.test(ch))) return false;
        cursor -= 1;
    }
    return true;
}

export function getPreviousVisibleChar(rawContent, index) {
    if (!Number.isInteger(index) || index <= 0) return '';

    let cursor = index - 1;
    while (cursor >= 0) {
        const ch = rawContent[cursor];
        if (!(/[\s\u3000\uFEFF]/.test(ch))) return ch;
        cursor -= 1;
    }
    return '';
}

export function isLikelyInlineChapterStart(rawContent, index) {
    if (!Number.isInteger(index) || index < 0) return false;
    if (isLikelyChapterLineStart(rawContent, index)) return true;

    const prevChar = getPreviousVisibleChar(rawContent, index);
    return INLINE_CHAPTER_BOUNDARY_CHAR_REGEX.test(prevChar);
}

export function normalizeInlineChapterMarkers(rawContent) {
    const text = typeof rawContent === 'string' ? rawContent : String(rawContent || '');
    if (!text) return text;

    let result = '';
    let cursor = 0;
    let changed = false;

    for (const match of text.matchAll(INLINE_CHAPTER_MARKER_REGEX)) {
        const index = Number.isInteger(match.index) ? match.index : -1;
        if (index < 0) continue;

        const marker = match[0];
        result += text.slice(cursor, index);

        const shouldInsertBreak = !isLikelyChapterLineStart(text, index)
            && isLikelyInlineChapterStart(text, index)
            && !result.endsWith('\n')
            && !result.endsWith('\r');

        if (shouldInsertBreak) {
            result += '\n';
            changed = true;
        }

        result += marker;
        cursor = index + marker.length;
    }

    if (cursor === 0) return text;
    result += text.slice(cursor);
    return changed ? result : text;
}

export function extractChapterCapture(match) {
    if (!match || typeof match[0] !== 'string') {
        return { capturedText: '', offsetInFullMatch: 0 };
    }

    const fullMatch = match[0];
    for (let i = 1; i < match.length; i++) {
        const captured = typeof match[i] === 'string' ? match[i] : '';
        if (!captured) continue;

        const offset = fullMatch.indexOf(captured);
        if (offset >= 0) {
            return { capturedText: captured, offsetInFullMatch: offset };
        }
    }

    return { capturedText: fullMatch, offsetInFullMatch: 0 };
}

export function getChapterMatchStartIndex(match) {
    const baseIndex = Number.isInteger(match?.index) ? match.index : 0;
    const capture = extractChapterCapture(match);
    return baseIndex + capture.offsetInFullMatch;
}
