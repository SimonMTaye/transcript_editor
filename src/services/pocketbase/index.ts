import PocketBase from "pocketbase";
import { pbDB } from "./pocketbase_db";
import { pbFileStore } from "./pocketbase_store";

const PB_URL = import.meta.env.VITE_POCKETB_URL;
console.log("PocketBase URL:", PB_URL);
export const pb = new PocketBase(PB_URL);

export const pbDatabase = pbDB;
export { pbFileStore };
