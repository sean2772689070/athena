// 引入 Vite 的 defineConfig 函数，用于定义配置
import { defineConfig, type CSSOptions } from 'vite';
// 引入 Node.js 的 path 模块中的 resolve 方法，用于解析文件路径
import { resolve } from 'node:path';
// 引入 unplugin-auto-import 插件，用于自动按需引入 Vue 等库
// import autoImport from 'unplugin-auto-import/vite';

// https://vitejs.dev/config
// 使用异步函数定义 Vite 配置，便于动态导入插件
export default defineConfig(async () => {
  // 动态导入 Vue 插件并获取默认导出
  const vue = (await import('@vitejs/plugin-vue')).default;
  // 动态导入 Tailwind CSS 插件并获取默认导出
  const tailwindcss = (await import('@tailwindcss/vite')).default;
  // 动态导入自动引入插件并获取默认导出
  const autoImport = (await import('unplugin-auto-import/vite')).default;

  return {
    // 注册插件：Vue 支持 和 Tailwind CSS 支持
    plugins: [
      // 注册 Vue 插件，使 Vite 支持 Vue 单文件组件
      vue(), 
      // 注册 Tailwind CSS 插件，使 Vite 支持 Tailwind CSS 处理
      tailwindcss(), 
      // 注册自动引入插件，自动按需引入 Vue、Pinia、Vue Router、Vue I18n 和 VueUse 等库
      autoImport({
        // 指定需要自动引入的库
        imports: ['vue', 'pinia', 'vue-router', 'vue-i18n', '@vueuse/core'],
        // 指定自动引入的类型声明文件路径，用于 TypeScript 类型提示
        dts: 'renderer/auto-imports.d.ts',
      })
    ],
    // CSS 相关配置
    css: {
      // 指定 CSS 转换器为 lightningcss，提升构建速度和兼容性
      transformer: 'lightningcss' as CSSOptions['transformer'],
    },
    // 构建相关配置
    build: {
      // 指定构建目标为 ES2022，确保兼容性
      target: 'es2022',
      // 指定静态资源目录为 'public'
      publicDir: 'public',
      // Rollup 打包配置
      rollupOptions: {
        // 多入口配置：指定三个 HTML 页面作为入口
        input: [
          resolve(__dirname, 'html/index.html'),   // 首页
          resolve(__dirname, 'html/setting.html'), // 设置页
          resolve(__dirname, 'html/dialog.html'),  // 弹窗页
        ]
      }
    },
    // 路径解析配置
    resolve: {
      // 设置路径别名，方便代码中引用
      alias: {
        '@common': resolve(__dirname, 'common'),
        '@renderer': resolve(__dirname, 'renderer'),
        '@main': resolve(__dirname, 'main'),
        '@locales': resolve(__dirname, 'locales'),
      }
    }
  }
});
