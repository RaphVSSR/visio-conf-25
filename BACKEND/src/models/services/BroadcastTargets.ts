import SessionManager from "./authentication/SessionManager.ts";
import TeamMember from "../TeamMember.ts";
import ChannelMember from "../ChannelMember.ts";

export default class BroadcastTargets {
	static async forTeam(teamId: string): Promise<string[]> {
		const members = await TeamMember.model.find({ teamId }).lean();
		const socketIds: string[] = [];
		for (const member of members) {
			socketIds.push(...SessionManager.getUserSocketIds(member.id.toString()));
		}
		return socketIds;
	}

	static async forChannel(channelId: string): Promise<string[]> {
		const members = await ChannelMember.model.find({ channelId }).lean();
		const socketIds: string[] = [];
		for (const member of members) {
			socketIds.push(...SessionManager.getUserSocketIds(member.userId.toString()));
		}
		return socketIds;
	}

	static pick(targetIds: string[], fallbackSocketId: string): string | string[] {
		return targetIds.length > 0 ? targetIds : fallbackSocketId;
	}
}
