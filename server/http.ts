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

const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const PROD_ORIGIN = "https://tailored-tech-fullstack-technical.vercel.app";

function corsHeaders(request: Request): Headers {
  const headers = new Headers();
  const origin = request.headers.get("Origin");
  if (!origin) return headers;
  if (!LOCAL_ORIGIN.test(origin) && origin !== PROD_ORIGIN) return headers;

  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  headers.set("Access-Control-Max-Age", "86400");
  headers.set("Vary", "Origin");
  return headers;
}

function withCors(response: Response, cors: Headers): Response {
  if ([...cors.keys()].length === 0) return response;
  const headers = new Headers(response.headers);
  cors.forEach((value, key) => headers.set(key, value));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/** Wraps a route's fetch handler so thrown HttpErrors (incl. AuthError) become proper JSON responses. */
export function withHandler(handler: (request: Request) => Promise<Response>) {
  return {
    async fetch(request: Request): Promise<Response> {
      const cors = corsHeaders(request);

      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: cors });
      }

      try {
        return withCors(await handler(request), cors);
      } catch (error) {
        if (error instanceof HttpError) {
          return withCors(json({ message: error.message }, error.status), cors);
        }
        console.error(error);
        return withCors(json({ message: "Internal Server Error" }, 500), cors);
      }
    },
  };
}
