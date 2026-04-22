# Blockchain Dashboard 项目改进建议规格

## 项目现状 (2026-04-22)

### 已完成 ✅
- Redis缓存层实现（backend/src/config/redis.js, services/cache.js）
- DeFi监控组件（LidoView.vue, AaveView.vue）
- README文档重写
- 环境变量配置（系统级 + 项目级）
- GitHub推送认证配置

### 待改进领域
- 组件单元测试覆盖率 0%
- API重试机制缺失
- 无TypeScript类型支持
- 无PWA离线能力
- 生产环境运维能力不足

## 新增改进建议（按优先级）

### P0 最高优先级

| 角度 | 建议 | 难度 | 原因 |
|------|------|------|------|
| **质量保证** | 组件单元测试 | ⭐⭐⭐ | 代码覆盖不足，无法保证稳定性 |
| **稳定性** | API错误处理和重试 | ⭐⭐⭐ | 网络异常处理薄弱 |

### P1 中等优先级

| 角度 | 建议 | 难度 | 原因 |
|------|------|------|------|
| **代码质量** | TypeScript渐进迁移 | ⭐⭐⭐⭐ | 类型安全提升 |
| **用户体验** | PWA离线支持 | ⭐⭐⭐ | 移动端可用性差 |

### P2 较低优先级

| 角度 | 建议 | 难度 | 原因 |
|------|------|------|------|
| **运维监控** | 优雅停机和健康检查 | ⭐⭐ | 生产环境运维需求 |
| **安全加固** | 输入验证和安全头 | ⭐⭐ | 存在XSS风险 |

## 核心改进任务详情

### 1. 组件单元测试 (P0 - 质量保证)

**目标**: 提高代码质量保证，减少回归bug

**技术方案**:
- 使用 Vitest 作为测试框架（与Vite项目契合）
- Vue Test Utils 编写组件测试
- Mock API调用避免依赖外部服务
- 覆盖率目标：核心组件 80%+

**涉及文件**:
- `src/webapp/src/components/*.vue`
- `src/webapp/src/stores/*.js`
- `src/webapp/src/api/index.js`

### 2. API错误处理和重试 (P0 - 稳定性)

**目标**: 提升系统在网络异常情况下的健壮性

**技术方案**:
- axios 拦截器统一处理错误
- 指数退避重试机制（最大3次）
- ErrorBoundary 组件捕获渲染错误
- Toast 通知组件展示错误信息
- 后端统一错误响应格式 `{ error, message, code }`

**涉及文件**:
- `src/webapp/src/api/index.js`
- `src/webapp/src/components/ErrorBoundary.vue`
- `src/webapp/src/components/Toast.vue`
- `backend/src/utils/errors.js`

### 3. TypeScript渐进迁移 (P1 - 代码质量)

**目标**: 提升类型安全，减少运行时错误

**技术方案**:
- 配置 tsconfig.json
- 创建类型定义文件 types/
- 从工具函数和store开始迁移
- 组件采用 JSDoc + TypeScript 混合模式
- 使用 `@ts-check` 渐进启用严格检查

**涉及文件**:
- `tsconfig.json`
- `src/webapp/src/types/`
- `src/webapp/src/stores/*.ts`
- `backend/src/types/`

### 4. PWA离线支持 (P1 - 用户体验)

**目标**: 提升移动端可用性，支持离线查看

**技术方案**:
- vite-plugin-pwa 插件
- Service Worker 缓存策略
- manifest.json 配置
- 离线页面 fallback

**涉及文件**:
- `vite.config.js`
- `public/manifest.json`
- `src/sw.js`

### 5. 优雅停机和健康检查 (P2 - 运维)

**目标**: 支持生产环境零停机部署

**技术方案**:
- SIGTERM 信号处理
- 活跃请求完成后再退出
- /api/health 端点增强
- Docker healthcheck 配置

### 6. 输入验证和安全头 (P2 - 安全)

**目标**: 加固应用安全性

**技术方案**:
- express-validator 输入验证
- helmet 安全头完善
- CORS 严格配置
- XSS 防护

## 技术债务清理

1. ✅ Redis缓存层实现
2. ✅ DeFi组件创建
3. ✅ README重写
4. ✅ 环境变量安全配置
5. ⬜ 清理冗余console.log
6. ⬜ 统一组件样式规范
7. ⬜ 添加关键函数JSDoc
