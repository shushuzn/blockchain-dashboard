# ADR-001: 技术栈选择

**日期**: 2024-01-15
**状态**: 已接受

## 背景

我们需要为区块链Gas监控仪表盘选择技术栈。

## 决策

### 后端
- **运行时**: Node.js 18+
- **框架**: Express.js
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **ORM**: Sequelize
- **缓存**: Redis
- **GraphQL**: Apollo Server 4
- **认证**: JWT with bcrypt

### 前端
- **框架**: Vue 3 (Composition API)
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **国际化**: vue-i18n
- **图表**: Lightweight Charts
- **构建**: Vite

### 移动端
- **框架**: React Native (Expo)
- **路由**: Expo Router
- **状态管理**: Zustand

## 理由

1. **Express.js**: 轻量、灵活、社区成熟
2. **Vue 3**: 组合式API易于测试和维护
3. **Apollo Server 4**: 支持REST和GraphQL共存
4. **Pinia**: Vue官方推荐，比Vuex更轻量
5. **Expo**: 简化React Native开发流程

## 后果

### 正面
- 统一JavaScript语言栈
- 快速原型开发
- 良好的TypeScript支持

### 负面
- 单线程限制
- 需要额外的微服务架构支持大规模扩展
