# peaka-mcp-server

Model Context Protocol (MCP) is a [new, standardized protocol](https://modelcontextprotocol.io/introduction) for managing context between large language models (LLMs) and external systems.

Peaka Model Context Protocol server that provides access to Peaka's text2SQL capabilities.

This server enables LLMs to inspect schemas and execute sql queries on provided Peaka projects.

## Components

### Resources

- `peaka_sql_query_rule_set`
  - Peaka SQL Query Rule Set is guidelines for writing sql queries for Peaka.

### Tools

- `peaka_schema_retriever`
  - Retrieve table metadata and schema. Metadata has column types and relationships of the table with other tables.
- `peaka_query_golden_sqls`
  - Query question/sql pairs from Peaka's golden sql vector store.
- `peaka_execute_sql_query`
  - Runs the given sql query on Peaka.

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

## Environment variables

You can use following environment variable for configuration:

| Name                 | Description                                                          | Default Value                       |
| -------------------- | -------------------------------------------------------------------- | ----------------------------------- |
| DBC_BASE_URL         | Base URL for the Peaka Data operations, used for running sql queries | https://dbc.peaka.host:4567         |
| PEAKA_API_KEY        | Project API key for authenticating with Peaka services.              | -                                   |
| PARTNER_API_BASE_URL | Base URL for Peaka partner API                                       | https://partner.peaka.studio/api/v1 |

## Contact

For feature requests and bugs, please create an issue in this repo. For further support, see the following resources:

- [Peaka Community Discord](https://discord.com/invite/peaka)
