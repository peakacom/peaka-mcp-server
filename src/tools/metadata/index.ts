import { registerListTableMetadataTool, registerGetMetadataOperationTool } from "./listTableMetadata";
import type { ToolRegister } from "../types";
import { registerGetProjectMetadataTool } from "./getProjectMetadata";
import { registerRefreshProjectMetadataTool } from "./refreshProjectMetadata";
import { registerGetMetadataRefreshStatusTool } from "./getMetadataRefreshStatus";
import { registerSearchRelevantTablesTool } from "./searchRelevantTables";
import { registerListProjectTablesTool } from "./listProjectTables";

export const registerMetadataTools: ToolRegister = (server) => {
  registerListProjectTablesTool(server);
  registerGetProjectMetadataTool(server);
  registerListTableMetadataTool(server);
  registerGetMetadataOperationTool(server);
  registerSearchRelevantTablesTool(server);
  registerRefreshProjectMetadataTool(server);
  registerGetMetadataRefreshStatusTool(server);
};
