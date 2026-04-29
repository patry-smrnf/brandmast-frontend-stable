export type ApiErrorPayload = {
  message?: string;
  code?: string;
  details?: unknown;
};

export class ApiError extends Error {
  readonly name = "ApiError";
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;
  readonly url?: string;

  constructor(args: {
    message: string;
    status: number;
    code?: string;
    details?: unknown;
    url?: string;
    cause?: unknown;
  }) {
    super(args.message, { cause: args.cause });
    this.status = args.status;
    this.code = args.code;
    this.details = args.details;
    this.url = args.url;
  }
}

