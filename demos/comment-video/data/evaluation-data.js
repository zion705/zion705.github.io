window.COMMENT_VIDEO_EVALUATION = {
  "schemaVersion": "1.0",
  "caseId": "a-line-skirt-comment-reply-native-av",
  "verdict": {
    "status": "offline-review-ready",
    "label": "Ready for offline review; marketing lift not yet validated",
    "compositeScore": null
  },
  "templateReplication": {
    "status": "partial-match",
    "beatCoverage": {
      "matched": 4,
      "total": 5,
      "percent": 80,
      "matchedBeats": ["objection hook", "human reaction", "visual proof", "low-pressure CTA"],
      "missingBeats": ["standalone reframe"]
    },
    "reference": {
      "analyzedWindowSeconds": 31,
      "fullDurationSeconds": 82.07,
      "detectedShotCount": 9
    },
    "output": {
      "durationSeconds": 20,
      "detectedShotCount": 4,
      "authoredSegments": 4
    }
  },
  "marketingReadiness": {
    "productGrounding": {
      "gate": "passed",
      "tracedClaims": 4,
      "totalClaims": 4,
      "forbiddenPhraseHits": []
    },
    "technicalCompliance": {
      "gate": "passed",
      "measuredBy": "FFmpeg",
      "width": 1080,
      "height": 1920,
      "fps": 30.05,
      "durationSeconds": 20,
      "hasAudio": true
    },
    "ugcQuality": {
      "status": "not-run",
      "plannedEvaluator": "DOVER-Mobile"
    },
    "predictedMarketingLift": {
      "status": "not-available"
    }
  },
  "openSourceProvenance": [
    {
      "name": "FFmpeg",
      "url": "https://github.com/FFmpeg/FFmpeg",
      "status": "executed",
      "role": "media inspection and scene-change signals"
    },
    {
      "name": "PySceneDetect",
      "url": "https://github.com/Breakthrough/PySceneDetect",
      "status": "adapter-ready-not-installed",
      "role": "production-grade shot-boundary detection"
    },
    {
      "name": "DOVER-Mobile",
      "url": "https://github.com/VQAssessment/DOVER",
      "status": "adapter-ready-not-installed",
      "role": "no-reference UGC technical and aesthetic quality"
    },
    {
      "name": "GrowthBook",
      "url": "https://github.com/growthbook/growthbook",
      "status": "experiment-spec-only",
      "role": "online A/B testing with real traffic"
    }
  ]
};
