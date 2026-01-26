// 引入 vue-i18n 提供的 createI18n 函数和 I18nOptions 类型定义
import { createI18n, type I18nOptions } from 'vue-i18n'

/**
 * 异步创建并返回一个 vue-i18n 实例
 * 该实例默认语言为中文，并预加载中文与英文语言包
 */
async function createI18nInstance() {
    // 配置 i18n 选项
    const options: I18nOptions = {
        // 默认语言设置为中文
        locale: 'zh',
        // 预加载的语言包
        messages: {
            // 动态导入中文语言包，使用 await 保证加载完成，取 default 导出
            zh: await import('@locales/zh.json').then(m => m.default),
            // 动态导入英文语言包，使用 await 保证加载完成，取 default 导出
            en: await import('@locales/en.json').then(m => m.default),
        }
    }

    // 使用配置项创建 i18n 实例
    const i18n = createI18n(options)
    // 返回创建好的实例
    return i18n
}

// 调用异步函数创建 i18n 实例并导出，供其他模块使用
export const i18n = createI18nInstance()

// 默认导出 i18n 实例，方便在需要时统一引入
export default i18n
