import {
  DefineFunction,
  Schema,
  SlackAPI,
  SlackFunction,
} from "deno-slack-sdk/mod.ts";
import { SlackAPIClient } from "deno-slack-sdk/deps.ts";
import BookDatastore, {
  bookBorrowed,
  bookNotBorrowed,
} from "../datastores/book_datastore.ts";

export const bookBorrow = "借りる";
export const bookReturn = "返す";

export const BookBorrowOrRetrunFunctionDefinition = DefineFunction({
  callback_id: "book_borrow_or_return_function",
  title: "Book Admin borrow or return the shared book",
  description: "共有本を借りるまたは返す関数",
  source_file: "functions/book_borrow_return_function.ts",
  input_parameters: {
    properties: {
      action: {
        type: Schema.types.string,
        description: "借りるか返すか",
        enum: [bookBorrow, bookReturn],
      },
      book_name: {
        type: Schema.types.string,
        description: "借りる / 返す 本の名前",
      },
      user_id: {
        type: Schema.slack.types.user_id,
        description: "ユーザーID",
      },
    },
    required: [
      "action",
      "book_name",
      "user_id",
    ],
  },
  output_parameters: {
    properties: {
      message: {
        type: Schema.slack.types.rich_text,
        description: "完了後にチャットに送信するメッセージ",
      },
    },
    required: [
      "message",
    ],
  },
});

export default SlackFunction(
  BookBorrowOrRetrunFunctionDefinition,
  async ({ inputs, token }) => {
    const { action, book_name, user_id } = inputs;
    const client = SlackAPI(token, {});

    switch (action) {
      case bookBorrow: {
        try {
          await _borrowBook(client, book_name, user_id);
        } catch (e) {
          throw new Error("BookBorrowOrRetrunFunction failed: " + e.message);
        }

        const message = _borrowMessage(book_name, user_id);

        return { outputs: { message: message } };
      }
      case bookReturn: {
        try {
          await _returnBook(client, book_name);
        } catch (e) {
          throw new Error("BookBorrowOrRetrunFunction failed: " + e.message);
        }

        const message = _returnMessage(book_name, user_id);

        return { outputs: { message: message } };
      }
      default:
        throw new Error("Invalid action: " + action);
    }
  },
);

/**
 * Datastoreにある本の貸出処理を行う関数
 * @param client SlackAPIClient
 * @param book_name 貸出する本の名前
 * @param borrow_user_id 貸出するユーザーのID
 */
const _borrowBook = async (
  client: SlackAPIClient,
  book_name: string,
  borrow_user_id: string,
) => {
  const res = await client.apps.datastore.update<
    typeof BookDatastore.definition
  >({
    datastore: BookDatastore.name,
    item: {
      id: book_name,
      borrowed_status: bookBorrowed,
      borrowed_user_id: borrow_user_id,
    },
  });

  if (res.error) {
    throw new Error("_borrowBook failed: " + res.error);
  }
};

/**
 * Datastoreにある本の返却処理を行う関数
 * @param client SlackAPIClient
 * @param book_name 返却する本の名前
 */
const _returnBook = async (
  client: SlackAPIClient,
  book_name: string,
) => {
  const res = await client.apps.datastore.update<
    typeof BookDatastore.definition
  >({
    datastore: BookDatastore.name,
    item: {
      id: book_name,
      borrowed_status: bookNotBorrowed,
      borrowed_user_id: null,
    },
  });

  if (res.error) {
    throw new Error("_returnBook failed: " + res.error);
  }
};

/**
 * 貸出が完了したことを通知するメッセージを生成する関数
 * @param book_name 貸出する本の名前
 * @param borrow_user_id 貸出するユーザーのID
 * @returns メッセージ
 */
const _borrowMessage = (
  book_name: string,
  borrow_user_id: string,
) => `<@${borrow_user_id}> が「${book_name}」を借りました :book:`;

/**
 * 返却が完了したことを通知するメッセージを生成する関数
 * @param book_name 返却する本の名前
 * @returns
 */
const _returnMessage = (
  book_name: string,
  borrow_user_id: string,
) =>
  `<@${borrow_user_id}> が借りていた「${book_name}」が返却されました :okaeri:`;
