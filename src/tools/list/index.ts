import type { ToolRegister } from "../types";
import { registerListCatalogsTool } from "./listCatalogs";
import { registerListSchemasTool } from "./listSchemas";
import { registerListTablesTool } from "./listTables";
import { registerListColumnsTool } from "./listColumns";
import { registerListQueriesTool } from "./listQueries";
import { registerListProjectsTool } from "./listProjects";

export const registerListTools: ToolRegister = (server) => {
  registerListCatalogsTool(server);
  registerListSchemasTool(server);
  registerListTablesTool(server);
  registerListColumnsTool(server);
  registerListQueriesTool(server);
  registerListProjectsTool(server);
};
