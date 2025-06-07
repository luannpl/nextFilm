// src/auth/guards/jwt-optional-auth.guard.ts

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtOptionalAuthGuard extends AuthGuard('jwt') {
  // Sobrescreva o método handleRequest do AuthGuard
  handleRequest(err, user, info) {
    // Este método é o que normalmente lançaria um erro se o usuário não for encontrado
    // ou se o token for inválido.
    // Em vez de lançar um erro, simplesmente retornamos o usuário se ele existir,
    // ou `null` / `undefined` se não existir.
    // Assim, a requisição sempre prossegue.
    return user;
  }
}