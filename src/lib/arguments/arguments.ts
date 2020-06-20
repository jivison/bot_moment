import { Message } from "discord.js";
import { BotMomentService } from "../../services/BotMomentService";
import { MentionParser, MentionOptions } from "./mentions";
import { Parser } from "./parser";

export interface Slice {
  start: number;
  stop?: number;
}

export interface InputsOptions {
  stopChar?: string;
}

export interface InputArguments {
  index: number | Slice;
  splitOn?: string;
  regex?: RegExp;
  optional?: boolean;
  custom?: (messageString: string) => ParsedArgument;
}

export interface Arguments {
  mentions?: {
    [name: string]: MentionOptions;
  };
  inputs?: {
    [name: string]: InputArguments;
  };
}

export type ParsedArgument = any;

export interface ParsedArguments {
  [name: string]: ParsedArgument;
}

export class ArgumentParser extends Parser {
  parsedArguments: ParsedArguments = {};
  botMomentService = BotMomentService.getInstance();
  arguments: Arguments;
  mentionParser = new MentionParser(this);

  constructor(args: Arguments) {
    super();
    this.arguments = args;
  }

  parse(message: Message, runAs: string): ParsedArguments {
    let messageString = this.removeAllMentions(message.content).trim();

    let mentions = this.mentionParser.parse(message);

    let inputs = this.parseInputs(
      this.botMomentService.removeCommandName(messageString, runAs)
    );

    this.parsedArguments = { ...mentions, ...inputs };

    return this.parsedArguments;
  }

  private parseCustomInputs(messageString: string): ParsedArguments {
    if (this.arguments.inputs) {
      let parsedArguments = Object.keys(this.arguments.inputs!)
        .filter((arg) => !!this.arguments.inputs![arg].custom)
        .reduce((acc, arg) => {
          let argOptions = this.arguments.inputs![arg];
          if (argOptions.custom) {
            acc[arg] = argOptions.custom(messageString);
          }
          return acc;
        }, {} as ParsedArguments);

      return parsedArguments;
    } else return {};
  }

  private parseInputsWithSplit(
    messageString: string,
    splitFunction: (string: string, arg: InputArguments) => Array<string>,
    filter: (arg: InputArguments) => boolean
  ): ParsedArguments {
    if (this.arguments.inputs) {
      let argArray = Object.keys(this.arguments.inputs).filter((arg) =>
        filter(this.arguments.inputs![arg])
      );

      return argArray.reduce((acc: ParsedArguments, arg, idx) => {
        let argOptions = this.arguments.inputs![arg];
        let array = splitFunction(messageString, argOptions);

        acc[arg] = this.getElementFromIndex(array, argOptions.index);

        return acc;
      }, {} as ParsedArguments);
    } else return {};
  }

  removeAllMentions(string: string): string {
    if (this.mentionParser.hasNonDiscordMentions()) {
      return this.mentionParser.removeCustomMentions(
        this.removeMentions(string)
      );
    } else {
      return this.removeMentions(string);
    }
  }

  private parseInputs(string: string): ParsedArguments {
    let genericArgs = this.parseInputsWithSplit(
      string,
      (string) => string.trim().split(/\s+/),
      (arg) => !arg.splitOn
    );

    let splitOnArgs = this.parseInputsWithSplit(
      string,
      (string, arg) => (string + " ").split(` ${arg?.splitOn} `),
      (arg) => !!arg.splitOn
    );

    let regexArgs = this.parseInputsWithSplit(
      string,
      (string, arg) => (string.match(arg.regex!) || []) as Array<string>,
      (arg) => !!arg.regex
    );

    let customArgs = this.parseCustomInputs(string);

    return { ...genericArgs, ...splitOnArgs, ...regexArgs, ...customArgs };
  }
}

export interface GroupedArguments {
  [split: string]: { name: string; index: number | Slice; optional: boolean }[];
}
export function groupArgumentsBySplit(args: Arguments): GroupedArguments {
  return Object.keys(args.inputs ?? {}).reduce((acc, argName) => {
    let arg = args.inputs![argName];

    if (!acc[arg.splitOn ?? " "]) acc[arg.splitOn ?? " "] = [];

    if (arg.splitOn) {
      acc[arg.splitOn].push({
        name: argName,
        index: arg.index,
        optional: arg.optional ?? false,
      });
    } else {
      acc[" "].push({
        name: argName,
        index: arg.index,
        optional: arg.optional ?? false,
      });
    }

    return acc;
  }, {} as GroupedArguments);
}