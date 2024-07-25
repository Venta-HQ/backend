import { Controller, Get } from '@nestjs/common';
import { ClerkService } from './clerk.service';

@Controller()
export class ClerkController {
  constructor(private readonly clerkService: ClerkService) {}

  @Get()
  getSomething() {
    return 'Hello';
  }
}
