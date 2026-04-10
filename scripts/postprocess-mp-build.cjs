const fs = require('fs')
const path = require('path')

function read(file) {
  return fs.readFileSync(file, 'utf8')
}

function write(file, content) {
  fs.writeFileSync(file, content, 'utf8')
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else files.push(full)
  }
  return files
}

function patchAppJson(file) {
  if (!fs.existsSync(file)) return
  const app = JSON.parse(read(file))
  if (app.tabBar && Array.isArray(app.tabBar.list) && app.tabBar.list.length >= 3) {
    app.tabBar.list[0].text = '工作台'
    app.tabBar.list[1].text = '账务'
    app.tabBar.list[2].text = '我的'
  }
  write(file, JSON.stringify(app, null, 2))
}

function patchPageJs(file) {
  let content = read(file)
  content = content.replace(/e\.onShow\(\(\)=>\{e\.index\.hideTabBar\(\)\}\);/g, '')
  content = content.replace(/index\.hideTabBar\(\);?/g, '')
  write(file, content)
}

function patchNavigationJs(file) {
  if (!fs.existsSync(file)) return
  const content = `"use strict";const e=require("../common/vendor.js");let t=!1,i=null,n=0,o=\"\";const r=250,c=450,u=250;function l(){return Date.now()}function a(e=c){i&&clearTimeout(i),i=setTimeout(()=>{t=!1,i=null},e)}function s(i){const o=l()-n;if(o<r||t)return;t=!0,n=l();try{i({complete:()=>a(),fail:()=>a(u)})}catch(e){throw a(u),e}}function f(e){return String(e||\"\").replace(/^\\//,\"\")}function g(e){const t=f(e);if(!t)return!0;const i=\"function\"==typeof getCurrentPages?getCurrentPages():[],r=i.length?i[i.length-1].route:\"\";return t===r||t===o&&l()-n<c}function d(e){o=f(e)}exports.safeNavigateTo=function(t){g(t)||(d(t),s(i=>{e.index.navigateTo({url:t,complete:i.complete,fail:i.fail})}))},exports.safeRedirectTo=function(t){g(t)||(d(t),s(i=>{e.index.redirectTo({url:t,complete:i.complete,fail:i.fail})}))},exports.safeSwitchTab=function(t){g(t)||(d(t),s(i=>{e.index.switchTab({url:t,complete:i.complete,fail:i.fail})}))},exports.safeNavigateBack=function(t={}){const{delta:i=1,fallbackUrl:n=\"/pages/workbench/index\",fallbackType:o=\"switchTab\"}=t,r=\"function\"==typeof getCurrentPages?getCurrentPages():[];r.length>i?s(t=>{e.index.navigateBack({delta:i,complete:t.complete,fail:t.fail})}):\"redirectTo\"===o?exports.safeRedirectTo(n):exports.safeSwitchTab(n)},exports.resetNavigationLock=function(){t=!1,n=0,o=\"\",i&&(clearTimeout(i),i=null)};`
  write(file, content)
}

function main() {
  const root = path.resolve(process.argv[2] || 'dist/build/mp-weixin')
  patchAppJson(path.join(root, 'app.json'))
  for (const file of walk(path.join(root, 'pages'))) {
    if (file.endsWith('.js')) patchPageJs(file)
  }
  patchNavigationJs(path.join(root, 'utils', 'navigation.js'))
  console.log(`Postprocessed ${root}`)
}

main()
