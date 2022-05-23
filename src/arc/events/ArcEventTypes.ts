import { ArcModelEventTypes } from "./models/ArcModelEventTypes.js";

export const ArcEventTypes = Object.freeze({
  Model: ArcModelEventTypes,
  Workspace: Object.freeze({
    read: 'domainworkspaceread',
    write: 'domainworkspacewrite',
    append: 'domainworkspaceappend',
    triggerWrite: 'domainworkspacetriggerwrite',
    State: Object.freeze({
      write: 'domainworkspacestatewrite'
    }),
  }),
});
