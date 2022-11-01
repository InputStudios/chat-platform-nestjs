import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IUserService } from 'src/users/user';
import { Services } from 'src/utils/constants';
import { Conversation, User } from 'src/utils/typeorm';
import { CreateConversationParams } from 'src/utils/types';
import { Repository } from 'typeorm';
import { IConversationsService } from './conversations';

@Injectable()
export class ConversationsService implements IConversationsService {
	constructor(
		@InjectRepository(Conversation) 
		private readonly conversationRepository: Repository<Conversation>,
		@Inject(Services.USERS)
		private readonly userService: IUserService,
	) {}

	async getConversations(id: number): Promise<Conversation[]> {
		return this.conversationRepository
			.createQueryBuilder('conversation')
			.leftJoinAndSelect('conversation.lastMessageSent', 'lastMessageSent')
			.leftJoinAndSelect('conversation.creator', 'creator')
			.addSelect([
				'creator.id',
				'creator.firstName',
            'creator.lastName',
				'creator.email',
			])
			.leftJoin('conversation.recipient', 'recipient')
			.addSelect([
				'recipient.id',
				'recipient.firstName',
				'recipient.lastName',
				'recipient.email',
		])
		.where('creator.id = :id', { id })
		.orWhere('recipient.id = :id', { id })
		.orderBy('conversation.lastMessageSentAt', 'DESC')
		.getMany();
	}

	async findById(id: number): Promise<Conversation> {
		return this.conversationRepository.findOne({ 
			where: { id },
			relations: ['lastMessageSent', 'creator', 'recipient'],
		});
	}

	async createConversation(user: User, params: CreateConversationParams) {
		const { email } = params;

		const recipient = await this.userService.findUser({ email });

		if (!recipient) 
			throw new HttpException('Recipient Not Found', HttpStatus.BAD_REQUEST);
		if(user.id === recipient.id)
			throw new HttpException(
				'Cannot Create conversation',
				HttpStatus.BAD_REQUEST,
			);

			const existingConversation = await this.conversationRepository
				.createQueryBuilder('conversation')
				.leftJoinAndSelect('conversation.users', 'user')
				.where('user.id = :userId OR user.id = :otherId', {
					userId: user.id,
					therId: recipient.id,
				})
				.getMany();
			
			console.log(existingConversation);

			return existingConversation[0];
			
		// const existingConversation = await this.conversationRepository.findOne({
		// 	where: [
		// 		{
		// 			creator: { id: user.id },
		// 			recipient: { id: recipient.id },
		// 		},
		// 		{
		// 			creator: { id: recipient.id },
		// 			recipient: { id: user.id },
		// 		},
		// 	],
		// });
		
		// if (existingConversation)
		// 	throw new HttpException('Conversation exists', HttpStatus.CONFLICT);
			
		// const conversation = this.conversationRepository.create({ 
		// 	users: [user, recipient],
		// 	type: 'private',
		// });

		// return this.conversationRepository.save(conversation);
	}
}