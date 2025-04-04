import "dotenv/config";
import { Trino } from "trino-client";
import { DEFAULT_PEAKA_DBC_HOST } from "./constants";
import { DataResult } from "./types";

export class DataService {
  private static _instance: DataService;
  private trinoInstance: Trino;

  private constructor() {
    this.trinoInstance = Trino.create({
      server: process.env.DBC_BASE_URL
        ? process.env.DBC_BASE_URL
        : DEFAULT_PEAKA_DBC_HOST,
      extraCredential: {
        peakaKey: process.env.PEAKA_API_KEY || "",
      },
    });
  }

  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  public async executeSQLQuery(query: string): Promise<unknown> {
    const iter = await this.trinoInstance.query(query);

    for await (const queryResult of iter) {
      if (queryResult.error) {
        throw new Error(queryResult.error.message);
      }
      if (!queryResult.data || !queryResult.columns) {
        return [];
      }
      const columns = queryResult.columns;

      const dataResult: DataResult[][] = [];
      queryResult.data.forEach((row) => {
        const result = row.map((cell, index) => {
          const column = columns[index];
          return {
            dataType: column.type,
            name: column.name,
            order: index,
            value: cell as unknown,
          };
        });
        dataResult.push(result);
      });

      return dataResult;
    }
  }
}
