type ThemeMode = 'dark' | 'light' | 'system';

interface WindowApi {
    closeWindow: () => void;
    minimizeWindow: () => void;
    maximizeWindow: () => void;
    onWindowMaximized: (callback: (isMaximized: boolean) => void) => void;
    isWindowMaximized: () => Promise<boolean>;

    setThemeMode: (mode: ThemeMode) => Promise<boolean>;
    getThemeMode: () => Promise<ThemeMode>;
    isDarkTheme: () => Promise<boolean>;
    onSystemThemeChange: (callback: (isDark: boolean) => void) => void;

    logger: {
        info: (msg: string, ...meta: any[]) => void;
        error: (msg: string, ...meta: any[]) => void;
        debug: (msg: string, ...meta: any[]) => void;
        warn: (msg: string, ...meta: any[]) => void;
    }
}

// 使用 declare 是为了告诉 TypeScript：这里对 Window 的扩展属于“环境声明”，
// 避免与已有的 lib.dom.d.ts 中的 Window 接口冲突，同时让编译器合并字段。
declare interface Window {
    api: WindowApi;
  }

