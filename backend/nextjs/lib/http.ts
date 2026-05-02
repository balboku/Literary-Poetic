import { z } from "zod";

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function errorJson(error: unknown, fallbackStatus = 500) {
  if (error instanceof z.ZodError) {
    return json(
      {
        error: "INVALID_REQUEST",
        message: "輸入格式不完整，請檢查欄位後再試一次。",
        details: error.flatten(),
      },
      400,
    );
  }

  return json(
    {
      error: "SERVER_ERROR",
      message: error instanceof Error ? error.message : "發生未知錯誤。",
    },
    fallbackStatus,
  );
}
