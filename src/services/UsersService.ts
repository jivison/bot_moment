import { User } from "../database/entity/User";


export class UsersService {
  async getUsername(discordID: string): Promise<string> {
    let user = await User.findOne({ discordID: discordID });

    if (user) {
      return user.lastFMUsername;
    } else return "";
  }

  async setUsername(
    discordID: string,
    lastFMUsername: string
  ): Promise<string> {
    let user = await User.findOne({ discordID: discordID });

    if (user) {
      user.lastFMUsername = lastFMUsername;
      await user.save();
      return user.lastFMUsername;
    } else {
      user = User.create({
        discordID: discordID,
        lastFMUsername: lastFMUsername,
      });
      await user.save();
      return user.lastFMUsername;
    }
  }
}
