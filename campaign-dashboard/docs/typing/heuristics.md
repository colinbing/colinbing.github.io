Typing & Mapping Heuristics (Deterministic, No‑AI)

Goal: Auto‑map >90% of sample headers; flag ambiguous with confidence; type parsing consistent across sources.

Confidence model

Score = min(1, max(0, *weighted sum*)) of:

Header exact match (+0.70)

Header regex match (+0.50)

Platform hint (+0.10) when the export source is known and synonym list includes that platform

Value evidence (+0.20) from type sniffers applied to sample values (e.g., 10 rows)

Contradiction penalty (−0.30) if header suggests one field but values contradict (e.g., header looks like % but integers >1000)

Thresholds:

≥ 0.85 → Auto‑map

0.60–0.849 → Suggest (user confirm)

< 0.60 → Unknown (requires user mapping)

Mapping‑wizard defaults

Clicks policy

If platform ∈ {Meta, TikTok} and link_clicks exists → map link_clicks → clicks, set click_type = "link".

Else if platform = Google Ads and interactions present with interaction campaign types → map interactions → clicks, set click_type = "interaction".

Else map clicks.

Viewability policy

Prefer measurable_impressions/viewable_impressions when available.

If measurable_impressions == 0 and viewable_impressions > 0, compute viewability over impressions and set viewability_denominator = "served".

Video quartiles

Accept any of: video starts | quartile 0% | video views as starts; video completes | video 100% | quartile 100% as completes.

Enforce monotonicity; clamp downwards and set data_quality_note when violated.

Date handling

Timestamps are truncated to local date (dataset timezone) after parsing.

Mixed formats in the same column are normalized if ≥90% parseable; otherwise flag.

Normalization

Currency symbols/ISO suffixes converted to numeric spend in dataset currency; missing currency → assume dataset currency.

De‑noising

Strip prefixes like Active View: and trim whitespaces; collapse multiple spaces; normalize case.

Persistence

Save user‑confirmed mappings per domain+platform so future uploads auto‑apply with confidence = 1.0 (locked). Provide a one‑click “reset mapping” option.

Consistency checks

Zero‑denominator guards: Before KPI math, ensure denominators > 0; otherwise KPI = null.

Rate sanity: If header implies rate (CTR/CVR/VCR/Viewability) but column values are counts, down‑rank by −0.30 and avoid auto‑mapping.

Outlier values: Extremely large integers in fields like CTR are treated as evidence against rate typing.

Sample evaluation loop (pseudo)
for (const header of headers) {
  const candidates = scoreCandidates(header, platform, sampleValues[header]);
  const best = maxBy(candidates, c => c.score);
  if (best.score >= thresholds.auto_map) apply(best.canonicalField);
  else if (best.score >= thresholds.suggest) suggest(best.canonicalField, best.score);
  else markUnknown(header);
}

Acceptance alignment: Deterministic rules, JSON‑based, no AI, with tunable thresholds. Should auto‑map >90% of common GAM/DV360/TTD/DCM/Meta/TikTok exports given typical naming.