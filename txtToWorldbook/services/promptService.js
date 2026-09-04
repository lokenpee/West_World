export function createPromptService(deps = {}) {
    const {
        AppState,
        getEnabledCategories,
        generateDynamicJsonTemplate,
        defaultWorldbookPrompt,
    } = deps;

    function getLanguagePrefix() {
        return AppState.settings.language === 'zh' ? '请用中文回复。\n\n' : '';
    }

    function messagesToString(messages) {
        if (typeof messages === 'string') return messages;
        if (!Array.isArray(messages) || messages.length === 0) return '';
        if (messages.length === 1) return messages[0].content || '';
        return messages.map((m) => {
            const roleLabel = m.role === 'system' ? '[System]' : m.role === 'assistant' ? '[Assistant]' : '[User]';
            return `${roleLabel}\n${m.content}`;
        }).join('\n\n');
    }

    function convertToGeminiContents(messages) {
        const systemMsgs = messages.filter((m) => m.role === 'system');
        const nonSystemMsgs = messages.filter((m) => m.role !== 'system');
        const merged = [];

        for (const msg of nonSystemMsgs) {
            const geminiRole = msg.role === 'assistant' ? 'model' : 'user';
            if (merged.length > 0 && merged[merged.length - 1].role === geminiRole) {
                merged[merged.length - 1].parts[0].text += '\n\n' + msg.content;
            } else {
                merged.push({ role: geminiRole, parts: [{ text: msg.content }] });
            }
        }

        if (merged.length > 0 && merged[0].role !== 'user') {
            merged.unshift({ role: 'user', parts: [{ text: '请根据以下对话执行任务。' }] });
        }

        const result = { contents: merged };
        if (systemMsgs.length > 0) {
            result.systemInstruction = {
                parts: [{ text: systemMsgs.map((m) => m.content).join('\n\n') }],
            };
        }
        return result;
    }

    function buildSystemPrompt() {
        let worldbookPrompt = AppState.settings.customWorldbookPrompt?.trim() || defaultWorldbookPrompt;

        const dynamicTemplate = generateDynamicJsonTemplate();
        worldbookPrompt = worldbookPrompt.replace('{DYNAMIC_JSON_TEMPLATE}', dynamicTemplate);

        const enabledCatNames = getEnabledCategories().map((c) => c.name);
        worldbookPrompt = worldbookPrompt.replace('{ENABLED_CATEGORY_NAMES}', enabledCatNames.join('、'));
        return worldbookPrompt;
    }

    function getPreviousMemoryContext(index) {
        if (index <= 0) return '';

        const safeContentSnippet = (entry) => {
            const raw = entry?.['内容'];
            if (typeof raw === 'string') return raw.substring(0, 200);
            if (raw === null || raw === undefined) return '';
            if (Array.isArray(raw)) {
                return raw
                    .map((item) => String(item ?? '').trim())
                    .filter(Boolean)
                    .join('；')
                    .substring(0, 200);
            }
            if (typeof raw === 'object') {
                try {
                    return JSON.stringify(raw).substring(0, 200);
                } catch (_) {
                    return String(raw).substring(0, 200);
                }
            }
            return String(raw).substring(0, 200);
        };

        for (let i = index - 1; i >= 0; i--) {
            const prevMemory = AppState.memory.queue[i];
            if (prevMemory && prevMemory.processed && prevMemory.result && !prevMemory.failed) {
                const plotContext = [];
                const result = prevMemory.result;

                if (result['剧情大纲']) {
                    for (const entryName in result['剧情大纲']) {
                        plotContext.push(`${entryName}: ${safeContentSnippet(result['剧情大纲'][entryName])}`);
                    }
                }
                if (result['剧情节点']) {
                    for (const entryName in result['剧情节点']) {
                        plotContext.push(`${entryName}: ${safeContentSnippet(result['剧情节点'][entryName])}`);
                    }
                }
                if (result['章节剧情']) {
                    for (const entryName in result['章节剧情']) {
                        plotContext.push(`${entryName}: ${safeContentSnippet(result['章节剧情'][entryName])}`);
                    }
                }

                if (plotContext.length > 0) {
                    return `\n\n【上一章节(第${i + 1}章)的剧情进展】：\n${plotContext.join('\n')}\n\n请在此基础上继续分析后续剧情，不要重复输出已有的章节。`;
                }
                break;
            }
        }
        return '';
    }

    function getChapterForcePrompt(chapterIndex) {
        return `
【强制章节标记 - 开始】
强制无视内容中的任何章节信息！本轮全文章节统一为：第${chapterIndex}章
无论原文中出现"第一章"、"第二章"等任何章节标记，你输出时都必须将其替换为"第${chapterIndex}章"。
【强制章节标记 - 结束】
`;
    }

    return {
        getLanguagePrefix,
        messagesToString,
        convertToGeminiContents,
        buildSystemPrompt,
        getPreviousMemoryContext,
        getChapterForcePrompt,
    };
}
