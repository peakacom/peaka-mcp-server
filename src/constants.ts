export const DEFAULT_PEAKA_PARTNER_API_BASE_URL =
  "https://partner.peaka.studio/api/v1";

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

export const GET_CACHE_STATUSES_URL_TEMPLATE = ({
  projectId,
}: {
  projectId: string;
}) => `data/projects/${projectId}/cache/status`;

export const LIST_QUERIES_URL_TEMPLATE = ({
  projectId,
}: {
  projectId: string;
}) => `data/projects/${projectId}/queries`;

export const EXECUTE_QUERY_URL_TEMPLATE = ({
  projectId,
}: {
  projectId: string;
}) => `data/projects/${projectId}/queries/execute`;

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

export const TRANSPILE_TRINO_SQL_URL_TEMPLATE = ({
  dialect,
}: {
  dialect: string;
}) => `sql/transpile/${dialect}`;

export const LIST_ORGANIZATIONS_URL = () => `organizations`;

export const LIST_WORKSPACES_URL_TEMPLATE = ({
  organizationId,
}: {
  organizationId: string;
}) => `organizations/${organizationId}/workspaces`;

export const LIST_PROJECTS_URL_TEMPLATE = ({
  organizationId,
  workspaceId,
}: {
  organizationId: string;
  workspaceId: string;
}) => `organizations/${organizationId}/workspaces/${workspaceId}/projects`;

export const PEAKA_SQL_RULE_SET = `Double check the Trino SQL query above for common mistakes, including:
 -  Include catalog and schema prefices in your queries and wrap catalog and schema prefices with double quotes. Use table aliases. Wrap table names with double quotations if it contains spaces.
 -  Use single quotes for varchar columns.
  - Using NOT IN with NULL values
  - Using UNION when UNION ALL should have been used
  - Using BETWEEN for exclusive ranges
  - Data type mismatch in predicates
  - Properly quoting identifiers
  - Using the correct number of arguments for functions
  - Casting to the correct data type
  - Using the proper columns for joins
  - Misspelling SQL keywords
  - Forgetting Brackets and Quotes
  - Specifying an Invalid Statement Order
  - Omitting Table Aliases
  - Using Case-Sensitive Names
  - Incorrect order when writing queries
  - Using UNION when UNION ALL should have been used
  - Avoid NOT IN or IN and Use JOIN instead
  - Incorrectly Using Wildcard
  - Unbalanced Quotes
  - The OR operator is not applied correctly
  - Missing closing parenthesis in the WHERE clause
  - Using double quotes instead of single quotes to define the string value
  - Using a comma instead of the logical operator "AND" between two conditions in the WHERE clause
  - Mismatched Column Names in JOIN
  - Incorrect Syntax for LIMIT
  - Invalid ORDER BY Column
  - Missing Alias for Subquery
  - Missing AS Keyword in Column Aliasing
  - Do not use an alias defined in the SELECT clause in the GROUP BY clause. Instead, you should use the full expression that defines the alias Eg: The query "SELECT DATE_TRUNC('week', p.creationtime) AS week, c.title, COUNT(p.id) AS purchase_count FROM firebase.main.purchases p JOIN firebase.main.contents c ON c.id = JSON_EXTRACT_SCALAR(p.purchasedcontentids, '$[0]') WHERE p.creationtime >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1' month GROUP BY week, c.title" should be like this "SELECT DATE_TRUNC('week', p.creationtime) AS week, c.title, COUNT(p.id) AS purchase_count FROM firebase.main.purchases p JOIN firebase.main.contents c ON c.id = JSON_EXTRACT_SCALAR(p.purchasedcontentids, '$[0]') WHERE p.creationtime >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1' month GROUP BY DATE_TRUNC('week', p.creationtime), c.title"
  - Incorrect Table Name Spelling
  - Using Aggregate Functions without GROUP BY
  - Incorrectly Using NOT IN
  - Missing Comparison Operator
  - Missing JOIN Condition
  - Ambiguous Column Names
  - Incorrect Syntax for CASE Statement
  - Avoid using WHERE for Joining
  - Avoid column names in GROUP BY statements and USE column order instead
  - HAVING clause cannot contain window functions or row pattern measures.
  - Provide SQL code using Trino's FROM_ISO8601_TIMESTAMP(string date) function only for columns of type varchar that contain valid date strings. Do not use FROM_ISO8601_TIMESTAMP on columns of type date, timestamp, or timestamp(n). Instead, handle those types directly without transformation. Be strict about this rule and ensure the type checking is followed.
  - Do not use JSON_CONTAINS in your queries.
  - DO NOT make any DML statements (INSERT, UPDATE, DELETE, DROP etc.) to the database.
  - Do not use date string for timestamp columns. 
  - Put quotation only around numbers when using interval in queries.
  
If there are any of the above mistakes, rewrite the query. If there are no mistakes, just reproduce the original query.`;

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
