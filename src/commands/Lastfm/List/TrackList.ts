import {
  displayNumber,
  displayNumberedList,
} from "../../../lib/views/displays";
import { ListCommand } from "./ListCommand";

export default class TrackList extends ListCommand {
  idSeed = "stayc yoon";

  description = "Shows your top tracks over a given time period";
  aliases = ["tlist", "toptracks", "toptrack", "tracks", "tl", "topsongs"];

  async run() {
    let { username } = await this.parseMentions();

    let topTracks = await this.lastFMService.topTracks({
      username,
      limit: this.listAmount,
      period: this.timePeriod,
    });

    let messageEmbed = this.newEmbed()
      .setTitle(
        `Top ${displayNumber(this.listAmount, "track")} for \`${username}\` ${
          this.humanReadableTimePeriod
        }`
      )
      .setDescription(
        displayNumberedList(
          topTracks.tracks.map(
            (t) =>
              `${t.name.strong()} by ${t.artist.name.italic()} - ${displayNumber(
                t.userPlaycount,
                "play"
              )}`
          )
        )
      );

    await this.send(messageEmbed);
  }
}
