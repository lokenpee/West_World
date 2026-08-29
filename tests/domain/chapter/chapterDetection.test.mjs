import assert from 'node:assert/strict';
import test from 'node:test';

import {
    extractChapterCapture,
    getChapterMatchStartIndex,
    isLikelyInlineChapterStart,
    normalizeInlineChapterMarkers,
} from '../../../src/domain/chapter/chapterDetection.js';

test('normalizes inline chapter markers without changing line-start markers', () => {
    assert.equal(
        normalizeInlineChapterMarkers('正文结束。第二章 新的开始'),
        '正文结束。\n第二章 新的开始',
    );
    assert.equal(
        normalizeInlineChapterMarkers('正文结束。\n第二章 新的开始'),
        '正文结束。\n第二章 新的开始',
    );
});

test('recognizes chapter boundaries after punctuation', () => {
    assert.equal(isLikelyInlineChapterStart('正文。第二章', 3), true);
    assert.equal(isLikelyInlineChapterStart('正文第二章', 2), false);
});

test('uses the first capture group as the chapter title and start offset', () => {
    const matches = [...'前缀[第二章]正文'.matchAll(/\[(第二章)\]/g)];
    const match = matches[0];
    assert.deepEqual(extractChapterCapture(match), {
        capturedText: '第二章',
        offsetInFullMatch: 1,
    });
    assert.equal(getChapterMatchStartIndex(match), 3);
});
