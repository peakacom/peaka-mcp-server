import { z } from "zod";
import { resolveService } from "../../context";
import { PROJECT_ID_HINT } from "../shared";
import type { ToolRegister } from "../types";
import { handleToolError } from "../../error";

export const registerCreateSemanticCatalogTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_create_semantic_catalog",
    description:
      `Create a semantic catalog in the Peaka project. A semantic catalog groups semantic tables — saved queries surfaced as queryable tables — under a single namespace. Returns the created catalog including its id.

    ${PROJECT_ID_HINT}`,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
    },
    parameters: z.object({
      projectId: z.string().describe("The Peaka project ID to run against."),
      name: z.string().describe("Name of the semantic catalog to create."),
    }),
    execute: async (args, { log, session }) => {
      try {
        const svc = resolveService(session);
        const result = await svc.createSemanticCatalog(args.projectId, {
          name: args.name,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        handleToolError(error, log);
      }
    },
  });
};
