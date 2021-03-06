import { LogicError } from "../../../errors";
import { Variation } from "../../../lib/command/BaseCommand";
import { Paginator } from "../../../lib/Paginator";
import { displayNumber } from "../../../lib/views/displays";
import { SearchCommand } from "./SearchCommand";

export default class SearchAlbum extends SearchCommand {
  idSeed = "gwsn miya";

  shouldBeIndexed = true;
  description = "Searches your top albums for keywords";
  aliases = ["sl", "sal", "salbum"];
  usage = ["keywords", "keywords @user"];

  variations: Variation[] = [
    {
      name: "deep",
      variation: ["deepsl", "dsl"],
      description: "Searches your top 4000 albums (instead of 2000)",
    },
  ];

  async run() {
    let keywords = this.parsedArguments.keywords!;

    const { requestable, perspective } = await this.parseMentions();

    let paginator = new Paginator(
      this.lastFMService.topAlbums.bind(this.lastFMService),
      this.variationWasUsed("deep") ? 4 : 2,
      { username: requestable, limit: 1000 }
    );

    let topAlbums = await paginator.getAllToConcatonable({
      concurrent: this.variationWasUsed("deep"),
    });

    let filtered = topAlbums.albums.filter((a) =>
      this.clean(a.name).includes(this.clean(keywords))
    );

    if (filtered.length !== 0 && filtered.length === topAlbums.albums.length) {
      throw new LogicError(
        "too many search results, try narrowing down your query..."
      );
    }

    let embed = this.newEmbed()
      .setTitle(
        `Search results in ${perspective.possessive} top ${displayNumber(
          topAlbums.albums.length,
          "album"
        )}`
      )
      .setDescription(
        filtered.length
          ? `Albums matching ${keywords.code()}
\`\`\`
${filtered
  .slice(0, 25)
  .map((l) => `${l.rank}. ${l.artist.name} - ${l.name}`)
  .join("\n")}
\`\`\``
          : `No results found for ${keywords.code()}!`
      );

    await this.send(embed);
  }
}
