import axios, { AxiosInstance, AxiosResponse } from "axios";
import {
  Catalog,
  ColumnDetail,
  GoldenSqlResult,
  MetadataRefreshResponse,
  MetadataRefreshStatusResponse,
  Organization,
  Project,
  ProjectInfoResponse,
  ProjectListItem,
  ProjectMetadataResponse,
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
  Workspace,
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
  LIST_CATALOGS_URL_TEMPLATE,
  LIST_COLUMNS_URL_TEMPLATE,
  LIST_ORGANIZATIONS_URL,
  LIST_PROJECTS_URL_TEMPLATE,
  LIST_CONNECTIONS_URL_TEMPLATE,
  GET_CONNECTION_DETAIL_URL_TEMPLATE,
  LIST_SCHEMAS_URL_TEMPLATE,
  LIST_TABLES_URL_TEMPLATE,
  LIST_WORKSPACES_URL_TEMPLATE,
  QUERY_GOLDEN_SQL_URL_TEMPLATE,
  QUERY_TABLE_METADATA_URL_TEMPLATE,
  REFRESH_PROJECT_METADATA_URL_TEMPLATE,
  TRANSPILE_TRINO_SQL_URL_TEMPLATE,
} from "./constants";

export interface APIServiceOptions {
  accessToken: string;
  baseUrl?: string;
}

export class APIService {
  private axiosInstance: AxiosInstance;

  constructor(options: APIServiceOptions) {
    const { accessToken, baseUrl } = options;

    let baseURL = baseUrl || DEFAULT_PEAKA_PARTNER_API_BASE_URL;

    if (!baseURL.endsWith("/")) {
      baseURL += "/";
    }
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 15000,
    });
    this.axiosInstance.interceptors.request.use((config) => {
      config.headers.Authorization = `Bearer ${accessToken}`;
      return config;
    });
  }

  public async getProjectInfo(): Promise<ProjectInfoResponse> {
    const response = await this.axiosInstance.get<ProjectInfoResponse>("info");
    return response.data;
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

  public async listCatalogs(projectId: string): Promise<Catalog[]> {
    const url = LIST_CATALOGS_URL_TEMPLATE({
      projectId,
    });

    const response = await this.axiosInstance.get<Catalog[]>(url);
    return response.data;
  }

  public async listSchemas(
    projectId: string,
    catalogId: string
  ): Promise<Schema[]> {
    const url = LIST_SCHEMAS_URL_TEMPLATE({
      projectId,
      catalogId,
    });

    const response = await this.axiosInstance.get<Schema[]>(url);
    return response.data;
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

    const response = await this.axiosInstance.post<QueryResult>(
      url,
      { statement },
      { timeout: 20000 }
    );
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

  public async listOrganizations(): Promise<Organization[]> {
    const url = LIST_ORGANIZATIONS_URL();
    const response = await this.axiosInstance.get<Organization[]>(url);
    return response.data;
  }

  public async listWorkspaces(organizationId: string): Promise<Workspace[]> {
    const url = LIST_WORKSPACES_URL_TEMPLATE({ organizationId });
    const response = await this.axiosInstance.get<Workspace[]>(url);
    return response.data;
  }

  public async listProjects(
    organizationId: string,
    workspaceId: string
  ): Promise<Project[]> {
    const url = LIST_PROJECTS_URL_TEMPLATE({ organizationId, workspaceId });
    const response = await this.axiosInstance.get<Project[]>(url);
    return response.data;
  }

  public async listAllProjects(): Promise<ProjectListItem[]> {
    const orgs = await this.listOrganizations();
    const results: ProjectListItem[] = [];

    for (const org of orgs) {
      const workspaces = await this.listWorkspaces(org.id);
      for (const ws of workspaces) {
        const projects = await this.listProjects(org.id, ws.id);
        for (const proj of projects) {
          results.push({
            organizationId: org.id,
            organizationName: org.name,
            workspaceId: ws.id,
            workspaceName: ws.name,
            projectId: proj.id,
            projectName: proj.name,
          });
        }
      }
    }

    return results;
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
      { catalogId },
      { timeout: 30000 }
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
