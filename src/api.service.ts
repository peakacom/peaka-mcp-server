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
  RefreshCacheFullResponse,
  RefreshCacheIncrementalResponse,
  UpdateCacheRequest,
  DeleteCacheResponse,
  SavedQuery,
  CreateQueryRequest,
  UpdateQueryRequest,
  DeleteQueryResponse,
  QueryResult,
  TableMetadataResult,
  Workspace,
} from "./types";
import {
  CREATE_CACHE_URL_TEMPLATE,
  GET_CACHE_STATUSES_URL_TEMPLATE,
  REFRESH_CACHE_FULL_URL_TEMPLATE,
  REFRESH_CACHE_INCREMENTAL_URL_TEMPLATE,
  UPDATE_CACHE_URL_TEMPLATE,
  DELETE_CACHE_URL_TEMPLATE,
  GET_METADATA_REFRESH_STATUS_URL_TEMPLATE,
  GET_PROJECT_METADATA_URL_TEMPLATE,
  EXECUTE_QUERY_URL_TEMPLATE,
  LIST_QUERIES_URL_TEMPLATE,
  CREATE_QUERY_URL_TEMPLATE,
  UPDATE_QUERY_URL_TEMPLATE,
  DELETE_QUERY_URL_TEMPLATE,
  DEFAULT_PEAKA_PARTNER_API_BASE_URL,
  LIST_CATALOGS_URL_TEMPLATE,
  LIST_COLUMNS_URL_TEMPLATE,
  LIST_ORGANIZATIONS_URL,
  LIST_PROJECTS_URL_TEMPLATE,
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
    try {
      const response = await this.axiosInstance.get<ProjectInfoResponse>(
        "info"
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid API Key.");
        }
      }
      throw error;
    }
  }

  public async queryForGoldenSqls(
    projectId: string,
    query: string
  ): Promise<GoldenSqlResult> {
    try {
      const url = QUERY_GOLDEN_SQL_URL_TEMPLATE({
        projectId,
        query: encodeURI(query),
      });

      const response = await this.axiosInstance.get<GoldenSqlResult>(url);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid API Key.");
        }
      }
      throw error;
    }
  }

  public async queryForMetadata(
    projectId: string,
    tableNames: string[]
  ): Promise<TableMetadata[]> {
    try {
      const apiCalls: Promise<AxiosResponse>[] = [];
      for (const tableName of tableNames) {
        const url = QUERY_TABLE_METADATA_URL_TEMPLATE({
          projectId,
          tableName: encodeURI(tableName),
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
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid API Key.");
        }
      }
      throw error;
    }
  }

  public async getProjectMetadata(
    projectId: string,
    catalogId?: string,
    schemaName?: string
  ): Promise<ProjectMetadataResponse> {
    try {
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
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid API Key.");
        }
      }
      throw error;
    }
  }

  public async listCatalogs(projectId: string): Promise<Catalog[]> {
    try {
      const url = LIST_CATALOGS_URL_TEMPLATE({
        projectId,
      });

      const response = await this.axiosInstance.get<Catalog[]>(url);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid API Key.");
        }
      }
      throw error;
    }
  }

  public async listSchemas(
    projectId: string,
    catalogId: string
  ): Promise<Schema[]> {
    try {
      const url = LIST_SCHEMAS_URL_TEMPLATE({
        projectId,
        catalogId,
      });

      const response = await this.axiosInstance.get<Schema[]>(url);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid API Key.");
        }
      }
      throw error;
    }
  }

  public async listTables(
    projectId: string,
    catalogId: string,
    schemaName: string
  ): Promise<Table[]> {
    try {
      const url = LIST_TABLES_URL_TEMPLATE({
        projectId,
        catalogId,
        schemaName,
      });

      const response = await this.axiosInstance.get<Table[]>(url);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid API Key.");
        }
      }
      throw error;
    }
  }

  public async listColumns(
    projectId: string,
    catalogId: string,
    schemaName: string,
    tableName: string
  ): Promise<ColumnDetail[]> {
    try {
      const url = LIST_COLUMNS_URL_TEMPLATE({
        projectId,
        catalogId,
        schemaName,
        tableName,
      });

      const response = await this.axiosInstance.get<ColumnDetail[]>(url);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid API Key.");
        }
      }
      throw error;
    }
  }

  public async createCache(
    projectId: string,
    catalogId: string,
    schemaName: string,
    tableName: string
  ): Promise<Cache> {
    try {
      const url = CREATE_CACHE_URL_TEMPLATE({
        projectId,
      });

      const response = await this.axiosInstance.post<Cache>(url, {
        catalogId,
        schemaName,
        tableName,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid API Key.");
        }
      }
      throw error;
    }
  }

  public async getCacheStatuses(projectId: string): Promise<CacheStatus[]> {
    try {
      const url = GET_CACHE_STATUSES_URL_TEMPLATE({
        projectId,
      });

      const response = await this.axiosInstance.get<CacheStatus[]>(url);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid API Key.");
        }
      }
      throw error;
    }
  }

  public async refreshCacheFull(
    projectId: string,
    cacheId: string
  ): Promise<RefreshCacheFullResponse> {
    try {
      const url = REFRESH_CACHE_FULL_URL_TEMPLATE({
        projectId,
        cacheId,
      });

      const response = await this.axiosInstance.post<RefreshCacheFullResponse>(
        url
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid API Key.");
        }
      }
      throw error;
    }
  }

  public async refreshCacheIncremental(
    projectId: string,
    cacheId: string
  ): Promise<RefreshCacheIncrementalResponse> {
    try {
      const url = REFRESH_CACHE_INCREMENTAL_URL_TEMPLATE({
        projectId,
        cacheId,
      });

      const response =
        await this.axiosInstance.post<RefreshCacheIncrementalResponse>(url);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid API Key.");
        }
      }
      throw error;
    }
  }

  public async updateCache(
    projectId: string,
    cacheId: string,
    body: UpdateCacheRequest
  ): Promise<Cache> {
    try {
      const url = UPDATE_CACHE_URL_TEMPLATE({
        projectId,
        cacheId,
      });

      const response = await this.axiosInstance.put<Cache>(url, body);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid API Key.");
        }
      }
      throw error;
    }
  }

  public async deleteCache(
    projectId: string,
    cacheId: string
  ): Promise<DeleteCacheResponse> {
    try {
      const url = DELETE_CACHE_URL_TEMPLATE({
        projectId,
        cacheId,
      });

      const response = await this.axiosInstance.delete<DeleteCacheResponse>(
        url
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid API Key.");
        }
      }
      throw error;
    }
  }

  public async listQueries(projectId: string): Promise<SavedQuery[]> {
    try {
      const url = LIST_QUERIES_URL_TEMPLATE({
        projectId,
      });

      const response = await this.axiosInstance.get<SavedQuery[]>(url);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid API Key.");
        }
      }
      throw error;
    }
  }

  public async createQuery(
    projectId: string,
    body: CreateQueryRequest
  ): Promise<SavedQuery> {
    try {
      const url = CREATE_QUERY_URL_TEMPLATE({
        projectId,
      });

      const response = await this.axiosInstance.post<SavedQuery>(url, body);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid API Key.");
        }
      }
      throw error;
    }
  }

  public async updateQuery(
    projectId: string,
    queryId: string,
    body: UpdateQueryRequest
  ): Promise<SavedQuery> {
    try {
      const url = UPDATE_QUERY_URL_TEMPLATE({
        projectId,
        queryId,
      });

      const response = await this.axiosInstance.put<SavedQuery>(url, body);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid API Key.");
        }
      }
      throw error;
    }
  }

  public async deleteQuery(
    projectId: string,
    queryId: string
  ): Promise<DeleteQueryResponse> {
    try {
      const url = DELETE_QUERY_URL_TEMPLATE({
        projectId,
        queryId,
      });

      const response = await this.axiosInstance.delete<DeleteQueryResponse>(
        url
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid API Key.");
        }
      }
      throw error;
    }
  }

  public async executeQuery(
    projectId: string,
    queryId: string
  ): Promise<QueryResult> {
    try {
      const url = EXECUTE_QUERY_URL_TEMPLATE({
        projectId,
      });

      const response = await this.axiosInstance.post<QueryResult>(url, {
        id: queryId,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid API Key.");
        }
      }
      throw error;
    }
  }

  public async executeSQLStatement(
    projectId: string,
    statement: string
  ): Promise<QueryResult> {
    try {
      const url = EXECUTE_QUERY_URL_TEMPLATE({
        projectId,
      });

      const response = await this.axiosInstance.post<QueryResult>(
        url,
        { statement },
        { timeout: 20000 }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid API Key.");
        }
      }
      throw error;
    }
  }

  public async transpileQueryToTrinoDialect(
    query: string
  ): Promise<QueryContainer> {
    try {
      const url = TRANSPILE_TRINO_SQL_URL_TEMPLATE({
        dialect: "trino",
      });

      const response = await this.axiosInstance.post<QueryContainer>(url, {
        query,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid API Key.");
        }
      }
      throw error;
    }
  }

  public async listOrganizations(): Promise<Organization[]> {
    try {
      const url = LIST_ORGANIZATIONS_URL();
      const response = await this.axiosInstance.get<Organization[]>(url);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid API Key.");
        }
      }
      throw error;
    }
  }

  public async listWorkspaces(organizationId: string): Promise<Workspace[]> {
    try {
      const url = LIST_WORKSPACES_URL_TEMPLATE({ organizationId });
      const response = await this.axiosInstance.get<Workspace[]>(url);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid API Key.");
        }
      }
      throw error;
    }
  }

  public async listProjects(
    organizationId: string,
    workspaceId: string
  ): Promise<Project[]> {
    try {
      const url = LIST_PROJECTS_URL_TEMPLATE({ organizationId, workspaceId });
      const response = await this.axiosInstance.get<Project[]>(url);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid API Key.");
        }
      }
      throw error;
    }
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
    try {
      const url = REFRESH_PROJECT_METADATA_URL_TEMPLATE({
        projectId,
      });

      const response = await this.axiosInstance.post<MetadataRefreshResponse>(
        url,
        { catalogId },
        { timeout: 30000 }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid API Key.");
        }
      }
      throw error;
    }
  }

  public async getMetadataRefreshStatus(
    projectId: string,
    catalogId: string
  ): Promise<MetadataRefreshStatusResponse> {
    try {
      const url = GET_METADATA_REFRESH_STATUS_URL_TEMPLATE({
        projectId,
        catalogId,
      });

      const response =
        await this.axiosInstance.get<MetadataRefreshStatusResponse>(url);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid API Key.");
        }
      }
      throw error;
    }
  }
}
