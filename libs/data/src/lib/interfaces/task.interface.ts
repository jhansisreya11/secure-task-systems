import { IUser } from './user.interface';
import { IOrganization } from './organization.interface';

export interface ITask {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  organization: IOrganization;
  createdBy: IUser;
  createdAt: Date;
  updatedAt: Date;
}
