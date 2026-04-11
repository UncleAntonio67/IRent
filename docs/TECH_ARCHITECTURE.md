# 技术架构与工程约定

最后更新日期：2026-04-11

## 1. 目标技术路线

### 前端

- `Vue 3`
- `Uni-app`
- `Tailwind CSS`

当前目标是：

- 一套代码优先编译到微信小程序
- H5 作为辅助预览和开发验证

### 后端规划

未来目标架构：

- `Node.js`
- `Express` 或 `NestJS`
- `RESTful API`
- `MySQL`
- `Prisma ORM`

### 文件存储规划

- `Cloudflare R2`

未来主要存储对象：

- 身份证图片
- 合同文件
- 收款凭证
- 抄表图片
- 房屋图片

## 2. 当前仓库的真实状态

当前仓库仍然是前端高保真原型，不是正式前后端分离系统。

已经具备：

- 前端页面原型
- 本地 mock 数据
- 本地持久化
- 领域模型与页面写操作封装
- 小程序构建与兼容性修补

当前还没有：

- 正式后端 API
- MySQL / Prisma
- 真正对象存储上传
- 登录鉴权
- 多租户

## 3. 当前核心页面结构

路由定义在：

- `src/pages.json`

当前主要页面：

- `pages/workbench/index`
- `pages/block/detail`
- `pages/room/detail`
- `pages/room/checkin`
- `pages/bills/index`
- `pages/profile/index`

其中与房间经营最相关的两条主路径已经稳定为：

1. 楼栋页点空房，直接进入办理入住页
2. 楼栋页点非空房，打开完整房间详情抽屉

## 4. 当前关键代码模块

### 数据与领域层

- `src/data/rentStore.js`
- `src/domain/rent-models.js`
- `src/domain/rent-room-service.js`
- `src/domain/rent-api-mappers.js`

职责划分：

- `rentStore.js`
  - 本地持久化
  - mock 场景数据
  - 页面查询入口
- `rent-models.js`
  - 稳定数据模型
  - 格式化与默认值
- `rent-room-service.js`
  - 房间级写操作
  - 收租、附加收费、抄表、附件、入住、退租
- `rent-api-mappers.js`
  - 面向未来后端的数据映射

### 页面与展示层

- `src/components/RoomDetailSheet.vue`
- `src/components/OccupancyTimeline.vue`
- `src/pages/room/checkin.vue`
- `src/pages/block/detail.vue`

当前状态：

- `RoomDetailSheet.vue` 是房间经营主视图
- `room/detail.vue` 已复用抽屉详情实现
- `room/checkin.vue` 是空置房办理入住页
- `OccupancyTimeline.vue` 负责历史入住时间轴

### 通用能力

- `src/utils/navigation.js`
- `src/utils/layout.js`
- `src/components/BottomDrawer.vue`
- `src/components/InnerDrawer.vue`

职责：

- 路由节流
- 防重复跳转
- 安全返回
- 头部高度 / 安全区读取
- 抽屉容器与弹层统一

## 5. 当前房间页的信息架构

### 房间详情页

当前已统一为：

- `当前情况`
- `历史入住`

`当前情况` 内的稳定模块：

- 房间概况
- 当前租客
- 租金收费
- 附加收费
- 收费明细

其中：

- `房间概况` 与 `当前租客` 已支持折叠
- `租金收费` 与 `附加收费` 都采用表格式台账布局
- `收费明细` 默认折叠

### 办理入住页

当前也统一为：

- `当前情况`
- `历史入住`

`当前情况` 当前结构：

- 房间概况
- 当前租客
- 租金与租期

其中：

- 房间概况与当前租客已支持折叠
- 日期选择改为自定义弹层
- 租期结束日不手选，按开始日期 + 月数自动推算

## 6. 真实收费模型

当前实现已经不再只依赖“账期已付 / 未付”。

### 租金

已支持：

- 按合同生成理论账期
- 一期多次收费
- 部分收费
- 补收
- 上传凭证

页面表达方式：

- 一个总收费进度条
- 一张账期表
- 每期显示应收 / 已收 / 状态 / 操作

### 附加收费

当前已统一纳入：

- 水费
- 电费
- 燃汽
- 供暖

规则：

- 水费、电费支持抄表生成应收
- 也支持直接收费
- 燃汽、供暖走手动收费
- 全部支持上传凭证

## 7. 小程序兼容性约束

### WXSS 兼容性

微信小程序对部分 Tailwind 产物不兼容，因此当前工程仍依赖：

- `src/tailwind.generated.css`
- `scripts/sanitize-mp-weixin-wxss.cjs`
- `scripts/postprocess-mp-build.cjs`

需要继续避免：

- 复杂转义类名
- 小程序不支持的复杂选择器
- 依赖浏览器伪元素的样式方案

### 系统信息读取

系统信息读取已经统一收口到：

- `src/utils/layout.js`

规则：

- 优先 `uni.getWindowInfo`
- 回退 `uni.getSystemInfoSync`

## 8. 测试与校验

当前已补的工程校验：

- `npm run build:mp-weixin`
- `npm run build:h5`
- `npm run test:domain`
- `npm run verify:encoding`

其中：

- `tests/domain.test.js` 覆盖领域层核心链路
- `scripts/verify-encoding.cjs` 用于扫描编码污染

## 9. 当前开发约定

### 页面修改约定

1. 优先保证微信小程序可用性
2. 再收原型还原度
3. 再做 H5 辅助表现

### 文档约定

每次重要结构或交互变化后，都要同步更新：

- `docs/IMPLEMENTATION_STATUS.md`
- `docs/PROJECT_HISTORY.md`
- `docs/TECH_ARCHITECTURE.md`

### 当前推荐后续方向

1. 继续把折叠卡头抽成公共小组件
2. 继续统一底部双按钮 footer 样式
3. 在不改原型功能的前提下继续压缩页面长度
4. 再推进后端 API 边界落地
