import {
  displayNumber,
  displayNumberedList,
} from "../../../lib/views/displays";
import { ListCommand } from "./ListCommand";

export default class AlbumList extends ListCommand {
  idSeed = "stayc sumin";

  description = "Shows your top albums over a given time period";
  aliases = ["llist", "allist", "topalbums", "topalbum", "albums", "ll"];

  async run() {
    let { username } = await this.parseMentions();

    let topAlbums = await this.lastFMService.topAlbums({
      username,
      limit: this.listAmount,
      period: this.timePeriod,
    });

    let messageEmbed = this.newEmbed()
      .setTitle(
        `Top ${displayNumber(this.listAmount, "album")} for \`${username}\` ${
          this.humanReadableTimePeriod
        }`
      )
      .setDescription(
        displayNumberedList(
          topAlbums.albums.map(
            (a) =>
              `${a.name.strong()} by ${a.artist.name.italic()} - ${displayNumber(
                a.userPlaycount,
                "play"
              )}`
          )
        )
      );

    await this.send(messageEmbed);
  }
}
