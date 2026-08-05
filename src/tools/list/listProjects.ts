import { z } from "zod";
import { UserError } from "fastmcp";
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

        const { projects: allProjects, forbidden } =
          await svc.listAllProjects();

        // If we couldn't list a single project AND every workspace was
        // forbidden, that's almost certainly a permissions/backend problem,
        // not an empty account — surface it instead of a misleading empty list.
        if (allProjects.length === 0 && forbidden.length > 0) {
          throw new UserError(
            JSON.stringify({
              error: "forbidden",
              message: `Could not list any projects: all ${forbidden.length} workspace(s) returned 403 Forbidden. This usually indicates a permissions or backend issue rather than an empty account.`,
              forbiddenWorkspaces: forbidden,
            })
          );
        }

        let projects = allProjects;
        if (search) {
          const q = search.toLowerCase();
          projects = projects.filter(
            (p) =>
              p.projectName.toLowerCase().includes(q) ||
              p.workspaceName.toLowerCase().includes(q) ||
              p.organizationName.toLowerCase().includes(q)
          );
        }

        const payload: {
          projects: typeof projects;
          note?: string;
        } = { projects };
        if (forbidden.length > 0) {
          payload.note = `${forbidden.length} workspace(s) returned 403 and were skipped, so this list may be incomplete: ${forbidden.join(
            ", "
          )}`;
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(payload, null, 2),
            },
          ],
        };
      } catch (error) {
        handleToolError(error, log);
      }
    },
  });
};
