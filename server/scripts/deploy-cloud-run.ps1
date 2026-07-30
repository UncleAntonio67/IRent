param(
  [string]$ProjectId = $(if ($env:GCP_PROJECT_ID) { $env:GCP_PROJECT_ID } else { "irent-493813" }),
  [string]$Region = $(if ($env:GCP_REGION) { $env:GCP_REGION } else { "asia-east1" }),
  [string]$ServiceName = $(if ($env:CLOUD_RUN_SERVICE) { $env:CLOUD_RUN_SERVICE } else { "irent-api" })
)

$ErrorActionPreference = "Stop"

function Require-Value {
  param(
    [string]$Name,
    [string]$Value
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    throw "Missing required environment variable: $Name"
  }
}

Require-Value "GCP_PROJECT_ID" $ProjectId
Require-Value "GCP_REGION" $Region
Require-Value "CLOUD_RUN_SERVICE" $ServiceName

$requiredEnv = @(
  "APP_BASE_URL",
  "DATABASE_URL",
  "JWT_SECRET",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "R2_PUBLIC_BASE_URL"
)

foreach ($name in $requiredEnv) {
  Require-Value $name (Get-Item "Env:$name" -ErrorAction SilentlyContinue).Value
}

$allowedOrigins = (Get-Item "Env:ALLOWED_ORIGINS" -ErrorAction SilentlyContinue).Value
if ([string]::IsNullOrWhiteSpace($allowedOrigins)) {
  $allowedOrigins = "*"
}

$jwtExpiresIn = (Get-Item "Env:JWT_EXPIRES_IN" -ErrorAction SilentlyContinue).Value
if ([string]::IsNullOrWhiteSpace($jwtExpiresIn)) {
  $jwtExpiresIn = "7d"
}

$devAuthBypass = (Get-Item "Env:DEV_AUTH_BYPASS" -ErrorAction SilentlyContinue).Value
if ([string]::IsNullOrWhiteSpace($devAuthBypass)) {
  $devAuthBypass = "true"
}

$wechatAppId = (Get-Item "Env:WECHAT_APPID" -ErrorAction SilentlyContinue).Value
$wechatAppSecret = (Get-Item "Env:WECHAT_APPSECRET" -ErrorAction SilentlyContinue).Value

$envVars = @(
  "NODE_ENV=production",
  "APP_BASE_URL=$env:APP_BASE_URL",
  "DATABASE_URL=$env:DATABASE_URL",
  "JWT_SECRET=$env:JWT_SECRET",
  "JWT_EXPIRES_IN=$jwtExpiresIn",
  "DEV_AUTH_BYPASS=$devAuthBypass",
  "WECHAT_APPID=$wechatAppId",
  "WECHAT_APPSECRET=$wechatAppSecret",
  "R2_ACCOUNT_ID=$env:R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID=$env:R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY=$env:R2_SECRET_ACCESS_KEY",
  "R2_BUCKET=$env:R2_BUCKET",
  "R2_PUBLIC_BASE_URL=$env:R2_PUBLIC_BASE_URL",
  "ALLOWED_ORIGINS=$allowedOrigins"
) -join ","

Write-Host "Deploying Cloud Run service '$ServiceName' to project '$ProjectId' in region '$Region'..."

gcloud run deploy $ServiceName `
  --project $ProjectId `
  --region $Region `
  --source . `
  --allow-unauthenticated `
  --set-env-vars $envVars

Write-Host "Cloud Run deploy finished."
