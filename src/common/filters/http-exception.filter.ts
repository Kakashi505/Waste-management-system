import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: exception.message,
      error: exception.name,
    };

    // バリデーションエラーの場合、詳細なエラー情報を追加
    if (status === HttpStatus.BAD_REQUEST) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
        errorResponse['details'] = exceptionResponse['message'];
      }
    }

    // ログ出力
    console.error(`HTTP Exception: ${status} - ${request.method} ${request.url}`, {
      error: exception.message,
      stack: exception.stack,
      body: request.body,
      query: request.query,
      params: request.params,
    });

    response.status(status).json(errorResponse);
  }
}
