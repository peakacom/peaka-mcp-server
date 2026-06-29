import type { ToolRegister } from "../types";
import { registerQueryGoldenSqlsTool } from "./queryGoldenSqls";
import { registerExecuteSqlQueryTool } from "./executeSqlQuery";
import { registerExecuteQueryTool } from "./executeQuery";
import { registerGetQueryTool } from "./getQuery";
import { registerCreateQueryTool } from "./createQuery";
import { registerUpdateQueryTool } from "./updateQuery";
import { registerDeleteQueryTool } from "./deleteQuery";
import { registerRefreshMaterializedQueryTool } from "./refreshMaterializedQuery";
import { registerMaterializedQueryStatusTool } from "./getMaterializedQueryStatus";

export const registerQueryTools: ToolRegister = (server) => {
  registerQueryGoldenSqlsTool(server);
  registerExecuteSqlQueryTool(server);
  registerExecuteQueryTool(server);
  registerGetQueryTool(server);
  registerCreateQueryTool(server);
  registerUpdateQueryTool(server);
  registerDeleteQueryTool(server);
  registerRefreshMaterializedQueryTool(server);
  registerMaterializedQueryStatusTool(server);
};
