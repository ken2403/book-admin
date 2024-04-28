import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import {
  bookBorrow,
  BookBorrowOrRetrunFunctionDefinition,
  bookReturn,
} from "../functions/book_borrow_return_function.ts";
import {
  BookBorrowOrRetrunPreprocessFunctionDefinition,
} from "../functions/book_borrow_return_preprocess_function.ts";

const BookBorrowWorkflow = DefineWorkflow({
  callback_id: "book_borrow_workflow",
  title: "共有本を借りる / 返す",
  description: "共有本を借りる / 返すためのワークフロー",
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

// 本を借りるか返すかを選択するフォームを開く
const selectForm = BookBorrowWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    interactivity: BookBorrowWorkflow.inputs.interactivity,
    title: "共有本を借りる / 返す",
    description: "共有本を借りるか返すか選択してください",
    submit_label: "次へ",
    fields: {
      elements: [
        {
          name: "action",
          title: "借りる / 返す を選ぶ",
          type: Schema.types.string,
          enum: [bookBorrow, bookReturn],
          default: bookBorrow,
        },
      ],
      required: [
        "action",
      ],
    },
  },
);

// 借りるか返すかを処理する関数
const preprocess = BookBorrowWorkflow.addStep(
  BookBorrowOrRetrunPreprocessFunctionDefinition,
  {
    interactivity: selectForm.outputs.interactivity,
    action: selectForm.outputs.fields.action,
  },
);

// 本の情報を入力するフォームを開く
const inputForm = BookBorrowWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    interactivity: preprocess.outputs.interactivity,
    description: preprocess.outputs.next_form_description,
    title: preprocess.outputs.next_form_title,
    submit_label: "送信",
    fields: {
      elements: [
        {
          name: "book_name",
          title: preprocess.outputs.next_form_books_title,
          type: Schema.types.string,
          enum: preprocess.outputs.books,
        },
        {
          name: "user_id",
          title: preprocess.outputs.next_form_user_id_title,
          type: Schema.slack.types.user_id,
          default: BookBorrowWorkflow.inputs.user_id,
        },
      ],
      required: [
        "book_name",
        "user_id",
      ],
    },
  },
);

// 本を借りるか返すかを処理する関数
const bookBorrowFunction = BookBorrowWorkflow.addStep(
  BookBorrowOrRetrunFunctionDefinition,
  {
    action: selectForm.outputs.fields.action,
    book_name: inputForm.outputs.fields.book_name,
    user_id: inputForm.outputs.fields.user_id,
  },
);

// messageをチャットに送信する処理
BookBorrowWorkflow.addStep(
  Schema.slack.functions.SendMessage,
  {
    channel_id: BookBorrowWorkflow.inputs.channel_id,
    message: bookBorrowFunction.outputs.message,
  },
);

export default BookBorrowWorkflow;
