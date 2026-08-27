export enum Role {
  ADMIN = 'ADMIN',
  SUBADMIN = 'SUBADMIN',
}

export class UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phoneNumber?: string;
  role: Role;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
