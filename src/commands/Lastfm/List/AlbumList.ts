import { Message, MessageEmbed } from "discord.js";
import { numberDisplay } from "../../../helpers";
import { ListChildCommand } from "./ListChildCommand";

export class AlbumList extends ListChildCommand {
  aliases = ["llist", "allist", "topalbums"];
  description = "Shows your top albums";

  async run(message: Message) {
    let { username } = await this.parseMentionedUsername(message);

    let topAlbums = await this.lastFMService.topAlbums(
      username,
      this.listAmount,
      1,
      this.timePeriod
    );

    let messageEmbed = new MessageEmbed()
      .setTitle(
        `Top ${numberDisplay(this.listAmount, "album")} for \`${username}\` ${
          this.humanReadableTimePeriod
        }`
      )
      .setDescription(
        topAlbums.album
          .map(
            (a) =>
              `${numberDisplay(a.playcount, "play")} - **${a.name}** by _${
                a.artist.name
              }_`
          )
          .join("\n")
      );

    await message.channel.send(messageEmbed);
  }
}