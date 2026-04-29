import type { ToolRegister } from "../types";
import { registerListConnectionsTool } from "./listConnections";
import { registerGetConnectionDetailTool } from "./getConnectionDetail";

export const registerConnectionTools: ToolRegister = (server) => {
  registerListConnectionsTool(server);
  registerGetConnectionDetailTool(server);
};
