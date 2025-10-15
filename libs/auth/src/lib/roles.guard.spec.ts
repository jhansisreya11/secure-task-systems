import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';

describe('RolesGuard', () => {
  it('allows Owner to bypass', () => {
    const guard = new RolesGuard(new Reflector());
    const context: any = {
      switchToHttp: () => ({ getRequest: () => ({ user: { role: 'Owner' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    };
    jest.spyOn((guard as any).reflector, 'getAllAndOverride').mockReturnValue(['Admin']);
    expect(guard.canActivate(context)).toBe(true);
  });
});
