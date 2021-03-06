import { LastFMBaseCommand } from "../LastFMBaseCommand";
import { Arguments } from "../../../lib/arguments/arguments";
import { standardMentions } from "../../../lib/arguments/mentions/mentions";
import { LinkGenerator } from "../../../helpers/lastFM";
import { displayNumber } from "../../../lib/views/displays";

const args = {
  inputs: {
    artist: { index: 0, splitOn: "|" },
    album: { index: 1, splitOn: "|" },
  },
  mentions: standardMentions,
} as const;

export default class ScraperAlbumTopTracks extends LastFMBaseCommand<
  typeof args
> {
  idSeed = "nature sunshine";

  description = "Shows your top tracks from an album";
  aliases = ["sltt"];
  usage = ["", "artist | album @user"];
  subcategory = "library";

  arguments: Arguments = args;

  async run() {
    let artist = this.parsedArguments.artist,
      album = this.parsedArguments.album;

    let { senderUsername, username } = await this.parseMentions({
      senderRequired: !artist || !album,
    });

    if (artist && album) {
      let albumInfo = await this.lastFMService.albumInfo({ artist, album });
      artist = albumInfo.artist;
      album = albumInfo.name;
    }

    if (!artist || !album) {
      let nowPlaying = await this.lastFMService.nowPlaying(senderUsername);

      if (!artist) {
        artist = nowPlaying.artist;
      } else {
        artist = await this.lastFMService.correctArtist({ artist });
      }
      if (!album) {
        album = nowPlaying.album;
      } else {
        let corrected = await this.lastFMService.correctAlbum({
          artist,
          album,
        });

        artist = corrected.artist;
        album = corrected.album;
      }
    }

    let topAlbums = await this.lastFMService.scraper.albumTopTracks(
      username,
      artist,
      album
    );

    let embed = this.newEmbed()
      .setAuthor(
        this.message.author.username,
        this.message.author.avatarURL() || ""
      )
      .setTitle(`Top tracks on ${artist} - ${album} for ${username}`)
      .setURL(LinkGenerator.libraryAlbumPage(username, artist, album))
      .setDescription(
        `_${displayNumber(topAlbums.total, `total scrobble`)}_\n\n` +
          topAlbums.items
            .map(
              (tt) =>
                `${displayNumber(tt.playcount, "play")} - ${tt.track.strong()}`
            )
            .join("\n")
      );

    await this.send(embed);
  }
}
