import { expect } from "chai";
import { SinonSandbox, createSandbox } from "sinon";
import MessagePreviewService from "../../src/services/MessagePreviewService";
import { Message, TextChannel, GuildMember } from "discord.js";
import MockDiscord from "../MockDiscord";
import { isSymbol } from "util";

describe("MessagePreviewService", () => {
	describe("::getInstance()", () => {
		it("returns an instance of MessagePreviewService", () => {
			const service = MessagePreviewService.getInstance();

			expect(service).to.be.instanceOf(MessagePreviewService);
		});
	});

	describe("generatePreview()", () => {
		let sandbox: SinonSandbox;
		let messagePreview: MessagePreviewService;
		let link: string;
		let callingMessage: Message;
		let member: GuildMember;
		let channel: TextChannel;
		let discordMock: MockDiscord;

		beforeEach(() => {
			sandbox = createSandbox();
			messagePreview = MessagePreviewService.getInstance();
			discordMock = new MockDiscord();
			link = "https://discord.com/channels/guild-id/518817917438001152/732711501345062982";
			callingMessage = discordMock.getMessage();
			member = discordMock.getGuildMember();
			channel = discordMock.getTextChannel();
			channel.id = "518817917438001152";
		});

		it("gets the channel from the link", async () => {
			const getsChannelMock = sandbox.stub(callingMessage.guild.channels.cache, "get").returns(channel);

			sandbox.stub(channel.messages, "fetch").resolves(callingMessage);
			sandbox.stub(callingMessage.member, "displayColor").get(() => "#FFFFFF");
			sandbox.stub(callingMessage.channel, "send");

			await messagePreview.generatePreview(link, callingMessage);

			expect(getsChannelMock.calledOnce).to.be.true;
		});

		it("sends preview message", async () => {
			const getsChannelMock = sandbox.stub(callingMessage.guild.channels.cache, "get").returns(channel);
			const sendsMessageMock = sandbox.stub(callingMessage.channel, "send");

			sandbox.stub(channel.messages, "fetch").resolves(callingMessage);
			sandbox.stub(callingMessage.member, "displayColor").get(() => "#FFFFFF");

			await messagePreview.generatePreview(link, callingMessage);

			expect(sendsMessageMock.calledOnce).to.be.true;
		});

		it("doesn't send preview message if it is a bot message", async () => {
			const getsChannelMock = sandbox.stub(callingMessage.guild.channels.cache, "get").returns(channel);
			const sendsMessageMock = sandbox.stub(callingMessage.channel, "send");

			callingMessage.author.bot = true;

			sandbox.stub(channel.messages, "fetch").resolves(callingMessage);
			sandbox.stub(callingMessage.member, "displayColor").get(() => "#FFFFFF");

			expect(sendsMessageMock.called).to.be.false;
		});

		afterEach(() => {
			sandbox.restore();
		});
	});

	describe("verifyGuild()", () => {
		const messagePreview = MessagePreviewService.getInstance();
		const discordMock = new MockDiscord();
		const message = discordMock.getMessage();

		it("should return true if message's guild and provided guild id match", () => {
			message.guild.id = "RANDOM_GUILD_ID";

			expect(messagePreview.verifyGuild(message, "RANDOM_GUILD_ID")).to.be.true;
		});

		it("should return false if message's guild and provided guild id don't match", () => {
			message.guild.id = "RANDOM_GUILD_ID";

			expect(messagePreview.verifyGuild(message, "OTHER_GUILD_ID")).to.be.false;
		});
	});

	describe("stripLink()", () => {
		let sandbox: SinonSandbox;
		let messagePreview: MessagePreviewService;
		let link: string;

		beforeEach(() => {
			sandbox = createSandbox();
			messagePreview = MessagePreviewService.getInstance();
			link = "https://ptb.discordapp.com/channels/240880736851329024/518817917438001152/732711501345062982";
		});

		it("strips link of unnecessary details", () => {
			const array = messagePreview.stripLink(link);

			expect(array).to.include("240880736851329024");
			expect(array).to.include("518817917438001152");
			expect(array).to.include("732711501345062982");
		});

		afterEach(() => {
			sandbox.restore();
		});
	});

	describe("serializeHyperlinks()", () => {
		let sandbox: SinonSandbox;
		let messagePreview: MessagePreviewService;
		let content: String;

		beforeEach(() => {
			sandbox = createSandbox();
			messagePreview = MessagePreviewService.getInstance();
		});

		it("should return the string as it is if there are no hyperlinks", () => {
			expect(messagePreview.serializeHyperlinks("I am the night")).to.equal("I am the night");
		});

		it("should return the string as it is even if it is falsy", () => {
			expect(messagePreview.serializeHyperlinks(null)).to.be.null;
			expect(messagePreview.serializeHyperlinks(undefined)).to.be.undefined;
			expect(messagePreview.serializeHyperlinks("")).to.equal("");
		});

		it("should escape hyperlinks", () => {
			expect(messagePreview.serializeHyperlinks("Do you feel lucky, [punk](punkrock.com)?"))
				.to.equal("Do you feel lucky, \\[punk\\]\\(punkrock.com\\)?");
		});

		it("should scape all hyperlinks if there is more than one", () => {
			expect(messagePreview.serializeHyperlinks("[Link1](l1.com) and [Link2](l2.com)"))
				.to.equal("\\[Link1\\]\\(l1.com\\) and \\[Link2\\]\\(l2.com\\)");
		});

		it("should escape hyperlinks even if they are empty", () => {
			expect(messagePreview.serializeHyperlinks("[]()")).to.equal("\\[\\]\\(\\)");
			expect(messagePreview.serializeHyperlinks("[half]()")).to.equal("\\[half\\]\\(\\)");
			expect(messagePreview.serializeHyperlinks("[](half)")).to.equal("\\[\\]\\(half\\)");
		});
	});
});