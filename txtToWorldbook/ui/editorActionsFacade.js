export function createEditorActionsFacade(deps = {}) {
    const {
        categoryEditorModal,
    } = deps;

    function showAddCategoryModal() {
        if (!categoryEditorModal) return;
        categoryEditorModal.showAddCategoryModal();
    }

    function showEditCategoryModal(editIndex) {
        if (!categoryEditorModal) return;
        categoryEditorModal.showEditCategoryModal(editIndex);
    }

    return {
        showAddCategoryModal,
        showEditCategoryModal,
    };
}
