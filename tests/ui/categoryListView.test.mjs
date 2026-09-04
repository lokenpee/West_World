import assert from 'node:assert';
import { DEFAULT_WORLDBOOK_CATEGORIES } from '../../txtToWorldbook/core/constants.js';
import { createListRenderer } from '../../txtToWorldbook/ui/renderer.js';
import { createCategoryListView } from '../../txtToWorldbook/ui/categoryListView.js';
import { buildModalHtml } from '../../txtToWorldbook/ui/settingsPanel.js';
import { bindSettingEvents } from '../../txtToWorldbook/ui/eventBindings.js';

function withCategoryListElement(callback) {
    const element = { innerHTML: '', dataset: {}, querySelectorAll: () => [] };
    globalThis.document = {
        getElementById: (id) => (id === 'ttw-categories-list' ? element : null),
    };
    return callback(element);
}

function assertVisibleStandardCheckboxes(html) {
    assert.match(html, /type="checkbox" class="ttw-category-cb"/);
    assert.match(html, /👤 角色/);
    assert.match(html, /📍 地点/);
    assert.doesNotMatch(html, /ttw-category-check/);
}

// 模态框模板本身必须预置内置分类；即使动态渲染失败也不能空白。
assertVisibleStandardCheckboxes(buildModalHtml());

// 动态渲染同样使用普通可见 checkbox，并保留角色/地点。
withCategoryListElement((element) => {
    const state = {
        persistent: {
            customCategories: structuredClone(DEFAULT_WORLDBOOK_CATEGORIES),
        },
    };
    const view = createCategoryListView({
        AppState: state,
        ListRenderer: createListRenderer({
            smartUpdate: (container, html) => {
                container.innerHTML = html;
            },
        }),
        EventDelegate: { on() {} },
        defaultCategories: DEFAULT_WORLDBOOK_CATEGORIES,
        hasDefaultCategory: (name) => DEFAULT_WORLDBOOK_CATEGORIES.some((item) => item.name === name),
        saveCustomCategories: async () => {},
        showEditCategoryModal: () => {},
        confirmAction: async () => false,
        resetSingleCategory: async () => {},
    });

    view.renderCategoriesList();
    assertVisibleStandardCheckboxes(element.innerHTML);
});

// checkbox 事件绑定在稳定 modalContainer 上，初始静态项与重绘后的动态项都能保存状态。
{
    const delegatedEvents = new Map();
    const state = {
        settings: {},
        config: { parallel: {}, chapterRegex: {} },
        processing: {},
        persistent: {
            customCategories: structuredClone(DEFAULT_WORLDBOOK_CATEGORIES),
        },
    };
    const saved = [];
    globalThis.document = {
        getElementById: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {},
    };

    bindSettingEvents({
        EventDelegate: {
            batchOn(container, config) {
                delegatedEvents.set('batch', config);
            },
            on() {},
        },
        modalContainer: {},
        AppState: state,
        saveCurrentSettings: () => {},
        saveCustomCategories: async () => saved.push(structuredClone(state.persistent.customCategories)),
    });

    const categoryEvents = delegatedEvents.get('batch')['.ttw-category-cb'];
    assert.ok(categoryEvents?.change);

    const checkbox = {
        dataset: { index: '0', categoryName: '角色' },
        checked: false,
    };
    categoryEvents.change({}, checkbox);
    assert.equal(state.persistent.customCategories[0].name, '角色');
    assert.equal(state.persistent.customCategories[0].enabled, false);
}

console.log('categoryListView tests passed');
