import "dotenv/config";
import axios, { AxiosInstance } from "axios";
import cache from "memory-cache";
import { GoldenSqlResult, ProjectInfoResponse } from "./types";
import {
  DEFAULT_PEAKA_PARTNER_API_BASE_URL,
  QUERY_GOLDEN_SQL_URL_TEMPLATE,
} from "./constants";

export class APIService {
  private static _instance: APIService;
  private axiosInstance: AxiosInstance;

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: process.env.PARTNER_API_BASE_URL
        ? process.env.PARTNER_API_BASE_URL
        : DEFAULT_PEAKA_PARTNER_API_BASE_URL,
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
      throw error;
    }
  }
}
