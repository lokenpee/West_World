export function createModalLifecycle(deps) {
    const {
        addModalStyles,
        bindModalEvents,
        loadSavedSettings,
        loadCategoryLightSettings,
        loadCustomCategories,
        renderCategoriesList,
    } = deps;

    function initializeModalState() {
        addModalStyles();
        bindModalEvents();
        loadSavedSettings();
        loadCategoryLightSettings();

        // AppState 初始状态已带内置分类。这里同步渲染一次，避免异步 IndexedDB
        // 加载延迟或异常导致“提示词配置 → 提取分类”暂时/持续空白。
        renderCategoriesList();
    }

    function restoreModalData() {
        Promise.resolve(loadCustomCategories())
            .catch(() => {})
            .finally(() => {
                renderCategoriesList();
            });
    }

    return {
        initializeModalState,
        restoreModalData,
    };
}
