import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    const users: User[] = [];

    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filteredUsers);
      },
      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 999999),
          email,
          password,
        } as User;
        users.push(user);
        return Promise.resolve(user);
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a salted and hashed password ', async () => {
    const user = await service.signup('test@mail.com', '1234');

    expect(user.password).not.toEqual('1234');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if user signs up with email that is in use', async () => {
    await service.signup('abcd@mail.com', '123');

    await expect(service.signup('abcd@mail.com', 'asdf')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws an error if signin is called with an unused email', async () => {
    await expect(service.signin('abcd@mail.com', 'asdf')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws an error if invalid password is provided', async () => {
    await service.signup('bla@mail.com', '1234');

    await expect(service.signin('bla@mail.com', 'asdf')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('returns a user if correct password is provided', async () => {
    await service.signup('test@mail.com', '12345');

    const user = await service.signin('test@mail.com', '12345');
    expect(user).toBeDefined();
  });
});
