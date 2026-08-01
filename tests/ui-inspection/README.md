# UI 截图巡检

## 目录

- `baseline/`：确认无误的基线截图，提交到仓库。
- `current/`：本次修改后的截图，不提交到仓库。
- `manifest.json`：必须覆盖的页面与状态。

截图文件名必须和 `manifest.json` 的 `id` 一致，例如：

```text
baseline/room-current-expanded.png
current/room-current-expanded.png
```

允许 PNG、JPG、JPEG。每一对基线和当前截图必须来自同一设备尺寸、同一方向和同一系统字体缩放。

## 采集流程

1. 执行 `npm run build:mp-weixin`，在微信开发者工具中导入 `dist/build/mp-weixin`。
2. 按 `manifest.json` 逐项进入页面和状态；使用真机或开发者工具截图。
3. 首次确认 UI 正确时，将截图存入 `baseline/`。
4. 后续改动后，将同名截图存入 `current/`。
5. 执行 `npm run ui:inspect:strict`。
6. 将需要人工复核的全屏截图提供给 Codex；说明场景 ID 和问题位置。

## 人工检查项

- 字体：正文、表格辅助文本、状态和按钮在手机上可读，不出现过小字号。
- 边框：卡片、弹层、底部栏不叠加描边；输入、上传和空状态保留必要边界。
- 布局：无裁切、重叠、横向溢出、底部安全区遮挡或表格列挤压。
- 交互：折叠箭头、按钮、上传入口和底部操作栏触达范围清晰。
- 状态：空置、已租、待收、已收、未上传凭证等状态文字与颜色正确。
