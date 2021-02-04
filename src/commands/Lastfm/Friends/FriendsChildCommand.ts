import { LastFMBaseChildCommand } from "../LastFMBaseCommand";
import { FriendsService } from "../../../services/dbservices/FriendsService";
import { Message } from "discord.js";
import { User } from "../../../database/entity/User";
import { LogicError } from "../../../errors";
import { Arguments } from "../../../lib/arguments/arguments";

export abstract class FriendsChildCommand<
  T extends Arguments = Arguments
> extends LastFMBaseChildCommand<T> {
  parentName = "friends";

  friendsService = new FriendsService(this.logger);

  friendUsernames: string[] = [];
  senderUsername!: string;
  user!: User;

  throwIfNoFriends = false;

  async prerun(message: Message) {
    let [, senderUsername] = await Promise.all([
      this.setFriendUsernames(message),
      this.usersService.getUsername(message.author.id),
    ]);
    this.senderUsername = senderUsername;

    if (this.throwIfNoFriends && this.friendUsernames.length < 1)
      throw new LogicError("you don't have any friends :(");
  }

  async setFriendUsernames(message: Message) {
    let user = await this.usersService.getUser(message.author.id);

    this.user = user;

    this.friendUsernames = await this.friendsService.getUsernames(
      message.guild?.id!,
      user
    );
  }

  protected displayMissingFriend(username: string, entity = "playcount") {
    return `${username.code()} - _Error fetching ${entity}_`;
  }
}
