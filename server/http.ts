export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
}

/** Wraps a route's fetch handler so thrown HttpErrors (incl. AuthError) become proper JSON responses. */
export function withHandler(handler: (request: Request) => Promise<Response>) {
  return {
    async fetch(request: Request): Promise<Response> {
      try {
        return await handler(request);
      } catch (error) {
        if (error instanceof HttpError) {
          return json({ message: error.message }, error.status);
        }
        console.error(error);
        return json({ message: "Internal Server Error" }, 500);
      }
    },
  };
}
