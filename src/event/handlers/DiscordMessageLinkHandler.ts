import EventHandler from "../../abstracts/EventHandler";
import { Message, Constants } from "discord.js";
import MessagePreviewService from "../../services/MessagePreviewService";

class DiscordMessageLinkHandler extends EventHandler {
	constructor() {
		super(Constants.Events.MESSAGE_CREATE);
	}

	async handle(message: Message): Promise<void> {
		const messageRegex = /https:\/\/(ptb\.)?discord(app)?\.com\/channels\//gm;
		const linkIndex = message.content.search(messageRegex);

		if (linkIndex === -1) return;

		const wordIndex = message.content.slice(0, linkIndex).split(" ").length - 1;
		const linkContent = message.content.split(" ")[wordIndex];

		if (linkContent.startsWith("<") && linkContent.endsWith(">")) return;

		const link = message.content.replace(/app/, "").replace(/ptb\./, "").substring(linkIndex, linkIndex + 85);

		const messagePreviewService = MessagePreviewService.getInstance();

		await messagePreviewService.generatePreview(link, message);
	}
}

export default DiscordMessageLinkHandler;