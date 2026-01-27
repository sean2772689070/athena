/**
 * 防抖（debounce）配置接口
 */
export interface DebounceOptions {
  /**
   * 如果为 true，则在首次触发时立即执行函数（leading 边缘），而非最后一次触发后的延迟执行（trailing 边缘）。
   * @default false
   */
  immediate?: boolean;
}

/**
 * 经过防抖包装后的函数类型
 * 调用签名与原函数一致，但额外提供 cancel 方法以取消尚未执行的调用
 */
export interface DebouncedFn<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  /**
   * 取消当前待执行的函数调用
   */
  cancel: () => void;
}

/**
 * 创建一个防抖函数，该函数会在连续调用停止后等待 `wait` 毫秒再执行。
 * 如果在等待期间再次调用，则重新计时。
 *
 * @param fn 需要防抖的原始函数
 * @param wait 延迟执行的毫秒数
 * @param options 配置项
 * @returns 返回包装后的防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
  options: DebounceOptions = {}
): DebouncedFn<T> {
  // 保存 setTimeout 返回的定时器 ID，用于后续清除
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  // 解构配置项，默认不立即执行
  const { immediate = false } = options;

  // 生成真正的防抖函数
  const debounced = function(this: any, ...args: Parameters<T>) {
    const context = this;

    // 若已存在定时器，则先清除，实现“重新计时”
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (immediate) {
      // 立即执行模式：第一次触发时立即执行，后续触发需等待 wait 时间结束
      const callNow = !timeoutId; // 当前无定时器表示首次触发
      timeoutId = setTimeout(() => {
        timeoutId = null; // 等待结束，允许下一次立即执行
      }, wait);
      if (callNow) {
        fn.apply(context, args);
      }
    } else {
      // 默认模式：最后一次触发后等待 wait 毫秒再执行
      timeoutId = setTimeout(() => {
        fn.apply(context, args);
      }, wait);
    }
  };

  // 附加 cancel 方法，用于手动取消尚未执行的调用
  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced as DebouncedFn<T>;
}
