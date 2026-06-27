import { Controller, Get, Param } from '@nestjs/common';
import { Roles } from '@thallesp/nestjs-better-auth';
import { UserService } from './user.service.js';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * GET /user/all — returns all users. Admin only.
   */
  @Get('all')
  @Roles(['ADMIN'])
  findAll() {
    return this.userService.findAll();
  }

  /**
   * GET /user/:id — returns a single user by id.
   * Authenticated users can access (protected by global AuthGuard).
   */
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.userService.findById(id);
  }
}
