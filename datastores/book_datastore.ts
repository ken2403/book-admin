import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

export const bookBorrowed = "borrowed";
export const bookNotBorrowed = "not_borrowed";

const BookDatastore = DefineDatastore({
  name: "BookDatastore",
  primary_key: "id",
  attributes: {
    // 本の名前をidで管理する
    id: {
      type: Schema.types.string,
    },
    book_owner_user_id: {
      type: Schema.types.string,
    },
    // not_borrowed: 貸出可能
    // borrowed: 貸出中
    borrowed_status: {
      type: Schema.types.string,
      enum: [bookBorrowed, bookNotBorrowed],
    },
    // 貸出中のユーザーID
    // 貸出可能の場合はnull
    borrowed_user_id: {
      type: Schema.types.string,
      default: null,
    },
  },
});

export default BookDatastore;
