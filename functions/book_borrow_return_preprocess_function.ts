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
import { bookBorrow } from "./book_borrow_return_function.ts";
import { bookReturn } from "./book_borrow_return_function.ts";

export const BookBorrowOrRetrunPreprocessFunctionDefinition = DefineFunction({
  callback_id: "book_borrow_or_return_preprocess_function",
  title: "Book Admin preprocess the borrow or return book",
  description: "共有本の一覧を取得し、次のフォームに必要な情報を取得する関数",
  source_file: "functions/book_borrow_return_preprocess_function.ts",
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
        description: "インタラクティブな情報",
      },
      action: {
        type: Schema.types.string,
        description: "借りるか返すか",
        enum: [bookBorrow, bookReturn],
      },
    },
    required: [
      "interactivity",
      "action",
    ],
  },
  output_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
        description: "インタラクティブな情報",
      },
      next_form_title: {
        type: Schema.types.string,
        description: "次のフォームのタイトル",
      },
      next_form_description: {
        type: Schema.types.string,
        description: "次のフォームの説明",
      },
      next_form_books_title: {
        type: Schema.types.string,
        description: "次のフォームの本を選択する部分のタイトル",
      },
      next_form_user_id_title: {
        type: Schema.types.string,
        description: "次のフォームのユーザーIDを選択する部分のタイトル",
      },
      books: {
        description: "選択可能な本の一覧",
        type: Schema.types.array,
        items: {
          type: Schema.types.string,
        },
      },
    },
    required: [
      "interactivity",
      "next_form_title",
      "next_form_description",
      "next_form_books_title",
      "next_form_user_id_title",
      "books",
    ],
  },
});

export default SlackFunction(
  BookBorrowOrRetrunPreprocessFunctionDefinition,
  async ({ inputs, token }) => {
    const { interactivity, action } = inputs;
    const client = SlackAPI(token, {});

    switch (action) {
      case bookBorrow: {
        try {
          const res = await _fetchAllNotBorrowdBook(client);
          const books = res.items.map((book) => book.id);

          if (books.length === 0) {
            throw new Error(
              "BookBorrowOrReturnPreprocessFunction failed: No borrowable books found",
            );
          }

          return {
            outputs: {
              interactivity: interactivity,
              next_form_title: "共有本を借りる",
              next_form_description:
                "貸出可能な本から借りたい本を選んでください",
              next_form_books_title: "借りたい本を選ぶ",
              next_form_user_id_title: "本を借りるユーザー",
              books: books,
            },
          };
        } catch (e) {
          throw new Error(
            "BookBorrowOrReturnPreprocessFunction failed: " + e.message,
          );
        }
      }
      case bookReturn: {
        try {
          const res = await _fetchAllBorrowedBook(client);
          const books = res.items.map((book) => book.id);

          if (books.length === 0) {
            throw new Error(
              "BookBorrowOrReturnPreprocessFunction failed: No returnable books found",
            );
          }

          return {
            outputs: {
              interactivity: interactivity,
              next_form_title: "共有本を返す",
              next_form_description: "貸出中の本から返したい本を選んでください",
              next_form_books_title: "返したい本を選ぶ",
              next_form_user_id_title: "本を返すユーザー",
              books: books,
            },
          };
        } catch (e) {
          throw new Error(
            "BookBorrowOrReturnPreprocessFunction failed: " + e.message,
          );
        }
      }
      default:
        throw new Error(
          "BookBorrowOrReturnPreprocessFunction failed: Invalid action",
        );
    }
  },
);

/**
 * Datastoreにある貸出可能な本を全て取得する関数
 * @param client SlackAPIClient
 * @returns 貸出可能な本の一覧
 */
const _fetchAllNotBorrowdBook = async (client: SlackAPIClient) => {
  const res = await client.apps.datastore.query<
    typeof BookDatastore.definition
  >({
    datastore: BookDatastore.name,
    expression: "#borrowed_status = :status",
    expression_attributes: { "#borrowed_status": "borrowed_status" },
    expression_values: { ":status": bookNotBorrowed },
  });

  if (!res.ok) {
    throw new Error("_fetchAllNotBorrowdBook failed: " + res.error);
  }

  return res;
};
/**
 * Datastoreにある貸出中の本を全て取得する関数
 * @param client SlackAPIClient
 * @returns 貸出中の本の一覧
 */
const _fetchAllBorrowedBook = async (client: SlackAPIClient) => {
  const res = await client.apps.datastore.query<
    typeof BookDatastore.definition
  >({
    datastore: BookDatastore.name,
    expression: "#borrowed_status = :status",
    expression_attributes: { "#borrowed_status": "borrowed_status" },
    expression_values: { ":status": bookBorrowed },
  });

  if (!res.ok) {
    throw new Error("_fetchAllBorrowedBook failed: " + res.error);
  }

  return res;
};
