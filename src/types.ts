export interface ProjectInfoResponse {
  projectId: string;
  projectName: string;
  userId: string;
  email: string;
}

export interface GoldenSqlResult {
  result: GoldenSql[];
}

export interface GoldenSql {
  question: string;
  sql: string;
}

export interface DataResult {
  dataType: string;
  name: string;
  order: number;
  value: unknown;
}

export interface QueryContainer {
  query: string;
}
