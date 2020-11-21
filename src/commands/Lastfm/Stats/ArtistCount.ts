import { Arguments } from "../../../lib/arguments/arguments";
import { generatePeriod, generateHumanPeriod } from "../../../helpers/date";
import { numberDisplay } from "../../../helpers";
import { LastFMBaseCommand } from "../LastFMBaseCommand";
import { LastFMPeriod } from "../../../services/LastFM/LastFMService.types";
import { standardMentions } from "../../../lib/arguments/mentions/mentions";

export default class ArtistCount extends LastFMBaseCommand {
  aliases = ["ac"];
  description = "Shows you how many artists you've scrobbled";
  subcategory = "library stats";
  usage = ["", "time period @user"];

  arguments: Arguments = {
    inputs: {
      timePeriod: {
        custom: (messageString: string) => generatePeriod(messageString),
        index: -1,
      },
      humanReadableTimePeriod: {
        custom: (messageString: string) => generateHumanPeriod(messageString),
        index: -1,
      },
    },
    mentions: standardMentions,
  };

  async run() {
    let timePeriod = this.parsedArguments.timePeriod as LastFMPeriod,
      humanReadableTimePeriod = this.parsedArguments
        .humanReadableTimePeriod as string;

    let { username, perspective } = await this.parseMentions();

    let scrobbles = await this.lastFMService.artistCount(username, timePeriod);

    await this.reply(
      `${perspective.plusToHave} scrobbled ${numberDisplay(
        scrobbles,
        "artist"
      ).strong()} ${humanReadableTimePeriod}`
    );
  }
}
