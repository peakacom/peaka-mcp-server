import type { ToolRegister } from "../types";
import { registerQueryGoldenSqlsTool } from "./queryGoldenSqls";
import { registerExecuteSqlQueryTool } from "./executeSqlQuery";
import { registerExecuteQueryTool } from "./executeQuery";

export const registerQueryTools: ToolRegister = (server) => {
  registerQueryGoldenSqlsTool(server);
  registerExecuteSqlQueryTool(server);
  registerExecuteQueryTool(server);
};
