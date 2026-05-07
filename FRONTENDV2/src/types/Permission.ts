export type Permission = {
  id: string;
  uuid: string;
  name: string;
  description: string;
  default: boolean;
};

export type PermissionPayload = {
  name: string;
  description: string;
};
