import axios, { AxiosInstance, AxiosResponse } from "axios";
import {
  Catalog,
  ColumnDetail,
  GoldenSqlResult,
  MetadataRefreshResponse,
  MetadataRefreshStatusResponse,
  Project,
  ProjectMetadataResponse,
  MetadataFormat,
  QueryContainer,
  Schema,
  Table,
  TableMetadata,
  Cache,
  CacheStatus,
  CatalogRelations,
  TableStatistics,
  Connection,
  ConnectionDetail,
  CreateCacheRequest,
  CreateCacheBatchRequest,
  RefreshCacheFullResponse,
  RefreshCacheIncrementalResponse,
  UpdateCacheRequest,
  DeleteCacheResponse,
  CreateSemanticCatalogRequest,
  SemanticCatalog,
  CreateSemanticTableRequest,
  SemanticTable,
  DeleteSemanticTableResponse,
  SavedQuery,
  CreateQueryRequest,
  UpdateQueryRequest,
  DeleteQueryResponse,
  RefreshMaterializedQueryResponse,
  MaterializedQueryStatus,
  QueryResult,
  TableMetadataResult,
  RelevantTablesResponse,
  ProjectTableList,
  ScopeDescriptions,
} from "./types";
import {
  CREATE_CACHE_URL_TEMPLATE,
  CREATE_CACHE_BATCH_URL_TEMPLATE,
  GET_CACHE_STATUSES_URL_TEMPLATE,
  REFRESH_CACHE_FULL_URL_TEMPLATE,
  REFRESH_CACHE_INCREMENTAL_URL_TEMPLATE,
  UPDATE_CACHE_URL_TEMPLATE,
  DELETE_CACHE_URL_TEMPLATE,
  CREATE_SEMANTIC_CATALOG_URL_TEMPLATE,
  CREATE_SEMANTIC_TABLE_URL_TEMPLATE,
  DELETE_SEMANTIC_TABLE_URL_TEMPLATE,
  GET_METADATA_REFRESH_STATUS_URL_TEMPLATE,
  GET_PROJECT_METADATA_URL_TEMPLATE,
  GET_RELATIONS_URL_TEMPLATE,
  GET_TABLE_STATISTICS_URL_TEMPLATE,
  EXECUTE_QUERY_URL_TEMPLATE,
  REFRESH_MATERIALIZED_QUERY_URL_TEMPLATE,
  LIST_MATERIALIZED_QUERY_STATUSES_URL_TEMPLATE,
  GET_MATERIALIZED_QUERY_STATUS_URL_TEMPLATE,
  LIST_QUERIES_URL_TEMPLATE,
  GET_QUERY_URL_TEMPLATE,
  CREATE_QUERY_URL_TEMPLATE,
  UPDATE_QUERY_URL_TEMPLATE,
  DELETE_QUERY_URL_TEMPLATE,
  DEFAULT_PEAKA_PARTNER_API_BASE_URL,
  DEFAULT_TIMEOUT_MS,
  PEAKA_MCP_USER_AGENT,
  LIST_CATALOGS_URL_TEMPLATE,
  LIST_COLUMNS_URL_TEMPLATE,
  LIST_ALL_PROJECTS_URL,
  LIST_CONNECTIONS_URL_TEMPLATE,
  GET_CONNECTION_DETAIL_URL_TEMPLATE,
  LIST_SCHEMAS_URL_TEMPLATE,
  LIST_TABLES_URL_TEMPLATE,
  QUERY_GOLDEN_SQL_URL_TEMPLATE,
  QUERY_TABLE_METADATA_URL_TEMPLATE,
  REFRESH_PROJECT_METADATA_URL_TEMPLATE,
  TRANSPILE_TRINO_SQL_URL_TEMPLATE,
} from "./constants";

export interface APIServiceOptions {
  accessToken: string;
  baseUrl?: string;
  /** Request timeout in ms. Defaults to {@link DEFAULT_TIMEOUT_MS}. */
  timeoutMs?: number;
}

export class APIService {
  private axiosInstance: AxiosInstance;

  constructor(options: APIServiceOptions) {
    const { accessToken, baseUrl, timeoutMs } = options;

    let baseURL = baseUrl || DEFAULT_PEAKA_PARTNER_API_BASE_URL;

    if (!baseURL.endsWith("/")) {
      baseURL += "/";
    }

    this.axiosInstance = axios.create({
      baseURL,
      timeout: timeoutMs ?? DEFAULT_TIMEOUT_MS,
      headers: { "User-Agent": PEAKA_MCP_USER_AGENT },
    });
    this.axiosInstance.interceptors.request.use((config) => {
      config.headers.Authorization = `Bearer ${accessToken}`;
      return config;
    });
  }

  public async queryForGoldenSqls(
    projectId: string,
    query: string
  ): Promise<GoldenSqlResult> {
    const url = QUERY_GOLDEN_SQL_URL_TEMPLATE({
      projectId,
      query: encodeURIComponent(query),
    });

    const response = await this.axiosInstance.get<GoldenSqlResult>(url);
    return response.data;
  }

  public async searchRelevantTables(projectId: string, question: string, limit = 5): Promise<RelevantTablesResponse> {
    const response = await this.axiosInstance.get<RelevantTablesResponse>(
      `metadata/${encodeURIComponent(projectId)}/relevant-tables`, { params: { question, limit } });
    return response.data;
  }

  public async queryForMetadata(
    projectId: string,
    tableNames: string[]
  ): Promise<TableMetadata[]> {
    const apiCalls: Promise<AxiosResponse>[] = [];
    for (const tableName of tableNames) {
      const url = QUERY_TABLE_METADATA_URL_TEMPLATE({
        projectId,
        tableName: encodeURIComponent(tableName),
      });
      apiCalls.push(this.axiosInstance.get<TableMetadataResult>(url));
    }

    const apiResults = await Promise.all(apiCalls);

    let result: TableMetadata[] = [];
    for (const apiResult of apiResults) {
      const apiResultData = apiResult.data as TableMetadataResult;
      apiResultData.result.forEach((tableMetadata) => {
        tableMetadata.fullTableNameToBeUsedInSQLQueries = `"${tableMetadata.catalogQueryName}"."${tableMetadata.schemaName}"."${tableMetadata.tableName}"`;
      });
      result = [...result, ...apiResultData.result];
    }

    return result;
  }

  public async listTableMetadata(projectId: string, params: {catalogId?: string; schemaName?: string; cursor?: string; limit?: number}) {
    const response = await this.axiosInstance.get(`/metadata/${encodeURIComponent(projectId)}/tables`, {params});
    return response.data;
  }

  public async getMetadataOperation(projectId: string, runId: string) {
    const response = await this.axiosInstance.get(`/metadata/${encodeURIComponent(projectId)}/operations/${encodeURIComponent(runId)}`);
    return response.data;
  }

  public async getProjectMetadata(
    projectId: string,
    catalogId?: string,
    schemaName?: string
  ): Promise<ProjectMetadataResponse> {
    const url = GET_PROJECT_METADATA_URL_TEMPLATE({
      projectId,
    });

    const params: Record<string, string> = {};
    if (catalogId) {
      params.catalogId = catalogId;
    }
    if (schemaName) {
      params.schemaName = schemaName;
    }

    const response = await this.axiosInstance.get<ProjectMetadataResponse>(url, { params });
    return response.data;
  }

  /**
   * The project metadata in a smaller shape: format=compact returns { tables: [...] } (names, types, descriptions,
   * keys, values, relations), format=ddl returns CREATE TABLE text. Sample values come only with includeSamples.
   */
  public async getProjectMetadataAs(
    projectId: string,
    format: MetadataFormat,
    options: { catalogId?: string; schemaName?: string; includeSamples?: boolean; tables?: string[] } = {}
  ): Promise<string> {
    const url = GET_PROJECT_METADATA_URL_TEMPLATE({
      projectId,
    });

    // One table= a table (a table name may hold a comma); axios would write table[]= for an array.
    const params = new URLSearchParams({ format });
    if (options.catalogId) {
      params.set("catalogId", options.catalogId);
    }
    if (options.schemaName) {
      params.set("schemaName", options.schemaName);
    }
    if (options.includeSamples) {
      params.set("include", "samples");
    }
    for (const table of options.tables ?? []) {
      params.append("table", table);
    }

    const response = await this.axiosInstance.get<unknown>(url, { params });
    return typeof response.data === "string" ? response.data : JSON.stringify(response.data);
  }

  /**
   * The project's tables, one short line each (name, description, column names, joins, cache state), or, when the
   * scope is too large to list whole, its schemas with their table counts.
   */
  public async listProjectTables(
    projectId: string,
    options: { catalogId?: string; schemaName?: string } = {}
  ): Promise<ProjectTableList> {
    const params: Record<string, string> = {};
    if (options.catalogId) params.catalogId = options.catalogId;
    if (options.schemaName) params.schemaName = options.schemaName;
    const response = await this.axiosInstance.get<ProjectTableList>(
      `metadata/${encodeURIComponent(projectId)}/table-list`, { params });
    return response.data;
  }

  public async listCatalogs(projectId: string): Promise<Catalog[]> {
    const url = LIST_CATALOGS_URL_TEMPLATE({
      projectId,
    });

    const [response, described] = await Promise.all([
      this.axiosInstance.get<Catalog[]>(url),
      this.scopeDescriptions(projectId),
    ]);
    const byId = new Map(described.map((c) => [c.catalogId, c.description]));
    return response.data.map((c) => withDescription(c, byId.get(String(c.id))));
  }

  public async listSchemas(
    projectId: string,
    catalogId: string
  ): Promise<Schema[]> {
    const url = LIST_SCHEMAS_URL_TEMPLATE({
      projectId,
      catalogId,
    });

    const [response, described] = await Promise.all([
      this.axiosInstance.get<Schema[]>(url),
      this.scopeDescriptions(projectId, catalogId),
    ]);
    const byName = new Map(
      (described.find((c) => c.catalogId === catalogId)?.schemas ?? []).map((s) => [s.schemaName, s.description])
    );
    return response.data.map((s) => withDescription(s, byName.get(s.schemaName)));
  }

  /**
   * The catalog and schema descriptions written in Peaka. A listing does not depend on them: a deployment without
   * them, or a failed read, lists catalogs and schemas as before.
   */
  private async scopeDescriptions(projectId: string, catalogId?: string): Promise<ScopeDescriptions["catalogs"]> {
    try {
      const response = await this.axiosInstance.get<ScopeDescriptions>(
        `metadata/${encodeURIComponent(projectId)}/descriptions`,
        { params: catalogId ? { catalogId } : {} }
      );
      return response.data?.available ? response.data.catalogs ?? [] : [];
    } catch {
      return [];
    }
  }

  public async listTables(
    projectId: string,
    catalogId: string,
    schemaName: string
  ): Promise<Table[]> {
    const url = LIST_TABLES_URL_TEMPLATE({
      projectId,
      catalogId,
      schemaName,
    });

    const response = await this.axiosInstance.get<Table[]>(url);
    return response.data;
  }

  public async listColumns(
    projectId: string,
    catalogId: string,
    schemaName: string,
    tableName: string
  ): Promise<ColumnDetail[]> {
    const url = LIST_COLUMNS_URL_TEMPLATE({
      projectId,
      catalogId,
      schemaName,
      tableName,
    });

    const response = await this.axiosInstance.get<ColumnDetail[]>(url);
    return response.data;
  }

  public async createCache(
    projectId: string,
    body: CreateCacheRequest
  ): Promise<Cache> {
    const url = CREATE_CACHE_URL_TEMPLATE({
      projectId,
    });

    const response = await this.axiosInstance.post<Cache>(url, body);
    return response.data;
  }

  public async createCacheBatch(
    projectId: string,
    body: CreateCacheBatchRequest
  ): Promise<Cache[]> {
    const url = CREATE_CACHE_BATCH_URL_TEMPLATE({
      projectId,
    });

    const response = await this.axiosInstance.post<Cache[]>(url, body);
    return response.data;
  }

  public async getCacheStatuses(projectId: string): Promise<CacheStatus[]> {
    const url = GET_CACHE_STATUSES_URL_TEMPLATE({
      projectId,
    });

    const response = await this.axiosInstance.get<CacheStatus[]>(url);
    return response.data;
  }

  public async refreshCacheFull(
    projectId: string,
    cacheId: string
  ): Promise<RefreshCacheFullResponse> {
    const url = REFRESH_CACHE_FULL_URL_TEMPLATE({
      projectId,
      cacheId,
    });

    const response = await this.axiosInstance.post<RefreshCacheFullResponse>(
      url
    );
    return response.data;
  }

  public async refreshCacheIncremental(
    projectId: string,
    cacheId: string
  ): Promise<RefreshCacheIncrementalResponse> {
    const url = REFRESH_CACHE_INCREMENTAL_URL_TEMPLATE({
      projectId,
      cacheId,
    });

    const response =
      await this.axiosInstance.post<RefreshCacheIncrementalResponse>(url);
    return response.data;
  }

  public async updateCache(
    projectId: string,
    cacheId: string,
    body: UpdateCacheRequest
  ): Promise<Cache> {
    const url = UPDATE_CACHE_URL_TEMPLATE({
      projectId,
      cacheId,
    });

    const response = await this.axiosInstance.put<Cache>(url, body);
    return response.data;
  }

  public async deleteCache(
    projectId: string,
    cacheId: string
  ): Promise<DeleteCacheResponse> {
    const url = DELETE_CACHE_URL_TEMPLATE({
      projectId,
      cacheId,
    });

    const response = await this.axiosInstance.delete<DeleteCacheResponse>(url);
    return response.data;
  }

  public async createSemanticCatalog(
    projectId: string,
    body: CreateSemanticCatalogRequest
  ): Promise<SemanticCatalog> {
    const url = CREATE_SEMANTIC_CATALOG_URL_TEMPLATE({
      projectId,
    });

    const response = await this.axiosInstance.post<SemanticCatalog>(url, body);
    return response.data;
  }

  public async createSemanticTable(
    projectId: string,
    catalogId: string,
    body: CreateSemanticTableRequest
  ): Promise<SemanticTable> {
    const url = CREATE_SEMANTIC_TABLE_URL_TEMPLATE({
      projectId,
      catalogId,
    });

    const response = await this.axiosInstance.post<SemanticTable>(url, body);
    return response.data;
  }

  public async deleteSemanticTable(
    projectId: string,
    catalogId: string,
    tableId: string
  ): Promise<DeleteSemanticTableResponse> {
    const url = DELETE_SEMANTIC_TABLE_URL_TEMPLATE({
      projectId,
      catalogId,
      tableId,
    });

    await this.axiosInstance.delete(url);
    return { ok: true };
  }

  public async listQueries(projectId: string): Promise<SavedQuery[]> {
    const url = LIST_QUERIES_URL_TEMPLATE({
      projectId,
    });

    const response = await this.axiosInstance.get<SavedQuery[]>(url);
    return response.data;
  }

  public async getQuery(
    projectId: string,
    queryId: string
  ): Promise<SavedQuery> {
    const url = GET_QUERY_URL_TEMPLATE({
      projectId,
      queryId,
    });

    const response = await this.axiosInstance.get<SavedQuery>(url);
    return response.data;
  }

  public async createQuery(
    projectId: string,
    body: CreateQueryRequest
  ): Promise<SavedQuery> {
    const url = CREATE_QUERY_URL_TEMPLATE({
      projectId,
    });

    const response = await this.axiosInstance.post<SavedQuery>(url, body);
    return response.data;
  }

  public async updateQuery(
    projectId: string,
    queryId: string,
    body: UpdateQueryRequest
  ): Promise<SavedQuery> {
    const url = UPDATE_QUERY_URL_TEMPLATE({
      projectId,
      queryId,
    });

    const response = await this.axiosInstance.put<SavedQuery>(url, body);
    return response.data;
  }

  public async deleteQuery(
    projectId: string,
    queryId: string
  ): Promise<DeleteQueryResponse> {
    const url = DELETE_QUERY_URL_TEMPLATE({
      projectId,
      queryId,
    });

    const response = await this.axiosInstance.delete<DeleteQueryResponse>(url);
    return response.data;
  }

  public async executeQuery(
    projectId: string,
    queryId: string
  ): Promise<QueryResult> {
    const url = EXECUTE_QUERY_URL_TEMPLATE({
      projectId,
    });

    const response = await this.axiosInstance.post<QueryResult>(url, {
      id: queryId,
    });
    return response.data;
  }

  public async refreshMaterializedQuery(
    projectId: string,
    queryId: string
  ): Promise<RefreshMaterializedQueryResponse> {
    const url = REFRESH_MATERIALIZED_QUERY_URL_TEMPLATE({
      projectId,
      queryId,
    });

    const response =
      await this.axiosInstance.post<RefreshMaterializedQueryResponse>(url);
    return response.data;
  }

  public async getMaterializedQueryStatuses(
    projectId: string
  ): Promise<MaterializedQueryStatus[]> {
    const url = LIST_MATERIALIZED_QUERY_STATUSES_URL_TEMPLATE({
      projectId,
    });

    const response = await this.axiosInstance.get<MaterializedQueryStatus[]>(
      url
    );
    return response.data;
  }

  public async getMaterializedQueryStatus(
    projectId: string,
    queryId: string
  ): Promise<MaterializedQueryStatus> {
    const url = GET_MATERIALIZED_QUERY_STATUS_URL_TEMPLATE({
      projectId,
      queryId,
    });

    const response = await this.axiosInstance.get<MaterializedQueryStatus>(url);
    return response.data;
  }

  public async executeSQLStatement(
    projectId: string,
    statement: string
  ): Promise<QueryResult> {
    const url = EXECUTE_QUERY_URL_TEMPLATE({
      projectId,
    });

    const response = await this.axiosInstance.post<QueryResult>(url, {
      statement,
    });
    return response.data;
  }

  public async transpileQueryToTrinoDialect(
    query: string
  ): Promise<QueryContainer> {
    const url = TRANSPILE_TRINO_SQL_URL_TEMPLATE({
      dialect: "trino",
    });

    const response = await this.axiosInstance.post<QueryContainer>(url, {
      query,
    });
    return response.data;
  }

  /**
   * Lists every project the caller can access in a single request. Unlike
   * {@link listAllProjects} this needs neither the `me`/info lookup nor the
   * org→workspace→project walk, so one broken leg (e.g. a 500 from `me`)
   * can't take the whole listing down.
   */
  public async getAllProjects(): Promise<Project[]> {
    const url = LIST_ALL_PROJECTS_URL();
    const response = await this.axiosInstance.get<Project[]>(url);
    return response.data;
  }

  public async refreshProjectMetadata(
    projectId: string,
    catalogId: string
  ): Promise<MetadataRefreshResponse> {
    const url = REFRESH_PROJECT_METADATA_URL_TEMPLATE({
      projectId,
    });

    const response = await this.axiosInstance.post<MetadataRefreshResponse>(
      url,
      { catalogId }
    );
    return response.data;
  }

  public async getMetadataRefreshStatus(
    projectId: string,
    catalogId: string
  ): Promise<MetadataRefreshStatusResponse> {
    const url = GET_METADATA_REFRESH_STATUS_URL_TEMPLATE({
      projectId,
      catalogId,
    });

    const response =
      await this.axiosInstance.get<MetadataRefreshStatusResponse>(url);
    return response.data;
  }

  public async getRelations(
    projectId: string,
    catalogId: string
  ): Promise<CatalogRelations> {
    const url = GET_RELATIONS_URL_TEMPLATE({
      projectId,
      catalogId,
    });

    const response = await this.axiosInstance.get<CatalogRelations>(url);
    return response.data;
  }

  public async getTableStatistics(
    projectId: string,
    catalogId: string,
    schemaName: string,
    tableName: string
  ): Promise<TableStatistics> {
    const url = GET_TABLE_STATISTICS_URL_TEMPLATE({
      projectId,
      catalogId,
      schemaName,
      tableName,
    });

    const response = await this.axiosInstance.get<TableStatistics>(url);
    return response.data;
  }

  public async listConnections(projectId: string): Promise<Connection[]> {
    const url = LIST_CONNECTIONS_URL_TEMPLATE({
      projectId,
    });

    const response = await this.axiosInstance.get<Connection[]>(url);
    return response.data;
  }

  public async getConnectionDetail(
    projectId: string,
    connectionId: string
  ): Promise<ConnectionDetail> {
    const url = GET_CONNECTION_DETAIL_URL_TEMPLATE({
      projectId,
      connectionId,
    });

    const response = await this.axiosInstance.get<ConnectionDetail>(url);
    return response.data;
  }
}

/** Adds a description only when one is written, so an undescribed catalog or schema costs no tokens. */
const withDescription = <T extends object>(item: T, description: string | undefined): T =>
  description ? { ...item, description } : item;
