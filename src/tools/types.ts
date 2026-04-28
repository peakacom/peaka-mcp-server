import type { FastMCP } from "fastmcp";
import type { PeakaSession } from "../types";

export type ToolRegister = (server: FastMCP<PeakaSession>) => void;
