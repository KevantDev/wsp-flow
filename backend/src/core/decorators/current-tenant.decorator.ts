import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return user?.tenantId || (request.headers['x-tenant-id'] as string) || (request.query?.tenantId as string) || '';
  },
);
