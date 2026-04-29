import type { ToolRegister } from "../types";
import { registerGetProjectMetadataTool } from "./getProjectMetadata";
import { registerRefreshProjectMetadataTool } from "./refreshProjectMetadata";
import { registerGetMetadataRefreshStatusTool } from "./getMetadataRefreshStatus";

export const registerMetadataTools: ToolRegister = (server) => {
  registerGetProjectMetadataTool(server);
  registerRefreshProjectMetadataTool(server);
  registerGetMetadataRefreshStatusTool(server);
};
