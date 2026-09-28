# Boldr Strengths Site v21

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

## v21 updates

- Fixed the structural cause of Theme Coverage misalignment by giving the right-hand Insights card the same 18px × 20px content padding as Theme Representation.
- Preserved the approved Theme Coverage hierarchy while aligning headings, dividers, prevalence metrics and the contributing-profile note to one shared content grid.
- Reduced visual drift by making the filtered “What stands out” state inherit the same card geometry.
- Simplified the dark Insights interpretation note into one compact desktop line, with responsive wrapping on smaller screens.
- Preserved all v20 functionality, filters, profile behavior, Matrix behavior and Excel exports.

## Data

The underlying source data structure is unchanged.

- 215 profiles
- 126 Active
- 89 Inactive
- 34 CliftonStrengths themes
- 4 domains

Status rule: ACTIVE = Active; TERMINATED and blank employment status = Inactive.
