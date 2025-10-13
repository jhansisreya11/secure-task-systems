import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get() 
  root() {
    return { ok: true };
  }

  @Get('health') 
  health() {
    return { status: 'ok' };
  }
}
