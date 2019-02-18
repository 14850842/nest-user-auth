import {
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { GqlAuthGuard } from '../auth/graphql-auth.guard';
import { CreateUserInput, User, UpdateUserInput } from '../graphql.classes';
import { UsernameEmailGuard } from '../auth/guards/username-email.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Resolver('User')
export class UserResolver {
  constructor(private readonly userService: UsersService) {}

  @Query('getUsers')
  @UseGuards(GqlAuthGuard, AdminGuard)
  async getUsers() {
    return await this.userService.getAllUsers();
  }

  @Query('user')
  @UseGuards(GqlAuthGuard, UsernameEmailGuard)
  async user(
    @Args('username') username: string,
    @Args('email') email: string,
  ): Promise<User> {
    let user: User | null;
    if (username) {
      user = await this.userService.findOneByUsername(username);
    } else if (email) {
      user = await this.userService.findOneByEmail(email);
    } else {
      // Is this the best exception for a graphQL error?
      throw new BadRequestException();
    }

    if (user) return user;
    throw new NotFoundException();
  }

  @Mutation('createUser')
  async createUser(
    @Args('createUserInput') createUserInput: CreateUserInput,
  ): Promise<User> {
    const createdUser = await this.userService.create(createUserInput);
    return createdUser;
  }

  @Mutation('updateUser')
  @UseGuards(GqlAuthGuard, UsernameEmailGuard)
  async updateUser(
    @Args('username') username: string,
    @Args('fieldsToUpdate') fieldsToUpdate: UpdateUserInput,
  ): Promise<User> {
    const user = await this.userService.findOneByUsername(username);

    if (!user) throw new NotFoundException();

    if (fieldsToUpdate.username) user.username = fieldsToUpdate.username;
    if (fieldsToUpdate.email) user.email = fieldsToUpdate.email;
    if (fieldsToUpdate.password) user.password = fieldsToUpdate.password;

    // Save will hash the password
    await user.save();
    return user;
  }
}