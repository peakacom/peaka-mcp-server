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
- `peaka_create_cache`
  - Create a cache for a table in the Peaka project. Caching a table improves query performance by storing the data locally.
- `peaka_get_cache_statuses`
  - Get all cache statuses for tables in the Peaka project, including current caching state, execution history, and progress.
- `peaka_list_queries`
  - List all saved queries in the Peaka project. Returns query names, SQL content, and whether they are plain or materialized.
- `peaka_execute_query`
  - Execute a saved query by its ID in the Peaka project.
- `peaka_list_projects`
  - List all projects accessible with the current API key, across all organizations and workspaces. Also shows the currently active project.
- `peaka_select_project`
  - Set the active project for the session. All subsequent tool calls will use this project. Pass an empty string to reset to the default project.
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

## Contact

For feature requests and bugs, please create an issue in this repo. For further support, see the following resources:

- [Peaka Community Discord](https://discord.com/invite/peaka)
