export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  SUBADMIN = 'SUBADMIN',
}

export class UserEntity {
  id: string;
  tenantId?: string;
  tenantSlug?: string;
  tenantName?: string;
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
