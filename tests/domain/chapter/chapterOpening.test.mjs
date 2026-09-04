import assert from 'node:assert/strict';
import test from 'node:test';

import { extractChapterOpening } from '../../../src/domain/chapter/chapterOpening.js';

test('extracts the first two source sentences and preserves closing quotes', () => {
    assert.equal(
        extractChapterOpening('风从门缝里灌进来。“快走！”他低声说道。后面内容不应出现。'),
        '风从门缝里灌进来。“快走！”',
    );
});

test('falls back to available source text for short or irregular chapters', () => {
    assert.equal(extractChapterOpening('只有一段没有句号的章节内容'), '只有一段没有句号的章节内容');
    assert.equal(extractChapterOpening(''), '');
    assert.equal(extractChapterOpening(null), '');
});
