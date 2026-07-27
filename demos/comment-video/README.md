# Comment2Proof Video Agent

Echo Cutroom turns a high-value product comment into an evidence-led, editable,
and measurable vertical reply video.

## Website structure

The portfolio demo now has two user tasks and one transparent system map:

1. **Query → script:** enter the original customer comment and the merchant’s
   position, then load the completed four-scene script.
2. **Select footage:** choose approved merchant assets or add local images and
   videos from the device.
3. **System map:** inspect every input, tool, output, execution mode, and
   evidence loop from the query to the final MP4.

The static page never uploads selected local files and does not call model APIs
from the browser.

## Completed demo run

- Product: High-Rise A-Line Denim Midi Skirt
- Text plan source: `doubao-seed-2-0-mini-260428`
- English script: four timed spoken lines, adapted from the validated run
- Generated opener: Seedance 2.0 Fast, 5 seconds, 9:16, 720p
- Product evidence: front fit, side fit, and fabric detail
- Voiceover: Piper `en_US-lessac-medium`, generated offline
- Post-production: FFmpeg edit, English captions, transitions, and background music
- Final cut: 20.8 seconds, 1080 × 1920, 30 fps, H.264 + AAC
- Output: `assets/output/comment-reply-demo-en.mp4`
- Sanitized run record: `assets/output/workflow-run-en.json`

## End-to-end workflow

```text
Customer comment + merchant brief
  → Doubao Seed 2.0 Mini structured video plan
  → Local claim, reference, and timing validation
  → Merchant asset matching or local upload
  → Fact-to-shot evidence gap check
  → Seedance opener + offline Piper voiceover
  → FFmpeg edit, captions, transitions, and BGM
  → Evaluation and deterministic media checks
  → Static MP4 + sanitized run manifest
```

The browser replays completed artifacts. Seedance and the language model are not
called in real time by the website.

## Local preview

From the portfolio repository root:

```powershell
node .\demos\comment-video\tools\serve-static.mjs
```

Then open:

```text
http://127.0.0.1:18765/demos/comment-video/
```
