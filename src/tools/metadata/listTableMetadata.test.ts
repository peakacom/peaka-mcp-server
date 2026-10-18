import {describe,it,expect,vi} from "vitest";
import {registerListTableMetadataTool,registerGetMetadataOperationTool} from "./listTableMetadata";
const mock=vi.hoisted(()=>({list:vi.fn(),operation:vi.fn()}));
vi.mock("../../context",()=>({resolveService:()=>({listTableMetadata:mock.list,getMetadataOperation:mock.operation})}));
function tool(register:any){let value:any;register({addTool:(v:any)=>value=v});return value;}
describe("bounded management tools",()=>{
 it("preserves an empty continued page without fetching additional pages",async()=>{
  const t=tool(registerListTableMetadataTool);const page={items:[],hasMore:true,nextCursor:"12345678-1234-1234-1234-123456789abc"};
  mock.list.mockResolvedValue(page);const result=await t.execute(t.parameters.parse({projectId:"p"}),{log:{},session:{}});
  expect(JSON.parse(result.content[0].text)).toEqual(page);expect(mock.list).toHaveBeenCalledWith("p",{limit:20});
 });
 it("rejects excessive limits and malformed cursor",()=>{
  const t=tool(registerListTableMetadataTool);
  expect(()=>t.parameters.parse({projectId:"p",limit:51})).toThrow();
  expect(()=>t.parameters.parse({projectId:"p",cursor:"bad"})).toThrow();
 });
 it("preserves the exact operation and partial outcome",async()=>{
  const t=tool(registerGetMetadataOperationTool);const runId="12345678-1234-1234-1234-123456789abc";
  mock.operation.mockResolvedValue({id:runId,status:"partially_completed"});
  const r=await t.execute({projectId:"p",runId},{log:{},session:{}});
  expect(mock.operation).toHaveBeenCalledWith("p",runId);expect(JSON.parse(r.content[0].text).status).toBe("partially_completed");
 });
});
