import {
  DefineFunction,
  Schema,
  SlackAPI,
  SlackFunction,
} from "deno-slack-sdk/mod.ts";
import { SlackAPIClient } from "deno-slack-sdk/deps.ts";
import BookDatastore, {
  bookNotBorrowed,
} from "../datastores/book_datastore.ts";

export const BookAddFunctionDefinition = DefineFunction({
  callback_id: "book_add_function",
  title: "Book Admin add the shared book",
  description: "共有本に本を追加する関数",
  source_file: "functions/book_add_function.ts",
  input_parameters: {
    properties: {
      book_name: {
        type: Schema.types.string,
        description: "追加する本の名前",
      },
      user_id: {
        type: Schema.slack.types.user_id,
        description: "ユーザーID",
      },
    },
    required: [
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
  BookAddFunctionDefinition,
  async ({ inputs, token }) => {
    const { book_name, user_id } = inputs;
    const client = SlackAPI(token, {});

    try {
      await _addBook(client, book_name, user_id);
    } catch (e) {
      throw new Error("BookAddFunction failed: " + e.message);
    }

    const message = _addMessage(book_name, user_id);

    return { outputs: { message: message } };
  },
);

/**
 * Datastoreに本を追加する関数
 * @param client
 * @param book_name
 * @param user_id
 */
const _addBook = async (
  client: SlackAPIClient,
  book_name: string,
  user_id: string,
) => {
  const res = await client.apps.datastore.put<typeof BookDatastore.definition>({
    datastore: BookDatastore.name,
    item: {
      id: book_name,
      book_owner_user_id: user_id,
      borrowed_status: bookNotBorrowed,
      borrowed_user_id: null,
    },
  });

  if (!res.ok) {
    throw new Error("_addBook failed: " + res.error);
  }
};

/**
 * 追加が完了したことを通知するメッセージを作成する関数
 * @param book_name 追加した本の名前
 * @param user_id 本の所有者のユーザーID
 * @returns メッセージ
 */
const _addMessage = (
  book_name: string,
  user_id: string,
) => `<@${user_id}> の「${book_name}」が共有本に追加されました :books:`;
