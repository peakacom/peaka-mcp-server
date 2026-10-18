import { z } from "zod";
import { resolveService } from "../../context";
import { handleToolError } from "../../error";
import type { ToolRegister } from "../types";

export const registerListTableMetadataTool: ToolRegister = server => {
  server.addTool({
    name: "peaka_list_table_metadata",
    description: "Read one page of collected table metadata summaries, including tables excluded from automatic AI context. Requires metadata management permission. Use catalogId/schemaName to narrow scope. Pass nextCursor with the same filters and limit to continue; an empty page can still have a continuation. Cursors expire after 15 minutes. This is not a complete source inventory or a snapshot; discover missing tables with the ordinary catalog/schema/table tools. Descriptions longer than 2000 characters are explicitly marked as truncated. Does not return columns, samples or relations. On unsupported servers, ask to upgrade; never silently fetch the whole project. Permission errors must not be bypassed.",
    annotations: { title: "List Table Metadata", readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    parameters: z.object({projectId:z.string().min(1), catalogId:z.string().min(1).optional(), schemaName:z.string().min(1).optional(),
      limit:z.number().int().min(1).max(50).default(20), cursor:z.string().uuid().optional()}),
    execute: async (args, {log, session}) => {
      try { const {projectId, ...query}=args; const result=await resolveService(session).listTableMetadata(projectId,query);
        return {content:[{type:"text",text:JSON.stringify(result)}]};
      } catch(error) { handleToolError(error,log,{tool:"peaka_list_table_metadata"}); }
    }
  });
};

export const registerGetMetadataOperationTool: ToolRegister = server => {
  server.addTool({
    name:"peaka_get_metadata_operation",
    description:"Read the exact refresh operation ID returned in runIds by refresh. Only done means success; partially_completed, cancelled, paused, failed and timed_out are not success. Do not substitute the latest catalog job. Requires metadata management permission. Does not start or retry work.",
    annotations:{title:"Get Metadata Operation",readOnlyHint:true,destructiveHint:false,openWorldHint:false},
    parameters:z.object({projectId:z.string().min(1),runId:z.string().uuid()}),
    execute:async(args,{log,session})=>{try{
      const result=await resolveService(session).getMetadataOperation(args.projectId,args.runId);
      return {content:[{type:"text",text:JSON.stringify(result)}]};
    }catch(error){handleToolError(error,log,{tool:"peaka_get_metadata_operation"});}}
  });
};
