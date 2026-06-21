import mongoose from "mongoose";
import config from "./config/config";
import logger from "./tools/winston";
import { chalkInfo, chalkSuccess } from "./tools/chalk";
import { uriInspec } from "./utils";

const connect = async () => {
  mongoose.connect("mongodb+srv://ed4ngelis:ruZLG0lCffpmze9A@cluster0.l90zluj.mongodb.net/my-home?retryWrites=true&w=majority", {});

  mongoose.connection.on("connected", () => {
    const { source, dataBaseName } = uriInspec(config.db_uri!);
    console.log(
      `${chalkSuccess(
        "Mongo Connected"
      )} Source: ${source} Database: ${chalkInfo(dataBaseName)}`
    );
    logger.info("Mongoose connected");
  });
};

export default connect;
