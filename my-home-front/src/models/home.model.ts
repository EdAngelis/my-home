interface IHome {
  _id?: string;
  name: string;
  code: string;
  users: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export default IHome;
