import type { ToolRegister } from "../types";
import { registerGetProjectMetadataTool } from "./getProjectMetadata";
import { registerRefreshProjectMetadataTool } from "./refreshProjectMetadata";
import { registerGetMetadataRefreshStatusTool } from "./getMetadataRefreshStatus";
import { registerSearchRelevantTablesTool } from "./searchRelevantTables";

export const registerMetadataTools: ToolRegister = (server) => {
  registerGetProjectMetadataTool(server);
  registerSearchRelevantTablesTool(server);
  registerRefreshProjectMetadataTool(server);
  registerGetMetadataRefreshStatusTool(server);
};
