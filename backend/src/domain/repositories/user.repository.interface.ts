import { UserEntity } from '../entities/user.entity';

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findAll(): Promise<UserEntity[]>;
  create(user: Partial<UserEntity>): Promise<UserEntity>;
  update(id: string, user: Partial<UserEntity>): Promise<UserEntity>;
  delete(id: string): Promise<boolean>;
}

export const USER_REPOSITORY = 'USER_REPOSITORY';
