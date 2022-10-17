import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { instanceToPlain } from 'class-transformer';
import { Conversation, Message, User } from 'src/utils/typeorm';
import { CreateMessageParams } from 'src/utils/types';
import { Repository } from 'typeorm';
import { IMessageService } from './message';

@Injectable()
export class MessageService implements IMessageService {
	constructor(
		@InjectRepository(Message) 
		private readonly messageRepository: Repository<Message>,
		@InjectRepository(Conversation) 
		private readonly conversationRepository: Repository<Conversation>,
	) {}
		async createMessage({ user, content, conversationId }: CreateMessageParams) {
		const conversation = await this.conversationRepository.findOne({ 
			where: { id: conversationId },
			relations: ['creator', 'recipient', 'lastMessageSent'],
		});
		if (!conversation)
			throw new HttpException('Conversation not found', HttpStatus.BAD_REQUEST);
			const { creator, recipient	} = conversation;
		if (creator.id !== user.id && recipient.id !== user.id)
			throw new HttpException('Cannot Create Message', HttpStatus.FORBIDDEN);

		const message = this.messageRepository.create({
			content,
			author: instanceToPlain(user),
		});

		const savedMessage = await this.messageRepository.save(message);
		conversation.lastMessageSent = savedMessage;
		const updatedConversation = await this.conversationRepository.save(
			conversation
		);
		console.log(updatedConversation);
		console.log(savedMessage);
		return { message: savedMessage, conversation: updatedConversation };
	}

	getMessagesByConversationId(conversationId: number): Promise<Message[]> {
		return this.messageRepository.find({
			relations: ['author'],
			where: { conversation: { id: conversationId }},
			order: { createdAt: 'DESC' },
		});
	}
}