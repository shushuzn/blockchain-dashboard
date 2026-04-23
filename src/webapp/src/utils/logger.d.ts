export interface Logger {
  debug(message: string, meta?: Record<string, any>): void
  info(message: string, meta?: Record<string, any>): void
  warn(message: string, meta?: Record<string, any>): void
  error(message: string, meta?: Record<string, any>): void
  setLevel(level: string): void
  getLevel(): string
}

export function getLogger(name?: string): Logger

export default getLogger