import "dotenv/config";
import axios, { AxiosInstance, AxiosResponse } from "axios";
import cache from "memory-cache";
import {
  GoldenSqlResult,
  ProjectInfoResponse,
  QueryContainer,
  TableMetadata,
  TableMetadataResult,
} from "./types";
import {
  DEFAULT_PEAKA_PARTNER_API_BASE_URL,
  QUERY_GOLDEN_SQL_URL_TEMPLATE,
  QUERY_TABLE_METADATA_URL_TEMPLATE,
  TRANSPILE_TRINO_SQL_URL_TEMPLATE,
} from "./constants";

export class APIService {
  private static _instance: APIService;
  private axiosInstance: AxiosInstance;

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
      headers: { Authorization: `Bearer ${process.env.PEAKA_API_KEY || ""}` },
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

  public async queryForGoldenSqls(query: string): Promise<GoldenSqlResult> {
    try {
      const projectInfo = await this.getProjectInfo();

      const url = QUERY_GOLDEN_SQL_URL_TEMPLATE({
        projectId: projectInfo.projectId,
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
      const projectInfo = await this.getProjectInfo();
      const apiCalls: Promise<AxiosResponse>[] = [];
      for (const tableName of tableNames) {
        const url = QUERY_TABLE_METADATA_URL_TEMPLATE({
          projectId: projectInfo.projectId,
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
}
