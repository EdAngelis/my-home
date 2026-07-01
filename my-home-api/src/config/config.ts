import "dotenv/config";

type Environments = {
  db_uri: string;
  serverless: string;
};

type Config = {
  development: Environments;
  production: Environments;
};

const getDbUri = () => {
  if (!process.env.DB_URI) {
    throw new Error("DB_URI environment variable is required");
  }

  return process.env.DB_URI;
};

const config: Config = {
  development: {
    db_uri: getDbUri(),
    serverless: process.env.SERVERLESS || "false",
  },
  production: {
    db_uri: getDbUri(),
    serverless: process.env.SERVERLESS || "false",
  },
};

type ObjectIndex = keyof typeof config;

const mode: ObjectIndex =
  (process.env.NODE_ENV as ObjectIndex) || ("development" as ObjectIndex);

export default config[mode];
