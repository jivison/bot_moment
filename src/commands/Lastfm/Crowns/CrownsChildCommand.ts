import { LastFMBaseChildCommand } from "../LastFMBaseCommand";
import { CrownsService } from "../../../services/dbservices/CrownsService";

export abstract class CrownsChildCommand extends LastFMBaseChildCommand {
  crownsService = new CrownsService();
}