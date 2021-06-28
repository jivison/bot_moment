import { IndexerError } from "../../../../errors";
import { convertIndexerDate } from "../../../../helpers/mirrorball";
import { Arguments } from "../../../../lib/arguments/arguments";
import { Variation } from "../../../../lib/command/BaseCommand";
import { IndexingBaseCommand } from "../../../../lib/indexing/IndexingCommand";
import { displayDate } from "../../../../lib/views/displays";
import {
  LastScrobbledConnector,
  LastScrobbledParams,
  LastScrobbledResponse,
} from "./connector";

const args = {
  inputs: {
    artist: { index: 0, splitOn: "|" },
    track: { index: 1, splitOn: "|" },
  },
} as const;

export default class LastScrobbledTrack extends IndexingBaseCommand<
  LastScrobbledResponse,
  LastScrobbledParams,
  typeof args
> {
  connector = new LastScrobbledConnector();

  idSeed = "shasha hwi a";

  aliases = ["lastt", "lt"];
  variations: Variation[] = [{ name: "first", variation: ["firstl", "ft"] }];

  subcategory = "library";
  description = "Shows the last time you scrobbled an track";

  rollout = {
    guilds: this.indexerGuilds,
  };

  arguments: Arguments = args;

  async run() {
    let artistName = this.parsedArguments.artist,
      trackName = this.parsedArguments.track;

    const { senderRequestable, senderUser, dbUser, perspective } =
      await this.parseMentions({
        senderRequired: !artistName || !trackName,
        reverseLookup: { required: true },
      });

    const user = (dbUser || senderUser)!;

    await this.throwIfNotIndexed(user, perspective);

    if (!artistName || !trackName) {
      let nowPlaying = await this.lastFMService.nowPlaying(senderRequestable);

      if (!artistName) artistName = nowPlaying.artist;
      if (!trackName) trackName = nowPlaying.name;
    } else {
      const lfmTrack = await this.lastFMService.trackInfo({
        artist: artistName,
        track: trackName,
      });

      artistName = lfmTrack.artist.name;
      trackName = lfmTrack.name;
    }

    const response = await this.query({
      track: { name: trackName, artist: { name: artistName } },
      user: { discordID: user.discordID },
      sort: this.variationWasUsed("first")
        ? "scrobbled_at asc"
        : "scrobbled_at desc",
    });

    const errors = this.parseErrors(response);

    if (errors) {
      throw new IndexerError(errors.errors[0].message);
    }

    const [play] = response.plays;

    const embed = this.newEmbed()
      .setAuthor(
        ...this.generateEmbedAuthor(
          (this.variationWasUsed("first") ? "First" : "Last") + " scrobbled"
        )
      )
      .setDescription(
        `${perspective.upper.name} ${
          this.variationWasUsed("first") ? "first" : "last"
        } scrobbled ${play.track.name.italic()} by ${play.track.artist.name.strong()} on ${displayDate(
          convertIndexerDate(play.scrobbledAt)
        )}`
      );

    await this.send(embed);
  }
}