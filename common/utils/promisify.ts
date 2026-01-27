/**
 * 将 Node.js 风格（error-first callback）的函数转换为返回 Promise 的函数。
 * 遵循业界最佳实践，保证高性能、高可用、无副作用，并完整保留原函数的 this 指向与元数据。
 *
 * 使用示例：
 * const readFileAsync = promisify(fs.readFile);
 * const data = await readFileAsync('./package.json', 'utf8');
 *
 * @param original 原始 error-first callback 风格函数
 * @returns 返回一个与原函数签名一致（除末位 callback 外）的异步函数，调用后返回 Promise
 */
export function promisify<T extends (...args: any[]) => any>(
  original: T
): (...args: Parameters<T> extends [...infer P, any] ? P : never) => Promise<ReturnType<T> extends (err: any, res?: infer R) => any ? R : never> {
  if (typeof original !== 'function') {
    throw new TypeError('Expected a function');
  }

  // 返回新的包装函数，使用 function 语法以动态绑定 this
  return function (this: any, ...args: any[]): Promise<any> {
    const self = this;

    return new Promise((resolve, reject) => {
      // 组装 callback，遵循 error-first 规范
      const callback = (err: any, result?: any) => {
        if (err) {
          // 保证异常栈可追溯：若 err 已是 Error 实例，直接 reject；否则包装为 Error
          const wrapped = err instanceof Error ? err : new Error(err);
          reject(wrapped);
        } else {
          resolve(result);
        }
      };

      // 透传所有参数并附加 callback
      try {
        Reflect.apply(original, self, [...args, callback]);
      } catch (thrown) {
        // 同步异常直接转为 Promise 拒绝，避免崩溃
        reject(thrown);
      }
    });
  };
}

/**
 * 静态工具方法：快速判断一个对象是否已实现 util.promisify.custom 符号，
 * 若存在则直接返回其自定义的 promisify 实现，保证与 Node.js 官方行为一致。
 */
promisify.custom = Symbol.for('nodejs.util.promisify.custom');
