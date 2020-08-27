import { MessageEmbed } from "discord.js";
import { ucFirst } from "../../../helpers";
import { Arguments } from "../../../lib/arguments/arguments";
// import { Paginator } from "../../../lib/Paginator";
import {
  // TagTopArtists,
  TopArtists,
} from "../../../services/LastFMService.types";
import { LastFMBaseCommand } from "../LastFMBaseCommand";

interface Overlap {
  artist: string;
  plays: number;
}

export default class Tag extends LastFMBaseCommand {
  aliases = ["tag"];
  description = "shows your scrobbles of a tag";
  subcategory = "stats";
  usage = ["", "milestone", "time period milestone @user"];

  arguments: Arguments = {
    mentions: {
      user: {
        index: 0,
        description: "The user to lookup",
        nonDiscordMentionParsing: this.ndmp,
      },
    },
    inputs: {
      tag: {
        index: { start: 0 },
      },
    },
  };

  async run() {
    let tag = this.parsedArguments.tag as string;
    let { username, perspective } = await this.parseMentionedUsername({
      asCode: false,
    });

    let [tagTopArtists, userTopArtists] = await Promise.all([
      this.lastFMService.tagTopArtists({ tag, limit: 1000 }),
      this.lastFMService.topArtists({ username, limit: 1000 }),
    ]);

    let tagArtistNames = tagTopArtists!.artist.map((a) =>
      a.name.toLowerCase().replace(/\s+/g, "-")
    );

    let overlap = this.calculateOverlap(userTopArtists, tagArtistNames);

    let embed = new MessageEmbed()
      .setTitle(
        `${ucFirst(perspective.possessive)} top ${
          tagTopArtists!["@attr"].tag
        } artists`
      )
      .setDescription(
        `
_Compares your top 1000 artists and the top 1000 artists of the tag_\n` +
          (overlap.length
            ? `\`\`\`
${overlap.map((o) => o.plays + " - " + o.artist).join("\n")}
\`\`\``
            : "Couldn't find any matching artists!")
      );

    await this.send(embed);
  }

  calculateOverlap(
    userTopArtists: TopArtists,
    tagArtistNames: string[]
  ): Overlap[] {
    return userTopArtists.artist
      .reduce((acc, a) => {
        if (tagArtistNames.includes(a.name.toLowerCase().replace(/\s+/g, "-")))
          acc.push({
            artist: a.name,
            plays: a.playcount.toInt(),
          });

        return acc;
      }, [] as Overlap[])
      .slice(0, 20);
  }
}