# peaka-mcp-server

Model Context Protocol (MCP) is a [new, standardized protocol](https://modelcontextprotocol.io/introduction) for managing context between large language models (LLMs) and external systems.

Peaka Model Context Protocol server that provides access to Peaka's text2SQL capabilities.

This server enables LLMs to inspect schemas and execute sql queries on provided Peaka projects.

## Components

### Resources

- `peaka_sql_query_rule_set`
  - Peaka SQL Query Rule Set is guidelines for writing sql queries for Peaka.
- `peaka_artifact_template`
  - Style guide and HTML template for generating visual reports, dashboards, and artifacts from Peaka query results.

### Tools

Every project-scoped tool takes a `projectId` argument. If the MCP client does not already know the projectId, it should call `peaka_list_projects` first and pass the chosen id to subsequent calls. The server itself is stateless with respect to project selection — each call carries its own projectId.

- `peaka_list_projects`
  - List all projects accessible with the current API key. For Partner API keys, enumerates projects across all organizations and workspaces. For Project API keys, returns the single project bound to the key.
- `peaka_query_golden_sqls`
  - Query question/sql pairs from Peaka's golden sql vector store. If an existing query matches the user's question, it can be reused directly.
- `peaka_execute_sql_query`
  - Runs the given sql query on Peaka.
- `peaka_get_project_metadata`
  - Get metadata for all catalogs, schemas, and tables in the Peaka project in a single call. Optionally filter by `catalogId` and/or `schemaName`.
- `peaka_list_catalogs`
  - List all available catalogs in the Peaka project. Returns catalog names, types, and connection info.
- `peaka_list_schemas`
  - List all available schemas for a given catalog in the Peaka project.
- `peaka_list_tables`
  - List all available tables for a given catalog and schema in the Peaka project.
- `peaka_list_columns`
  - List all columns for a given table in the Peaka project. Returns column names, data types, and constraints.
- `peaka_get_relations`
  - Get table relationships (foreign keys) for a catalog. Useful for constructing accurate JOINs.
- `peaka_get_table_statistics`
  - Get column-level statistics for a table, including distinct-value fractions per column.
- `peaka_create_cache`
  - Create a cache for a table in the Peaka project. Caching a table improves query performance by storing the data locally.
- `peaka_create_cache_batch`
  - Create caches for multiple tables in a single call. Preferred over repeated `peaka_create_cache` calls.
- `peaka_get_cache_statuses`
  - Get all cache statuses for tables in the Peaka project, including current caching state, execution history, and progress.
- `peaka_refresh_cache_full`
  - Trigger a full refresh on an existing cache.
- `peaka_refresh_cache_incremental`
  - Trigger an incremental update on an existing cache, fetching only new or changed rows.
- `peaka_update_cache`
  - Update cache settings (schedules) on an existing cache. Replaces both schedules entirely each call.
- `peaka_delete_cache`
  - Delete an existing cache; the underlying table is not affected.
- `peaka_list_queries`
  - List all saved queries in the Peaka project. Returns query names, SQL content, and whether they are plain or materialized.
- `peaka_execute_query`
  - Execute a saved query by its ID in the Peaka project.
- `peaka_create_query`
  - Create a named, saved query in the project's semantic layer. Returns the created query including its ID. For materialized queries, accepts an optional `schedule` (ISO-8601 duration, e.g. `PT6H`) to set the auto-refresh interval.
- `peaka_update_query`
  - Update an existing saved query's display name, SQL body, and/or auto-refresh `schedule` (ISO-8601 duration, materialized queries only).
- `peaka_delete_query`
  - Delete a saved query from the Peaka project.
- `peaka_refresh_materialized_query`
  - Trigger a refresh on a materialized saved query. Use `peaka_list_queries` to find query IDs whose `queryType` is `MATERIALIZED`.
- `peaka_get_materialized_query_statuses`
  - Inspect the auto-refresh state of materialized queries: last refresh status, last/next scheduled execution, and schedule settings. Pass a `queryId` for a single query or omit it to list all.
- `peaka_list_connections`
  - List all data source connections in the Peaka project, including each connection's id, name, and type.
- `peaka_get_connection_detail`
  - Get connection-specific configuration detail for a data source connection.
- `peaka_create_semantic_catalog`
  - Create a semantic catalog in the Peaka project. A semantic catalog groups semantic tables (saved queries surfaced as queryable tables) under a single namespace.
- `peaka_create_semantic_table`
  - Create a semantic table inside a semantic catalog, backed by a saved query. Requires `catalogId`, `schemaName`, `tableName`, and `queryId`.
- `peaka_delete_semantic_table`
  - Delete a semantic table from a semantic catalog. The underlying saved query is not affected.
- `peaka_refresh_project_metadata`
  - Refresh project metadata for a specific catalog. Long-running; triggers the refresh and polls for completion.
- `peaka_get_metadata_refresh_status`
  - Check the current status of a metadata refresh job for a specific catalog.

## Usage with Claude Desktop

- Edit the configuration file `config.json`:
  - on macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - on Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Add the following configuration to the `mcpServers` object:

```json
{
  "mcpServers": {
    "peaka": {
      "command": "npx",
      "args": ["-y", "@peaka/mcp-server-peaka@latest"],
      "env": {
        "PEAKA_API_KEY": "<YOUR_API_KEY>"
      }
    }
  }
}
```

Change the `{PEAKA_API_KEY}` with your project API Key. Check out Peaka Documentation for creating your API Key and follow detailed instructions by clicking [here](https://docs.peaka.com/how-to-guides/how-to-generate-api-keys).

- Restart Claude Desktop

## Packaging as a Claude Desktop extension

This repo ships with a `pack` script that builds the server and then runs `mcpb pack` (from [`@anthropic-ai/mcpb`](https://www.npmjs.com/package/@anthropic-ai/mcpb)) to produce a `.mcpb` bundle — a zip-like archive containing the built server and `manifest.json` that Claude Desktop can load as a custom MCP extension.

```bash
npm run pack
```

This produces `peaka-mcp-server.mcpb` at the repo root. To install it, open Claude Desktop → Settings → Extensions -> Advanced Settings -> Install Extension -> Select the `.mcpb` file -> Enter your API key when prompted and enable the extension.

## Environment variables

You can use following environment variable for configuration:

| Name                 | Description                                             | Default Value                       |
| -------------------- | ------------------------------------------------------- | ----------------------------------- |
| PEAKA_API_KEY        | Project API key for authenticating with Peaka services. | -                                   |
| PARTNER_API_BASE_URL | Base URL for Peaka partner API                          | https://partner.peaka.studio/api/v1 |
| OAUTH_AUTHORIZATION_SERVER_URL      | Protected-resource metadata URL advertised in the `WWW-Authenticate` header on 401 responses (httpStream mode). | -                                   |

## Contact

For feature requests and bugs, please create an issue in this repo. For further support, see the following resources:

- [Peaka Community Discord](https://discord.com/invite/peaka)
