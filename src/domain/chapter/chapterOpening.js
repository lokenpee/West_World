const SENTENCE_ENDINGS = new Set(['。', '！', '？', '!', '?']);
const CLOSING_MARKS = new Set(['”', '’', '」', '』', '）', ')', ']', '】', '》', '〉']);

/**
 * Extract a short, source-only chapter lead for display in the chapter panel.
 * This function never calls an API and never mutates chat history.
 */
export function extractChapterOpening(text, sentenceCount = 2) {
    const source = String(text || '').replace(/\s+/gu, ' ').trim();
    if (!source) return '';

    const targetCount = Number.isInteger(sentenceCount) && sentenceCount > 0 ? sentenceCount : 2;
    let sentenceEnds = 0;
    for (let index = 0; index < source.length; index += 1) {
        if (!SENTENCE_ENDINGS.has(source[index])) continue;

        sentenceEnds += 1;
        let end = index + 1;
        while (end < source.length && CLOSING_MARKS.has(source[end])) {
            end += 1;
        }
        if (sentenceEnds >= targetCount) {
            return source.slice(0, end).trim();
        }
        index = end - 1;
    }

    // If the source has fewer sentence terminators, show the available lead
    // instead of returning an empty panel for short or irregular chapters.
    return source.slice(0, 180).trim();
}
