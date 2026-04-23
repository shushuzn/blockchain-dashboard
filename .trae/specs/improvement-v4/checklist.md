# Checklist - 区块链仪表盘项目V4改进验证清单

## V4-T1: 安全增强与加固
- [ ] JWT Token黑名单正确实现（Redis存储）
- [ ] 登出时Token被加入黑名单
- [ ] CSP配置阻止XSS攻击
- [ ] Zod输入验证覆盖所有API端点
- [ ] Docker/docker-compose中无硬编码密钥
- [ ] 所有密钥从环境变量读取
- [ ] 安全审计日志记录所有敏感操作

## V4-T2: 测试覆盖率提升
- [ ] API集成测试覆盖率>70%
- [ ] GraphQL查询测试覆盖主要查询
- [ ] E2E测试覆盖关键用户流程
- [ ] 测试覆盖率阈值配置为70%
- [ ] CI中生成测试报告（JUnit XML格式）
- [ ] 测试报告上传到CI工件

## V4-T3: 前端错误追踪
- [ ] Sentry正确捕获Vue组件错误
- [ ] Web Vitals指标（LCP, FID, CLS）正常上报
- [ ] 性能仪表板显示关键指标
- [ ] 移动端错误被Sentry捕获
- [ ] Source map正确上传用于调试

## V4-T4: 基础设施完善
- [ ] Kubernetes deployment配置完整
- [ ] Service和Ingress配置正确
- [ ] ConfigMap和Secret正确管理配置
- [ ] 日志聚合配置（Fluentd/ELK）
- [ ] 分布式追踪配置（Jaeger）
- [ ] 备份脚本和恢复流程文档化

## V4-T5: 移动端完善
- [ ] 完整国际化覆盖所有界面
- [ ] 离线模式下数据正常显示
- [ ] 网络恢复后自动同步
- [ ] Sentry捕获移动端崩溃
- [ ] 后台任务正确处理

## V4-T6: 文档完善
- [ ] ADR记录关键架构决策
- [ ] 开发指南包含环境设置
- [ ] 部署文档包含Kubernetes说明
- [ ] 安全策略文档完整
