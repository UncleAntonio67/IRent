# Rent UniApp

微信小程序原型工程，目标是高保真复刻租房管理应用原型，并逐步从前端 demo 演进到可落地的多端应用。

这个仓库已经补充了长期维护文档，后续无论在哪台机器拉下代码，都应该先读下面这些文件：

- [项目总览](./docs/PROJECT_OVERVIEW.md)
- [产品需求与原型约束](./docs/PRODUCT_REQUIREMENTS.md)
- [技术架构与工程约定](./docs/TECH_ARCHITECTURE.md)
- [当前实现状态与已知问题](./docs/IMPLEMENTATION_STATUS.md)
- [历史决策与对话摘要](./docs/PROJECT_HISTORY.md)
- [文档维护规则](./docs/DOC_MAINTENANCE.md)

## 当前定位

- 当前仓库是 `Uni-app + Vue 3 + Tailwind CSS` 的微信小程序前端原型工程。
- 业务方向已经明确为：`职业房东 / 二房东自我记账管理`，不是面向租客的催缴系统。
- 现阶段主要是高保真原型和交互闭环验证，后端数据库与正式 API 还没有接入。

## 快速启动

```bash
npm install
npm run tw:build
npm run dev:mp-weixin
```

构建微信小程序：

```bash
npm run build:mp-weixin
```

产物目录：

- `dist/build/mp-weixin`

## 维护要求

后续每次改动代码时，必须同步更新以下内容：

1. `docs/IMPLEMENTATION_STATUS.md`
2. `docs/PROJECT_HISTORY.md`
3. 如果需求或架构发生变化，同时更新：
   - `docs/PRODUCT_REQUIREMENTS.md`
   - `docs/TECH_ARCHITECTURE.md`

不要只改代码不改文档。这个仓库后续会被拿到其它机器继续开发，文档必须能够单独支撑交接。
