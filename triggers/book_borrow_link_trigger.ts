import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import BookBorrowWorkflow from "../workflows/book_borrow_workflow.ts";

const bookBorrowLinkTrigger: Trigger<typeof BookBorrowWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "共有本貸出 ",
  description: "共有本を借りる",
  shortcut: {
    button_text: "book-borrow",
  },
  workflow: `#/workflows/${BookBorrowWorkflow.definition.callback_id}`,
  inputs: {
    interactivity: { value: TriggerContextData.Shortcut.interactivity },
    channel_id: { value: TriggerContextData.Shortcut.channel_id },
    user_id: { value: TriggerContextData.Shortcut.user_id },
  },
};

export default bookBorrowLinkTrigger;
