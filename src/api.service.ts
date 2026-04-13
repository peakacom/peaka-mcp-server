import axios, { AxiosInstance, AxiosResponse } from "axios";
import cache from "memory-cache";
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
  SavedQuery,
  QueryResult,
  TableMetadataResult,
  Workspace,
} from "./types";
import {
  CREATE_CACHE_URL_TEMPLATE,
  GET_CACHE_STATUSES_URL_TEMPLATE,
  GET_METADATA_REFRESH_STATUS_URL_TEMPLATE,
  GET_PROJECT_METADATA_URL_TEMPLATE,
  EXECUTE_QUERY_URL_TEMPLATE,
  LIST_QUERIES_URL_TEMPLATE,
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

export class APIService {
  private static _instance: APIService;
  private axiosInstance: AxiosInstance;
  private selectedProjectId: string | null = null;
  private keyType: "partner" | "project" | null = null;
  private detectionPromise: Promise<void> | null = null;

  private constructor() {
    let baseURL = process.env.PARTNER_API_BASE_URL
      ? process.env.PARTNER_API_BASE_URL
      : DEFAULT_PEAKA_PARTNER_API_BASE_URL;

    if (!baseURL.endsWith("/")) {
      baseURL += "/";
    }
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 15000,
    });
    this.axiosInstance.interceptors.request.use((config) => {
      config.headers.Authorization = `Bearer ${process.env.PEAKA_API_KEY || ""}`;
      return config;
    });
  }

  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  public async getProjectInfo(): Promise<ProjectInfoResponse> {
    try {
      const cachedResponse = cache.get("projectInfo");
      if (cachedResponse) {
        return cachedResponse as ProjectInfoResponse;
      }

      const response = await this.axiosInstance.get<ProjectInfoResponse>(
        "info"
      );

      const data = response.data;
      cache.put("projectInfo", data, 1000 * 60 * 60);
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid API Key.");
        }
      }
      throw error;
    }
  }

  public async ensureInitialized(): Promise<void> {
    if (this.keyType) return;
    if (this.detectionPromise) return this.detectionPromise;

    this.detectionPromise = (async () => {
      try {
        const info = await this.getProjectInfo();
        if (info.projectId) {
          this.keyType = "project";
          this.selectedProjectId = info.projectId;
        } else {
          this.keyType = "partner";
        }
      } catch (error) {
        this.detectionPromise = null;
        throw error;
      }
    })();

    return this.detectionPromise;
  }

  public async ensureReady(): Promise<void> {
    await this.ensureInitialized();
    if (this.keyType === "partner" && !this.selectedProjectId) {
      const projects = await this.listAllProjects();
      const projectList = projects
        .map((p) => `  - ${p.projectName} (ID: ${p.projectId})`)
        .join("\n");
      throw new Error(
        `No project selected. Ask the user to select a project. Available projects:\n${projectList}\nUse peaka_select_project to set one.\n`
      );
    }
  }

  public getKeyType(): "partner" | "project" | null {
    return this.keyType;
  }

  public isPartnerKey(): boolean {
    return this.keyType === "partner";
  }

  public async getActiveProjectId(): Promise<string> {
    if (this.selectedProjectId) {
      return this.selectedProjectId;
    }

    const projects = await this.listAllProjects();
    const projectList = projects
      .map((p) => `  - ${p.projectName} (ID: ${p.projectId})`)
      .join("\n");

    throw new Error(
      `No project selected. Ask the user to select a project. Available projects:\n${projectList}\nUse peaka_select_project to set one.\n`
    );
  }

  public setActiveProject(projectId: string | null): void {
    if (this.keyType === "project" && projectId !== this.selectedProjectId) {
      throw new Error(
        `This is a Project API key scoped to project '${this.selectedProjectId}'. Cannot switch to a different project.`
      );
    }
    this.selectedProjectId = projectId;
  }

  public getSelectedProjectId(): string | null {
    return this.selectedProjectId;
  }

  public async queryForGoldenSqls(query: string): Promise<GoldenSqlResult> {
    try {
      const projectId = await this.getActiveProjectId();

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
    tableNames: string[]
  ): Promise<TableMetadata[]> {
    try {
      const projectId = await this.getActiveProjectId();
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
    catalogId?: string,
    schemaName?: string
  ): Promise<ProjectMetadataResponse> {
    try {
      const projectId = await this.getActiveProjectId();

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

  public async listCatalogs(): Promise<Catalog[]> {
    try {
      const projectId = await this.getActiveProjectId();

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

  public async listSchemas(catalogId: string): Promise<Schema[]> {
    try {
      const projectId = await this.getActiveProjectId();

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

  public async listTables(catalogId: string, schemaName: string): Promise<Table[]> {
    try {
      const projectId = await this.getActiveProjectId();

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
    catalogId: string,
    schemaName: string,
    tableName: string
  ): Promise<ColumnDetail[]> {
    try {
      const projectId = await this.getActiveProjectId();

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
    catalogId: string,
    schemaName: string,
    tableName: string
  ): Promise<Cache> {
    try {
      const projectId = await this.getActiveProjectId();

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

  public async getCacheStatuses(): Promise<CacheStatus[]> {
    try {
      const projectId = await this.getActiveProjectId();

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

  public async listQueries(): Promise<SavedQuery[]> {
    try {
      const projectId = await this.getActiveProjectId();

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

  public async executeQuery(queryId: string): Promise<QueryResult> {
    try {
      const projectId = await this.getActiveProjectId();

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

  public async executeSQLStatement(statement: string): Promise<QueryResult> {
    try {
      const projectId = await this.getActiveProjectId();

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
    catalogId: string
  ): Promise<MetadataRefreshResponse> {
    try {
      const projectId = await this.getActiveProjectId();

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
    catalogId: string
  ): Promise<MetadataRefreshStatusResponse> {
    try {
      const projectId = await this.getActiveProjectId();

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
