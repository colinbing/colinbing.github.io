Tile Specifications (Inputs, Encodings, Defaults, Fallbacks)

Global defaults

Time grain: date (daily). User-selectable rollup to weekly/monthly (computed from sums).

Top‑N policy: For high-cardinality dims (site_domain, creative_size, campaign_name), default N=30 (sort by spend else impressions), others bucketed into Other.

Rounding: As per Chat 2 (CTR/CVR 2 dp; VCR/Viewability 1 dp; currency 2 dp).

Nulls: KPI with zero denominators render as —. Rows with all-zero metrics are dropped from charts.

KPI Scorecard

Inputs: None mandatory; renders a card per KPI whose prerequisites exist.

Encodings: Cards with metric, delta vs previous period (if prior period available), and sparkline of the underlying denominator.

Defaults: Show in this order when available: CPM, CPC, CTR, CPA, CVR, VCR, Viewability, ROAS.

Prereqs per KPI:

CTR: impressions + clicks

CPM: impressions + spend

CPC: clicks + spend

CPA: conversions + spend

CVR: clicks + conversions

VCR: video_starts + video_100

Viewability: measurable_impressions + viewable_impressions (fallback denom per policy)

ROAS: revenue + spend

Hide/Fallback: Hide entire tile if fewer than 2 KPI cards can render.

Time Trend

Inputs: date + at least one metric.

Encodings: X=date; Y=lines. Dual-axis when mixing currency and rates.

Defaults: Primary line spend; secondary CTR (if impressions+clicks exist). If CTR not available, show impressions.

Hide/Fallback: If only date present with no metrics → hide.

Channel Mix

Inputs: channel + (spend or impressions).

Encodings: 100% stacked bars by channel across time or single bar for total.

Defaults: Basis=spend; color by channel.

Hide/Fallback: Hide if neither spend nor impressions present.

Top Campaigns Table

Inputs: campaign_name + (spend or impressions).

Encodings: Table columns: Campaign, Spend, Impressions, Clicks, Conversions, CTR, CPC, CPM, CPA.

Defaults: Sort by spend desc (fallback impressions). Top‑N=30.

Hide/Fallback: Hide if both spend and impressions missing.

Geo Map (Country)

Inputs: country + (spend or impressions).

Encodings: Choropleth (fill by metric); tooltip includes CTR/CPA when available.

Defaults: Fill=spend; projection World; exclude —/unknown.

Hide/Fallback: Hide if < 3 unique countries.

Device Split

Inputs: device_type + (spend or impressions).

Encodings: 100% stacked bars.

Defaults: Basis=spend.

Hide/Fallback: Hide if missing both metrics or single category only.

OS Split

Inputs: os + (spend or impressions).

Encodings: Bars.

Defaults: Collapse categories beyond 8 into Other.

Hide/Fallback: Hide if after collapse only one category remains.

Domain/App Performance

Inputs: site_domain or app_bundle + (spend or impressions).

Encodings: Table with KPIs; mini bar for spend.

Defaults: Basis=spend; Top‑N=30.

Hide/Fallback: Hide if dimension absent or metric missing.

Creative Size Performance

Inputs: creative_size + impressions (required); optional clicks, spend, conversions for CTR/CPM/CPA.

Encodings: Horizontal bars by size; optional small multiples by device.

Defaults: Sort by impressions desc; Top‑N=30.

Hide/Fallback: Hide if sizes > 100 (pre-bucketing) or invalid format.

Video Funnel

Inputs: video_starts, video_100; optional quartiles 25/50/75.

Encodings: Funnel (starts→100%).

Defaults: Show VCR prominently.

Hide/Fallback: Hide if video_starts == 0.

Viewability Gauge

Inputs: measurable_impressions, viewable_impressions.

Encodings: Gauge or donut with % viewable.

Defaults: Use measurable as denominator; fallback to impressions with label served.

Hide/Fallback: Hide if both fields missing.

Efficiency Scatter

Inputs: campaign_name, spend, and either conversions or clicks.

Encodings: X=spend; Y=CPA if conversions present else CPC; point size=impressions.

Defaults: Label top outliers by spend.

Hide/Fallback: Hide if neither conversions nor clicks present.

Conversion Funnel (Clicks→Conversions)

Inputs: clicks, conversions.

Encodings: Two-step funnel with CVR label.

Hide/Fallback: Hide if either metric missing.

Anomaly Strip (Daily)

Inputs: date + one of spend/impressions/clicks.

Encodings: Sparkline with z-score markers (|z| ≥ 2).

Defaults: Metric priority: spend → impressions → clicks.

Hide/Fallback: Hide if < 14 days.

Filters (derived from canonical dimensions)

date_range (required; default = last 30 days if available else full span)

channel (multi-select)

campaign_name (searchable multi-select)

adgroup_name (searchable multi-select)

creative_size (multi-select; normalized WxH)

site_domain / app_bundle (searchable multi-select)

device_type, os (multi-select)

country, region, dma (hierarchical; country→region)

Filter behaviors: Filters apply globally; each tile states when it ignores a filter (e.g., Geo ignores region if country is absent). Empty filter = include all.

Acceptance alignment: Each tile documents exact prerequisites and fallback rules. Missing prerequisites hide tiles; defaults specified (basis metric, sort, top‑N, rounding). No ambiguous/empty states render.