# 云服务部署指南

当前云化方案：

- 后端：`Google Cloud Run`
- 数据库：`Neon PostgreSQL`
- 对象存储：`Cloudflare R2`

当前已知固定值：

- `GCP project id`: `irent-493813`
- 建议 `Cloud Run service name`: `irent-api`
- `R2 account id`: `14258e0fc21d18ece67b3d09e42666c4`
- `R2 bucket`: `irent`
- `R2 public base url`: `https://pub-aa543a2f729f48928d4d90d4f9e59915.r2.dev`

## 1. 当前状态

本地已经完成：

- `Neon` 数据库连接已验证
- `Prisma schema` 已成功推送到 `Neon`
- `R2` 预签名上传已验证
- `R2` 公开访问地址已验证

还未完成：

- Cloud Run 服务正式部署
- 微信登录参数接入
- 小程序端云 API 地址配置

## 2. 部署前置条件

本机需要准备：

- `Node.js 20+`
- `gcloud CLI`
- 已登录的 Google Cloud 账号
- 对 `irent-493813` 项目的部署权限

建议先执行：

```powershell
gcloud auth login
gcloud config set project irent-493813
```

## 3. Neon 数据库

当前数据库已经可用，不需要重复建库。

如需再次校验，在 [server](D:/Project/IRent/server) 目录执行：

```powershell
npx prisma validate
npx prisma db push
node src/index.js --check
```

## 4. Cloudflare R2

当前已确定：

- `account id`
- `bucket`
- `public base url`

仍需在 Cloud Run 环境里配置：

- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`

## 5. 必填环境变量

可参考：

- [server/.env.production.example](D:/Project/IRent/server/.env.production.example)
- [server/cloudrun.env.yaml.example](D:/Project/IRent/server/cloudrun.env.yaml.example)

当前部署必须提供：

- `APP_BASE_URL`
- `DATABASE_URL`
- `JWT_SECRET`
- `WECHAT_APPID`
- `WECHAT_APPSECRET`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL`

说明：

- `DATABASE_URL` 已有可用值
- `R2_ACCOUNT_ID / R2_BUCKET / R2_PUBLIC_BASE_URL` 已有可用值
- 仍缺：
  - `WECHAT_APPID`
  - `WECHAT_APPSECRET`
  - `JWT_SECRET`
  - Cloud Run 最终 `APP_BASE_URL`

## 6. Cloud Run 部署脚本

仓库已提供：

- [deploy-cloud-run.ps1](D:/Project/IRent/server/scripts/deploy-cloud-run.ps1)

默认值已经预填：

- `GCP project id`: `irent-493813`
- `region`: `asia-east1`
- `service`: `irent-api`

## 7. 推荐部署步骤

### 第一步：设置环境变量

在 PowerShell 中执行：

```powershell
$env:GCP_PROJECT_ID="irent-493813"
$env:GCP_REGION="asia-east1"
$env:CLOUD_RUN_SERVICE="irent-api"

$env:APP_BASE_URL="https://irent-api-xxxxx-uc.a.run.app"
$env:DATABASE_URL="你的 Neon DATABASE_URL"
$env:JWT_SECRET="替换成强随机密钥"
$env:WECHAT_APPID="你的微信小程序 AppID"
$env:WECHAT_APPSECRET="你的微信小程序 AppSecret"

$env:R2_ACCOUNT_ID="14258e0fc21d18ece67b3d09e42666c4"
$env:R2_ACCESS_KEY_ID="你的 R2 Access Key"
$env:R2_SECRET_ACCESS_KEY="你的 R2 Secret Key"
$env:R2_BUCKET="irent"
$env:R2_PUBLIC_BASE_URL="https://pub-aa543a2f729f48928d4d90d4f9e59915.r2.dev"
$env:ALLOWED_ORIGINS="*"
```

### 第二步：推送 Prisma schema

```powershell
cd server
npx prisma db push
```

### 第三步：部署 Cloud Run

```powershell
cd server
npm run deploy:cloudrun
```

## 8. 部署完成后的验证

至少验证：

1. Cloud Run 服务健康检查可用
2. `GET /health` 正常
3. `POST /api/auth/wechat/login` 能进入后端逻辑
4. `POST /api/attachments/presign` 能返回上传签名
5. 小程序端能读取院落树和房间详情

## 9. 小程序端还要配置

小程序后台需要加入合法域名：

- 请求域名：Cloud Run API 域名
- 上传域名：R2 相关上传域名
- 下载域名：`pub-aa543a2f729f48928d4d90d4f9e59915.r2.dev`

前端还需要配置：

- `VITE_API_BASE_URL`

## 10. 下一步

现在离正式跑通还差：

1. 你提供 `WECHAT_APPID`
2. 你提供 `WECHAT_APPSECRET`
3. 我替你生成最终 Cloud Run 环境变量版本
4. 再执行真实部署
