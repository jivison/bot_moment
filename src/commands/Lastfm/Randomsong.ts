import { Arguments } from "../../lib/arguments/arguments";
import { standardMentions } from "../../lib/arguments/mentions/mentions";
import { Delegate } from "../../lib/command/BaseCommand";
import { LastFMBaseCommand } from "./LastFMBaseCommand";
import RandomsongInUsersLibrary from "./RandomSongInUsersLibrary";

const args = {
  mentions: standardMentions,
} as const;

export default class Randomsong extends LastFMBaseCommand<typeof args> {
  idSeed = "april naeun";
  description = "Picks a random song from all the users in a guild";
  usage = [
    "",
    "@user (will pick a random song in their top tracks) poolAmount",
  ];

  arguments: Arguments = args;

  delegates: Delegate<typeof args>[] = [
    {
      when: (args) => !!args.user || !!args.userID || !!args.lfmUser,
      delegateTo: RandomsongInUsersLibrary,
    },
  ];

  async run() {
    let serverUsers = (await this.guild.members.fetch()).map((u) => `${u.id}`);

    let randomUser = await this.usersService.randomUser({
      userIDs: serverUsers,
    });

    let randomSongs = await this.lastFMService.recentTracks({
      username: randomUser.lastFMUsername,
      limit: 100,
    });

    let randomSong =
      randomSongs.track[~~(randomSongs.track.length * Math.random())];

    let embed = this.newEmbed()
      .setAuthor(`Scrobbled by ${randomUser.lastFMUsername}`)
      .setTitle(randomSong.name)
      .setDescription(
        `by ${randomSong.artist["#text"].strong()}` +
          (randomSong.album["#text"]
            ? ` from ${randomSong.album["#text"].italic()}`
            : "")
      )
      .setThumbnail(
        randomSong.image.find((i) => i.size === "large")?.["#text"] || ""
      );

    await this.send(embed);
  }
}
