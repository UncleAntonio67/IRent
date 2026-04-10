# 文档维护规则

这份规则必须被后续开发者执行。否则这个仓库换机器后就会再次丢失上下文。

## 1. 文档目标

文档不是装饰，而是项目继续开发所需的最小上下文系统。

要求做到：

- 新机器拉代码后，不看聊天记录也能继续做
- 新接手的人能知道需求、架构、当前进度和历史取舍
- 每次改动后，文档状态和代码状态尽量同步

## 2. 必须维护的文档

### 永久文档

- `README.md`
- `docs/PROJECT_OVERVIEW.md`
- `docs/PRODUCT_REQUIREMENTS.md`
- `docs/TECH_ARCHITECTURE.md`
- `docs/IMPLEMENTATION_STATUS.md`
- `docs/PROJECT_HISTORY.md`
- `docs/DOC_MAINTENANCE.md`

### 什么时候必须更新

#### 改了需求

更新：

- `docs/PRODUCT_REQUIREMENTS.md`
- `docs/PROJECT_HISTORY.md`

#### 改了技术方案或工程结构

更新：

- `docs/TECH_ARCHITECTURE.md`
- `docs/PROJECT_HISTORY.md`

#### 改了页面实现或功能完成度

更新：

- `docs/IMPLEMENTATION_STATUS.md`
- `docs/PROJECT_HISTORY.md`

#### 改了启动方式、构建方式、目录结构

更新：

- `README.md`
- `docs/TECH_ARCHITECTURE.md`

## 3. 每次开发完成后的最低动作

每次提交前，至少执行：

1. 检查文档是否仍描述真实状态
2. 把新增功能写进 `IMPLEMENTATION_STATUS`
3. 把关键决策写进 `PROJECT_HISTORY`
4. 如果发现已有文档过时，立即修正

## 4. 记录风格

### 该写什么

- 为什么做
- 做了什么
- 当前做到哪里
- 还有什么没做
- 已知问题是什么
- 下一步建议是什么

### 不要只写什么

- 不要只写“优化了 UI”
- 不要只写“修复了一些问题”

而要写清楚：

- 优化的是哪个页面
- 改了哪类交互
- 现在还剩什么问题

## 5. 推荐更新方式

### 小改动

只更新：

- `docs/IMPLEMENTATION_STATUS.md`
- `docs/PROJECT_HISTORY.md`

### 中等改动

更新：

- `docs/IMPLEMENTATION_STATUS.md`
- `docs/PROJECT_HISTORY.md`
- 必要时 `README.md`

### 大改动

全部检查：

- `README.md`
- `docs/PRODUCT_REQUIREMENTS.md`
- `docs/TECH_ARCHITECTURE.md`
- `docs/IMPLEMENTATION_STATUS.md`
- `docs/PROJECT_HISTORY.md`

## 6. 当前最需要持续更新的内容

未来几轮开发里，最容易过期的是：

- 账务页和我的页真实完成度
- 乱码清理进度
- 结构管理页实际可用程度
- 路由问题是否已完全解决
- 是否已经引入正式后端

这些内容一有变化，就要写回文档。
