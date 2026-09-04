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
    }

    function restoreModalData() {
        loadCustomCategories().then(() => {
            renderCategoriesList();
        });
    }

    return {
        initializeModalState,
        restoreModalData,
    };
}
