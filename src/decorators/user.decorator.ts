import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TokenPayload } from 'src/auth/auth';

export const User = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    console.log('User decorator called');
    return request.user as TokenPayload;
  },
);
