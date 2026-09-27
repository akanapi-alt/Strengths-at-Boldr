# Boldr Strengths Site v17

Static, GitHub Pages compatible Boldr CliftonStrengths experience.

## Pages

- `index.html` — Overview and CliftonStrengths framework
- `grid.html` — Explore People: person discovery, Card view and paginated Matrix view
- `insights.html` — Strengths Insights: aggregate patterns, domain/theme representation, location analysis and Excel export
- `profile.html` — Individual strengths profile

## Product structure

- **Explore People** answers *who?* It owns name/role search, Domain, Strength, Department, Location and Status filtering, person cards, individual profiles and the person-by-theme Matrix.
- **Strengths Insights** answers *what patterns?* It owns Location, Department, Status and Top 5/Top 10 analysis scope, aggregate domain/theme analysis, location analysis and the analytical Excel report.
- Shared Location, Department and Status population matching helpers live in `assets/common.js`.

## v17 updates

- Added **Download filtered matrix ↓** to Matrix view. The export includes the full currently filtered population, not only the visible 25-row page.
- Filtered Matrix Excel contains profile context plus all 34 themes grouped by domain, preserves rank 1–10 cells, applies domain-based rank intensity, includes the current filter context, and freezes profile/header context for easier review.
- Matrix export remains distinct from the Strengths Insights Excel report: Explore People exports person-level ranked data, while Strengths Insights exports aggregate analysis.
- Theme Coverage companion card now uses the same visual hierarchy, spacing, typography, and restrained Boldr accents as the adjacent Insights widgets.
- Gallup learning handoff is tighter and expressed as one concise sentence while preserving the existing official-resource link.
- Existing v14 analytical denominator logic remains synchronized between the live Insights page and its downloadable Excel report.

## Data

The source data structure is unchanged.

- 215 profiles
- 126 Active
- 89 Inactive
- 34 CliftonStrengths themes
- 4 domains

Status rule: ACTIVE = Active; TERMINATED and blank employment status = Inactive.


## v17 updates

- Rebuilt the Explore People filtered Matrix Excel export on the same workbook/download foundation used by Strengths Insights.
- Matrix export now includes a branded Report Summary sheet plus the complete filtered 34-theme matrix, independent of on-screen pagination.
- Both Excel download experiences now share the same browser download utility and show a clear error if export generation fails.
- Refined Theme Coverage into a compact dashboard companion with balanced metric tiles and aligned data-coverage context.
