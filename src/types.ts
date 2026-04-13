export interface ProjectInfoResponse {
  projectId?: string;
  projectName?: string;
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


export interface QueryContainer {
  query: string;
}

export interface TableMetadataResult {
  result: TableMetadata[];
}

export interface ProjectMetadataEntry {
  id: string;
  content: string;
  metadata: TableMetadata;
}

export interface ProjectMetadataResponse {
  metadata: ProjectMetadataEntry[];
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
  fullTableNameToBeUsedInSQLQueries: string;
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

export interface Catalog {
  id: string;
  name: string;
  displayName: string;
  catalogType: string;
  connectionId: string | null;
}

export interface Schema {
  catalogId: string;
  catalogName: string;
  schemaName: string;
}

export interface Table {
  catalogId: string;
  catalogName: string;
  schemaName: string;
  tableName: string;
  isCacheable: boolean;
  isDynamicTable: boolean;
  isCached: boolean;
}

export interface ColumnDetail {
  name: string;
  dataType: string;
  displayName: string;
  defaultValue: string | null;
  isNotNull: boolean;
  isUnique: boolean;
  desc?: string;
}

export interface Cache {
  id: string;
  catalogId: string;
  schemaName: string;
  tableName: string;
  projectId: string;
  incrementalCacheSchedule: { expression: string; type: string } | null;
  fullRefreshCacheSchedule: { expression: string; type: string } | null;
}

export interface CacheExecutionProgress {
  numberOfCachedRecords: number;
  numberOfInsertedRecords: number;
  numberOfUpdatedRecords: number;
  numberOfDeletedRecords: number;
  lastOffset: string;
  lastCacheTxId: string;
}

export interface CacheExecutionInfo {
  id: string;
  status: string;
  error: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  finishedAt: string;
  progress: CacheExecutionProgress | null;
}

export interface CacheActionLog {
  timestamp: string;
  action: string;
  message: string;
  cacheType: string;
  isScheduled: boolean;
}

export interface CacheStatus {
  id: string;
  status: string;
  catalogId: string;
  schemaName: string;
  tableName: string;
  projectId: string;
  lastIncrementalCacheExecution: CacheExecutionInfo | null;
  lastFullRefreshCacheExecution: CacheExecutionInfo | null;
  cacheActionLogs: CacheActionLog[];
}

export interface QuerySchedule {
  expression: string;
  type: string;
}

export interface SavedQuery {
  id: string;
  displayName: string;
  name: string;
  inputQuery: string;
  inputQueryRefId: string;
  queryType: string;
  schedule: QuerySchedule | null;
}

export interface QueryResultColumn {
  catalogId: string;
  catalogName: string;
  schemaName: string;
  tableName: string;
  columnName: string;
}

export interface QueryResultCellValue {
  name: string;
  displayName: string;
  dataType: string;
  value: string;
  order: number;
}

export interface QueryResult {
  columns: QueryResultColumn[];
  data: QueryResultCellValue[][];
}

export enum RelationshipType {
  ManyToOne = "MANY_TO_ONE",
  OneToMany = "ONE_TO_MANY",
  OneToOne = "ONE_TO_ONE",
}

export interface Organization {
  id: string;
  name: string;
  owner: string;
  createdAt: string;
  iconFileId: string | null;
  description: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  createdBy: string;
  organizationId: string;
  description: string | null;
  createdAt: string;
  defaultWorkspace: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  domain: string | null;
  webhookBaseUrl: string | null;
  createdAt: string;
  owner: string;
  workspaceId: string;
}

export interface ProjectListItem {
  organizationId: string;
  organizationName: string;
  workspaceId: string;
  workspaceName: string;
  projectId: string;
  projectName: string;
}

export interface MetadataRefreshResponse {
  [key: string]: unknown;
}

export type MetadataRefreshStatus =
  | "NOT_ACTIVE"
  | "COMPLETED"
  | "WAITING"
  | "ACTIVE"
  | "DELAYED"
  | "FAILED"
  | "PAUSED"
  | "STUCK";

export interface MetadataRefreshStatusResponse {
  status: MetadataRefreshStatus;
}
