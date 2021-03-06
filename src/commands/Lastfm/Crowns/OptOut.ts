import { CrownsChildCommand } from "./CrownsChildCommand";
import { Message } from "discord.js";
import { displayNumber } from "../../../lib/views/displays";

export class OptOut extends CrownsChildCommand {
  idSeed = "wjsn seola";

  description =
    "Opts you out of the crowns game, deleting all your crowns, and preventing you from getting new ones";
  usage = "";

  async run(message: Message) {
    let sentMessage = await this.traditionalReply(
      `are you sure you want to opt out? This will delete all your crowns!`
    );

    message.channel.stopTyping();
    await sentMessage.react("✅");

    try {
      await sentMessage.awaitReactions(
        (reaction, user) =>
          user.id == message.author.id && reaction.emoji.name == "✅",
        { max: 1, time: 30000, errors: ["time"] }
      );

      await this.crownsService.scribe.optOut(message.member!);

      let numberOfCrowns = await this.crownsService.optOut(
        message.guild?.id!,
        message.author.id
      );

      await this.send(
        this.newEmbed().setDescription(
          `Opted you out, deleting ${displayNumber(
            numberOfCrowns,
            "crown"
          ).strong()}`
        )
      );
    } catch {
      await this.traditionalReply(`No reaction, cancelling opt out`);
    }
  }
}
