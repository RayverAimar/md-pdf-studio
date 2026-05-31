declare module "markdown-it-footnote" {
  import type { PluginSimple } from "markdown-it";

  const footnote: PluginSimple;
  export default footnote;
}

declare module "markdown-it-task-lists" {
  import type { PluginWithOptions } from "markdown-it";

  interface TaskListsOptions {
    enabled?: boolean;
    label?: boolean;
    labelAfter?: boolean;
  }

  const taskLists: PluginWithOptions<TaskListsOptions>;
  export default taskLists;
}
