import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import BookAddWorkflow from "../workflows/book_add_workflow.ts";

const bookAddLinkTrigger: Trigger<typeof BookAddWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "共有本追加",
  description: "共有本を追加する",
  shortcut: {
    button_text: "book-add",
  },
  workflow: `#/workflows/${BookAddWorkflow.definition.callback_id}`,
  inputs: {
    interactivity: { value: TriggerContextData.Shortcut.interactivity },
    channel_id: { value: TriggerContextData.Shortcut.channel_id },
    user_id: { value: TriggerContextData.Shortcut.user_id },
  },
};

export default bookAddLinkTrigger;
