import { Arguments } from "../../lib/arguments/arguments";
import { BaseCommand } from "../../lib/command/BaseCommand";
import { Validation } from "../../lib/validation/ValidationChecker";
import { validators } from "../../lib/validation/validators";
import { IndexingService } from "../../services/indexing/IndexingService";

const args = {
  inputs: {
    username: { index: 0 },
  },
} as const;

export default class Index extends BaseCommand<typeof args> {
  idSeed = "iz*one yujin";

  description = "Testing testing 123";
  secretCommand = true;
  devCommand = true;

  indexingService = new IndexingService();

  arguments: Arguments = args;

  validation: Validation = {
    username: new validators.Required({}),
  };

  async run() {
    const username = this.parsedArguments.username!;

    // const response = await this.indexingService.userTopArtists(username);
    const response = await this.indexingService.fullIndex(username);
    // const response = await this.indexingService.genericRequest("TEST");

    this.send("```" + JSON.stringify(response, undefined, 2) + "```");
  }
}
