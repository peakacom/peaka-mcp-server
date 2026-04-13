#!/usr/bin/env node
import { FastMCP, UserError } from "fastmcp";
import { z } from "zod";
import "dotenv/config";
import { APIService } from "./api.service";
import { PEAKA_SQL_RULE_SET, PEAKA_ARTIFACT_TEMPLATE } from "./constants";
import type { ProjectMetadataResponse, ColumnMetadata } from "./types";

const server = new FastMCP({
  name: "Peaka",
  version: "1.0.0",
});

const apiService = APIService.Instance;

// Filters metadata to reduce token usage for LLMs:
// - Removes system columns (e.g. _q_pagination_anchor, _q_offset)
// - Strips isCategorical when false
// - Strips categoricalValues when empty
// - Normalizes columnDescription from string "null" to ""
function filterMetadataResponse(data: ProjectMetadataResponse): ProjectMetadataResponse {
  return {
    metadata: data.metadata.map((entry) => ({
      ...entry,
      metadata: {
        ...entry.metadata,
        columns: entry.metadata.columns
          ?.filter((col) => !col.isSystem)
          .map((col) => {
            const filtered: ColumnMetadata = { ...col };
            if (filtered.columnDescription === "null") {
              filtered.columnDescription = "";
            }
            if (!filtered.isCategorical) {
              delete filtered.isCategorical;
            }
            if (
              !filtered.categoricalValues ||
              filtered.categoricalValues.length === 0
            ) {
              delete filtered.categoricalValues;
            }
            return filtered;
          }),
      },
    })),
  };
}

server.addTool({
  name: "peaka_query_golden_sqls",
  description:
    `Query question/sql pairs from Peaka's golden sql vector store.
    If you find an existing query matching the user's question, just use it.
    Otherwise use the other tools to figure out the tables and write the query`,
  parameters: z.object({
    query: z.string(),
  }),
  execute: async (args, { log }) => {
    try {
      await apiService.ensureReady();
      const query = args.query;
      const result = await apiService.queryForGoldenSqls(query);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      if (error instanceof UserError) throw error;
      log.error("Error querying golden sqls", JSON.stringify(error));
      throw new UserError("Error querying golden sqls. Check your api key.");
    }
  },
});

server.addTool({
  name: "peaka_execute_sql_query",
  description:
    `Runs the given sql query on Peaka.

    BEFORE RUNNING THIS TOOL:
      1: Use peaka_get_project_metadata to determine which tables should be used in the query and their schemas.
      2: Use peaka_list_tables to determine if the tables of interest are cached or not (this response has isCached property)
      3: If one or more tables that you need to query are cacheable but not cached:
        3a: Warn the user that the results will be limited and ask if you should start the caching process for those tables, and start the caching process using the create cache tool
        3b: If the caching is rejected by the user, warn them that the query results will be limited and use LIMIT statements on the query to make sure it doesn't run forever`,
  parameters: z.object({
    query: z.string(),
  }),
  execute: async (args, { log, reportProgress }) => {
    try {
      await apiService.ensureReady();
      const query = args.query;
      reportProgress({
        progress: 0,
        total: 100,
      });

      const transpiledQuery = await apiService.transpileQueryToTrinoDialect(
        query
      );

      reportProgress({
        progress: 50,
        total: 100,
      });

      const result = await apiService.executeSQLStatement(transpiledQuery.query);

      reportProgress({
        progress: 100,
        total: 100,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      if (error instanceof UserError) throw error;
      log.error(
        `Error executing sql query ${args.query}`,
        JSON.stringify(error)
      );
      throw new UserError(
        "Error executing sql query. Check your sql query syntax."
      );
    }
  },
});

server.addTool({
  name: "peaka_get_project_metadata",
  description:
    `Get metadata for all catalogs, schemas, and tables in the Peaka project in a single call. Optionally filter by catalogId and/or schemaName. Use this tool to discover the data structure before writing queries.`,
  parameters: z.object({
    catalogId: z
      .string()
      .optional()
      .describe("Optional catalog ID to filter metadata by a specific catalog."),
    schemaName: z
      .string()
      .optional()
      .describe("Optional schema name to filter metadata by a specific schema."),
  }),
  execute: async (args, { log }) => {
    try {
      await apiService.ensureReady();
      const result = await apiService.getProjectMetadata(
        args.catalogId,
        args.schemaName
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(filterMetadataResponse(result), null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof UserError) throw error;
      log.error("Error getting project metadata", JSON.stringify(error));
      throw new UserError("Error getting project metadata. Check your api key.");
    }
  },
});

server.addTool({
  name: "peaka_list_catalogs",
  description:
    "List all available catalogs in the Peaka project. Returns catalog names, types, and connection info.",
  parameters: z.object({}),
  execute: async (_, { log }) => {
    try {
      await apiService.ensureReady();
      const result = await apiService.listCatalogs();
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      if (error instanceof UserError) throw error;
      log.error("Error listing catalogs", JSON.stringify(error));
      throw new UserError("Error listing catalogs. Check your api key.");
    }
  },
});

server.addTool({
  name: "peaka_list_schemas",
  description:
    "List all available schemas for a given catalog in the Peaka project.",
  parameters: z.object({
    catalogId: z.string(),
  }),
  execute: async (args, { log }) => {
    try {
      await apiService.ensureReady();
      const result = await apiService.listSchemas(args.catalogId);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      if (error instanceof UserError) throw error;
      log.error("Error listing schemas", JSON.stringify(error));
      throw new UserError("Error listing schemas. Check your api key.");
    }
  },
});

server.addTool({
  name: "peaka_list_tables",
  description:
    "List all available tables for a given catalog and schema in the Peaka project.",
  parameters: z.object({
    catalogId: z.string(),
    schemaName: z.string(),
  }),
  execute: async (args, { log }) => {
    try {
      await apiService.ensureReady();
      const result = await apiService.listTables(args.catalogId, args.schemaName);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      if (error instanceof UserError) throw error;
      log.error("Error listing tables", JSON.stringify(error));
      throw new UserError("Error listing tables. Check your api key.");
    }
  },
});

server.addTool({
  name: "peaka_list_columns",
  description:
    "List all columns for a given table in the Peaka project. Returns column names, data types, and constraints. Use peaka_get_project_metadata first to discover available catalogs, schemas, and tables.",
  parameters: z.object({
    catalogId: z.string(),
    schemaName: z.string(),
    tableName: z.string(),
  }),
  execute: async (args, { log }) => {
    try {
      await apiService.ensureReady();
      const result = await apiService.listColumns(
        args.catalogId,
        args.schemaName,
        args.tableName
      );
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      if (error instanceof UserError) throw error;
      log.error("Error listing columns", JSON.stringify(error));
      throw new UserError("Error listing columns. Check your api key.");
    }
  },
});

server.addTool({
  name: "peaka_create_cache",
  description:
    "Create a cache for a table in the Peaka project. Caching a table improves query performance by storing the data locally.",
  parameters: z.object({
    catalogId: z.string(),
    schemaName: z.string(),
    tableName: z.string(),
  }),
  execute: async (args, { log }) => {
    try {
      await apiService.ensureReady();
      const result = await apiService.createCache(
        args.catalogId,
        args.schemaName,
        args.tableName
      );
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      if (error instanceof UserError) throw error;
      log.error("Error creating cache", JSON.stringify(error));
      throw new UserError("Error creating cache. Check your api key.");
    }
  },
});

server.addTool({
  name: "peaka_get_cache_statuses",
  description:
    "Get all cache statuses for tables in the Peaka project. Returns the current caching state, execution history, and progress for each cached table.",
  parameters: z.object({}),
  execute: async (_, { log }) => {
    try {
      await apiService.ensureReady();
      const result = await apiService.getCacheStatuses();
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      if (error instanceof UserError) throw error;
      log.error("Error getting cache statuses", JSON.stringify(error));
      throw new UserError("Error getting cache statuses. Check your api key.");
    }
  },
});

server.addTool({
  name: "peaka_list_queries",
  description:
    "List all saved queries in the Peaka project. Returns query names, SQL content, and whether they are plain or materialized.",
  parameters: z.object({}),
  execute: async (_, { log }) => {
    try {
      await apiService.ensureReady();
      const result = await apiService.listQueries();
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      if (error instanceof UserError) throw error;
      log.error("Error listing queries", JSON.stringify(error));
      throw new UserError("Error listing queries. Check your api key.");
    }
  },
});

server.addTool({
  name: "peaka_execute_query",
  description:
    "Execute a saved query by its ID in the Peaka project. Use peaka_list_queries to find available query IDs.",
  parameters: z.object({
    queryId: z.string(),
  }),
  execute: async (args, { log }) => {
    try {
      await apiService.ensureReady();
      const result = await apiService.executeQuery(args.queryId);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      if (error instanceof UserError) throw error;
      log.error("Error executing query", JSON.stringify(error));
      throw new UserError("Error executing query. Check your query ID and api key.");
    }
  },
});

server.addTool({
  name: "peaka_list_projects",
  description:
    "List all projects accessible with the current API key, across all organizations and workspaces. Also shows the currently active project.",
  parameters: z.object({}),
  execute: async (_, { log }) => {
    try {
      await apiService.ensureInitialized();

      if (!apiService.isPartnerKey()) {
        const info = await apiService.getProjectInfo();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  activeProjectId: info.projectId,
                  keyType: "project",
                  note: "This is a Project API key scoped to a single project. Project switching is not available.",
                  projects: [
                    {
                      projectId: info.projectId,
                      projectName: info.projectName,
                    },
                  ],
                },
                null,
                2
              ),
            },
          ],
        };
      }

      const projects = await apiService.listAllProjects();
      const activeProjectId = apiService.getSelectedProjectId();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { activeProjectId, keyType: "partner", projects },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      if (error instanceof UserError) throw error;
      log.error("Error listing projects", JSON.stringify(error));
      throw new UserError("Error listing projects. Check your api key.");
    }
  },
});

server.addTool({
  name: "peaka_select_project",
  description:
    "Set the active project for the session. All subsequent tool calls will use this project. Use peaka_list_projects to find available project IDs. Pass an empty string to reset to the default project.",
  parameters: z.object({
    projectId: z
      .string()
      .describe(
        "The project ID to set as active. Pass an empty string to reset to the default project."
      ),
  }),
  execute: async (args, { log }) => {
    try {
      await apiService.ensureInitialized();

      if (!apiService.isPartnerKey()) {
        const currentProjectId = apiService.getSelectedProjectId();
        if (args.projectId === "" || args.projectId === currentProjectId) {
          return {
            content: [
              {
                type: "text",
                text: `This is a Project API key already bound to project '${currentProjectId}'. Project switching is not available.`,
              },
            ],
          };
        }
        throw new UserError(
          `This is a Project API key scoped to project '${currentProjectId}'. Cannot switch to project '${args.projectId}'.`
        );
      }

      if (args.projectId === "") {
        apiService.setActiveProject(null);
        return {
          content: [
            {
              type: "text",
              text: "Project selection reset.",
            },
          ],
        };
      }
      apiService.setActiveProject(args.projectId);
      return {
        content: [
          {
            type: "text",
            text: `Active project set to: ${args.projectId}`,
          },
        ],
      };
    } catch (error) {
      if (error instanceof UserError) throw error;
      log.error("Error selecting project", JSON.stringify(error));
      throw new UserError("Error selecting project.");
    }
  },
});

const METADATA_REFRESH_TERMINAL_STATES = new Set([
  "COMPLETED",
  "FAILED",
  "NOT_ACTIVE",
  "STUCK",
]);

server.addTool({
  name: "peaka_refresh_project_metadata",
  description:
    `Refresh project metadata for a specific catalog. This is a long-running operation that should only be used when a data source has structurally changed (e.g. new tables or columns added). Triggers the refresh and polls for completion, returning the final status.`,
  parameters: z.object({
    catalogId: z
      .string()
      .describe("The catalog ID to refresh metadata for."),
  }),
  execute: async (args, { log, reportProgress }) => {
    try {
      await apiService.ensureReady();

      reportProgress({ progress: 0, total: 100 });

      await apiService.refreshProjectMetadata(args.catalogId);

      reportProgress({ progress: 10, total: 100 });

      const maxPolls = 60;
      let polls = 0;

      while (polls < maxPolls) {
        await new Promise((resolve) => setTimeout(resolve, 10000));
        polls++;

        const statusResult = await apiService.getMetadataRefreshStatus(
          args.catalogId
        );

        const progressValue = Math.min(
          10 + Math.round((polls / maxPolls) * 90),
          99
        );
        reportProgress({ progress: progressValue, total: 100 });

        if (METADATA_REFRESH_TERMINAL_STATES.has(statusResult.status)) {
          reportProgress({ progress: 100, total: 100 });
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    catalogId: args.catalogId,
                    status: statusResult.status,
                    message:
                      statusResult.status === "COMPLETED"
                        ? "Metadata refresh completed successfully."
                        : `Metadata refresh ended with status: ${statusResult.status}`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }

      reportProgress({ progress: 100, total: 100 });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                catalogId: args.catalogId,
                status: "TIMEOUT",
                message:
                  "Metadata refresh is still running after 10 minutes. Use peaka_get_metadata_refresh_status to check progress.",
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      if (error instanceof UserError) throw error;
      log.error("Error refreshing project metadata", JSON.stringify(error));
      throw new UserError(
        "Error refreshing project metadata. Check your api key and catalog ID."
      );
    }
  },
});

server.addTool({
  name: "peaka_get_metadata_refresh_status",
  description:
    "Check the current status of a metadata refresh job for a specific catalog. Possible statuses: NOT_ACTIVE, COMPLETED, WAITING, ACTIVE, DELAYED, FAILED, PAUSED, STUCK.",
  parameters: z.object({
    catalogId: z
      .string()
      .describe("The catalog ID to check refresh status for."),
  }),
  execute: async (args, { log }) => {
    try {
      await apiService.ensureReady();
      const result = await apiService.getMetadataRefreshStatus(
        args.catalogId
      );
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      if (error instanceof UserError) throw error;
      log.error(
        "Error getting metadata refresh status",
        JSON.stringify(error)
      );
      throw new UserError(
        "Error getting metadata refresh status. Check your api key and catalog ID."
      );
    }
  },
});

server.addResource({
  uri: "file:///peaka_sql_query_rule_set.txt",
  name: "peaka_sql_query_rule_set",
  description:
    "Peaka SQL Query Rule Set is guidelines for writing sql queries for Peaka.",
  mimeType: "text/plain",
  async load() {
    return {
      text: PEAKA_SQL_RULE_SET,
    };
  },
});

server.addResource({
  uri: "file:///peaka_artifact_template.txt",
  name: "peaka_artifact_template",
  description:
    "Style guide and HTML template for generating visual reports, dashboards, and artifacts from Peaka query results.",
  mimeType: "text/plain",
  async load() {
    return {
      text: PEAKA_ARTIFACT_TEMPLATE,
    };
  },
});

server.start({
  transportType: "stdio",
});
