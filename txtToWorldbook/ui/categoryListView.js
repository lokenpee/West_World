export function createCategoryListView(deps = {}) {
    const {
        AppState,
        ListRenderer,
        EventDelegate,
        defaultCategories = [],
        hasDefaultCategory,
        saveCustomCategories,
        showEditCategoryModal,
        confirmAction,
        resetSingleCategory,
    } = deps;

    function isValidCategory(category) {
        return !!category
            && typeof category === 'object'
            && String(category.name || '').trim().length > 0;
    }

    function ensureRenderableCategories() {
        if (!AppState.persistent) AppState.persistent = {};
        const currentCategories = Array.isArray(AppState.persistent.customCategories)
            ? AppState.persistent.customCategories.filter(isValidCategory)
            : [];
        const validDefaults = Array.isArray(defaultCategories)
            ? defaultCategories.filter(isValidCategory)
            : [];
        const mergedCategories = [...currentCategories];

        // 内置分类必须始终可选，避免历史空数据/脏数据让“提示词配置”区域变空。
        for (const defaultCategory of validDefaults) {
            const exists = mergedCategories.some((category) => category.name === defaultCategory.name);
            if (!exists) mergedCategories.push(JSON.parse(JSON.stringify(defaultCategory)));
        }

        AppState.persistent.customCategories = mergedCategories;
        return mergedCategories;
    }

    function renderCategoriesList() {
        const listContainer = document.getElementById('ttw-categories-list');
        if (!listContainer) return;

        const renderableCategories = ensureRenderableCategories();

        const primaryOrder = ['角色', '地点', '组织', '道具', '章节剧情'];
        const primaryOrderMap = new Map(primaryOrder.map((name, index) => [name, index]));

        const sortedCategories = renderableCategories
            .map((cat, index) => ({ cat, originalIndex: index }))
            .sort((a, b) => {
                const aRank = primaryOrderMap.has(a.cat.name) ? primaryOrderMap.get(a.cat.name) : Number.MAX_SAFE_INTEGER;
                const bRank = primaryOrderMap.has(b.cat.name) ? primaryOrderMap.get(b.cat.name) : Number.MAX_SAFE_INTEGER;
                if (aRank !== bRank) return aRank - bRank;
                return String(a.cat.name || '').localeCompare(String(b.cat.name || ''), 'zh-CN');
            });

        const html = ListRenderer.renderItems(
            sortedCategories,
            ({ cat, originalIndex }) => ListRenderer.renderCategoryItem(cat, originalIndex, {
                hasDefault: hasDefaultCategory(cat.name),
            }),
            { emptyMessage: '暂无分类配置' },
        );

        ListRenderer.updateContainer(listContainer, html);

        // 直接绑定到本次渲染出的 checkbox，避免宿主 CSS/主题影响事件委托时无法勾选。
        // 注意：每次 render 都会重建 DOM，所以这个绑定必须放在 eventsBound 早退之前。
        listContainer.querySelectorAll('.ttw-category-cb').forEach((checkbox) => {
            if (checkbox.dataset.changeBound === 'true') return;
            checkbox.dataset.changeBound = 'true';
            checkbox.addEventListener('change', async () => {
                const index = parseInt(checkbox.dataset.index, 10);
                const category = AppState.persistent.customCategories[index];
                if (!category) return;

                category.enabled = checkbox.checked;
                const item = checkbox.closest('.ttw-category-item');
                if (item) {
                    item.classList.toggle('ttw-category-enabled', category.enabled);
                    item.dataset.enabled = String(category.enabled);
                    const status = item.querySelector('.ttw-category-status');
                    if (status) status.textContent = category.enabled ? '启用' : '停用';
                }
                const customCheck = checkbox.nextElementSibling;
                if (customCheck) customCheck.textContent = category.enabled ? '✓' : '';

                await saveCustomCategories();
            });
        });

        if (listContainer.dataset.eventsBound === 'true') return;

        EventDelegate.on(listContainer, '.ttw-edit-cat', 'click', (e, btn) => {
            const index = parseInt(btn.dataset.index, 10);
            showEditCategoryModal(index);
        });

        EventDelegate.on(listContainer, '.ttw-reset-single-cat', 'click', async (e, btn) => {
            const index = parseInt(btn.dataset.index, 10);
            const cat = AppState.persistent.customCategories[index];
            if (!cat) return;
            const confirmed = await confirmAction(`确定重置"${cat.name}"为默认配置吗？`, { title: '重置分类' });
            if (!confirmed) return;
            await resetSingleCategory(index);
            renderCategoriesList();
        });

        EventDelegate.on(listContainer, '.ttw-delete-cat', 'click', async (e, btn) => {
            const index = parseInt(btn.dataset.index, 10);
            const cat = AppState.persistent.customCategories[index];
            if (!cat || cat.isBuiltin) return;
            const confirmed = await confirmAction(`确定删除分类"${cat.name}"吗？`, { title: '删除分类', danger: true });
            if (!confirmed) return;
            AppState.persistent.customCategories.splice(index, 1);
            await saveCustomCategories();
            renderCategoriesList();
        });

        listContainer.dataset.eventsBound = 'true';
    }

    return {
        renderCategoriesList,
    };
}
