const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  SILENT: 4,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;
type LogLevelValue = (typeof LOG_LEVELS)[LogLevel];

let currentLevel: LogLevelValue = LOG_LEVELS.INFO;
const isProduction = import.meta.env.PROD;

// 从环境变量初始化日志级别
const envLevel = import.meta.env.VITE_LOG_LEVEL as string;
if (envLevel) {
  currentLevel = LOG_LEVELS[envLevel.toUpperCase() as LogLevel] || LOG_LEVELS.INFO;
}

function formatMessage(level: string, message: string, meta: Record<string, unknown> = {}): string {
  const timestamp = new Date().toISOString();
  const levelStr = level.padEnd(5);
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] ${levelStr} ${message}${metaStr}`;
}

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  setLevel(level: string): void;
  getLevel(): string;
}

export function getLogger(name?: string): Logger {
  return {
    debug(message: string, meta: Record<string, unknown> = {}) {
      if (currentLevel >= LOG_LEVELS.DEBUG && !isProduction) {
        console.log(formatMessage('DEBUG', message, { ...meta, component: name }));
      }
    },

    info(message: string, meta: Record<string, unknown> = {}) {
      if (currentLevel >= LOG_LEVELS.INFO) {
        console.log(formatMessage('INFO', message, { ...meta, component: name }));
      }
    },

    warn(message: string, meta: Record<string, unknown> = {}) {
      if (currentLevel >= LOG_LEVELS.WARN) {
        console.warn(formatMessage('WARN', message, { ...meta, component: name }));
      }
    },

    error(message: string, meta: Record<string, unknown> = {}) {
      if (currentLevel >= LOG_LEVELS.ERROR) {
        console.error(formatMessage('ERROR', message, { ...meta, component: name }));
      }
    },

    setLevel(level: string) {
      const levelKey = level.toUpperCase() as LogLevel;
      if (LOG_LEVELS[levelKey] !== undefined) {
        currentLevel = LOG_LEVELS[levelKey];
      }
    },

    getLevel(): string {
      return (
        Object.keys(LOG_LEVELS).find((key) => LOG_LEVELS[key as LogLevel] === currentLevel) ||
        'INFO'
      );
    },
  };
}

export default getLogger;
