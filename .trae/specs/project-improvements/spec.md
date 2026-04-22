# Blockchain Dashboard 项目改进建议规格

## Why

项目已完成基础架构搭建（Vue3前端 + Node.js后端 + SQLite），但存在以下需要改进的领域：
- 性能优化：缺少缓存层，高频API调用浪费资源
- 功能完善：Vue3组件部分完成但未集成
- 文档更新：README仍描述旧版单文件架构
- 监控扩展：DeFi协议覆盖不足

## What Changes

### 建议列表（按优先级排序）

| 角度 | 建议 | 优先级 | 难度 | 原因 |
|------|------|--------|------|------|
| **性能** | 后端Redis缓存层实现 | P0 | ⭐⭐⭐⭐ | 当前无缓存，高频请求浪费资源 |
| **功能** | Vue3组件功能完善和测试 | P0 | ⭐⭐⭐⭐ | 部分组件未完成集成和测试 |
| **文档** | 重写README反映当前架构 | P1 | ⭐⭐⭐ | 文档与实际架构不符 |
| **监控** | 添加Aave/Curve等DeFi监控 | P1 | ⭐⭐⭐ | 扩展监控覆盖范围 |
| **错误处理** | API错误处理和重试机制 | P1 | ⭐⭐⭐ | 网络异常处理不足 |
| **代码质量** | TypeScript迁移 | P2 | ⭐⭐⭐⭐ | 提升类型安全 |
| **离线能力** | PWA支持和离线缓存 | P2 | ⭐⭐⭐ | 无PWA支持 |

### 核心改进任务

1. **Redis缓存层** (最难)
   - 添加Redis依赖和配置
   - 实现缓存服务（价格数据、链数据缓存）
   - 添加缓存失效策略
   - 更新API使用缓存

2. **Vue3功能完善**
   - 完成告警模态框和设置面板集成
   - 添加Lido/Aave等监控视图
   - 编写组件单元测试
   - 集成测试E2E

3. **README更新**
   - 重写项目介绍
   - 更新架构图
   - 添加部署说明
   - 添加API文档

4. **DeFi监控扩展**
   - 添加Lido TVL显示（已部分完成）
   - 添加Aave/Compound TVL监控
   - 添加Curve交易量监控

5. **错误处理增强**
   - API请求重试机制
   - 错误边界组件
   - 用户友好的错误提示

## Impact

### 受影响的规格
- 前端架构规格
- 后端API规格
- 数据持久化规格

### 受影响的代码
- `backend/src/services/` - 缓存服务
- `src/webapp/src/components/` - Vue组件
- `README.md` - 项目文档
- `backend/src/routes/` - API路由

## ADDED Requirements

### Requirement: Redis缓存层

#### Scenario: API缓存命中
- **WHEN** 前端请求 `/api/history` 或 `/api/lido`
- **THEN** 后端检查Redis缓存
- **IF** 缓存命中且未过期 **THEN** 直接返回缓存数据
- **IF** 缓存未命中 **THEN** 从源获取数据，存入缓存，返回数据

#### Scenario: 缓存失效
- **WHEN** 缓存数据过期（TTL到期）
- **THEN** 自动从源重新获取数据
- **AND** 更新缓存

### Requirement: README文档更新

#### Scenario: 新用户访问
- **WHEN** 新用户访问GitHub仓库
- **THEN** README清晰展示项目架构
- **AND** 提供快速开始指南
- **AND** 列出所有功能特性

### Requirement: DeFi协议监控

#### Scenario: 查看DeFi TVL
- **WHEN** 用户访问DeFi监控页面
- **THEN** 显示Lido、Aave、Compound等协议的TVL
- **AND** 显示24小时变化趋势

## MODIFIED Requirements

### Requirement: 告警配置UI

Vue3 AlertModal组件已完成集成，需要添加：
- 告警触发测试功能
- 告警历史管理
- 告警统计展示

## REMOVED Requirements

无

## 技术债务清理

1. 移除未使用的TestComponent文件 ✅ 已完成
2. 清理冗余的console.log
3. 统一代码风格（ESLint配置）
4. 移除重复的样式定义