# 评论→商品回复视频 Prompt Playbook

版本：`reply-video-v3.2`  
适用范围：15—35秒竖屏电商短视频；输入为单条评论、商家回应意图、商品事实白名单和授权素材库。  
演示说明：本文中的评论、商品与结果均为合成案例。接入正式API后，应使用固定测试集重新跑分，而不能把离线人工回放分数当成线上模型结论。

## 1. Prompt要解决的不是“写口播”

普通文案Prompt容易生成“姐妹们闭眼入”“显瘦绝了”等空洞卖点。本工作流先判断评论背后的购买阻力，再决定是否适合公开回复，并让每条商品结论绑定事实、每段证明绑定素材。

产出必须同时满足：

1. **回答的是这条评论**，不是借评论播放通用广告；
2. **只有事实白名单中的商品结论**，未知信息必须保留为未知；
3. **先承认合理担忧，再展示证据**，不与用户吵架；
4. **镜头可执行**，素材库找不到时明确标记缺口；
5. **CTA承接同一个阻力**，而不是突然“321上链接”；
6. **高风险品类保留适用边界、安全提示和免责声明**。

## 2. 最终系统Prompt

```text
你是“Comment2Proof电商回复视频Agent”，兼具短视频编导、商品事实审校员和用户研究员能力。

你的任务：把一条值得公开回应的用户评论，转化为15—35秒的竖屏商品回复视频方案。评论是内容入口，真正目标是识别评论背后的购买阻力，并用商品事实和可见证据降低该阻力。

【工作顺序】
1. 判断该评论是否值得公开做成视频：
   - 适合：高频售前疑问、使用误解、适配性问题、价格/必要性质疑、可被事实解释的差评。
   - 不适合：需要一对一售后、涉及隐私、真实质量事故、辱骂引战、没有证据可以回答的问题。
2. 识别评论类型、主要购买阻力、意图阶段、情绪与风险。
3. 从merchantBrief选择回应重点；不得把商家未要求且事实库未支持的卖点塞进脚本。
4. 只把productFacts中的statement视为可用商品事实。每一句包含参数、效果、材质、适用范围或实验结果的口播，都必须写入对应factIds。
5. 先设计证据，再写结论。优先顺序：
   真人/实物连续镜头 > 同条件A/B > 尺寸/标签实拍 > 场景素材 > 纯口播。
6. 生成开场：0—3秒必须看见“达人读评论”的动作、评论冲突和即将如何证明；不要依靠辱骂、夸张表情或虚假承诺制造张力。
7. 输出时间线、素材召回、后期文字、CTA和自评。所有时间段连续、无重叠，总时长一致。

【文案规则】
- 保留用户原评论的核心措辞，不歪曲成更容易反驳的问题。
- 第一人称商家口吻；短句、口语、有停顿，避免产品说明书腔。
- 面对差评先承担信息或服务责任，不说“是你不会用”。
- 可承认“不适合所有人”“无法保证”，但随后要给出具体判断方法。
- 禁止“100%”“任何人”“绝对”“根治”“零风险”“闭眼入”等无依据绝对词。
- 没有事实支持的结论不得用常识补全，不得根据素材文件名猜测额外事实。
- 实验结论只限输入所述实验条件；不得外推为人体、医学或全场景功效。
- CTA必须对应评论阻力：尺码疑问→尺码/试穿；使用误解→教程/客服；必要性质疑→配方/规格/试用判断。

【视频规则】
- 开场生成模型不要直接生成中文文字；画面留白，评论卡由后期精确叠加。
- openingVideoPrompt需包含人物、场景、动作节拍、表情转折、镜头运动、留白位置、spokenLine与negativePrompt。
- 每个storyboard镜头必须列出assetIds。素材缺失时用MISSING_ASSET，不得编造文件。
- 商品效果镜头不得使用生成模型凭空改变产品、污渍、身材或实验结果。
- 对照实验要说明相同条件与唯一变量，无法证明同条件则降级为“展示”。

【输出要求】
- 只输出符合给定Schema的JSON，不要Markdown，不要额外解释。
- 所有字符串使用简体中文；ID使用输入ID或稳定的英文短横线命名。
- 分数必须给出理由；触发一票否决时passed=false，即使总分较高。
```

## 3. 用户Prompt模板

```text
请基于以下输入生成一支“读评论→证据回应→行动引导”的竖屏商品回复视频。

【任务配置】
目标时长：{{duration_min}}—{{duration_max}}秒
画幅：{{aspect_ratio}}
目标平台：{{platform}}
主要目标：{{business_goal}}

【用户评论】
comment_id: {{comment_id}}
comment_text: {{comment_text}}
comment_context: {{comment_context_or_unknown}}

【商家解释与希望回应的方面】
why_reply: {{why_reply}}
response_focus:
{{response_focus_list}}
target_audience: {{target_audience}}
tone: {{tone}}
must_avoid:
{{must_avoid_list}}

【商品事实白名单】
{{#each product_facts}}
- factId: {{id}}
  statement: {{statement}}
  source: {{source}}
  evidenceAssetIds: {{evidence_asset_ids}}
{{/each}}

【明确未知】
{{unknowns_list}}

【授权素材库】
{{#each assets}}
- assetId: {{id}}
  type: {{type}}
  durationSec: {{duration}}
  ratio: {{ratio}}
  description: {{description}}
  tags: {{tags}}
  supportsFacts: {{supports_fact_ids}}
  rights: {{rights}}
{{/each}}

请先在内部完成“评论诊断→事实核验→证据规划→脚本→素材匹配→风险检查”，最终只返回JSON。
```

## 4. JSON输出Schema

下面是用于接口校验的JSON Schema。生产环境建议在服务端进行严格校验；不通过时把错误路径返回给模型局部重写。

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CommentToProductReplyVideo",
  "type": "object",
  "required": [
    "commentAnalysis",
    "script",
    "storyboard",
    "openingVideoPrompt",
    "assetMatches",
    "cta",
    "evaluation"
  ],
  "properties": {
    "commentAnalysis": {
      "type": "object",
      "required": [
        "publishDecision",
        "type",
        "primaryObjection",
        "intentStage",
        "emotion",
        "responseStrategy",
        "proofMode",
        "riskLevel",
        "riskNotes"
      ],
      "properties": {
        "publishDecision": {
          "enum": [
            "值得公开回复",
            "公开回复，同时进入说明书与详情页优化",
            "转一对一客服",
            "转质量/合规处理",
            "忽略"
          ]
        },
        "type": { "type": "string", "minLength": 2 },
        "primaryObjection": { "type": "string", "minLength": 4 },
        "intentStage": { "type": "string" },
        "emotion": { "type": "string" },
        "responseStrategy": { "type": "string" },
        "proofMode": { "type": "string" },
        "riskLevel": { "enum": ["low", "medium", "high"] },
        "riskNotes": {
          "type": "array",
          "items": { "type": "string" }
        }
      },
      "additionalProperties": false
    },
    "script": {
      "type": "object",
      "required": ["durationSec", "hook", "spokenLines", "fullVoiceover"],
      "properties": {
        "durationSec": { "type": "number", "minimum": 15, "maximum": 35 },
        "hook": { "type": "string", "minLength": 8, "maxLength": 80 },
        "spokenLines": {
          "type": "array",
          "minItems": 4,
          "items": {
            "type": "object",
            "required": [
              "startSec",
              "endSec",
              "speaker",
              "text",
              "purpose",
              "factIds"
            ],
            "properties": {
              "startSec": { "type": "number", "minimum": 0 },
              "endSec": { "type": "number", "exclusiveMinimum": 0 },
              "speaker": { "type": "string" },
              "text": { "type": "string", "minLength": 2 },
              "purpose": { "type": "string" },
              "factIds": {
                "type": "array",
                "items": { "type": "string" },
                "uniqueItems": true
              }
            },
            "additionalProperties": false
          }
        },
        "fullVoiceover": { "type": "string", "minLength": 20 }
      },
      "additionalProperties": false
    },
    "storyboard": {
      "type": "array",
      "minItems": 4,
      "items": {
        "type": "object",
        "required": [
          "id",
          "startSec",
          "endSec",
          "visual",
          "audio",
          "overlay",
          "transition",
          "assetIds"
        ],
        "properties": {
          "id": { "type": "string" },
          "startSec": { "type": "number", "minimum": 0 },
          "endSec": { "type": "number", "exclusiveMinimum": 0 },
          "visual": { "type": "string" },
          "audio": { "type": "string" },
          "overlay": { "type": "string" },
          "transition": { "type": "string" },
          "assetIds": {
            "type": "array",
            "minItems": 1,
            "items": { "type": "string" }
          }
        },
        "additionalProperties": false
      }
    },
    "openingVideoPrompt": {
      "type": "object",
      "required": [
        "durationSec",
        "aspectRatio",
        "prompt",
        "performanceDirection",
        "cameraDirection",
        "spokenLine",
        "commentOverlay",
        "negativePrompt"
      ],
      "properties": {
        "durationSec": { "type": "number", "minimum": 2, "maximum": 6 },
        "aspectRatio": { "const": "9:16" },
        "prompt": { "type": "string", "minLength": 80 },
        "performanceDirection": { "type": "string" },
        "cameraDirection": { "type": "string" },
        "spokenLine": { "type": "string" },
        "commentOverlay": {
          "type": "object",
          "required": [
            "renderInPost",
            "text",
            "position",
            "style",
            "inAnimation",
            "outAnimation"
          ],
          "properties": {
            "renderInPost": { "const": true },
            "text": { "type": "string" },
            "position": { "type": "string" },
            "style": { "type": "string" },
            "inAnimation": { "type": "string" },
            "outAnimation": { "type": "string" }
          },
          "additionalProperties": false
        },
        "negativePrompt": { "type": "string", "minLength": 20 }
      },
      "additionalProperties": false
    },
    "assetMatches": {
      "type": "array",
      "items": {
        "type": "object",
        "required": [
          "sceneId",
          "selectedAssetIds",
          "query",
          "matchScore",
          "reason"
        ],
        "properties": {
          "sceneId": { "type": "string" },
          "selectedAssetIds": {
            "type": "array",
            "items": { "type": "string" }
          },
          "query": { "type": "string" },
          "matchScore": { "type": "number", "minimum": 0, "maximum": 1 },
          "reason": { "type": "string" }
        },
        "additionalProperties": false
      }
    },
    "cta": {
      "type": "object",
      "required": ["spoken", "onScreen", "action", "rationale"],
      "properties": {
        "spoken": { "type": "string" },
        "onScreen": { "type": "string" },
        "action": { "type": "string" },
        "rationale": { "type": "string" }
      },
      "additionalProperties": false
    },
    "evaluation": {
      "type": "object",
      "required": [
        "scoreScale",
        "total",
        "passed",
        "scores",
        "vetoChecks",
        "improvement"
      ],
      "properties": {
        "scoreScale": { "const": "0-100" },
        "total": { "type": "number", "minimum": 0, "maximum": 100 },
        "passed": { "type": "boolean" },
        "scores": {
          "type": "object",
          "required": [
            "relevance",
            "factuality",
            "naturalness",
            "evidence",
            "hook",
            "conversion"
          ],
          "additionalProperties": {
            "type": "object",
            "required": ["score", "note"],
            "properties": {
              "score": { "type": "number", "minimum": 0, "maximum": 100 },
              "note": { "type": "string" }
            }
          }
        },
        "vetoChecks": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["id", "passed", "note"],
            "properties": {
              "id": { "type": "string" },
              "passed": { "type": "boolean" },
              "note": { "type": "string" }
            }
          }
        },
        "improvement": { "type": "string" }
      }
    }
  },
  "additionalProperties": false
}
```

### 服务端额外校验

JSON Schema无法覆盖全部业务逻辑，服务端还需执行：

- `spokenLines[0].startSec === 0`；
- 前一段的`endSec`等于后一段的`startSec`，最后一段等于`durationSec`；
- `storyboard`时间线满足同样条件；
- 所有`factIds`都存在于输入事实白名单；
- 所有`assetIds`都存在于授权素材库，生成开场仅允许约定的`generated-opening-*`；
- 每个数字型商品结论必须至少绑定一个`factId`；
- 评测总分按权重重新计算，不能直接相信模型自报分；
- 任一`vetoChecks.passed === false`时，最终`passed`强制为`false`。

## 5. 反幻觉与商品真实性约束

### 5.1 事实分层

| 等级 | 可以怎么用 | 示例 |
|---|---|---|
| A：商品原始证据 | 可作为口播结论，必须带`factId` | 背标、质检表、尺码表、连续实验 |
| B：场景素材 | 只能说明“可以展示该场景”，不能推出效果 | 产品放进行李箱 |
| C：商家主观希望 | 只能决定表达方向，不能当事实 | “希望强调显瘦” |
| D：常识或模型知识 | 不可补充商品结论 | “氨纶一定更耐穿” |

### 5.2 Claim Ledger

生成后逐句抽取所有可验证主张，形成内部账本：

```json
[
  {
    "claim": "正面素材可见裙摆从胯下向外自然放开",
    "factIds": ["skirt-f1"],
    "evidenceAssetIds": ["skirt-a1"],
    "status": "supported"
  },
  {
    "claim": "所有梨形身材穿这条都不显胯",
    "factIds": [],
    "evidenceAssetIds": [],
    "status": "reject"
  }
]
```

规则：

- `factIds`为空但含产品效果、规格、适用人群的句子，删除或改为提问；
- 素材只支持“看见什么”，不能证明未拍摄的因果；
- 生成开场只负责人物表演，不负责生成商品实证；
- 有实验时必须同屏或口播说明条件、变量和边界；
- 输入`unknowns`中的信息，不得在输出中变成肯定结论；
- 医疗、健康、儿童、安全类表达默认进入高风险人工复核。

### 5.3 视觉防幻觉

1. 评论卡、参数、配方与免责声明全部后期叠加，不让视频模型生成中文；
2. 商品实证优先用授权实拍，生成模型不得修改清洁结果、服装版型或包装文字；
3. A/B素材必须来自同一次连续拍摄；若不是，只能称“两个展示镜头”，不能称“对照实验”；
4. 服装试穿必须标注试穿者数据和尺码，不能将个体结果外推；
5. 未匹配到素材时输出`MISSING_ASSET`，工作流停在“待补拍”，不能用想象镜头顶替。

## 6. 四轮Prompt调试与真实运行

调试样例固定使用：

> 评论：“梨形身材穿这条裙子真的不显胯吗？模特图看不出来啊……”

事实白名单固定为：高腰A字版型与正面试穿素材、当前样衣侧面活动量素材、面料支撑与垂落细节、按腰围对照尺码表的商家选码规则。没有面料成分、试穿者身材数字和“显瘦率”。Round 1—3用于回放策略演进；Round 4为`doubao-seed-2-0-mini-260428`的真实接口输出，并通过本地结构与证据链校验。

### Round 1：只有“写一条爆款带货口播”

**Prompt**

```text
根据这条评论写一条带货视频口播。要有吸引力，突出显瘦和版型。
```

**典型输出**

> “姐妹们谁懂啊，这条裙子简直梨形身材救星！一秒藏胯，谁穿谁显瘦，闭眼入就对了！”

**结果**

- 相关性：54
- 事实一致性：22
- 自然度：61
- 证据覆盖：15
- 前3秒张力：72
- 转化感：68
- **加权分：45，一票否决**

**问题**

- 把商家想表达的“版型优势”直接当成已证实效果；
- “一秒藏胯”“谁穿谁显瘦”既没有事实，也容易引发体型焦虑；
- 没回答“模特不可信”，反而继续用空口保证；
- 没有分镜和素材要求，无法交付剪辑。

### Round 2：加入事实白名单与固定结构

**Prompt新增**

```text
只能使用以下事实：高腰A字版型；当前正面、侧面试穿素材；面料有一定支撑但不硬；商家建议优先按腰围选码。
结构必须是：读评论—讲版型—推荐购买。
```

**典型输出**

> “有人问梨形身材会不会显胯。这条是高腰A字版型，面料有支撑，侧面也留了活动量，所以可以有效修饰胯部，赶紧下单吧。”

**结果**

- 相关性：70
- 事实一致性：72
- 自然度：48
- 证据覆盖：42
- 前3秒张力：51
- 转化感：58
- **加权分：59，未通过**

**改进与遗留问题**

- 版型、面料和活动量来自事实库，比Round 1可靠；
- 但“所以可以有效修饰”仍把当前样衣画面外推成普适效果；
- 像在背卖点，未承认模特图的信任问题；
- CTA突然“赶紧下单”，没有帮助用户判断尺码；
- 仍未把事实对应到可见素材。

### Round 3：绑定factId，但还没有验证“口播—画面”同段一致

**Prompt新增**

```text
先识别评论背后的信任缺口，再设计证据。
每条商品结论绑定factId，每个镜头绑定assetId。
开场原样接住“模特图看不出来”的质疑；承诺直接看正面、侧面和面料。
不得承诺普适显瘦或“不显胯”；只描述当前素材可见的版型与活动量。
CTA必须给出“优先按腰围选码”的边界，而非直接催单。
```

**候选输出（被拒绝）**

> “这条我不空口说，直接看三个位置。先看正面：高腰线把视觉重心上提，裙摆从胯下自然放开。再看侧面：这里留了活动量，不会贴着胯线往下走。面料有支撑但不硬，走动时不会整片粘腿。梨形身材建议按腰围选码。留下身高体重，我再帮你看尺码。”

**结果**

- 相关性：96
- 事实一致性：61
- 自然度：89
- 证据覆盖：58
- 前3秒张力：92
- 转化感：78
- **结论：一票否决**

**为什么仍不通过**

1. “走动时不会整片粘腿”无法由静态面料图证明，是材质事实向上身效果的越界推导；
2. 仅校验factId存在还不够，模型可能让正面口播配侧面画面；
3. CTA只有咨询动作，没有把用户带到尺码表或商品详情；
4. 视频Prompt若写“手机屏幕显示评论”，仍会诱发乱码，与后期评论卡策略冲突。

### Round 4：加入可执行的硬校验，真实接口锁版

**新增硬约束**

```text
每条spokenLine.factIds必须被同时间段storyboard.assetIds对应素材的supportsFacts支持。
材质事实不得推出“不贴胯”“不显胯”“显瘦”等上身效果。
单样衣证据必须保留“当前样衣/当前素材”边界。
手机屏幕必须熄灭、背向或不可读；评论全文只在后期叠加。
CTA必须包含查看尺码表、商品卡、商品详情或合适后下单的低压动作。
六项评分均使用0—100分，总分与均值误差不超过2分。
```

**真实模型输出**

> “梨形身材穿这条裙子真的不显胯吗？先看实拍证据。当前样衣正面是高腰A字版型，裙摆从胯下自然放开。当前样衣侧面臀胯位置有活动量，裙身没紧贴胯线。面料有支撑性不硬，捏起能形成弧度还自然垂落。梨形身材优先按腰围看尺码表，合适再下单。”

**结果**

- 模型：`doubao-seed-2-0-mini-260428`
- 时间线：5段，`0—4.2 / 4.2—8.2 / 8.2—12.2 / 12.2—16.2 / 16.2—20.8s`
- 本地校验：JSON结构、引用存在性、时间连续性、同段证据匹配、评论原文、Prompt安全边界、CTA与评分量纲全部通过
- 六项自评：均为90，总分90
- 成片：20.8秒，正面、侧面、面料与CTA逐段对应；Piper离线中文旁白覆盖五个时间槽

**为什么可以锁版**

1. 先公平呈现用户质疑，再用实拍回答，不靠“显瘦神器”等空口保证；
2. 每句产品事实都能追溯到factId，并被同一时间段的素材支持；
3. “当前样衣”限定阻止把单个试穿者外推给所有梨形身材；
4. 面料段只描述可见的支撑、弧度与垂落，不再推导贴胯结果；
5. 评论卡后期叠加，视频模型只负责人物表演；
6. CTA继续解决当前阻力：先看尺码表，合适再下单。

## 7. 推荐的模型调用链

为了减少一次生成同时承担太多任务，生产版建议拆成四次调用：

1. **评论诊断器**：输出是否公开回复、购买阻力、风险级别；
2. **证据规划器**：选择事实与素材，先生成Claim Ledger；
3. **脚本编导器**：只基于已批准的证据规划写脚本和分镜；
4. **批评者/评测器**：独立检查事实、边界、前3秒和CTA，返回可定位修改意见。

Demo可以为了速度合并为一次模型调用，但界面仍展示四步中间状态，以体现Agent不是“一个Prompt套壳”，而是具有显式规划、检索、生成和评测闭环。
