import type { ToolRegister } from "../types";
import { registerQueryGoldenSqlsTool } from "./queryGoldenSqls";
import { registerExecuteSqlQueryTool } from "./executeSqlQuery";
import { registerExecuteQueryTool } from "./executeQuery";
import { registerCreateQueryTool } from "./createQuery";
import { registerUpdateQueryTool } from "./updateQuery";
import { registerDeleteQueryTool } from "./deleteQuery";
import { registerRefreshMaterializedQueryTool } from "./refreshMaterializedQuery";

export const registerQueryTools: ToolRegister = (server) => {
  registerQueryGoldenSqlsTool(server);
  registerExecuteSqlQueryTool(server);
  registerExecuteQueryTool(server);
  registerCreateQueryTool(server);
  registerUpdateQueryTool(server);
  registerDeleteQueryTool(server);
  registerRefreshMaterializedQueryTool(server);
};
