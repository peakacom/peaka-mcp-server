import type { ToolRegister } from "../types";
import { registerCreateCacheTool } from "./createCache";
import { registerDeleteCacheTool } from "./deleteCache";
import { registerGetCacheStatusesTool } from "./getCacheStatuses";
import { registerRefreshCacheFullTool } from "./refreshCacheFull";
import { registerRefreshCacheIncrementalTool } from "./refreshCacheIncremental";
import { registerUpdateCacheTool } from "./updateCache";

export const registerCacheTools: ToolRegister = (server) => {
  registerCreateCacheTool(server);
  registerGetCacheStatusesTool(server);
  registerRefreshCacheFullTool(server);
  registerRefreshCacheIncrementalTool(server);
  registerUpdateCacheTool(server);
  registerDeleteCacheTool(server);
};
