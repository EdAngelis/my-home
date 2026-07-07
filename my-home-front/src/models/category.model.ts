interface ICategory {
  _id?: string;
  name: string;
  createdByUserId?: string;
  home: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export default ICategory;
