import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user || {};
    const userRoles: string[] = Array.isArray(user.roles) ? user.roles : [];

    const userRolesLower = userRoles.map((r) => String(r).toLowerCase());
    return requiredRoles.some((r) =>
      userRolesLower.includes(String(r).toLowerCase()),
    );
    }
}
