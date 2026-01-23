import { NextRequest } from "next/server";

export function getTelegramId(req: NextRequest) {
  const id = req.headers.get("x-telegram-id");
  if (!id) throw new Error("Unauthorized");
  return Number(id);
}
