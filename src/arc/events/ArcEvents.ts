import { ArcModelEvents } from "./models/ArcModelEvents.js";
import { WorkspaceEvents } from "./workspace/WorkspaceEvents.js";

export const ArcEvents = Object.freeze({
  Model: ArcModelEvents,
  Workspace: WorkspaceEvents,
});
