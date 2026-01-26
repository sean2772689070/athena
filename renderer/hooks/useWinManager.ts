/**
 * 窗口管理组合式函数
 * 提供对 Electron 主窗口的常用操作（关闭、最小化、最大化）以及最大化状态同步
 */
export function useWinManager() {
    // 响应式变量：标记当前窗口是否处于最大化状态
    const isMaximized = ref(false);

    /**
     * 关闭主窗口
     * 通过调用预注入的 window.api.closeWindow() 实现
     */
    function closeWindow() {
        window.api.closeWindow();
    }

    /**
     * 最小化主窗口
     * 通过调用预注入的 window.api.minimizeWindow() 实现
     */
    function minimizeWindow() {
        window.api.minimizeWindow();
    }

    /**
     * 最大化/还原主窗口
     * 通过调用预注入的 window.api.maximizeWindow() 实现
     * 具体行为由主进程决定，通常为最大化与还原之间切换
     */
    function maximizeWindow() {
        window.api.maximizeWindow();
    }

    onMounted(async () => {
        // 等待 DOM 更新完成，确保窗口状态获取准确
        await nextTick();
        // 初始化时同步一次窗口最大化状态
        isMaximized.value = await window.api.isWindowMaximized();
        // 监听后续窗口最大化/还原事件，实时更新状态
        window.api.onWindowMaximized((_isMaximized: boolean) => isMaximized.value = _isMaximized);
    })

    // 向组件暴露可操作函数与状态
    return {
        isMaximized,      // 当前窗口是否最大化（响应式）
        closeWindow,      // 关闭窗口函数
        minimizeWindow,   // 最小化窗口函数
        maximizeWindow    // 最大化/还原窗口函数
    }
}

export default useWinManager