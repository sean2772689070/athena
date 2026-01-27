// 引入第三方日志库 electron-log，用于在 Electron 应用中记录日志
import log from 'electron-log';
// 引入 Electron 的 app 模块（获取应用路径）和 ipcMain 模块（主进程 IPC 通信）
import {app, ipcMain} from 'electron';
// 引入 Node.js 的 path 模块，用于拼接文件路径
import * as path from 'path';
// 引入 Node.js 的 fs 模块，用于文件系统操作
import * as fs from 'fs';
import { promisify } from 'util';
import { IPC_EVENTS } from '@common/constants';

const readdirASync = promisify(fs.readdir);
const statASync = promisify(fs.stat);
const unlinkASync = promisify(fs.unlink);

/**
 * 日志服务类（单例模式）
 * 负责初始化日志目录并配置 electron-log 的文件输出路径
 */
class LogService {
    // 静态私有变量，保存单例实例
    private static _instance: LogService;

    /**
     * 日志保留天数常量
     * 用于指定清理旧日志时保留最近多少天的日志文件
     * 默认值为 7 天，超过此天数的日志文件将被删除
     */
    private LOG_RETENTION_DAYS = 7;

    /**
     * 日志清理间隔时间（毫秒）
     * 用于定时清理旧日志文件的时间间隔
     * 默认值为 24 小时（24 * 60 * 60 * 1000 毫秒）
     * 设置为 readonly 表示该值不可被修改
     */
    private readonly CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24小时

    /**
     * 私有构造函数，防止外部直接 new 实例
     * 在首次调用时自动创建日志目录，并按日期生成日志文件
     */
    private constructor() {
        // 拼接日志目录路径：用户数据目录下的 logs 文件夹
        const logPath = path.join(app.getPath('userData'), 'logs');

        // 尝试创建日志目录，若不存在则新建
        try{
            if(!fs.existsSync(logPath)){
                fs.mkdirSync(logPath);
            }
        }catch(err){
            // 若创建失败，在控制台打印错误信息
            this.error('Failed to create log directory:', err);
        }

        /**
         * 配置 electron-log 的文件传输路径
         * 每天生成一个新的日志文件，文件名格式：log-YYYY-MM-DD.log
         */
        log.transports.file.resolvePathFn = () => {
            const today = new Date();
            // 格式化日期：年-月-日，月份和日期补零
            const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 
            1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            // 返回完整的日志文件路径
            return path.join(logPath, `log-${formattedDate}.log`);
        }

        // 设置日志文件的输出格式模板
        // 格式说明：
        // {y}  四位数年份（如 2024）
        // {m}  两位数月份（01-12）
        // {d}  两位数日期（01-31）
        // {h}  两位数小时（00-23）
        // {i}  两位数分钟（00-59）
        // {s}  两位数秒（00-59）
        // {ms} 三位数毫秒（000-999）
        // {level} 日志级别（如 info、warn、error）
        // {text} 实际的日志内容
        // 示例输出：[2024-05-18 14:30:45.123] [info] 应用启动成功
        log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';

        log.transports.file.maxSize = 1024 * 1024 * 10; // 10MB

        log.transports.file.level = 'debug';

        this.info('LogService initialized successfully');

        this._cleanupOldLogs();
        // 定时任务：每天凌晨 1 点执行一次日志清理
        setInterval(() => this._cleanupOldLogs(), this.CLEANUP_INTERVAL_MS);
    }
    /**
     * 私有方法：初始化 IPC 主进程事件监听
     * 负责注册来自渲染进程的日志写入请求，将日志转发到本地文件
     * 通过预定义的 IPC_EVENTS 常量匹配不同级别的日志
     */
    private _setupIpcEvent() {
        // 监听渲染进程发送的 DEBUG 级别日志
        // 参数 _e 为 IpcMainEvent，此处用下划线表示不使用
        // message 为日志正文，...meta 为可选附加信息（任意类型）
        ipcMain.on(IPC_EVENTS.LOG_DEBUG, (_e, message: string, ...meta: any[]) =>
            this.debug(message, ...meta));

        // 监听 INFO 级别日志
        ipcMain.on(IPC_EVENTS.LOG_INFO, (_e, message: string, ...meta: any[]) =>
            this.info(message, ...meta));

        // 监听 WARN 级别日志
        ipcMain.on(IPC_EVENTS.LOG_WARN, (_e, message: string, ...meta: any[]) =>
            this.warn(message, ...meta));

        // 监听 ERROR 级别日志
        ipcMain.on(IPC_EVENTS.LOG_ERROR, (_e, message: string, ...meta: any[]) =>
            this.error(message, ...meta));
    }

    /**
     * 私有方法：重写控制台日志函数
     * 将 console.debug / console.log / console.info / console.warn / console.error
     * 全部重定向到 electron-log 对应级别，确保控制台输出也能落盘
     */
    private _rewriteConsoleLog() {
        // 将原生 console.debug 映射到 electron-log 的 debug 级别
        console.debug = log.debug;
        // 将原生 console.log 与 console.info 映射到 electron-log 的 info 级别
        console.log = log.info;
        console.info = log.info;
        // 将原生 console.warn 映射到 electron-log 的 warn 级别
        console.warn = log.warn;
        // 将原生 console.error 映射到 electron-log 的 error 级别
        console.error = log.error;
    }

    /**
     * 私有异步方法：清理过期日志文件
     * 根据 LOG_RETENTION_DAYS 配置，仅保留最近 N 天的 .log 文件
     * 遍历日志目录，删除创建时间早于过期时间的文件
     */
    private async _cleanupOldLogs() {
        try {
            // 获取日志目录完整路径
            const logPath = path.join(app.getPath('userData'), 'logs');

            // 若日志目录不存在，直接返回，避免后续逻辑报错
            if (!fs.existsSync(logPath)) return;

            // 获取当前时间
            const now = new Date();
            // 计算过期时间点：当前时间 - 保留天数对应的毫秒数
            const expirationDate = new Date(
                now.getTime() - this.LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000
            );

            // 异步读取日志目录下所有文件/文件夹名称
            const files = await readdirASync(logPath);

            // 记录本次清理删除的文件数量
            let deletedCount = 0;

            // 遍历所有文件
            for (const file of files) {
                // 仅处理以 .log 结尾的文件，其余跳过
                if (!file.endsWith('.log')) continue;

                // 拼接完整文件路径
                const filePath = path.join(logPath, file);

                try {
                    // 获取文件状态信息
                    const stats = await statASync(filePath);
                    // 若是文件且创建时间早于过期时间，则执行删除
                    if (stats.isFile() && stats.birthtime < expirationDate) {
                        await unlinkASync(filePath);
                        deletedCount++;
                    }
                } catch (err) {
                    // 单个文件删除失败时记录错误，不影响后续文件处理
                    this.error('Failed to cleanup old log file:', filePath, err);
                }
            }

            // 若有文件被删除，记录清理结果
            if (deletedCount > 0) {
                this.info(`Successfully cleaned up ${deletedCount} old log files.`);
            }
        } catch (err) {
            // 整个清理流程异常时记录错误
            this.error('Failed to cleanup old logs:', err);
        }
    }
    /**
     * 静态公共方法，获取单例实例
     * 若实例不存在则新建，存在则直接返回
     */
    public static getInstance(): LogService {
        if (!this._instance) {
            this._instance = new LogService();
        }
        return this._instance;
    }


    /**
     * 公共方法，记录 debug 级别的日志
     * @param message 日志内容
     */
    public debug(message: string, ...meta: any[]) {
        log.debug(message, ...meta);
    }

    /**
     * 公共方法，记录 info 级别的日志
     * @param message 日志内容
     */
    public info(message: string, ...meta: any[]) {
        log.info(message, ...meta);
    }

    /**
     * 公共方法，记录 warn 级别的日志
     * @param message 日志内容
     */
    public warn(message: string, ...meta: any[]) {
        log.warn(message, ...meta);
    }

    /**
     * 公共方法，记录 error 级别的日志
     * @param message 日志内容
     */
    public error(message: string, ...meta: any[]) {
        log.error(message, ...meta);
    }
}

// 导出单例实例，供其他模块直接使用
export const logManager = LogService.getInstance();

// 默认导出单例实例
export default logManager;