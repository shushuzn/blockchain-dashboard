# Tasks - Blockchain Dashboard 项目改进

## 优先级 P0（最高）- 最难和最重要的任务

### [ ] Task 1: 后端Redis缓存层实现
**描述**: 实现Redis缓存层，减少高频API调用，提高性能

- [ ] Task 1.1: 添加Redis依赖到backend/package.json
- [ ] Task 1.2: 创建Redis连接配置 (backend/src/config/redis.js)
- [ ] Task 1.3: 实现缓存服务 (backend/src/services/cache.js)
  - 价格数据缓存（TTL: 60秒）
  - 链数据缓存（TTL: 30秒）
  - Lido TVL缓存（TTL: 5分钟）
- [ ] Task 1.4: 在API路由中集成缓存
- [ ] Task 1.5: 添加缓存失效机制
- [ ] Task 1.6: 编写缓存服务测试

### [ ] Task 2: Vue3组件功能完善和测试
**描述**: 完善Vue3组件功能，添加单元测试和E2E测试

- [ ] Task 2.1: 完成AlertModal组件集成到ChainMonitor
- [ ] Task 2.2: 完成SettingsModal组件集成
- [ ] Task 2.3: 创建Lido监控组件 (LidoView.vue)
- [ ] Task 2.4: 在App.vue中注册LidoView路由
- [ ] Task 2.5: 编写Vue组件单元测试 (Vitest)
- [ ] Task 2.6: 编写E2E测试覆盖关键流程

## 优先级 P1（中等）

### [ ] Task 3: README文档更新
**描述**: 重写README反映当前架构（Vue3 + Node.js后端）

- [ ] Task 3.1: 更新项目介绍和特性列表
- [ ] Task 3.2: 创建新的架构图（ASCII）
- [ ] Task 3.3: 添加快速开始指南
- [ ] Task 3.4: 添加部署说明（GitHub Pages + Railway）
- [ ] Task 3.5: 添加API文档
- [ ] Task 3.6: 添加贡献指南

### [ ] Task 4: DeFi协议监控扩展
**描述**: 添加更多DeFi协议的TVL监控

- [ ] Task 4.1: 完善Lido TVL显示组件
- [ ] Task 4.2: 创建Aave TVL服务 (backend/src/services/aave.js)
- [ ] Task 4.3: 创建Aave API路由
- [ ] Task 4.4: 创建Aave监控组件
- [ ] Task 4.5: 创建DeFi总览仪表板

### [ ] Task 5: API错误处理和重试机制
**描述**: 增强API错误处理，提供更好的用户体验

- [ ] Task 5.1: 在前端添加API请求拦截器
- [ ] Task 5.2: 实现指数退避重试机制
- [ ] Task 5.3: 创建ErrorBoundary组件
- [ ] Task 5.4: 添加用户友好的错误提示Toast
- [ ] Task 5.5: 后端添加统一错误响应格式

## 优先级 P2（较低）

### [ ] Task 6: TypeScript迁移
**描述**: 迁移Vue3组件到TypeScript

- [ ] Task 6.1: 配置TypeScript (tsconfig.json)
- [ ] Task 6.2: 创建类型定义文件
- [ ] Task 6.3: 迁移store到TypeScript
- [ ] Task 6.4: 迁移API模块到TypeScript
- [ ] Task 6.5: 迁移Vue组件到TypeScript (渐进式)

### [ ] Task 7: PWA支持和离线缓存
**描述**: 添加PWA支持，实现部分功能离线使用

- [ ] Task 7.1: 配置Vite PWA插件
- [ ] Task 7.2: 创建Service Worker
- [ ] Task 7.3: 配置缓存策略
- [ ] Task 7.4: 添加PWA清单文件
- [ ] Task 7.5: 测试离线功能

### [ ] Task 8: 代码质量改进
**描述**: 提升代码质量和一致性

- [ ] Task 8.1: 配置ESLint和Prettier
- [ ] Task 8.2: 清理冗余console.log
- [ ] Task 8.3: 统一组件样式
- [ ] Task 8.4: 添加JSDoc注释

# 任务依赖关系

```
Task 1 (Redis缓存) 
  └─> Task 5.1 (API拦截器) 需要缓存配合

Task 2 (Vue3组件) 
  ├─> Task 3 (README) 完成后更新文档
  └─> Task 4 (DeFi监控) 需要组件基础

Task 6 (TypeScript) 
  └─> Task 2 完成后进行

Task 7 (PWA) 
  └─> Task 1, 2 完成后进行
```

# 预估工作量

- Task 1 (Redis缓存): 3-4小时
- Task 2 (Vue3组件): 4-5小时
- Task 3 (README更新): 2小时
- Task 4 (DeFi监控): 3小时
- Task 5 (错误处理): 2小时
- Task 6 (TypeScript): 6-8小时
- Task 7 (PWA): 3-4小时
- Task 8 (代码质量): 1-2小时

**总计**: 约24-30小时