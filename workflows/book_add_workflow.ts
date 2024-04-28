import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { BookAddFunctionDefinition } from "../functions/book_add_function.ts";

const BookAddWorkflow = DefineWorkflow({
  callback_id: "book_add_workflow",
  title: "共有本の追加",
  description: "共有本を追加するためのワークフロー",
  input_parameters: {
    properties: {
      interactivity: { type: Schema.slack.types.interactivity },
      user_id: { type: Schema.slack.types.user_id },
      channel_id: { type: Schema.types.string },
    },
    required: [
      "interactivity",
      "user_id",
      "channel_id",
    ],
  },
});

// 追加したい本の情報を入力するフォームを開く
const inputForm = BookAddWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    interactivity: BookAddWorkflow.inputs.interactivity,
    title: "共有本を追加する",
    description: "追加したい本の名前を入力してください",
    submit_label: "追加",
    fields: {
      elements: [
        {
          name: "book_name",
          title: "追加する本の名前",
          type: Schema.types.string,
        },
        {
          name: "user_id",
          title: "本の持ち主",
          type: Schema.slack.types.user_id,
          default: BookAddWorkflow.inputs.user_id,
        },
      ],
      required: [
        "book_name",
        "user_id",
      ],
    },
  },
);

// 本を追加する処理
const bookAddFunction = BookAddWorkflow.addStep(
  BookAddFunctionDefinition,
  {
    book_name: inputForm.outputs.fields.book_name,
    user_id: inputForm.outputs.fields.user_id,
  },
);

// messageをチャットに送信する処理
BookAddWorkflow.addStep(
  Schema.slack.functions.SendMessage,
  {
    channel_id: BookAddWorkflow.inputs.channel_id,
    message: bookAddFunction.outputs.message,
  },
);

export default BookAddWorkflow;
