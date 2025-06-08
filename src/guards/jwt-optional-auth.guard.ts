// src/auth/guards/jwt-optional-auth.guard.ts

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtOptionalAuthGuard extends AuthGuard('jwt') {
  // Sobrescreva o método handleRequest do AuthGuard
  handleRequest(err, user, info, context) {
    return user || null;
  }
}