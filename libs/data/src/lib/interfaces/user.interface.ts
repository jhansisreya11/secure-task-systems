import { Role } from './role.interface';
import { IOrganization } from './organization.interface';

export interface IUser {
  id: string;
  username: string;
  role: Role;
  organization: IOrganization;
}
