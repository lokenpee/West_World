import assert from 'node:assert';
import { DEFAULT_WORLDBOOK_CATEGORIES } from '../../txtToWorldbook/core/constants.js';
import { createListRenderer } from '../../txtToWorldbook/ui/renderer.js';
import { createCategoryListView } from '../../txtToWorldbook/ui/categoryListView.js';

function createToggleElement(index, initialChecked) {
    const status = { textContent: initialChecked ? '启用' : '停用' };
    const item = {
        className: initialChecked ? 'ttw-category-item ttw-category-enabled' : 'ttw-category-item',
        dataset: { enabled: String(initialChecked) },
        classList: {
            toggle(className, enabled) {
                const classes = new Set(item.className.split(/\s+/).filter(Boolean));
                if (enabled) classes.add(className);
                else classes.delete(className);
                item.className = Array.from(classes).join(' ');
            },
        },
        querySelector(selector) {
            return selector === '.ttw-category-status' ? status : null;
        },
    };

    const checkbox = {
        dataset: { index: String(index) },
        checked: initialChecked,
        nextElementSibling: { textContent: initialChecked ? '✓' : '' },
        addEventListener(event, handler) {
            if (event === 'change') checkbox.changeHandler = handler;
        },
        closest(selector) {
            return selector === '.ttw-category-item' ? item : null;
        },
    };

    return { checkbox, item, status };
}

function setupView(initialCategories, savedCategories = []) {
    const defaults = structuredClone(DEFAULT_WORLDBOOK_CATEGORIES);
    const toggles = defaults.map((category, index) => createToggleElement(index, category.enabled !== false));
    let activeToggles = toggles;
    const element = {
        innerHTML: '',
        dataset: {},
        querySelectorAll(selector) {
            if (selector !== '.ttw-category-cb') return [];
            // 模拟真实 render：每次查询都会得到重建后的 checkbox 节点。
            activeToggles = state.persistent.customCategories.map((category, index) => (
                createToggleElement(index, category.enabled !== false)
            ));
            return activeToggles.map((toggle) => toggle.checkbox);
        },
    };

    globalThis.document = {
        getElementById: (id) => (id === 'ttw-categories-list' ? element : null),
    };

    const state = {
        persistent: {
            customCategories: initialCategories,
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
        defaultCategories: defaults,
        hasDefaultCategory: (name) => defaults.some((category) => category.name === name),
        saveCustomCategories: async () => savedCategories.push(structuredClone(state.persistent.customCategories)),
        showEditCategoryModal: () => {},
        confirmAction: async () => false,
        resetSingleCategory: async () => {},
    });

    return {
        element,
        view,
        state,
        getToggles: () => activeToggles,
        savedCategories,
    };
}

{
    const defaults = structuredClone(DEFAULT_WORLDBOOK_CATEGORIES);
    const { element, view } = setupView(defaults);
    view.renderCategoriesList();
    assert.match(element.innerHTML, /ttw-category-cb/);
    assert.match(element.innerHTML, /ttw-category-check/);
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

{
    // 直接验证 checkbox change 事件会更新 enabled 并保存，而不是只改视觉状态。
    const { view, state, getToggles, savedCategories } = setupView();
    view.renderCategoriesList();

    // 先触发一次异步恢复后的重渲染，再验证新 DOM 上的 checkbox 仍然可用。
    view.renderCategoriesList();
    const roleToggle = getToggles()[0];
    roleToggle.checkbox.checked = false;
    await roleToggle.checkbox.changeHandler();

    assert.equal(state.persistent.customCategories[0].name, '角色');
    assert.equal(state.persistent.customCategories[0].enabled, false);
    assert.equal(roleToggle.item.dataset.enabled, 'false');
    assert.equal(roleToggle.status.textContent, '停用');
    assert.equal(savedCategories.length, 1);
}

console.log('categoryListView tests passed');
