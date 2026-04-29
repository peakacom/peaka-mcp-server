import type { ToolRegister } from "../types";
import { registerGetRelationsTool } from "./getRelations";
import { registerGetTableStatisticsTool } from "./getTableStatistics";

export const registerTableTools: ToolRegister = (server) => {
  registerGetRelationsTool(server);
  registerGetTableStatisticsTool(server);
};
