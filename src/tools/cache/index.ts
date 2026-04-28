import type { ToolRegister } from "../types";
import { registerCreateCacheTool } from "./createCache";
import { registerGetCacheStatusesTool } from "./getCacheStatuses";
import { registerRefreshCacheFullTool } from "./refreshCacheFull";
import { registerRefreshCacheIncrementalTool } from "./refreshCacheIncremental";

export const registerCacheTools: ToolRegister = (server) => {
  registerCreateCacheTool(server);
  registerGetCacheStatusesTool(server);
  registerRefreshCacheFullTool(server);
  registerRefreshCacheIncrementalTool(server);
};
