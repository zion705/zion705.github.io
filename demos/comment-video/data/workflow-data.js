/*
 * Comment-to-product-reply video demo data.
 * The exported browser dataset is limited to the English skirt case.
 */
(function attachWorkflowData(root, factory) {
  var data = factory();
  data.examples = data.examples.filter(function keepEnglishDemo(example) {
    return example.id === "a-line-denim-skirt";
  });
  root.COMMENT_VIDEO_WORKFLOW_DATA = data;
  root.commentVideoWorkflowData = data;
  if (typeof module === "object" && module.exports) {
    module.exports = data;
  }
})(typeof window !== "undefined" ? window : globalThis, function createWorkflowData() {
  "use strict";

  return {
    meta: {
      schemaVersion: "1.0.0",
      promptVersion: "reply-video-v3.2",
      generatedAt: "2026-07-26",
      language: "en-US",
      disclaimer:
        "All comments, products, and assets in this interview demo are synthetic. Production use requires merchant facts, authorized comments, and rights-cleared media.",
      defaultExampleId: "a-line-denim-skirt"
    },

    workflow: {
      name: "Comment2Proof Video Agent",
      promise: "Turn one high-value comment into an evidence-led, editable, and measurable product reply video.",
      stages: [
        {
          id: "input",
          label: "Comment and merchant intent",
          description: "Capture the comment, response goal, and non-negotiable claim boundaries."
        },
        {
          id: "reason",
          label: "Comment diagnosis",
          description: "Identify the objection, audience, purchase stage, and whether a public reply is useful."
        },
        {
          id: "script",
          label: "Evidence-led script",
          description: "Generate the hook, proof, boundaries, and CTA from approved product facts only."
        },
        {
          id: "opening",
          label: "Generate opener",
          description: "Generate the creator reaction while adding the exact comment card in post."
        },
        {
          id: "retrieve",
          label: "Retrieve merchant assets",
          description: "Recall usable footage by shot intent, product fact, and aspect ratio."
        },
        {
          id: "edit",
          label: "Edit and package",
          description: "Assemble the opener, proof assets, captions, comment card, music, narration, and CTA."
        },
        {
          id: "evaluate",
          label: "Quality evaluation",
          description: "Score six dimensions and apply veto checks before approving the cut."
        }
      ]
    },

    scoreDimensions: [
      { id: "relevance", label: "Comment relevance", weight: 20 },
      { id: "factuality", label: "Factual grounding", weight: 25 },
      { id: "naturalness", label: "Narration naturalness", weight: 15 },
      { id: "evidence", label: "Evidence coverage", weight: 15 },
      { id: "hook", label: "First-three-second hook", weight: 15 },
      { id: "conversion", label: "Conversion intent", weight: 10 }
    ],

    examples: [
      {
        id: "a-line-denim-skirt",
        title: "Will this A-line skirt emphasize pear-shaped hips?",
        category: "Fashion / Fit",
        status: "ready",
        accent: "#ff6b45",
        input: {
          userComment:
            "Does this skirt really not emphasize the hips on a pear-shaped body? The model photos don’t show it clearly.",
          merchantBrief: {
            whyReply:
              "This recurring fit question is blocking purchase decisions. The merchant wants to answer with front, side, and fabric evidence without making a universal fit claim.",
            responseFocus: [
              "Acknowledge that model photos do not answer every fit question",
              "Show the high-rise A-line shape from the front",
              "Show visible room through the hip area from the side",
              "Show that the fabric holds its shape without looking stiff",
              "Ask shoppers to check the size chart by waist before ordering"
            ],
            targetAudience:
              "Pear-shaped shoppers comparing skirt fits and worried that the silhouette may emphasize the hips",
            tone: "Direct, calm, evidence-led, and free of exaggerated slimming claims",
            mustAvoid: [
              "Do not claim that the skirt works for every pear-shaped body",
              "Do not promise instant slimming or body transformation",
              "Do not invent fabric composition, measurements, or model data",
              "Do not generalize one sample fit to every shopper"
            ]
          },
          product: {
            name: "High-Rise A-Line Denim Midi Skirt",
            sku: "DEMO-SKIRT-01",
            facts: [
              {
                id: "skirt-f1",
                statement:
                  "The sample has a high-rise A-line shape; the front-view asset shows the skirt opening below the hips.",
                source: "Merchant fit notes and front-view sample asset",
                evidenceAssetIds: ["skirt-a1"]
              },
              {
                id: "skirt-f2",
                statement:
                  "The side-view sample asset shows visible room through the hip area. This observation applies only to this sample and wearer.",
                source: "Merchant side-view sample asset",
                evidenceAssetIds: ["skirt-a2"]
              },
              {
                id: "skirt-f3",
                statement:
                  "The merchant describes the sample fabric as shape-holding without feeling stiff; the detail asset shows it forming a curve when pinched and falling naturally.",
                source: "Merchant fabric notes and fabric-detail asset",
                evidenceAssetIds: ["skirt-a3"]
              },
              {
                id: "skirt-f4",
                statement:
                  "The merchant’s sizing guidance is to check the size chart by waist before ordering.",
                source: "Merchant size guide",
                evidenceAssetIds: []
              }
            ],
            unknowns: [
              "No publishable fabric composition or weight is provided",
              "The wearer’s measurements and sample size are not provided",
              "The assets do not cover every waist-to-hip ratio",
              "Static assets cannot prove fit during every movement or use case"
            ]
          },
          assetLibrary: [
            {
              id: "skirt-a0",
              file: "assets/library/opener-generated.mp4",
              type: "video",
              durationSec: 5.2,
              ratio: "9:16",
              description:
                "Seedance opener: a creator holds a phone and the black A-line skirt, then looks up to answer the fit question.",
              tags: ["AI-generated", "comment opener", "creator", "A-line skirt"],
              supportsFacts: [],
              rights: "Demo-generated opener; performance only, not product evidence"
            },
            {
              id: "skirt-a1",
              file: "assets/library/fit-front.png",
              type: "image",
              durationSec: 5.2,
              ratio: "9:16",
              description:
                "Front-view sample fit showing the high rise and the A-line shape opening below the hips.",
              tags: ["sample fit", "front view", "high rise", "A-line"],
              supportsFacts: ["skirt-f1"],
              rights: "Authorized demo asset"
            },
            {
              id: "skirt-a2",
              file: "assets/library/fit-side.png",
              type: "image",
              durationSec: 5.2,
              ratio: "9:16",
              description:
                "Side-view sample fit showing visible room through the hip area.",
              tags: ["sample fit", "side view", "hip room", "A-line"],
              supportsFacts: ["skirt-f2"],
              rights: "Authorized demo asset"
            },
            {
              id: "skirt-a3",
              file: "assets/library/fabric-detail.png",
              type: "image",
              durationSec: 5.2,
              ratio: "9:16",
              description:
                "Fabric close-up showing the sample holding a curve when pinched and falling naturally.",
              tags: ["fabric detail", "shape", "soft structure", "drape"],
              supportsFacts: ["skirt-f3"],
              rights: "Authorized demo asset"
            }
          ]
        },
        output: {
          commentAnalysis: {
            publishDecision: "Suitable for a public video reply",
            type: "Fit question / model-photo trust gap",
            primaryObjection:
              "The shopper worries that the skirt may emphasize the hips and cannot judge the fit from model photos.",
            intentStage: "High intent; needs fit evidence before ordering",
            emotion: "Cautious and evidence-seeking, not hostile",
            responseStrategy:
              "Acknowledge concern → show front shape → show side room → show fabric structure and sizing action",
            proofMode: "Front sample + side sample + fabric detail + waist-based size-chart guidance",
            riskLevel: "medium",
            riskNotes: [
              "Do not make a universal no-hip-emphasis claim",
              "Keep observations scoped to this sample",
              "Do not invent measurements"
            ]
          },
          script: {
            durationSec: 20.8,
            hook:
              "Pear-shaped and worried this skirt will emphasize your hips? Let’s check the actual fit.",
            spokenLines: [
              {
                startSec: 0,
                endSec: 5.2,
                speaker: "Creator",
                text:
                  "Pear-shaped and worried this skirt will emphasize your hips? Let’s check the actual fit.",
                purpose: "State the concern and promise visible evidence",
                factIds: []
              },
              {
                startSec: 5.2,
                endSec: 10.4,
                speaker: "Creator",
                text:
                  "From the front, this sample has a high-rise A-line shape that opens below the hips.",
                purpose: "Show the front-view shape",
                factIds: ["skirt-f1"]
              },
              {
                startSec: 10.4,
                endSec: 15.6,
                speaker: "Creator",
                text:
                  "From the side, this sample leaves visible room through the hip area.",
                purpose: "Show the side-view room through the hips",
                factIds: ["skirt-f2"]
              },
              {
                startSec: 15.6,
                endSec: 20.8,
                speaker: "Creator",
                text:
                  "The fabric holds its shape without feeling stiff. Check the size chart by waist before ordering.",
                purpose: "Show the fabric structure and close with a low-pressure sizing action",
                factIds: ["skirt-f3", "skirt-f4"]
              }
            ],
            fullVoiceover:
              "Pear-shaped and worried this skirt will emphasize your hips? Let’s check the actual fit. From the front, this sample has a high-rise A-line shape that opens below the hips. From the side, this sample leaves visible room through the hip area. The fabric holds its shape without feeling stiff. Check the size chart by waist before ordering."
          },
          storyboard: [
            {
              id: "skirt-s1",
              startSec: 0,
              endSec: 5.2,
              visual:
                "A creator holds a phone with its screen turned away and lifts the black A-line skirt, then looks into camera.",
              audio:
                "Pear-shaped and worried this skirt will emphasize your hips? Let’s check the actual fit.",
              overlay:
                "Pear-shaped and worried this skirt will emphasize your hips? Let’s check the actual fit.",
              transition: "Smooth push into the front-view sample",
              assetIds: ["skirt-a0"]
            },
            {
              id: "skirt-s2",
              startSec: 5.2,
              endSec: 10.4,
              visual:
                "The front-view sample drifts slowly while guides trace the high rise and A-line shape.",
              audio:
                "From the front, this sample has a high-rise A-line shape that opens below the hips.",
              overlay:
                "From the front, this sample has a high-rise A-line shape that opens below the hips.",
              transition: "Slide to the matching side-view sample",
              assetIds: ["skirt-a1"]
            },
            {
              id: "skirt-s3",
              startSec: 10.4,
              endSec: 15.6,
              visual:
                "The side-view sample drifts slowly while a subtle guide marks the visible room through the hip area.",
              audio:
                "From the side, this sample leaves visible room through the hip area.",
              overlay:
                "From the side, this sample leaves visible room through the hip area.",
              transition: "Soft move into the fabric close-up",
              assetIds: ["skirt-a2"]
            },
            {
              id: "skirt-s4",
              startSec: 15.6,
              endSec: 20.8,
              visual:
                "The fabric close-up rises slowly; the final beat adds a clean size-chart prompt over the same asset.",
              audio:
                "The fabric holds its shape without feeling stiff. Check the size chart by waist before ordering.",
              overlay:
                "The fabric holds its shape without feeling stiff. Check the size chart by waist before ordering.",
              transition: "Hold the final frame through 20.8 seconds",
              assetIds: ["skirt-a3"]
            }
          ],
          openingVideoPrompt: {
            durationSec: 5,
            aspectRatio: "9:16",
            prompt:
              "Vertical 9:16 realistic UGC video, one continuous chest-up shot in a bright fitting room. A young adult creator holds a black high-rise A-line denim skirt and a phone with the screen turned away from camera and completely unreadable. She glances down, raises one eyebrow, looks into the lens, and lightly lifts the skirt as if ready to demonstrate the fit. Natural daylight, subtle handheld movement, no on-screen text, subtitles, logo, or watermark.",
            performanceDirection:
              "Start by glancing at the unreadable phone screen, then look up with a calm, evidence-first expression and lift the skirt slightly.",
            cameraDirection:
              "One continuous 9:16 chest-up shot with a gentle handheld push-in; no cuts.",
            spokenLine:
              "Pear-shaped and worried this skirt will emphasize your hips? Let’s check the actual fit.",
            commentOverlay: {
              renderInPost: true,
              text:
                "Does this skirt really not emphasize the hips on a pear-shaped body? The model photos don’t show it clearly.",
              position: "Upper-left safe area, 12% from the top",
              style:
                "White rounded comment card with an anonymous avatar and an orange highlight on “emphasize the hips”",
              inAnimation: "Pop in from the phone edge over 0.35 seconds",
              outAnimation: "Fade left during the transition to the front-view sample"
            },
            negativePrompt:
              "No readable phone screen, text, subtitles, comment UI, logos, or watermarks. No malformed hands, extra phones, identity changes, exaggerated anger, hard studio light, heavy skin smoothing, trousers, garment color changes, silhouette changes, or camera cuts."
          },
          assetMatches: [
            {
              sceneId: "skirt-s2",
              selectedAssetIds: ["skirt-a1"],
              query: "front-view high-rise A-line skirt sample fit opening below hips 9:16",
              matchScore: 0.99,
              reason: "The asset visibly supports the front-shape statement."
            },
            {
              sceneId: "skirt-s3",
              selectedAssetIds: ["skirt-a2"],
              query: "matching side-view A-line skirt sample visible room through hip area 9:16",
              matchScore: 0.99,
              reason: "The side view provides the angle missing from the model photos."
            },
            {
              sceneId: "skirt-s4",
              selectedAssetIds: ["skirt-a3"],
              query: "black skirt fabric close-up shape-holding soft structure natural drape",
              matchScore: 0.97,
              reason:
                "The close-up supports the fabric statement and carries the integrated size-chart prompt."
            }
          ],
          cta: {
            spoken:
              "The fabric holds its shape without feeling stiff. Check the size chart by waist before ordering.",
            onScreen: "Check the size chart by waist before ordering",
            action: "open_size_guide",
            rationale:
              "The final line turns fit uncertainty into a low-pressure sizing action without adding a separate CTA scene."
          },
          evaluation: {
            scoreScale: "0-100",
            total: 92,
            passed: true,
            scores: {
              relevance: { score: 92, note: "All four lines directly answer the fit concern." },
              factuality: { score: 94, note: "Each claim is scoped to the sample and tied to the fact whitelist." },
              naturalness: { score: 91, note: "Four concise lines fit the 20.8-second structure." },
              evidence: { score: 92, note: "Front, side, and fabric statements each have a matching asset." },
              hook: { score: 91, note: "The opening states the concern and immediately promises a fit check." },
              conversion: { score: 89, note: "Sizing guidance is integrated into the evidence scene without a hard sell." }
            },
            vetoChecks: [
              { id: "fabricated-fact", passed: true, note: "No measurements, composition, or model data were invented." },
              { id: "absolute-claim", passed: true, note: "The script does not promise the same result for every body." },
              { id: "body-shaming", passed: true, note: "The language is neutral and fit-focused." },
              { id: "evidence-mismatch", passed: true, note: "Four script sections map to four real assets." }
            ],
            improvement:
              "Add dynamic fit footage and size-labeled samples before using this as production evidence."
          }
        }
      },

      {
        id: "wet-wipes-necessity",
        title: "湿厕纸是不是被造出来的“伪需求”？",
        category: "日用快消 / 必要性质疑",
        status: "ready",
        accent: "#2f9c83",
        input: {
          userComment: "以前没有湿厕纸不也过来了？这东西不就是智商税吗？",
          merchantBrief: {
            whyReply:
              "该评论代表品类教育阶段的高频质疑。目标不是说服所有人，而是帮助有特定清洁体验需求的人判断是否适合自己。",
            responseFocus: [
              "承认产品并非人人刚需",
              "用同条件纹理板实验说明湿润擦拭与干擦的过程差异",
              "说明适用场景，而不制造健康焦虑",
              "引导用户先看材质与单片尺寸再决定"
            ],
            targetAudience: "经期、出差、久坐办公或使用干纸反复擦拭时感到不适的人",
            tone: "克制、坦诚、带一点反常识，不与评论者争输赢",
            mustAvoid: [
              "不说“干纸擦不干净”或暗示不用就不卫生",
              "不做治疗、抗菌、预防疾病等医疗宣称",
              "不将纹理板实验等同于人体功效实验",
              "不攻击不使用湿厕纸的人"
            ]
          },
          product: {
            name: "柔韧可冲散湿厕纸",
            sku: "DEMO-WIPE-02",
            facts: [
              {
                id: "wipe-f1",
                statement: "配方表标注纯化水为主要成分，不添加酒精与香精。",
                source: "产品包装配方表",
                evidenceAssetIds: ["wipe-a3"]
              },
              {
                id: "wipe-f2",
                statement: "单片展开尺寸为140mm × 180mm，实测展示样品与包装标注一致。",
                source: "包装标注及商家软尺实测",
                evidenceAssetIds: ["wipe-a4"]
              },
              {
                id: "wipe-f3",
                statement: "在演示用纹理硅胶板上放置等量巧克力酱，分别用一张干纸和一张本品各擦三次，湿厕纸侧可见残留更少。",
                source: "商家同条件演示记录；仅代表该次纹理板实验",
                evidenceAssetIds: ["wipe-a1"]
              },
              {
                id: "wipe-f4",
                statement: "展示样品在500ml常温水中手动搅动30秒后出现明显纤维分散。",
                source: "商家水中分散演示；不等同于所有管道环境",
                evidenceAssetIds: ["wipe-a2"]
              }
            ],
            unknowns: [
              "没有人体清洁效果的临床或功效结论",
              "无法保证适用于所有敏感人群",
              "不同地区排污与管道条件不同，不作普适可冲承诺"
            ]
          },
          assetLibrary: [
            {
              id: "wipe-a1",
              file: "assets/library/wipes/silicone-three-wipes-ab.mp4",
              type: "video",
              durationSec: 8.1,
              ratio: "9:16",
              description: "同一纹理硅胶板、等量巧克力酱，干纸与湿厕纸各擦三次的俯拍A/B实验。",
              tags: ["A/B实验", "纹理板", "三次擦拭", "俯拍", "同条件"],
              supportsFacts: ["wipe-f3"],
              rights: "商家自摄"
            },
            {
              id: "wipe-a2",
              file: "assets/library/wipes/dispersal-30s.mp4",
              type: "video",
              durationSec: 5.6,
              ratio: "9:16",
              description: "透明量杯中500ml常温水，计时30秒搅动后纤维分散。",
              tags: ["水中分散", "30秒", "量杯", "计时器"],
              supportsFacts: ["wipe-f4"],
              rights: "商家自摄"
            },
            {
              id: "wipe-a3",
              file: "assets/library/wipes/ingredients-package.mp4",
              type: "video",
              durationSec: 3.7,
              ratio: "9:16",
              description: "包装配方表微距横移，纯化水、无酒精和无香精信息清晰可读。",
              tags: ["包装", "配方表", "纯化水", "无酒精", "无香精"],
              supportsFacts: ["wipe-f1"],
              rights: "商家自摄"
            },
            {
              id: "wipe-a4",
              file: "assets/library/wipes/sheet-size-measure.mp4",
              type: "video",
              durationSec: 4.4,
              ratio: "9:16",
              description: "单片完全展开并用直尺测量长宽。",
              tags: ["单片尺寸", "展开", "直尺", "实测"],
              supportsFacts: ["wipe-f2"],
              rights: "商家自摄"
            },
            {
              id: "wipe-a5",
              file: "assets/library/wipes/scenario-travel-desk.mp4",
              type: "video",
              durationSec: 5,
              ratio: "9:16",
              description: "独立小包放入通勤包与行李箱侧袋的生活方式镜头。",
              tags: ["出差", "通勤", "随身", "场景"],
              supportsFacts: [],
              rights: "商家自摄"
            }
          ]
        },
        output: {
          commentAnalysis: {
            publishDecision: "值得公开回复",
            type: "品类必要性质疑 / 非目标用户偏见",
            primaryObjection: "认为新品类只是人为制造需求，不相信体验提升值得付费",
            intentStage: "品类认知：尚未进入具体品牌比较",
            emotion: "带讽刺但有公共讨论价值",
            responseStrategy: "先同意“非人人需要” → 做同条件演示 → 点名适用场景 → 让用户自行判断",
            proofMode: "纹理板同条件A/B实验 + 配方与尺寸实拍",
            riskLevel: "high",
            riskNotes: ["不得制造卫生焦虑", "实验结论只限展示条件", "避免医疗宣称"]
          },
          script: {
            durationSec: 27,
            hook: "这位说湿厕纸是智商税——先别吵。它确实不是人人都需要，我们只做一个三次擦拭实验。",
            spokenLines: [
              {
                startSec: 0,
                endSec: 3.4,
                speaker: "达人",
                text: "这位说湿厕纸是智商税——先别吵。它确实不是人人都需要。",
                purpose: "反预期地承认边界，降低对抗",
                factIds: []
              },
              {
                startSec: 3.4,
                endSec: 9.8,
                speaker: "达人",
                text: "同一块纹理板、同样多的巧克力酱，左边干纸，右边湿厕纸，都只擦三次。",
                purpose: "建立公平、可理解的证据条件",
                factIds: ["wipe-f3"]
              },
              {
                startSec: 9.8,
                endSec: 14.4,
                speaker: "达人",
                text: "这次演示里，右边可见残留更少。注意，这是纹理板实验，不是人体功效结论。",
                purpose: "呈现结果并主动限制外推",
                factIds: ["wipe-f3"]
              },
              {
                startSec: 14.4,
                endSec: 20.4,
                speaker: "达人",
                text: "所以重点不是“以前能不能过”，而是经期、出差，或者干纸反复擦时，你想不想换一种湿润的擦拭体验。",
                purpose: "从品类争论回到目标场景",
                factIds: []
              },
              {
                startSec: 20.4,
                endSec: 24.1,
                speaker: "达人",
                text: "这款主要是纯化水，不加酒精和香精；但敏感人群还是建议先小范围尝试。",
                purpose: "补充事实与谨慎提示",
                factIds: ["wipe-f1"]
              },
              {
                startSec: 24.1,
                endSec: 27,
                speaker: "达人",
                text: "商品卡能看单片尺寸和完整配方。需要的再选，不需要的真不用硬买。",
                purpose: "筛选目标用户并推动理性查看",
                factIds: ["wipe-f1", "wipe-f2"]
              }
            ],
            fullVoiceover:
              "这位说湿厕纸是智商税——先别吵。它确实不是人人都需要。同一块纹理板、同样多的巧克力酱，左边干纸，右边湿厕纸，都只擦三次。这次演示里，右边可见残留更少。注意，这是纹理板实验，不是人体功效结论。所以重点不是“以前能不能过”，而是经期、出差，或者干纸反复擦时，你想不想换一种湿润的擦拭体验。这款主要是纯化水，不加酒精和香精；但敏感人群还是建议先小范围尝试。商品卡能看单片尺寸和完整配方。需要的再选，不需要的真不用硬买。"
          },
          storyboard: [
            {
              id: "wipe-s1",
              startSec: 0,
              endSec: 3.4,
              visual: "达人拿手机读到“智商税”时短暂停顿，抬头摊手，另一只手各拿一张干纸和湿厕纸。",
              audio: "同期口播；“智商税”出现时轻微低频重音",
              overlay: "置顶评论：以前没有湿厕纸不也过来了？这东西不就是智商税吗？",
              transition: "双手将两张纸向下放，动作匹配切至实验台",
              assetIds: ["generated-opening-wipe"]
            },
            {
              id: "wipe-s2",
              startSec: 3.4,
              endSec: 9.8,
              visual: "俯拍分屏：同一纹理板左右等量污渍，两只手同步各擦三次；屏幕中央显示1、2、3计数。",
              audio: "旁白 + 三次清脆计数音",
              overlay: "同样污渍｜同样三次｜左：干纸　右：湿厕纸",
              transition: "第三次后定格0.5秒",
              assetIds: ["wipe-a1"]
            },
            {
              id: "wipe-s3",
              startSec: 9.8,
              endSec: 14.4,
              visual: "定格结果并放大两侧纹理凹槽，箭头只标可见残留，不使用洁净率数字。",
              audio: "旁白",
              overlay: "仅为纹理板演示，不等同于人体功效测试",
              transition: "免责声明保持至镜头结束",
              assetIds: ["wipe-a1"]
            },
            {
              id: "wipe-s4",
              startSec: 14.4,
              endSec: 20.4,
              visual: "经期收纳袋、出差行李箱、办公包三个快速生活场景，独立小包自然出现。",
              audio: "旁白",
              overlay: "经期｜出差｜想要湿润擦拭体验",
              transition: "每个场景约1.5秒，以手部放入动作匹配切",
              assetIds: ["wipe-a5"]
            },
            {
              id: "wipe-s5",
              startSec: 20.4,
              endSec: 24.1,
              visual: "包装配方表微距，关键词由后期框选；右下角出现“敏感人群先试用”。",
              audio: "旁白",
              overlay: "主要成分：纯化水｜不添加酒精、香精",
              transition: "配方关键词向商品卡聚合",
              assetIds: ["wipe-a3"]
            },
            {
              id: "wipe-s6",
              startSec: 24.1,
              endSec: 27,
              visual: "单片展开测量画面缩入商品详情样机，停在“成分 / 尺寸”信息区。",
              audio: "口播 + 轻提示音",
              overlay: "先看尺寸与配方，再决定",
              transition: "尾帧停留0.8秒",
              assetIds: ["wipe-a4"]
            }
          ],
          openingVideoPrompt: {
            durationSec: 4,
            aspectRatio: "9:16",
            prompt:
              "竖屏真实居家测评短视频，一位28岁左右的中国女性生活用品测评者坐在明亮洗手台旁，胸部以上近景。她右手拿手机读评论，左手同时捏着一张白色干纸和一张微湿柔巾。读到“智商税”时停顿半拍、抬头看镜头并轻轻摊手，表情像“这个争议我懂”，不是嘲讽也不是生气；随后把两张纸向镜头轻抬，准备做实验。背景干净真实，有透明实验板和量杯但不出现马桶。手机左上方留出干净空间，供后期放中文评论卡。自然窗光、真实皮肤、手机短视频质感、轻微手持、节奏紧。画面内不要生成任何文字、Logo或水印。",
            performanceDirection:
              "“智商税”之后停0.25秒，眉毛轻抬；说“不是人人都需要”时轻点头，传达坦诚而非争辩。",
            cameraDirection: "40mm等效近景，前2秒固定，2—3.5秒轻微推近6%。",
            spokenLine: "这位说湿厕纸是智商税——先别吵。它确实不是人人都需要。",
            commentOverlay: {
              renderInPost: true,
              text: "以前没有湿厕纸不也过来了？这东西不就是智商税吗？",
              position: "左上安全区，距离顶部13%、左右边距7%",
              style: "白色评论卡，灰色匿名头像，“智商税”用墨绿色描边高亮",
              inAnimation: "0.3秒从手机边缘上浮",
              outAnimation: "3.2秒随两张纸下压动作向下擦除"
            },
            negativePrompt:
              "禁止生成文字乱码、平台Logo、病痛表情、厕所污秽画面、嘲笑式表演、夸张嫌弃、实验结果提前出现、畸形手指、额外纸张、强磨皮、产品包装变形。"
          },
          assetMatches: [
            {
              sceneId: "wipe-s2",
              selectedAssetIds: ["wipe-a1"],
              query: "同一纹理板 等量巧克力酱 干纸湿纸 三次擦拭 A/B 俯拍",
              matchScore: 0.99,
              reason: "实验条件、次数和结果均可在一个连续镜头内核验。"
            },
            {
              sceneId: "wipe-s4",
              selectedAssetIds: ["wipe-a5"],
              query: "独立小包 经期收纳 出差行李 通勤包 真实生活场景",
              matchScore: 0.9,
              reason: "把抽象的必要性争论转化为目标人群可识别的使用时刻。"
            },
            {
              sceneId: "wipe-s5",
              selectedAssetIds: ["wipe-a3"],
              query: "包装配方表 纯化水 无酒精 无香精 微距可读",
              matchScore: 0.97,
              reason: "配方信息由包装原始画面支撑，避免只靠口播。"
            }
          ],
          cta: {
            spoken: "商品卡能看单片尺寸和完整配方。需要的再选，不需要的真不用硬买。",
            onScreen: "查看尺寸与配方｜判断是否适合你",
            action: "open_product_spec",
            rationale: "争议品类以自我筛选代替强推，更能建立可信度并减少错购。"
          },
          evaluation: {
            scoreScale: "0-100",
            total: 93,
            passed: true,
            scores: {
              relevance: { score: 95, note: "直接回应“是否必要”，没有偷换成单纯介绍产品。" },
              factuality: { score: 96, note: "实验边界、配方来源和未知项均明确。" },
              naturalness: { score: 91, note: "先承认非刚需，语言接近日常讨论。" },
              evidence: { score: 93, note: "A/B实验支撑体验差异，配方镜头支撑成分。" },
              hook: { score: 94, note: "“它确实不是人人需要”构成反预期开场。" },
              conversion: { score: 80, note: "弱促销但精准筛选目标用户，适合争议型品类。" }
            },
            vetoChecks: [
              { id: "fabricated-fact", passed: true, note: "未添加杀菌、可治疗等未提供功效。" },
              { id: "medical-claim", passed: true, note: "无医疗宣称，敏感人群只给谨慎建议。" },
              { id: "experiment-overreach", passed: true, note: "两次明确实验只代表纹理板条件。" },
              { id: "fear-marketing", passed: true, note: "未制造不用产品就不卫生的焦虑。" }
            ],
            improvement:
              "正式投放可A/B测试“反预期承认”与“直接实验”两种首句，观察3秒留存和负向评论率。"
          }
        }
      },

      {
        id: "cleaner-usage-misunderstanding",
        title: "喷上就擦没效果，是产品失效还是步骤错了？",
        category: "清洁用品 / 使用误解",
        status: "ready",
        accent: "#5277d8",
        input: {
          userComment: "跟风买了这个水垢清洁喷雾，喷上就擦，根本擦不掉，谁买谁后悔。",
          merchantBrief: {
            whyReply:
              "这条差评暴露出详情页没有把停留时间讲清楚。希望承认信息传达问题，用同一水垢玻璃做“立即擦/停留3分钟”的对照。",
            responseFocus: [
              "不责怪用户，先承认商家没有说清关键步骤",
              "演示表面擦干、喷涂、停留3分钟、再擦净",
              "做立即擦与等待3分钟的同条件对照",
              "明确不适用天然石材，并补充安全提示"
            ],
            targetAudience: "已经购买但认为无效，或担心清洁产品操作复杂的用户",
            tone: "负责、简洁、像售后工程师现场排查",
            mustAvoid: [
              "不说用户“不会用”",
              "不保证陈年水垢一次全净",
              "不在天然大理石等不适用表面演示",
              "不省略通风、戴手套、不可与含氯产品混用的提示"
            ]
          },
          product: {
            name: "浴室水垢清洁喷雾",
            sku: "DEMO-CLEAN-03",
            facts: [
              {
                id: "clean-f1",
                statement: "包装使用方法要求：待清洁表面先擦干，均匀喷涂后停留3分钟，再用湿布擦拭并清水冲净。",
                source: "产品背标使用说明",
                evidenceAssetIds: ["clean-a3"]
              },
              {
                id: "clean-f2",
                statement: "同一块带水垢的淋浴玻璃被划分为A、B两区：A区喷后立即擦，B区停留3分钟后擦；本次演示中B区可见水垢残留更少。",
                source: "商家连续镜头对照实验；仅代表该次样品与表面",
                evidenceAssetIds: ["clean-a1"]
              },
              {
                id: "clean-f3",
                statement: "背标注明不适用于天然大理石、石灰石、木材及受损涂层。",
                source: "产品背标适用范围",
                evidenceAssetIds: ["clean-a4"]
              },
              {
                id: "clean-f4",
                statement: "背标安全提示包括保持通风、佩戴手套、不可与含氯清洁剂混用。",
                source: "产品背标安全说明",
                evidenceAssetIds: ["clean-a4"]
              }
            ],
            unknowns: [
              "水垢形成时间和成分未知，不能保证一次清除",
              "没有覆盖所有玻璃涂层与五金材质",
              "视频无法替代用户先在不显眼处小范围测试"
            ]
          },
          assetLibrary: [
            {
              id: "clean-a1",
              file: "assets/library/cleaner/now-vs-3min-continuous.mp4",
              type: "video",
              durationSec: 12.8,
              ratio: "9:16",
              description: "同一淋浴玻璃划分A/B区，连续镜头完成立即擦与3分钟后擦对照，画面含计时器。",
              tags: ["A/B实验", "立即擦", "3分钟", "水垢", "连续镜头"],
              supportsFacts: ["clean-f2"],
              rights: "商家自摄"
            },
            {
              id: "clean-a2",
              file: "assets/library/cleaner/dry-spray-wipe-steps.mp4",
              type: "video",
              durationSec: 8.4,
              ratio: "9:16",
              description: "擦干表面、均匀喷涂、计时、湿布擦拭、清水冲净五步特写。",
              tags: ["使用教程", "擦干", "喷涂", "计时", "冲净"],
              supportsFacts: ["clean-f1"],
              rights: "商家自摄"
            },
            {
              id: "clean-a3",
              file: "assets/library/cleaner/back-label-directions.mp4",
              type: "video",
              durationSec: 4.1,
              ratio: "9:16",
              description: "背标使用方法微距，镜头依次扫过擦干、3分钟、冲净。",
              tags: ["背标", "使用方法", "3分钟", "微距"],
              supportsFacts: ["clean-f1"],
              rights: "商家自摄"
            },
            {
              id: "clean-a4",
              file: "assets/library/cleaner/safety-surface-label.mp4",
              type: "video",
              durationSec: 5.2,
              ratio: "9:16",
              description: "背标适用范围和安全说明；后期框选天然石材、通风、手套、勿混用。",
              tags: ["安全", "不适用表面", "天然石材", "通风", "手套", "勿混用"],
              supportsFacts: ["clean-f3", "clean-f4"],
              rights: "商家自摄"
            },
            {
              id: "clean-a5",
              file: "assets/library/cleaner/product-hero-bathroom.mp4",
              type: "video",
              durationSec: 4.6,
              ratio: "9:16",
              description: "清洁后的玻璃与产品同框，浴室自然光，不做夸张高光特效。",
              tags: ["产品结尾", "浴室", "玻璃", "自然光"],
              supportsFacts: [],
              rights: "商家自摄"
            }
          ]
        },
        output: {
          commentAnalysis: {
            publishDecision: "公开回复，同时进入说明书与详情页优化",
            type: "使用方式误解 / 真实售后抱怨",
            primaryObjection: "用户按直觉喷后立即擦，体验无效，进而否定产品",
            intentStage: "购后挽回，同时影响围观者的售前判断",
            emotion: "失望且带劝退倾向，应先承担沟通责任",
            responseStrategy: "承认没讲清 → 点出关键变量 → 连续镜头A/B验证 → 补齐安全边界",
            proofMode: "同表面立即擦 vs 停留3分钟 + 背标原文",
            riskLevel: "high",
            riskNotes: ["不能责怪用户", "安全提示不可被CTA挤掉", "对照必须连续且同条件"]
          },
          script: {
            durationSec: 30,
            hook: "这条差评先别删：如果喷上马上擦，确实可能看不到效果。我们漏讲了最关键的三分钟。",
            spokenLines: [
              {
                startSec: 0,
                endSec: 3.5,
                speaker: "达人",
                text: "这条差评先别删：如果喷上马上擦，确实可能看不到效果。",
                purpose: "承担问题并制造“为什么”的信息缺口",
                factIds: ["clean-f1"]
              },
              {
                startSec: 3.5,
                endSec: 6.8,
                speaker: "达人",
                text: "是我们之前没讲清，最关键的不是多喷，而是先擦干，再等三分钟。",
                purpose: "纠错但不责怪用户",
                factIds: ["clean-f1"]
              },
              {
                startSec: 6.8,
                endSec: 14.8,
                speaker: "达人",
                text: "同一块玻璃分两边：A区喷完马上擦，B区同样用量，停留三分钟再擦。",
                purpose: "建立可核验的同条件实验",
                factIds: ["clean-f2"]
              },
              {
                startSec: 14.8,
                endSec: 19.5,
                speaker: "达人",
                text: "这次镜头里，B区可见残留更少；但陈年水垢不保证一次全净。",
                purpose: "给出结果并约束承诺",
                factIds: ["clean-f2"]
              },
              {
                startSec: 19.5,
                endSec: 25.6,
                speaker: "达人",
                text: "用完要湿布擦、清水冲。天然大理石别用，保持通风、戴手套，也不要和含氯清洁剂混在一起。",
                purpose: "补齐适用范围和安全信息",
                factIds: ["clean-f1", "clean-f3", "clean-f4"]
              },
              {
                startSec: 25.6,
                endSec: 30,
                speaker: "达人",
                text: "商品卡新增了三分钟教程。已经买过的先照这个步骤小范围试一次，还有问题直接带照片来找我们。",
                purpose: "挽回购后用户并引导后续服务",
                factIds: ["clean-f1"]
              }
            ],
            fullVoiceover:
              "这条差评先别删：如果喷上马上擦，确实可能看不到效果。是我们之前没讲清，最关键的不是多喷，而是先擦干，再等三分钟。同一块玻璃分两边：A区喷完马上擦，B区同样用量，停留三分钟再擦。这次镜头里，B区可见残留更少；但陈年水垢不保证一次全净。用完要湿布擦、清水冲。天然大理石别用，保持通风、戴手套，也不要和含氯清洁剂混在一起。商品卡新增了三分钟教程。已经买过的先照这个步骤小范围试一次，还有问题直接带照片来找我们。"
          },
          storyboard: [
            {
              id: "clean-s1",
              startSec: 0,
              endSec: 3.5,
              visual: "达人站在有明显水垢的淋浴玻璃前，拿手机读差评，抬头后把喷雾放低，认真看镜头。",
              audio: "同期口播；“差评先别删”字幕重音",
              overlay: "置顶评论：喷上就擦，根本擦不掉，谁买谁后悔。",
              transition: "达人手指比出3，切至大号计时器“03:00”",
              assetIds: ["generated-opening-clean"]
            },
            {
              id: "clean-s2",
              startSec: 3.5,
              endSec: 6.8,
              visual: "擦干玻璃后均匀喷涂，画面用红叉标“喷完马上擦”，用绿色计时器标“等3分钟”。",
              audio: "旁白",
              overlay: "关键步骤：表面擦干 → 停留3分钟",
              transition: "计时器缩到右上角并保持",
              assetIds: ["clean-a2", "clean-a3"]
            },
            {
              id: "clean-s3",
              startSec: 6.8,
              endSec: 14.8,
              visual: "同一玻璃A/B分区连续镜头；A区立即擦，B区计时3分钟。用量图标保持一致。",
              audio: "旁白 + 计时快进音",
              overlay: "A：立即擦　B：停留3分钟｜同表面·同用量",
              transition: "B区擦拭动作完成后左右结果定格",
              assetIds: ["clean-a1"]
            },
            {
              id: "clean-s4",
              startSec: 14.8,
              endSec: 19.5,
              visual: "左右结果近景；只标出可见残留，不使用“100%去除”等数字。",
              audio: "旁白",
              overlay: "本次演示：B区可见残留更少｜陈年水垢不保证一次全净",
              transition: "湿布从镜头前擦过转场",
              assetIds: ["clean-a1"]
            },
            {
              id: "clean-s5",
              startSec: 19.5,
              endSec: 25.6,
              visual: "背标特写与正确冲洗动作交替；天然石材图标红叉，通风、手套、勿混用图标依次出现。",
              audio: "旁白，背景音乐音量降低",
              overlay: "天然石材勿用｜保持通风｜戴手套｜勿与含氯产品混用",
              transition: "安全图标保持至段落结束",
              assetIds: ["clean-a2", "clean-a4"]
            },
            {
              id: "clean-s6",
              startSec: 25.6,
              endSec: 30,
              visual: "商品卡样机展示新增“三分钟教程”，右侧出现“上传问题照片”入口；产品与清洁玻璃自然同框。",
              audio: "达人口播 + 服务提示音",
              overlay: "已购买：按教程小范围试用｜仍有问题：带图找客服",
              transition: "尾帧停留1秒",
              assetIds: ["clean-a5"]
            }
          ],
          openingVideoPrompt: {
            durationSec: 4,
            aspectRatio: "9:16",
            prompt:
              "竖屏真实家居清洁短视频，一位30岁左右中国女性店主站在真实浴室的淋浴玻璃前，玻璃上能看到轻度白色水垢。她戴着清洁手套，右手拿手机读一条差评，左手拿蓝色无品牌清洁喷瓶。读到“谁买谁后悔”时没有翻白眼，而是立刻把喷瓶放低、抬头认真直视镜头，轻点头承认问题；随后左手比出数字三，暗示关键步骤。0.7秒后镜头轻推近，人物有真实呼吸和短暂停顿。右上方保留干净留白用于后期评论卡。自然浴室光、手机拍摄质感、真实皮肤、非广告棚拍。画面中不要生成任何文字、商标或水印。",
            performanceDirection:
              "前1.3秒认真读；读到劝退句时不防御，嘴唇轻抿后点头；说“确实可能没效果”时语气负责；最后比出三。",
            cameraDirection: "32mm等效中近景，轻微手持，0.7—2.6秒推近约7%，保持玻璃水垢可见。",
            spokenLine: "这条差评先别删：如果喷上马上擦，确实可能看不到效果。",
            commentOverlay: {
              renderInPost: true,
              text: "跟风买了这个水垢清洁喷雾，喷上就擦，根本擦不掉，谁买谁后悔。",
              position: "右上安全区，距离顶部12%、左右边距7%",
              style: "白色评论卡，黑色正文，“根本擦不掉”用蓝色底线标记",
              inAnimation: "0.3秒由手机向右上弹出",
              outAnimation: "人物比出3时评论卡收缩成计时器"
            },
            negativePrompt:
              "禁止文字乱码、品牌Logo、危险混合清洁剂、未戴手套、喷雾朝脸、夸张生气、翻白眼、玻璃瞬间魔法变净、过曝高光、畸形手、额外喷瓶、产品颜色变化。"
          },
          assetMatches: [
            {
              sceneId: "clean-s2",
              selectedAssetIds: ["clean-a2", "clean-a3"],
              query: "背标步骤 表面擦干 喷涂 停留3分钟 湿布擦 清水冲",
              matchScore: 0.97,
              reason: "教程动作与原始背标交叉验证，避免仅凭达人口述。"
            },
            {
              sceneId: "clean-s3",
              selectedAssetIds: ["clean-a1"],
              query: "同一玻璃 A/B 连续镜头 同用量 立即擦 对比 3分钟",
              matchScore: 0.99,
              reason: "直接验证导致差评的关键变量，且连续镜头降低实验作假感。"
            },
            {
              sceneId: "clean-s5",
              selectedAssetIds: ["clean-a4", "clean-a2"],
              query: "天然石材勿用 通风 手套 不与含氯混用 冲净",
              matchScore: 0.98,
              reason: "安全文字有背标依据，同时展示实际防护动作。"
            }
          ],
          cta: {
            spoken: "已经买过的先照这个步骤小范围试一次，还有问题直接带照片来找我们。",
            onScreen: "看3分钟教程｜带图找客服",
            action: "open_usage_tutorial",
            rationale: "优先修复失败体验和降低退款，再承接围观用户的购买疑虑。"
          },
          evaluation: {
            scoreScale: "0-100",
            total: 96,
            passed: true,
            scores: {
              relevance: { score: 99, note: "完整复现“喷上就擦”的失败路径，并只改变关键变量。" },
              factuality: { score: 98, note: "步骤、禁用表面与安全提示均来自背标。" },
              naturalness: { score: 94, note: "先承担说明责任，避免教育用户的居高临下感。" },
              evidence: { score: 97, note: "连续A/B、背标与动作教程形成闭环。" },
              hook: { score: 95, note: "“差评先别删”与主动承认失败具有强停留动机。" },
              conversion: { score: 88, note: "CTA同时服务已购挽回和售前教育。" }
            },
            vetoChecks: [
              { id: "blame-user", passed: true, note: "明确由商家承担“没讲清”的责任。" },
              { id: "absolute-cleaning-claim", passed: true, note: "明确不保证陈年水垢一次全净。" },
              { id: "unsafe-guidance", passed: true, note: "禁用表面、通风、手套与勿混用全部保留。" },
              { id: "evidence-mismatch", passed: true, note: "A/B为同一表面连续镜头，变量清楚。" }
            ],
            improvement:
              "将此评论洞察同步到详情页首屏和包裹说明卡，验证教程曝光后“无效”类差评率是否下降。"
          }
        }
      }
    ]
  };
});
