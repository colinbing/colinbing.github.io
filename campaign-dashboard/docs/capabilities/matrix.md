Capability Matrix (Tile → Required Fields)

Policy inheritance: Chats 1–3. No raw rows to AI; local-only compute. Tiles unlock if and only if prerequisites are present. If not, tiles are hidden (no disabled/empty states).

Legend

Req. dims: minimal dimension set required to render.

Req. metrics: minimal metric set required to compute default KPI(s).

Optional: enables richer encodings or secondary KPIs.

Tile	Req. dims	Req. metrics	Optional	Notes
KPI Scorecard	—	any of: impressions, clicks, spend, conversions, video_starts, video_100, measurable_impressions, viewable_impressions	revenue, quartiles video_25/50/75	Renders one card per KPI whose prerequisites exist; hide tile if < 2 KPIs available.
Time Trend	date	at least one of: impressions | clicks | spend	pairs to enable CTR/CPM lines	Default lines: spend and CTR (needs impressions+clicks). If pair missing, fallback to available single-metric lines.
Channel Mix (100% stacked)	channel	spend | impressions	conversions (for color by CPA buckets)	Default basis: spend; fallback to impressions. Hide if both missing.
Top Campaigns Table	campaign_name	one of: spend | impressions	clicks, conversions, viewability, quartiles	Shows computed KPIs only when prerequisites exist.
Geo Map (Country)	country	spend | impressions	conversions (tooltip), ctr, cpm	Choropleth keyed by country. Hide if < 3 countries present.
Device Split	device_type	spend | impressions	clicks, conversions	100% stacked bars by default.
OS Split	os	spend | impressions	—	Hide if >8 OS categories collapse to Other.
Domain/App Performance	site_domain | app_bundle	spend | impressions	clicks, conversions	Table with top-N rule.
Creative Size Performance	creative_size	impressions	clicks, spend (for CTR/CPM), conversions (CPA)	Requires size format WxH. Hide if >100 sizes; show top 30 by impressions.
Video Funnel	—	video_starts, video_100	video_25/50/75 (for full funnel), impressions (VTR)	Hide if video_starts == 0.
Viewability Gauge	—	measurable_impressions, viewable_impressions	impressions (fallback denom rule)	Hide if both viewability fields missing.
Efficiency Scatter	campaign_name	spend and (conversions | clicks)	impressions (size)	If conversions present plot CPA; else plot CPC. Hide if neither conversions nor clicks present.
Conversion Funnel	—	clicks, conversions	—	Single-step funnel (Clicks → Conversions). Hide if either missing.
Anomaly Strip (Daily)	date	one of: spend | impressions | clicks	—	Uses simple z-score; no AI. Hide if < 14 days of data.

Hiding rules: If prerequisites fail, the tile does not render nor appear in the catalog list.