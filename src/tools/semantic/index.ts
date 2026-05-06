import type { ToolRegister } from "../types";
import { registerCreateSemanticCatalogTool } from "./createSemanticCatalog";
import { registerCreateSemanticTableTool } from "./createSemanticTable";
import { registerDeleteSemanticTableTool } from "./deleteSemanticTable";

export const registerSemanticTools: ToolRegister = (server) => {
  registerCreateSemanticCatalogTool(server);
  registerCreateSemanticTableTool(server);
  registerDeleteSemanticTableTool(server);
};
