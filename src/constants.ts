/** This server's version; also in package.json and manifest.json. */
export const PEAKA_MCP_VERSION = "0.15.2";

/**
 * Sent with every Partner API call. The gateway passes it on, and Query History shows
 * "Partner API · Peaka MCP 0.15.2" instead of axios's default agent.
 */
export const PEAKA_MCP_USER_AGENT = `peaka-mcp-server/${PEAKA_MCP_VERSION}`;

export const DEFAULT_PEAKA_PARTNER_API_BASE_URL =
  "https://partner.peaka.studio/api/v1";

export const DEFAULT_PORT = 3000;

// Default request timeout (ms) applied to all Partner API calls. Overridable
// per connection via the `timeoutSeconds` query parameter on the MCP endpoint
// (e.g. `<mcp-url>?timeoutSeconds=120`), so a slow or on-prem deployment
// (e.g. Turkcell) can be tuned from the URL without a rebuild.
export const DEFAULT_TIMEOUT_MS = 60000;

// Upper bound for `timeoutSeconds`. Values above it fall back to the default,
// so a unit mistake (e.g. `timeoutSeconds=60000` meant as ms) can't hold a
// request open for hours.
export const MAX_TIMEOUT_SECONDS = 600;

export const QUERY_GOLDEN_SQL_URL_TEMPLATE = ({
  projectId,
  query,
}: {
  projectId: string;
  query: string;
}) => `metadata/${projectId}/golden-sql/query?q=${query}`;

export const QUERY_TABLE_METADATA_URL_TEMPLATE = ({
  projectId,
  tableName,
}: {
  projectId: string;
  tableName: string;
}) => `metadata/${projectId}/query?table=${tableName}`;

export const LIST_CATALOGS_URL_TEMPLATE = ({
  projectId,
}: {
  projectId: string;
}) => `data/projects/${projectId}/catalogs`;

export const LIST_SCHEMAS_URL_TEMPLATE = ({
  projectId,
  catalogId,
}: {
  projectId: string;
  catalogId: string;
}) => `data/projects/${projectId}/catalogs/${catalogId}/schemas`;

export const LIST_TABLES_URL_TEMPLATE = ({
  projectId,
  catalogId,
  schemaName,
}: {
  projectId: string;
  catalogId: string;
  schemaName: string;
}) => `data/projects/${projectId}/catalogs/${catalogId}/schemas/${schemaName}/tables`;

export const LIST_COLUMNS_URL_TEMPLATE = ({
  projectId,
  catalogId,
  schemaName,
  tableName,
}: {
  projectId: string;
  catalogId: string;
  schemaName: string;
  tableName: string;
}) =>
  `data/projects/${projectId}/catalogs/${catalogId}/schemas/${schemaName}/tables/${tableName}/columns`;

export const CREATE_CACHE_URL_TEMPLATE = ({
  projectId,
}: {
  projectId: string;
}) => `data/projects/${projectId}/cache`;

export const CREATE_CACHE_BATCH_URL_TEMPLATE = ({
  projectId,
}: {
  projectId: string;
}) => `data/projects/${projectId}/cache/batch`;

export const GET_CACHE_STATUSES_URL_TEMPLATE = ({
  projectId,
}: {
  projectId: string;
}) => `data/projects/${projectId}/cache/status`;

export const REFRESH_CACHE_FULL_URL_TEMPLATE = ({
  projectId,
  cacheId,
}: {
  projectId: string;
  cacheId: string;
}) => `data/projects/${projectId}/cache/${cacheId}/fullRefreshUpdate`;

export const REFRESH_CACHE_INCREMENTAL_URL_TEMPLATE = ({
  projectId,
  cacheId,
}: {
  projectId: string;
  cacheId: string;
}) => `data/projects/${projectId}/cache/${cacheId}/incrementalUpdate`;

export const UPDATE_CACHE_URL_TEMPLATE = ({
  projectId,
  cacheId,
}: {
  projectId: string;
  cacheId: string;
}) => `data/projects/${projectId}/cache/${cacheId}`;

export const DELETE_CACHE_URL_TEMPLATE = ({
  projectId,
  cacheId,
}: {
  projectId: string;
  cacheId: string;
}) => `data/projects/${projectId}/cache/${cacheId}`;

export const CREATE_SEMANTIC_CATALOG_URL_TEMPLATE = ({
  projectId,
}: {
  projectId: string;
}) => `data/projects/${projectId}/semantic-catalogs`;

export const CREATE_SEMANTIC_TABLE_URL_TEMPLATE = ({
  projectId,
  catalogId,
}: {
  projectId: string;
  catalogId: string;
}) => `data/projects/${projectId}/semantic-catalogs/${catalogId}`;

export const DELETE_SEMANTIC_TABLE_URL_TEMPLATE = ({
  projectId,
  catalogId,
  tableId,
}: {
  projectId: string;
  catalogId: string;
  tableId: string;
}) => `data/projects/${projectId}/semantic-catalogs/${catalogId}/table/${tableId}`;

export const LIST_QUERIES_URL_TEMPLATE = ({
  projectId,
}: {
  projectId: string;
}) => `data/projects/${projectId}/queries`;

export const CREATE_QUERY_URL_TEMPLATE = ({
  projectId,
}: {
  projectId: string;
}) => `data/projects/${projectId}/queries`;

export const GET_QUERY_URL_TEMPLATE = ({
  projectId,
  queryId,
}: {
  projectId: string;
  queryId: string;
}) => `data/projects/${projectId}/queries/${queryId}`;

export const UPDATE_QUERY_URL_TEMPLATE = ({
  projectId,
  queryId,
}: {
  projectId: string;
  queryId: string;
}) => `data/projects/${projectId}/queries/${queryId}`;

export const DELETE_QUERY_URL_TEMPLATE = ({
  projectId,
  queryId,
}: {
  projectId: string;
  queryId: string;
}) => `data/projects/${projectId}/queries/${queryId}`;

export const EXECUTE_QUERY_URL_TEMPLATE = ({
  projectId,
}: {
  projectId: string;
}) => `data/projects/${projectId}/queries/execute`;

export const REFRESH_MATERIALIZED_QUERY_URL_TEMPLATE = ({
  projectId,
  queryId,
}: {
  projectId: string;
  queryId: string;
}) => `data/projects/${projectId}/materialized-queries/${queryId}/refresh`;

export const LIST_MATERIALIZED_QUERY_STATUSES_URL_TEMPLATE = ({
  projectId,
}: {
  projectId: string;
}) => `data/projects/${projectId}/materialized-queries/status`;

export const GET_MATERIALIZED_QUERY_STATUS_URL_TEMPLATE = ({
  projectId,
  queryId,
}: {
  projectId: string;
  queryId: string;
}) => `data/projects/${projectId}/materialized-queries/${queryId}/status`;

export const GET_PROJECT_METADATA_URL_TEMPLATE = ({
  projectId,
}: {
  projectId: string;
}) => `metadata/${projectId}`;

export const REFRESH_PROJECT_METADATA_URL_TEMPLATE = ({
  projectId,
}: {
  projectId: string;
}) => `metadata/${projectId}/refresh`;

export const GET_METADATA_REFRESH_STATUS_URL_TEMPLATE = ({
  projectId,
  catalogId,
}: {
  projectId: string;
  catalogId: string;
}) => `metadata/${projectId}/refresh/${catalogId}`;

export const GET_RELATIONS_URL_TEMPLATE = ({
  projectId,
  catalogId,
}: {
  projectId: string;
  catalogId: string;
}) => `metadata/${projectId}/relations/${catalogId}`;

export const GET_TABLE_STATISTICS_URL_TEMPLATE = ({
  projectId,
  catalogId,
  schemaName,
  tableName,
}: {
  projectId: string;
  catalogId: string;
  schemaName: string;
  tableName: string;
}) =>
  `data/projects/${projectId}/catalogs/${catalogId}/schemas/${schemaName}/tables/${tableName}/statistics`;

export const TRANSPILE_TRINO_SQL_URL_TEMPLATE = ({
  dialect,
}: {
  dialect: string;
}) => `sql/transpile/${dialect}`;

export const LIST_ALL_PROJECTS_URL = () => `projects`;

export const LIST_CONNECTIONS_URL_TEMPLATE = ({
  projectId,
}: {
  projectId: string;
}) => `connections/${projectId}`;

export const GET_CONNECTION_DETAIL_URL_TEMPLATE = ({
  projectId,
  connectionId,
}: {
  projectId: string;
  connectionId: string;
}) => `connections/${projectId}/${connectionId}/detail`;

/**
 * Trino SQL rules for peaka_execute_sql_query (DEV-4185). The earlier list was long, contradicted itself (GROUP BY
 * by the full expression and by the column order) and gave wrong advice (avoid IN, use JOIN). This one is short and
 * Trino-specific; the error loop does the rest: a failing query comes back with Trino's message, line and column.
 */
export const PEAKA_SQL_RULE_SET = `Peaka runs Trino SQL. Read-only: SELECT and WITH only.
- Tables: catalog.schema.table as listed. Unquoted names are case-insensitive; double-quote a name only if it has capitals, spaces or other special characters.
- Literals: strings in single quotes; DATE '2025-01-31', TIMESTAMP '2025-01-31 10:00:00', INTERVAL '30' DAY.
- Integer division truncates (7 / 2 = 3): CAST to DOUBLE or DECIMAL for ratios and averages of integers.
- Dates: date_trunc('month', ts), date_diff('day', a, b), date_add('day', 7, d). Compare timestamp columns with TIMESTAMP or DATE values, not strings; from_iso8601_timestamp only for varchar ISO strings.
- NOT IN returns no rows when the list or subquery holds a NULL: use NOT EXISTS.
- GROUP BY a select position (GROUP BY 1, 2) or the full expression, not a SELECT alias.
- Exact counts with COUNT(DISTINCT x); approx_distinct is approximate.
- JSON: json_extract_scalar(col, '$.field') returns varchar.
- Aggregate in SQL (COUNT, SUM, GROUP BY) instead of reading rows and adding them up.
- On an error, read Trino's message, line and column, fix that part and run again.`;

export const PEAKA_ARTIFACT_TEMPLATE = `When generating an HTML artifact (report, dashboard, or visualization) from Peaka query results, follow these style and structure rules exactly:

## Document Structure

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{{Report Title}}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    /* --- Base --- */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      padding: 2rem;
      line-height: 1.6;
    }

    /* --- Layout --- */
    .report-header { margin-bottom: 2rem; }
    .report-header h1 { font-size: 1.75rem; font-weight: 700; color: #f8fafc; }
    .report-header p  { font-size: 0.875rem; color: #94a3b8; margin-top: 0.25rem; }

    .grid        { display: grid; gap: 1.5rem; margin-bottom: 1.5rem; }
    .grid-2      { grid-template-columns: repeat(2, 1fr); }
    .grid-3      { grid-template-columns: repeat(3, 1fr); }
    .grid-4      { grid-template-columns: repeat(4, 1fr); }
    .grid-full   { grid-template-columns: 1fr; }

    /* --- Cards --- */
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 0.75rem;
      padding: 1.5rem;
    }
    .card-title {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
      margin-bottom: 0.75rem;
    }

    /* --- KPI / Stat Cards --- */
    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #f8fafc;
    }
    .stat-label {
      font-size: 0.8125rem;
      color: #94a3b8;
      margin-top: 0.25rem;
    }
    .stat-change {
      font-size: 0.8125rem;
      font-weight: 500;
      margin-top: 0.5rem;
    }
    .stat-change.positive { color: #34d399; }
    .stat-change.negative { color: #f87171; }

    /* --- Tables --- */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    thead th {
      text-align: left;
      padding: 0.75rem 1rem;
      font-weight: 600;
      color: #94a3b8;
      border-bottom: 1px solid #334155;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    tbody td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #1e293b;
    }
    tbody tr:hover { background: #334155; }

    /* --- Charts --- */
    .chart-container {
      position: relative;
      width: 100%;
      height: 300px;
    }

    /* --- Print / PDF --- */
    @media print {
      body { background: #ffffff; color: #1e293b; padding: 1rem; }
      .card { background: #f8fafc; border-color: #e2e8f0; break-inside: avoid; }
      .card-title { color: #475569; }
      .stat-value { color: #0f172a; }
      .stat-label, .report-header p { color: #64748b; }
      thead th { color: #475569; border-bottom-color: #e2e8f0; }
      tbody td { border-bottom-color: #f1f5f9; }
      tbody tr:hover { background: transparent; }
      .stat-change.positive { color: #059669; }
      .stat-change.negative { color: #dc2626; }
    }
  </style>
</head>
<body>
  <!-- Content goes here -->
</body>
</html>
\`\`\`

## Accent Color Palette

Assign colors consistently per division, category, or series. Use the following ordered palette:

| Index | Name       | Hex       | Use for                        |
|-------|------------|-----------|--------------------------------|
| 0     | Blue       | #3b82f6   | Primary series / default       |
| 1     | Emerald    | #10b981   | Secondary / positive values    |
| 2     | Amber      | #f59e0b   | Tertiary / warnings            |
| 3     | Rose       | #f43f5e   | Quaternary / negative values   |
| 4     | Violet     | #8b5cf6   | Fifth series                   |
| 5     | Cyan       | #06b6d4   | Sixth series                   |
| 6     | Orange     | #f97316   | Seventh series                 |
| 7     | Pink       | #ec4899   | Eighth series                  |

For Chart.js, set these as \`backgroundColor\` (with alpha \`33\` for fills) and \`borderColor\`.

## Chart.js Conventions

- Always wrap \`<canvas>\` in a \`.chart-container\` div and set \`maintainAspectRatio: false\` in options.
- Use the accent palette above for datasets, in order.
- Grid lines: \`color: '#334155'\`; tick labels: \`color: '#94a3b8'\`.
- Tooltip: \`backgroundColor: '#1e293b'\`, \`borderColor: '#334155'\`, \`titleColor: '#f8fafc'\`, \`bodyColor: '#e2e8f0'\`.
- Legend labels: \`color: '#94a3b8'\`.
- For print, Chart.js renders to canvas so colors remain as-is; this is acceptable.

## Rules

1. The report MUST be a single self-contained HTML file with no external dependencies other than Google Fonts and Chart.js CDN.
2. All data must be embedded inline as JavaScript variables — never use fetch() or external data files.
3. Use semantic markup: \`<header>\`, \`<main>\`, \`<section>\`, \`<table>\`, etc.
4. Numbers should be formatted with locale-aware separators (e.g. \`toLocaleString()\`).
5. Currency values should include the appropriate symbol.
6. Percentages should show one decimal place.
7. Dates should be formatted as readable strings (e.g. "Mar 30, 2026").
8. Include a timestamp in the report header showing when the report was generated.
9. Keep the grid responsive: use \`grid-2\` for KPI rows, \`grid-full\` for wide charts/tables.
10. Every chart and table must have a descriptive \`.card-title\`.`;

/**
 * The MCP server's instructions: clients such as Claude Code put them in the model's prompt before any tool is loaded,
 * while a tool's description is read only after the model has picked the tool by its name. So the route to a data
 * question's tables is said here; the rules a single tool needs stay in its description.
 */
export const PEAKA_SERVER_INSTRUCTIONS = `Peaka answers data questions with SQL over a project's catalogs.

To find the tables for a question, use two calls instead of listing catalogs, schemas, tables and columns one by one:
1. peaka_list_project_tables lists every table of the project, grouped by catalog.schema, in one line each: its name, [cached] when cached, a short description, some column names and joins.
2. peaka_get_project_metadata with tables=["catalog.schema.table", ...] returns the chosen tables' columns, types, descriptions and relations in one call.
Then run SQL with peaka_execute_sql_query. If the project is too large to list, the first call returns its schemas: list one schema, or use peaka_search_relevant_tables.

Answering:
- Say what the numbers cover: tables, filters, time window. When a result is cut (truncated) or a SaaS table was read live, say it may be incomplete.
- An unknown is not zero: when the data cannot answer (a missing table, no field to match on, a partial read), say it cannot be determined; never give 0 or "none" for it.
- State units and assumptions (currency, cents or units, time zone); when the data has no unit, say so.

A table of a SaaS source that is not marked [cached] is read live, and a live read may return only its first page of records: say so instead of presenting it as the whole table. A database table (e.g. Oracle) is read live and in full; caching it does not help. The list gives this in each schema's header. Do not create caches to work around a failing or slow query, and create one only when the user asks for it or agrees.`;
