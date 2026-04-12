# 技术架构与工程约定

最后更新日期：2026-04-12

## 1. 技术路线

### 前端

- `Vue 3`
- `Uni-app`
- `Tailwind CSS`

当前目标端：

- 微信小程序优先
- H5 仅用于辅助调试与构建验证

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
- 抄表照片
- 房屋图片

## 2. 当前仓库真实状态

当前仓库仍然是前端高保真原型，不是正式前后端分离系统。

已具备：

- 页面原型与核心交互
- 本地 mock 数据
- 本地持久化
- 领域模型与页面写操作封装
- 微信小程序构建与兼容性修补
- 统一的居中弹层体系

尚未具备：

- 正式后端 API
- MySQL / Prisma 落库
- 真实对象存储上传
- 登录鉴权
- 多租户

## 3. 当前核心模块

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
  - 规范化与默认值
- `rent-room-service.js`
  - 收租
  - 附加收费
  - 抄表
  - 入住
  - 退租
  - 附件与房屋图片写操作
- `rent-api-mappers.js`
  - 面向未来后端的数据映射

### 页面与组件层

- `src/components/RoomDetailSheet.vue`
- `src/components/CheckInSheet.vue`
- `src/components/OccupancyTimeline.vue`
- `src/pages/workbench/index.vue`
- `src/pages/block/detail.vue`
- `src/pages/bills/index.vue`
- `src/pages/profile/index.vue`

当前主链路：

1. 楼栋页点空房，直接进入办理入住抽屉
2. 楼栋页点非空房，打开房间详情抽屉
3. 房间详情与办理入住都统一为 `当前情况 / 历史入住`

### 通用能力层

- `src/utils/navigation.js`
- `src/utils/layout.js`
- `src/components/BaseCenteredModal.vue`
- `src/components/ActionFooterRow.vue`
- `src/components/CollapsibleSectionCard.vue`
- `src/components/ChargeCollectDrawer.vue`
- `src/components/DateSelectionModal.vue`
- `src/components/MeterEntryModal.vue`
- `src/components/CheckoutSettlementModal.vue`
- `src/components/EditRoomInfoModal.vue`

职责划分：

- 路由节流与安全跳转
- 统一安全区与顶部高度读取
- 统一居中悬浮弹层
- 统一底部双按钮 footer
- 统一折叠卡头

## 4. 当前房间页信息架构

### 房间详情

当前统一为：

- `当前情况`
- `历史入住`

`当前情况` 内的稳定模块：

- 房间概况
- 当前租客
- 租金收费
- 附加收费
- 收费明细

当前约定：

- 房间概况与当前租客支持折叠
- 租金收费与附加收费统一为表格型台账布局
- 收费明细默认可折叠
- 历史入住只展示历次租住情况，不展示历史操作流水

### 办理入住

当前统一为：

- `当前情况`
- `历史入住`

`当前情况` 当前结构：

- 房间概况
- 当前租客
- 租金与租期
- 入住收费
- 附加费用

当前约定：

- 日期选择走居中悬浮页
- 租期结束按开始日期 + 月数自动推算
- 当前租客只录入姓名与手机号
- 入住收费与押金收费复用公共收费弹层

## 5. 收费与结算模型

### 租金收费

已支持：

- 理论账期生成
- 一期多次收费
- 部分收款
- 补收
- 凭证上传

页面表达方式：

- 一个总收费进度条
- 一张账期表
- 每期展示应收 / 已收 / 状态 / 操作

### 附加收费

当前统一纳入：

- 水费
- 电费
- 燃气
- 供暖

规则：

- 水费、电费支持抄表生成应收
- 水费、电费也支持直接收费
- 燃气、供暖走手动收费
- 全部支持凭证上传
- 是否显示收费按钮，受办理入住时的附加费用配置控制

### 退租结算

当前已支持：

- 悬浮结算页
- 租金缴纳情况摘要
- 附加费用缴纳情况摘要
- 退押金记录

## 6. 弹层体系

当前统一目标是使用 `BaseCenteredModal.vue` 作为居中悬浮页基座。

已接入的主要场景：

- 收费
- 日期选择
- 抄表
- 退租
- 编辑房间信息
- 档案/凭证预览

当前残留风险：

- 旧抽屉组件虽然已基本退场，但仍需持续防止新增页面再次回退到旧体系

## 7. 小程序兼容性约束

### WXSS 兼容

微信小程序对部分 Tailwind 产物不兼容，因此当前工程仍依赖：

- `src/tailwind.generated.css`
- `scripts/sanitize-mp-weixin-wxss.cjs`
- `scripts/postprocess-mp-build.cjs`

需要继续避免：

- 复杂转义类名
- 小程序不支持的复杂选择器
- 依赖浏览器伪元素的样式方案

### 系统信息读取

系统信息读取已统一收口到：

- `src/utils/layout.js`

当前策略：

- 优先使用新接口
- 兼容必要的回退逻辑

## 8. 测试与校验

当前已接入：

- `npm run build:mp-weixin`
- `npm run build:h5`
- `npm run test:domain`
- `npm run verify:encoding`

其中：

- `tests/domain.test.js` 覆盖领域层核心链路
- `scripts/verify-encoding.cjs` 用于扫描编码污染

## 9. 当前工程约定

### 页面修改约定

1. 先保证小程序可用
2. 再统一交互与视觉语言
3. 最后再做局部精修

### 文档约定

每次重要结构、交互、弹层体系变更后，都要同步更新：

- `docs/IMPLEMENTATION_STATUS.md`
- `docs/PROJECT_HISTORY.md`
- `docs/TECH_ARCHITECTURE.md`

### 当前残留问题

1. `src/pages/workbench/index.vue` 仍有历史编码污染和旧文案
2. 字号与字重还没有完全沉淀为集中式 token
3. 个别页面仍有局部“重标题、重按钮”残留，需要继续压平

### 下一步建议

1. 清理 `workbench` 页面残留乱码
2. 把字号/字重层级进一步抽成统一 token
3. 继续收紧 `workbench / profile / bills` 三页视觉语言
