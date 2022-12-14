import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { hashPassword } from 'src/utils/helpers';
import { User } from 'src/utils/typeorm';
import {
	CreateUserDetails,
	FindUserOptions,
	FindUserParams,
} from 'src/utils/types';
import { IUserService } from '../interfaces/user';

@Injectable()
export class UserService implements IUserService {
	constructor(
		@InjectRepository(User) private readonly userRepository: Repository<User>,
	) {}

	async createUser(userDetails: CreateUserDetails) {
		const exitingUser = await this.userRepository.findOne({
			username: userDetails.username,
		});
		if (exitingUser)
			throw new HttpException('User already exists', HttpStatus.CONFLICT);
		const password = await hashPassword(userDetails.password);
		const params = { ...userDetails, password };
		const newUser = this.userRepository.create({ ...userDetails, password });
		return this.userRepository.save(newUser);
	}

	async findUser(
		params: FindUserParams,
		options?: FindUserOptions,
	): Promise<User> {
		const selections: (keyof User)[] = [
			'email',
			'username',
			'firstName',
			'lastName',
			'id',
		];
		const selectionWithPassword: (keyof User)[] = [...selections, 'password'];
		return this.userRepository.findOne(params, {
			select: options?.selectAll ? selectionWithPassword : selections,
			relations: ['profile', 'presence'],
		});
	}

	async saveUser(user: User) {
		return this.userRepository.save(user);
	}

	searchUsers(query: string) {
		const statement = '(user.username LIKE :query)';
		return this.userRepository
			.createQueryBuilder('user')
			.where(statement, { query: `%${query}%` })
			.limit(10)
			.select([
				'user.username',
				'user.firstName',
				'user.lastName',
				'user.email',
				'user.id',
				'user.profile',
			])
			.getMany();
	}
}
