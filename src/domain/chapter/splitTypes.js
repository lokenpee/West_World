export const DEFAULT_CHAPTER_SPLIT_TYPE = 'goal_shift';

export const CHAPTER_SPLIT_TYPES = Object.freeze([
    'scene_change',
    'time_jump',
    'goal_shift',
    'conflict_closed',
]);

export const LEGACY_CHAPTER_SPLIT_TYPE_MAP = Object.freeze({
    scene_switch: 'scene_change',
    situation_change: 'scene_change',
    action_closed: 'conflict_closed',
    dialogue_closed: 'conflict_closed',
    plot_twist: 'conflict_closed',
    perspective_switch: 'scene_change',
    relationship_shift: 'conflict_closed',
    revelation: 'conflict_closed',
    decision_point: 'goal_shift',
    emotional_turn: 'conflict_closed',
    interaction_point: 'goal_shift',
    scene_change: 'scene_change',
    time_skip: 'time_jump',
    time_jump: 'time_jump',
    goal_shift: 'goal_shift',
    conflict_closed: 'conflict_closed',
    '场景明显切换': 'scene_change',
    '时间明显跳转': 'time_jump',
    '人物核心目标完全改变': 'goal_shift',
    '完整冲突闭环结束': 'conflict_closed',
    '一个完整冲突/行动闭环结束': 'conflict_closed',
});

const chapterSplitTypeSet = new Set(CHAPTER_SPLIT_TYPES);

export function normalizeChapterSplitType(type) {
    const raw = String(type || '').trim();
    if (chapterSplitTypeSet.has(raw)) return raw;
    return LEGACY_CHAPTER_SPLIT_TYPE_MAP[raw] || DEFAULT_CHAPTER_SPLIT_TYPE;
}

/**
 * Normalize the serialized split-rule shape shared by processing, state, and UI layers.
 * Callers can opt into the legacy `matched[0]` fallback used by old processing results
 * and provide their historical rationale text without changing user-visible output.
 */
export function normalizeChapterSplitRule(rawRule = {}, options = {}) {
    const source = rawRule && typeof rawRule === 'object' ? rawRule : {};
    const legacyMatched = options.useMatched && Array.isArray(source.matched)
        ? source.matched.map((item) => String(item || '').trim()).filter(Boolean)
        : [];
    const primarySource = options.useMatched
        ? (source.primary || source.rule || source.main || legacyMatched[0] || DEFAULT_CHAPTER_SPLIT_TYPE)
        : (source.primary || source.rule || source.main || source.type || DEFAULT_CHAPTER_SPLIT_TYPE);
    const primary = normalizeChapterSplitType(primarySource);
    const rationale = String(source.rationale || source.reason || '').trim()
        || (typeof options.fallbackRationale === 'function'
            ? options.fallbackRationale(primary)
            : `选择 ${primary} 以保持叙事单元完整并避免事件被切开。`);

    return {
        primary,
        rationale,
    };
}
