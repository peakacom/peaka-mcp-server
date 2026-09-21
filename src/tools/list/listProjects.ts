import { z } from "zod";
import { resolveService } from "../../context";
import type { ToolRegister } from "../types";
import { handleToolError } from "../../error";

export const registerListProjectsTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_list_projects",
    description:
      "List all projects accessible for the user. Use this tool to discover projectIds, then pass the chosen projectId to subsequent tool calls.",
    annotations: {
      title: "List Projects",
      openWorldHint: false,
      readOnlyHint: true,
      destructiveHint: false,
    },
    parameters: z.object({
      search: z
        .string()
        .optional()
        .describe(
          "Optional case-insensitive filter. Only projects whose name contains this string are returned."
        ),
    }),
    execute: async ({ search }, { log, session }) => {
      try {
        const svc = resolveService(session);
        const all = await svc.getAllProjects();

        let projects = all.map((p) => ({
          projectId: p.id,
          projectName: p.name,
        }));
        if (search) {
          const q = search.toLowerCase();
          projects = projects.filter((p) =>
            p.projectName.toLowerCase().includes(q)
          );
        }

        return {
          content: [
            { type: "text", text: JSON.stringify({ projects }, null, 2) },
          ],
        };
      } catch (error) {
        handleToolError(error, log, { tool: "peaka_list_projects" });
      }
    },
  });
};
