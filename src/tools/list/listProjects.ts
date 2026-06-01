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
      readOnlyHint: true,
    },
    parameters: z.object({
      search: z
        .string()
        .optional()
        .describe(
          "Optional case-insensitive filter. Only projects whose project, workspace, or organization name contains this string are returned."
        ),
    }),
    execute: async ({ search }, { log, session }) => {
      try {
        const svc = resolveService(session);
        const info = await svc.getProjectInfo();
        if (info.projectId) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    note: "User has access to a single project. Pass this projectId to subsequent tool calls.",
                    projects: [
                      {
                        projectId: info.projectId,
                        projectName: info.projectName,
                      },
                    ],
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        let projects = await svc.listAllProjects();
        if (search) {
          const q = search.toLowerCase();
          projects = projects.filter(
            (p) =>
              p.projectName.toLowerCase().includes(q) ||
              p.workspaceName.toLowerCase().includes(q) ||
              p.organizationName.toLowerCase().includes(q)
          );
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ projects }, null, 2),
            },
          ],
        };
      } catch (error) {
        handleToolError(error, log);
      }
    },
  });
};
