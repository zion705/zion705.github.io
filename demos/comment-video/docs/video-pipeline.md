# 评论回复视频：离线混剪管线

这套管线负责把前面工作流产出的脚本、Seedance 开场和商家素材，合成为一个可以直接嵌入个人网站的竖版商品回复视频。视频生成、离线旁白与混剪解耦：`generate-seedance-opening.ps1`只生成一个5秒开场，`generate-voiceover.ps1`按五个时间槽离线生成旁白，`render-comment-video.ps1`只依赖本地FFmpeg完成后期；已有开场素材时无需API Key即可重复渲染。

## 输入与输出

默认从`assets/library/`读取一个9:16 MP4和四张9:16 PNG：

| 文件 | 画面职责 |
|---|---|
| `opener-generated.mp4` | Seedance 2.0 Fast生成的真人拿手机读评论动态开场 |
| `fit-front.png` | 商品正面版型证据 |
| `fit-side.png` | 商品侧面版型证据 |
| `fabric-detail.png` | 面料、支撑性或动态细节 |
| `cta.png` | 选码边界和购买/评论引导 |

缺少任意必需素材时，脚本会列出完整缺失路径并停止，不会悄悄生成残缺视频。视频段会按时间线自动裁切；短于目标时长则循环补足，静态图段继续使用轻微推拉和平移。

默认输出：

```text
assets/output/comment-reply-demo.mp4
```

成片规格为 1080 × 1920、30fps、H.264 + AAC、约 20.8 秒，包含轻微推拉/平移、四次转场、评论贴纸、证据标签、中文字幕和网页友好的 `faststart` 元数据。

## 运行

在 `demos/comment-video/` 下执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\render-comment-video.ps1
```

覆盖已有成片：

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\render-comment-video.ps1 -Force
```

只检查 FFmpeg、字体、时间线和素材是否齐全：

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\render-comment-video.ps1 -ValidateOnly
```

脚本默认使用：

```text
D:\23\tmp\video_tools\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe
```

换机器时可以显式传入：

```powershell
.\tools\render-comment-video.ps1 -FfmpegPath C:\tools\ffmpeg.exe
```

## 时间线如何工作

`tools/timeline.json` 是可编辑的剪辑协议，而不是写死在代码里的案例。它同时保存：

- 原评论、评论用户和商家希望解释的重点；
- 商品、目标受众、回答边界和 CTA；
- 每段素材、时长、镜头运动、字幕、段落目的；
- 段间转场和最终输出位置。

当前示例回答的是“梨形身材穿这条裙子是否显胯”。脚本依次展示正面、侧面和面料三类证据，最后给出按腰围选码的边界。要换成清洁用品实测、美妆持妆测试或小家电教程，只需替换五张素材并改写时间线文案，不需要修改 FFmpeg 代码。

## 对齐旁白与可选音乐

运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\generate-voiceover.ps1 -Force
```

脚本读取`llm-plan.json`中的五条`spokenLines`，逐句合成、必要时轻微加速，并按`4.2 / 4.0 / 4.0 / 4.0 / 4.6s`顺序拼接为20.8秒`voiceover.wav`。本机System.Speech不可用时回退到Piper离线模型：

- 运行库：`D:\23\tmp\piper_runtime`
- 中文音色：`D:\23\tmp\piper_voice\zh_CN-huayan-medium.onnx`

存在有效旁白时，渲染器使用完整旁白并关闭Seedance原声，避免两套口播重叠；没有旁白时才保留Seedance首段原声。背景音乐仍可使用`bgm.mp3`、`bgm.wav`或`bgm.m4a`，自动降到14%。候选音频小于4096字节或无法检测到有效音轨时会被跳过。

## 与模型生成层的接口

完整产品工作流里，大模型只需要输出与 `timeline.json` 对应的结构化字段：

1. 判断评论里的核心购买阻力；
2. 生成一句开场回应；
3. 选择 2–3 个可被商家素材证明的论点；
4. 给每个论点生成口播、镜头检索词和字幕；
5. 给出适用边界与 CTA。

素材检索层把匹配结果复制或映射为时间线里的`asset`文件名，随后调用本脚本。开场生成的安全接入方式见[api-integration.md](./api-integration.md)。这样模型、素材库和剪辑器彼此解耦：API暂时不可用时仍能用预生成MP4演示，重新生成开场时也不需要重写渲染器。

## 字体与故障排查

脚本依次查找 Windows 自带或常见的中文字体：Noto Sans SC、微软雅黑、黑体、等线和宋体。也可以用 `-FontPath` 显式指定 `.ttf`/`.ttc`。

如果 FFmpeg 报错，可以保留本次生成的滤镜文件：

```powershell
.\tools\render-comment-video.ps1 -Force -KeepRenderFiles
```

命令结束后会显示临时目录，其中的 `filter-complex.txt` 可以直接用于定位字幕、字体或转场问题。

## 本机验证

2026-07-27已使用真实LLM计划、Seedance 2.0 Fast开场、Piper离线中文旁白和FFmpeg 7.1在Windows PowerShell 5.1下完成端到端实测：

- 实际成片时长：20.80 秒；
- 视频：H.264 High、1080 × 1920、9:16、30fps、`yuv420p`；
- 音频：AAC-LC、48kHz、单声道；五个时间槽均检测到有效旁白，平均音量约`-15.7至-17.7dB`；
- 五段轻动态和四次转场均完成；
- 抽帧确认中文评论贴纸、段落标签和双行字幕已正确烧录。

最终文件已输出到`assets/output/comment-reply-demo.mp4`，可被静态服务器以`video/mp4`和HTTP Range直接播放。
