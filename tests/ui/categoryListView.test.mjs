import assert from 'node:assert';
import { DEFAULT_WORLDBOOK_CATEGORIES } from '../../txtToWorldbook/core/constants.js';
import { createListRenderer } from '../../txtToWorldbook/ui/renderer.js';
import { createCategoryListView } from '../../txtToWorldbook/ui/categoryListView.js';

function createElement() {
    return { innerHTML: '', dataset: {} };
}

function setupView(initialCategories) {
    const element = createElement();
    globalThis.document = {
        getElementById: (id) => (id === 'ttw-categories-list' ? element : null),
    };

    const view = createCategoryListView({
        AppState: {
            persistent: {
                customCategories: initialCategories,
            },
        },
        ListRenderer: createListRenderer({
            smartUpdate: (container, html) => {
                container.innerHTML = html;
            },
        }),
        EventDelegate: { on() {} },
        defaultCategories: DEFAULT_WORLDBOOK_CATEGORIES,
        hasDefaultCategory: (name) => DEFAULT_WORLDBOOK_CATEGORIES.some((category) => category.name === name),
        saveCustomCategories: async () => {},
        showEditCategoryModal: () => {},
        confirmAction: async () => false,
        resetSingleCategory: async () => {},
    });

    return { element, view };
}

const defaults = structuredClone(DEFAULT_WORLDBOOK_CATEGORIES);
{
    const { element, view } = setupView(defaults);
    view.renderCategoriesList();
    assert.match(element.innerHTML, /角色/);
    assert.match(element.innerHTML, /地点/);
    assert.strictEqual((element.innerHTML.match(/ttw-category-cb/g) || []).length, 2);
}

{
    // 模拟旧版本/导入配置造成的空数据或脏数据：内置分类仍必须可选。
    const { element, view } = setupView([null, { name: '', enabled: true }]);
    view.renderCategoriesList();
    assert.match(element.innerHTML, /角色/);
    assert.match(element.innerHTML, /地点/);
    assert.strictEqual((element.innerHTML.match(/ttw-category-cb/g) || []).length, 2);
}

console.log('categoryListView tests passed');
