import { Manifest } from "deno-slack-sdk/mod.ts";
import BookDatastore from "./datastores/book_datastore.ts";
import BookAddWorkflow from "./workflows/book_add_workflow.ts";
import BookBorrowWorkflow from "./workflows/book_borrow_workflow.ts";

export default Manifest({
  name: "book-admin",
  description: "共有本を管理するためのアプリ",
  icon: "assets/book_icon.png",
  workflows: [
    BookAddWorkflow,
    BookBorrowWorkflow,
  ],
  outgoingDomains: [],
  datastores: [
    BookDatastore,
  ],
  botScopes: [
    "commands",
    "chat:write",
    "chat:write.public",
    "datastore:read",
    "datastore:write",
  ],
});
