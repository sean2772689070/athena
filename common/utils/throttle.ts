/**
 * 节流（throttle）配置接口
 */
export interface ThrottleOptions {
  /**
   * 如果为 true，允许在周期开始（leading 边缘）执行一次。
   * @default true
   */
  leading?: boolean;
  /**
   * 如果为 true，允许在周期结束（trailing 边缘）再执行一次。
   * @default true
   */
  trailing?: boolean;
}

/**
 * 经过节流包装后的函数类型
 * 调用签名与原函数一致，但额外提供 cancel 方法以取消尚未执行的调用
 */
export interface ThrottledFn<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  /**
   * 取消当前待执行的函数调用
   */
  cancel: () => void;
}

/**
 * 创建一个节流函数，该函数在指定时间 `wait` 毫秒内最多执行一次。
 * 可通过配置项决定是否在周期开始（leading）与结束（trailing）执行。
 *
 * @param fn 需要节流的原始函数
 * @param wait 节流的毫秒数
 * @param options 配置项
 * @returns 返回包装后的节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
  options: ThrottleOptions = {}
): ThrottledFn<T> {
  // 解构配置项，默认 leading 与 trailing 均开启
  const { leading = true, trailing = true } = options;
  // 保存 setTimeout 返回的定时器 ID
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  // 记录上次执行时间点
  let lastExec = 0;

  // 生成真正的节流函数
  const throttled = function(this: any, ...args: Parameters<T>) {
    const context = this;
    const now = Date.now();

    // 首次调用且禁用 leading 时，将 lastExec 设为当前时间，避免立即执行
    if (!lastExec && !leading) {
      lastExec = now;
    }

    // 计算距离下次可执行还需等待多久
    const remaining = wait - (now - lastExec);

    if (remaining <= 0 || remaining > wait) {
      // 已到可执行时间点，立即执行
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastExec = now;
      fn.apply(context, args);
    } else if (!timeoutId && trailing) {
      // 尚未到执行时间点，且允许 trailing 执行，则设置定时器在剩余时间后执行
      timeoutId = setTimeout(() => {
        // 若允许 leading，则更新 lastExec 为当前时间；否则重置为 0
        lastExec = leading ? Date.now() : 0;
        timeoutId = null;
        fn.apply(context, args);
      }, remaining);
    }
  };

  // 附加 cancel 方法，用于手动取消尚未执行的调用，并重置状态
  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastExec = 0;
  };

  return throttled as ThrottledFn<T>;
}
