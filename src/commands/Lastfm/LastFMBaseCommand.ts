import { BaseCommand } from "../../lib/command/BaseCommand";
import { LastFMService } from "../../services/LastFM/LastFMService";
import { ParentCommand, ChildCommand } from "../../lib/command/ParentCommand";
import { SpotifyService } from "../../services/Spotify/SpotifyService";
import { Arguments } from "../../lib/arguments/arguments";

export abstract class LastFMBaseCommand<
  T extends Arguments = Arguments
> extends BaseCommand<T> {
  lastFMService = new LastFMService(this.logger);
  spotifyService = new SpotifyService(this.logger);

  category = "lastfm";
}

export abstract class LastFMBaseParentCommand extends ParentCommand {
  category = "lastfm";
}

export abstract class LastFMBaseChildCommand<
  T extends Arguments = Arguments
> extends ChildCommand<T> {
  lastFMService = new LastFMService(this.logger);
  category = "lastfm";
}
