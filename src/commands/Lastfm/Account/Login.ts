import { Message } from "discord.js";
import { Arguments } from "../../../lib/arguments/arguments";
import { LastFMBaseCommand } from "../LastFMBaseCommand";
import { Validation } from "../../../lib/validation/ValidationChecker";
import { validators } from "../../../lib/validation/validators";
import { UserInfo } from "../../../services/LastFM/LastFMService.types";
import { differenceInDays, fromUnixTime } from "date-fns";

export default class Login extends LastFMBaseCommand {
  description = "Logs you into lastfm";
  subcategory = "accounts";
  usage = "username";

  arguments: Arguments = {
    inputs: {
      username: { index: 0 },
    },
  };

  validation: Validation = {
    username: new validators.Required({
      message: `please enter a username (\`login <username>\`)`,
    }),
  };

  async run(message: Message) {
    let username = this.parsedArguments.username as string;

    if (username === "<username>") {
      await this.reply("lol");
      return;
    }

    let userInfo: UserInfo | undefined;

    try {
      userInfo = await this.lastFMService.userInfo({ username });

      await this.usersService.setUsername(message.author.id, username);

      let joined = fromUnixTime(userInfo.registered.unixtime.toInt());

      console.log(differenceInDays(joined, new Date()));

      this.send(
        `Logged in as ${username.code()}${
          differenceInDays(new Date(), joined) < 10
            ? ". Welcome to Last.fm!"
            : ""
        }`
      );
    } catch {
      this.reply(`The user ${username?.code()} couldn't be found`);
    }
  }
}
