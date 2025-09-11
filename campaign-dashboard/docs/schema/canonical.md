Canonical Schema (Fields) & KPI Formulas

Scope: Defines CPV’s canonical dimensions/metrics and deterministic KPI math. Inherits Chat 1 privacy/transport policy (no raw rows go to AI; AI optional; server proxy only).

Version: v1.0 • 2025‑09‑11

Canonical Dimensions

date — ISO YYYY-MM-DD; dataset timezone applied at import.

channel — enum: display | video | social | search | audio | native | email | other.

campaign_id, campaign_name — strings.

adgroup_id, adgroup_name — strings (aka line item/placement).

creative_id, creative_name, creative_size — strings; size WxH.

site_domain — registered domain; app_bundle — store bundle id (one or both may be present).

device_type — enum: desktop | mobile | tablet | ctv.

os — iOS | Android | Windows | macOS | Other.

country — ISO‑3166‑1 alpha‑2, region — ISO‑3166‑2 (optional), dma — Nielsen DMA code (optional).

AI-only hash mirrors (not stored in raw rows): campaign_hash, adgroup_hash, creative_hash, domain_hash.

Canonical Metrics (sums only)

Delivery: impressions (int), clicks (int), spend (number), conversions (int).

Video: video_starts, video_25, video_50, video_75, video_100 (ints).

Viewability: measurable_impressions, viewable_impressions (ints).

Optional: revenue (number), view_through_conversions (int), link_clicks (int).

Normalization

Currency: Convert spend/revenue to dataset currency pre‑aggregation; keep 2 decimals.

Timezone: Convert timestamps to dataset TZ, then truncate to date at 00:00 local.

Aggregation rule: KPIs are computed from sum of base metrics, never from averaged KPIs.

KPI Formulas (deterministic)

All KPIs computed from unrounded sums, then rounded for display.

CTR = clicks / impressions → % (display 2 decimals). Edge: impressions == 0 → null.

CPM = (spend / impressions) * 1000 → currency (2 d.p.). Edge: impressions == 0 or spend <= 0 → null.

CPC = spend / clicks → currency (2 d.p.). Edge: clicks == 0 or spend <= 0 → null.

CPA = spend / conversions → currency (2 d.p.). Edge: conversions == 0 or spend < 0 → null.

CVR (click‑through) = conversions / clicks → % (2 decimals). Edge: clicks == 0 → null.

VCR = video_100 / video_starts → % (1 decimal). Edge: video_starts == 0 → null.

Viewability (MRC) = viewable_impressions / measurable_impressions → % (1 decimal). Edge: if measurable_impressions == 0 but viewable_impressions > 0, fallback to viewable_impressions / impressions and set viewability_denominator = "served".

VTR (optional) = video_starts / impressions → % (1 decimal). Edge: impressions == 0 → null.

ROAS (optional) = revenue / spend → ratio (2 decimals). Edge: spend <= 0 → null.

Display rounding: CTR/CVR 2 dp; VCR/Viewability/VTR 1 dp; currency KPIs 2 dp; integers with thousands separators.

Data quality guards: Quartiles must be monotonic: video_100 ≤ video_75 ≤ video_50 ≤ video_25 ≤ video_starts. If not, clamp downward and set data_quality_note = "quartile_non_monotonic_clamped".

Minimum Columns per KPI

CTR: impressions, clicks

CPM: impressions, spend

CPC: clicks, spend

CPA: conversions, spend

CVR: clicks, conversions

VCR: video_starts, video_100

Viewability: measurable_impressions, viewable_impressions (fallback uses impressions)

Source Mapping Examples → Canonical
Google Ad Manager

Total impressions → impressions

Total clicks → clicks

Ad server revenue or chosen cost column → spend

Active View measurable impressions → measurable_impressions

Active View viewable impressions → viewable_impressions

Video starts → video_starts; Video plays to end → video_100

DV360 / CM360

Impressions, Clicks, Media cost → impressions, clicks, spend

Total Conversions → conversions

Measurable impressions, Viewable impressions → viewability fields

Quartile 0%, Quartile 100% → video_starts, video_100

Google Ads

Prefer Clicks for clicks; if only Interactions, map to clicks and set click_type = "interaction"

Cost → spend; Impressions → impressions; Conversions → conversions

Meta

impressions → impressions; spend → spend

Clicks policy:

Default: Clicks (All) → clicks

Performance: Link Clicks → clicks; set click_type = "link"

Purchases/selected event sum → conversions

Video: map thruplays carefully (doc if treated as starts); otherwise use video_view for starts and 100% metrics for video_100

TikTok / Other Social Video

Impressions, Clicks, Spend → canonical

Video Views → video_starts; Video Completions (or 100%) → video_100

Example Groupby Math (campaign × date)

Given sums:

impressions=1,234,560; clicks=34,560; spend=18,234.00; conversions=1,240;
video_starts=220,000; video_100=165,000; measurable_impressions=1,100,000; viewable_impressions=770,000

Computed (pre‑rounding):

CTR=0.0280 → 2.80%; CPM=14.77 → $14.77; CPC=0.527 → $0.53; CPA=14.709 → $14.71

CVR=0.0359 → 3.59%; VCR=0.75 → 75.0%; Viewability=0.7 → 70.0%