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

export interface TableMetadataResult {
  result: TableMetadata[];
}

export interface TableMetadata {
  projectId: string;
  catalogId: string;
  catalogType: string;
  catalogSubType: string;
  catalogQueryName: string;
  catalogDisplayName: string;
  schemaName: string;
  tableName: string;
  tableDescription?: string;
  isCacheable: boolean;
  isDynamicTable: boolean;
  useWithAI: boolean;
  columns?: ColumnMetadata[];
  relations?: RelationsMetadata[];
}

export interface ColumnMetadata {
  columnName: string;
  columnDescription: string;
  dataType: string;
  order: number;
  isNotNull?: boolean;
  isSystem?: boolean;
  isUnique?: boolean;
  isPrimary?: boolean;
  isCategorical?: boolean;
  lineage?: LineageResult[];
  categoricalValues?: string[];
  sampleValues?: unknown[];
}

export interface LineageResult {
  tables: string[];
  column: string;
  columnDescription?: string;
  expression: string;
}

export interface RelationsMetadata {
  id: string;
  projectId: string;
  sourceCatalogId: string;
  sourceCatalogName: string;
  sourceSchemaName: string;
  sourceTableName: string;
  sourceColumnName: string;
  targetCatalogId: string;
  targetCatalogName: string;
  targetSchemaName: string;
  targetTableName: string;
  targetColumnName: string;
  type: RelationshipType;
}

export enum RelationshipType {
  ManyToOne = "MANY_TO_ONE",
  OneToMany = "ONE_TO_MANY",
  OneToOne = "ONE_TO_ONE",
}
