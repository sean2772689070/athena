
const iconMap = new Map([
  ['system', 'material-symbols:auto-awesome-outline'],
  ['light', 'material-symbols:light-mode-outline'],
  ['dark', 'material-symbols:dark-mode-outline'],
])

export function useThemeMode() {
    const themeMode = ref<ThemeMode>('dark');
    const isDark = ref<boolean>(false);
    const themeIcon = computed(() => iconMap.get(themeMode.value) || 'material-symbols:auto-awesome-outline');

    const themeChangeCallback: Array<(mode: ThemeMode) => void> = [];

    function setThemeMode(mode: ThemeMode) {
        themeMode.value = mode;

        window.api.setThemeMode(mode);
    }

    function getThemeMode() {
        return themeMode.value;
    }

    function onSystemThemeChange(callback: (mode: ThemeMode) => void) {
        themeChangeCallback.push(callback);
    }

    onMounted(async () =>{
        window.api.isDarkTheme().then((res) => {
            isDark.value = res;
        })
        window.api.onSystemThemeChange((_isDark) => window.api.getThemeMode().then
    (
        res => {
            isDark.value = _isDark;
            if(res !== themeMode.value) themeMode.value = res;
            themeChangeCallback.forEach(callback => callback(res));
        }
    ))
    isDark.value = await window.api.isDarkTheme();
    themeMode.value = await window.api.getThemeMode();
    })

    return {
        themeMode,
        themeIcon,
        isDark,
        setThemeMode,
        getThemeMode,
        onSystemThemeChange,
    }
}

export default useThemeMode;
