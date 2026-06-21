## My Home
The app aims to help you organize your grocery shopping. In it you can:

- Create products
- Add products to shopping lists
- Send shopping lists to grocery stores by whatsapp

it is a simple app, but very useful.

#### I separated the app into 2 repo in this repo you find the server and [here](https://github.com/EdAngelis/my-home-front) the client: 

#### Technologies used:
  **Server:** Nodejs/Typescript/Express/MongoDB <br>
  **Client:** React/Typescript/UseContext/StyledComponents

### Run Locally

1. Clone the project.

```
  git clone https://github.com/EdAngelis/my-home-api.git
```
2. Go to file config/config.ts and set your local database.

```
const config = {
  development: {
    db_uri: "<LOCAL DATABASE GO HERE>",
  },
  production: {
    db_uri: process.env.DB_URI,
  },
};
```
obs: To avoid the need of setup a .env file when running the project locally, I pull the variables from config.ts file. There is the object development with the properties writhen directly in it. and the object production with the properties coming from the .env file. In Production mode setup the .env file with the variables and add NODE_ENV=production to it.

3. Install dependencies

```
  npm install
```
4. Run the project

```
  npm run dev
```

#### See a problem? Open an issue [here](https://github.com/EdAngelis/my-home-front/issues)
see the project board [here](https://github.com/users/EdAngelis/projects/1)

#### Want to contribute? Make a pull request, I will love to have your help.

### Now, Setup the client [here](https://github.com/EdAngelis/my-home-front)