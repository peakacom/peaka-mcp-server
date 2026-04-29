import { UserError } from "fastmcp";
import { z } from "zod";
import axios from "axios";
import { resolveService } from "../../context";
import type { ToolRegister } from "../types";

export const registerListProjectsTool: ToolRegister = (server) => {
  server.addTool({
    name: "peaka_list_projects",
    description:
      "List all projects accessible for the user. Use this tool to discover projectIds, then pass the chosen projectId to subsequent tool calls.",
    annotations: {
      readOnlyHint: true,
    },
    parameters: z.object({}),
    execute: async (_, { log, session }) => {
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

        const projects = await svc.listAllProjects();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ projects }, null, 2),
            },
          ],
        };
      } catch (error) {
        if (error instanceof UserError) {
          throw error;
        }
        if (axios.isAxiosError(error)) {
          log.error(error.message);
        }
      }
    },
  });
};
