# 文本计划与Seedance视频接口接入

文本模型负责生成结构化视频计划，Seedance只负责“达人拿手机读评论”的5秒开场片段。评论卡、中文字幕和商品事实仍按[prompt-playbook.md](./prompt-playbook.md)的约定在后期叠加，避免视频模型生成乱码或改写评论。

## 文本计划接口

`generate-llm-plan.ps1`调用：

```http
POST https://www.moyu.info/v1/chat/completions
Authorization: Bearer {SEEDANCE_API_KEY}
Content-Type: application/json
```

默认模型为`doubao-seed-2-0-mini-260428`，请求严格JSON输出。返回结果必须通过本地校验后才能写入`assets/output/llm-plan.json`，校验包括：

- 恰好五段口播与连续时间线；
- factId、assetId和sceneId引用存在；
- 每条口播factId被同时间段素材的supportsFacts支持；
- 单样衣边界、绝对化禁词和材质到上身效果的越界表达；
- 手机屏幕不可读，评论全文只在后期叠加；
- CTA动作白名单与0—100评分量纲。

失败时模型最多修复两次；仍失败就停止，不会继续生成视频。

## Seedance接口与默认参数

提交生成任务：

```http
POST https://www.moyu.info/v1/video/generations
Authorization: Bearer {SEEDANCE_API_KEY}
Content-Type: application/json
```

```json
{
  "model": "doubao-seedance-2-0-fast-260128",
  "prompt": "来自 openingVideoPrompt.prompt；画面内不要生成文字、字幕、Logo或水印",
  "duration": 5,
  "size": "9:16",
  "resolution": "720p"
}
```

记录提交结果中的`task_id`；兼容实现也可接受`id`。随后轮询：

```http
GET https://www.moyu.info/v1/video/generations/{task_id}
Authorization: Bearer {SEEDANCE_API_KEY}
```

建议每8秒查询一次，最长等待10分钟。成功后提取返回的视频URL并立即下载到自有存储；失败时保存状态与失败原因，但不得记录Authorization请求头。当前仓库已有可执行参考：

```powershell
powershell -ExecutionPolicy Bypass `
  -File .\tools\generate-seedance-opening.ps1
```

脚本默认参数就是上述fast模型、5秒、9:16和720p，并兼容接口返回的常见嵌套结构。

## 密钥红线

`SEEDANCE_API_KEY`只能由运行后端或本地脚本的**进程环境变量**读取：

```powershell
$env:SEEDANCE_API_KEY = Read-Host "Seedance API Key"
.\tools\generate-seedance-opening.ps1
Remove-Item Env:SEEDANCE_API_KEY
```

禁止：

- 写入`app.js`、`config.js`、HTML或任何前端请求；
- 写入Git仓库、示例JSON、截图、日志或构建产物；
- 放入浏览器Local Storage、Session Storage或Cookie；
- 从个人网站直接请求中转接口。即使做了代码混淆，访客仍能在网络面板看到密钥。

## 静态演示与生产架构

当前个人网站是静态站点，只能播放已经生成并下载到仓库素材目录的结果：

```text
本地/受控进程
  → POST生成任务
  → GET轮询结果
  → 下载开场MP4
  → FFmpeg叠加准确评论卡、字幕并混剪
  → 静态网站播放预生成成片
```

因此Demo页面的“生成”交互应展示工作流状态或切换预生成案例，不能声称浏览器正在调用真实视频模型。

若要让公开网站真实生成，必须增加服务端代理：

```text
浏览器
  → 自有后端 POST /api/comment-video/opening
  → 后端读取进程环境变量 SEEDANCE_API_KEY
  → moyu POST /v1/video/generations
  → 浏览器只轮询自有后端任务
  → 后端下载并转存结果，再返回自有URL
```

服务端还应完成登录校验、限流、单用户配额、Prompt长度限制、评论匿名化、任务超时和结果URL转存。浏览器不得获得中转接口密钥，也不应直接获得上游原始响应。

## 与现有工作流的接口边界

- `llm-plan.json`中的`openingVideoPrompt.prompt`作为视频Prompt输入；
- `spokenLine`可用于后续TTS或口型流程，本接口示例不假设一定生成准确中文语音；
- `commentOverlay.renderInPost`始终为`true`，评论原文不能交给视频模型绘制；
- Seedance生成的开场只承担人物表演和前三秒张力，不作为商品效果证据；
- 商品实证继续使用`assetLibrary`中的授权商家素材；
- 开场生成失败时，工作流回退到预生成`opener`，不能跳过评论卡或事实审校。
