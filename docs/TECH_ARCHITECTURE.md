# 技术架构与工程约定

## 1. 目标技术路线

### 前端

- `Vue 3`
- `Uni-app`
- `Tailwind CSS`

目标：

- 一套代码优先编译到微信小程序
- 兼容 H5 作为辅助预览

### 后端规划

未来目标架构：

- `Node.js`
- `Express` 或 `NestJS`
- `RESTful API`
- `MySQL`
- `Prisma ORM`

### 文件存储规划

- 对象存储：`Cloudflare R2`
- 未来存储对象：
  - 身份证照片
  - 合同文件
  - 收款凭证
  - 表计照片
  - 房间资产图片

## 2. 当前仓库实际状态

当前仓库并未接入正式后端，实际情况是：

- 只有前端原型工程
- 数据主要来自 `src/data/rentStore.js`
- 已实现本地存储持久化
- 没有 MySQL
- 没有 Prisma
- 没有真实 API 层
- 没有真实登录鉴权

也就是说，当前是：

- `前端高保真原型 + mock 数据 + 本地持久化`

不是：

- `正式前后端分离生产系统`

## 3. 当前页面结构

### 路由

定义在：

- `src/pages.json`

当前页面：

- `pages/workbench/index`
- `pages/block/detail`
- `pages/room/detail`
- `pages/room/checkin`
- `pages/bills/index`
- `pages/profile/index`

### tabBar

当前已经回退使用原生小程序 `tabBar`，原因是：

- 自绘 tabBar 虽然更自由，但切页性能和稳定性较差
- 原生 `switchTab` 更适合当前小程序体验要求

## 4. 关键代码模块

### 状态与 mock 数据

- `src/data/rentStore.js`

负责：

- 房产树结构
- 房间状态
- 账单与抄表 mock 数据
- 历史入住情况
- 本地存储持久化

### 路由保护

- `src/utils/navigation.js`

负责：

- 页面跳转节流
- 防重复点击
- 安全返回

### 公共组件

- `src/components/BottomDrawer.vue`
- `src/components/InnerDrawer.vue`
- `src/components/OccupancyTimeline.vue`
- `src/components/AppTabBar.vue`

说明：

- `AppTabBar.vue` 曾用于自绘 tabbar，但当前主导航已回归原生 tabBar，后续是否继续保留可再评估。

### 样式体系

- `src/tailwind.css`
- `src/tailwind.generated.css`
- `src/styles/utilities.css`

当前采用方式：

- Tailwind 生成基础原子类
- `utilities.css` 放微信小程序安全类和项目级组件类

## 5. 微信小程序特殊约束

这是当前工程里非常重要的一部分。

### WXSS 兼容约束

微信小程序对部分 Tailwind 产物不兼容，因此必须避免：

- 带反斜杠的选择器
- `space-y-*`
- `divide-y`
- `::-webkit-scrollbar`
- `:not(...)`
- 某些复杂伪元素与伪类

### 已做的构建后处理

脚本：

- `scripts/sanitize-mp-weixin-wxss.cjs`
- `scripts/postprocess-mp-build.cjs`

用途：

- 清理不兼容 WXSS 片段
- 规避小程序编译报错

### 原生 API 警告

当前项目里仍存在 `wx.getSystemInfoSync` 使用。

这是已知技术债：

- 目前主要用于状态栏高度计算
- 后续建议替换为：
  - `wx.getWindowInfo`
  - `wx.getDeviceInfo`
  - `wx.getAppBaseInfo`

## 6. 数据持久化现状

### 当前已实现

- `properties` 本地持久化
- 全局水电配置本地持久化
- 提醒配置本地持久化

### 当前未实现

- 后端数据库持久化
- 多设备同步
- 多用户隔离

## 7. 后续推荐落地架构

当进入正式开发阶段时，建议新增这些目录：

- `server/`
- `prisma/`
- `docs/api/`

建议优先落地的后端模块：

1. 认证与租户模型
2. 房产结构管理 API
3. 租约与账单 API
4. 对象存储上传签名接口
5. 历史流水与导出接口

## 8. 开发约定

### 每次改动后必须做

1. 更新 `docs/IMPLEMENTATION_STATUS.md`
2. 更新 `docs/PROJECT_HISTORY.md`
3. 若需求变更，更新 `docs/PRODUCT_REQUIREMENTS.md`
4. 若工程结构或技术方案变更，更新 `docs/TECH_ARCHITECTURE.md`

### 页面改动原则

- 优先保证微信小程序可用性
- 再追求高保真视觉
- 再考虑 H5 效果

### 文案原则

- 中文文案必须统一，避免乱码
- 不要残留“返”“关”等不符合小程序习惯的按钮文案
