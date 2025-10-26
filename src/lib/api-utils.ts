// API Response Handler Utility
// Standardized error handling for API routes

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return {
      error: error.message,
      details: error.details,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    return {
      error: error.message,
      statusCode: 500,
    };
  }

  return {
    error: 'An unknown error occurred',
    statusCode: 500,
  };
}

// Async handler wrapper for consistent error handling
export function asyncHandler(
  handler: (request: any, context?: any) => Promise<Response>
) {
  return async (request: any, context?: any) => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('API Error:', error);
      const { error: message, details, statusCode } = handleApiError(error);
      return Response.json(
        { error: message, details },
        { status: statusCode }
      );
    }
  };
}


