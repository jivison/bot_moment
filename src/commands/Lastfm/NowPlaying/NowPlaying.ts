import { Message } from "discord.js";
import {
  LinkGenerator,
  parseLastFMTrackResponse,
} from "../../../helpers/lastFM";
import { numberDisplay } from "../../../helpers";
import { Arguments } from "../../../lib/arguments/arguments";
import { standardMentions } from "../../../lib/arguments/mentions/mentions";
import { LastFMBaseCommand } from "../LastFMBaseCommand";
import { CrownsService } from "../../../services/dbservices/CrownsService";
import { TagConsolidator } from "../../../lib/TagConsolidator";
import { sanitizeForDiscord } from "../../../helpers/discord";
import config from "../../../../config.json";
import { LineConsolidator } from "../../../lib/LineConsolidator";

export default class NowPlaying extends LastFMBaseCommand {
  aliases = ["np", "fm"];
  description = "Displays the now playing or last played track in last.fm";
  usage = [
    "",
    "@user (will show their now playing)",
    "@user hey check out this song (will show your now playing)",
  ];
  arguments: Arguments = {
    inputs: {
      otherWords: { index: { start: 0 } },
    },
    mentions: standardMentions,
  };

  crownsService = new CrownsService(this.logger);
  tagConsolidator = new TagConsolidator();

  async run(message: Message) {
    let otherWords = this.parsedArguments.otherWords as string | undefined;

    let { username, senderUsername } = await this.parseMentions();

    if (
      otherWords &&
      !this.parsedArguments.userID &&
      !this.parsedArguments.lfmUser
    ) {
      username = senderUsername;
    }

    let nowPlayingResponse = await this.lastFMService.recentTracks({
      username,
      limit: 1,
    });

    let nowPlaying = nowPlayingResponse.track[0];

    let track = parseLastFMTrackResponse(nowPlaying);

    let links = LinkGenerator.generateTrackLinksForEmbed(nowPlaying);

    if (
      nowPlaying["@attr"]?.nowplaying &&
      this.client.isAlphaTester(this.author.id)
    ) {
      this.lastFMService.scrobbleTrack(
        {
          artist: track.artist,
          track: track.name,
          album: track.album,
          timestamp: new Date().getTime() / 1000,
        },
        config.lastFMBotSessionKey
      );
    }

    let nowPlayingEmbed = this.newEmbed()
      .setAuthor(
        `${
          nowPlaying["@attr"]?.nowplaying ? "Now playing" : "Last scrobbled"
        } for ${username}`,
        message.author.avatarURL() || undefined,
        LinkGenerator.userPage(username)
      )
      .setTitle(sanitizeForDiscord(track.name))
      .setURL(LinkGenerator.trackPage(track.artist, track.name))
      .setDescription(
        `by ${links.artist.bold()}` +
          (track.album ? ` from ${links.album.italic()}` : "")
      )
      .setThumbnail(
        nowPlaying.image.find((i) => i.size === "large")?.["#text"] || ""
      );

    // Types for Promise.allSettled are broken(?), so I have to manually assert the type that's returned
    let [artistInfo, crown] = (await Promise.allSettled([
      this.lastFMService.artistInfo({ artist: track.artist, username }),
      this.crownsService.getCrownDisplay(track.artist, message),
    ])) as { status: string; value?: any; reason: any }[];

    let crownString = "";
    let isCrownHolder = false;

    if (crown.value && crown.value.user) {
      if (crown.value.user.id === message.author.id) {
        isCrownHolder = true;
      } else {
        crownString = `👑 ${numberDisplay(crown.value.crown.plays)} (${
          crown.value.user.username
        })`;
      }
    }
    this.tagConsolidator.addTags(artistInfo.value?.tags?.tag || []);

    let lineConsolidator = new LineConsolidator();

    let artistPlays =
      (isCrownHolder ? "👑 " : "") +
      (track.artist.length < 150
        ? numberDisplay(
            artistInfo.value.stats.userplaycount,
            `${track.artist} scrobble`
          )
        : numberDisplay(artistInfo.value.stats.userplaycount, `scrobble`) +
          " of that artist");

    let noArtistData =
      "No data on last.fm for " +
      (track.artist.length > 150 ? "that artist" : nowPlaying.artist["#text"]);

    let scrobbleCount = `${numberDisplay(
      nowPlayingResponse["@attr"].total,
      "total scrobble"
    )}`;

    lineConsolidator.addLines(
      {
        shouldDisplay: this.tagConsolidator.hasTags(),
        string: this.tagConsolidator.tags.join(" ‧ "),
      },
      {
        shouldDisplay: !!artistInfo.value && !!crownString,
        string: `${artistPlays} • ${scrobbleCount} • ${crownString}`,
      },
      {
        shouldDisplay: !!artistInfo.value && !crownString,
        string: `${artistPlays} • ${scrobbleCount}`,
      },
      {
        shouldDisplay: !artistInfo.value && !!crownString,
        string: `${noArtistData} • ${scrobbleCount} • ${crownString}`,
      },
      {
        shouldDisplay: !artistInfo.value && !crownString,
        string: `${noArtistData} • ${scrobbleCount}`,
      }
    );

    nowPlayingEmbed.setFooter(lineConsolidator.consolidate());

    let sentMessage = await this.send(nowPlayingEmbed);

    if (
      track.artist.toLowerCase() === "twice" &&
      track.name.toLowerCase() === "jaljayo good night"
    ) {
      sentMessage.react("😴");
    }

    if (
      this.tagConsolidator.consolidate().includes("rare sad girl") ||
      this.tagConsolidator.consolidate().includes("rare sad boy")
    ) {
      sentMessage.react("😭");
    }
  }
}