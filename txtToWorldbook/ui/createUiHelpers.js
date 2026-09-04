import { createSettingsStateView } from './settingsStateView.js';
import { createCategoryListView } from './categoryListView.js';
import { createCategoryEditorModal } from './categoryEditorModal.js';
import { createEditorActionsFacade } from './editorActionsFacade.js';
import { createChapterRegexView } from './chapterRegexView.js';
import { createPromptPreviewModal } from './promptPreviewModal.js';
import { createModelActionsView } from './modelActionsView.js';
import { createApiModeView } from './apiModeView.js';
import { createSettingsActionsFacade } from './settingsActionsFacade.js';
import { createProgressView } from './progressView.js';

export function createUiHelpers(deps = {}) {
    const {
        AppState,
        ListRenderer,
        EventDelegate,
        ModalFactory,
        ErrorHandler,
        Logger,
        DEFAULT_WORLDBOOK_CATEGORIES,
        saveCurrentSettings,
        saveCustomCategories,
        confirmAction,
        resetSingleCategory,
        setCategoryDefaultConfig,
        buildSystemPrompt,
        getChapterForcePrompt,
        getEnabledCategories,
        handleFetchModelList,
        handleQuickTestModel,
    } = deps;

    let apiModeView = null;
    let categoryEditorModal = null;

    const settingsStateView = createSettingsStateView({
        AppState,
        handleUseTavernApiChange: () => apiModeView?.handleUseTavernApiChange(),
        handleProviderChange: (target = 'main') => apiModeView?.handleProviderChange(target),
    });
    const {
        updateSettingsUI,
        updateChapterRegexUI,
    } = settingsStateView;

    const categoryListView = createCategoryListView({
        AppState,
        ListRenderer,
        EventDelegate,
        defaultCategories: DEFAULT_WORLDBOOK_CATEGORIES,
        hasDefaultCategory: (name) => DEFAULT_WORLDBOOK_CATEGORIES.some((c) => c.name === name),
        saveCustomCategories,
        showEditCategoryModal: (index) => categoryEditorModal?.showEditCategoryModal(index),
        confirmAction,
        resetSingleCategory: (index) => resetSingleCategory(index),
    });
    const { renderCategoriesList } = categoryListView;

    categoryEditorModal = createCategoryEditorModal({
        AppState,
        ModalFactory,
        ErrorHandler,
        setCategoryDefaultConfig,
        saveCustomCategories,
        renderCategoriesList: () => renderCategoriesList(),
    });

    const editorActionsFacade = createEditorActionsFacade({
        categoryEditorModal,
    });
    const { showAddCategoryModal, showEditCategoryModal } = editorActionsFacade;

    const chapterRegexView = createChapterRegexView({
        AppState,
        ModalFactory,
        ErrorHandler,
        Logger,
    });
    const { testChapterRegex } = chapterRegexView;

    const promptPreviewModal = createPromptPreviewModal({
        AppState,
        ModalFactory,
        ErrorHandler,
        alertAction: deps.alertAction,
        buildSystemPrompt,
        getChapterForcePrompt,
        getEnabledCategories,
    });

    const modelActionsView = createModelActionsView({
        saveCurrentSettings,
        handleFetchModelList,
        handleQuickTestModel,
        Logger,
    });

    apiModeView = createApiModeView({
        AppState,
        updateModelStatus: (text, type, target) => modelActionsView.updateModelStatus(text, type, target),
    });

    const settingsActionsFacade = createSettingsActionsFacade({
        apiModeView,
        modelActionsView,
        promptPreviewModal,
    });
    const {
        handleUseTavernApiChange,
        handleProviderChange,
        switchApiTab,
        updateModelStatus,
        handleFetchModels,
        handleQuickTest,
        showPromptPreview,
    } = settingsActionsFacade;

    const progressView = createProgressView({
        AppState,
    });
    const {
        showQueueSection,
        showProgressSection,
        showResultSection,
        updateProgress,
    } = progressView;

    return {
        updateSettingsUI,
        updateChapterRegexUI,
        renderCategoriesList,
        showAddCategoryModal,
        showEditCategoryModal,
        testChapterRegex,
        handleUseTavernApiChange,
        handleProviderChange,
        switchApiTab,
        updateModelStatus,
        handleFetchModels,
        handleQuickTest,
        showPromptPreview,
        showQueueSection,
        showProgressSection,
        showResultSection,
        updateProgress,
    };
}
