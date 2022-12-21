import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { GatewayModule } from './gateway/gateway.module';
import entities, { FriendRequest } from './utils/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GroupModule } from './groups/group.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { FriendRequestModule } from './friend-requests/friend-requests.module';
import { FriendsModule } from './friends/friends.module';
import { EventsModule } from './events/events.module';

@Module({
	imports: [
		AuthModule, 
		UsersModule,
		ConfigModule.forRoot({ envFilePath: '.env.development' }), 
		PassportModule.register({ session: true }),
		TypeOrmModule.forRoot({
			type: 'mysql',
			host: process.env.MYSQL_DB_HOST,
			port: parseInt(process.env.MYSQL_DB_PORT),
			username: process.env.MYSQL_DB_USERNAME,
			password: process.env.MYSQL_DB_PASSWORD,
			database: process.env.MYSQL_DB_NAME,
			synchronize: true,
			entities,
			logging: false,
		}),
		ConversationsModule,
		MessagesModule,
		GatewayModule,
		EventEmitterModule.forRoot(),
		GroupModule,
		FriendRequestModule,
		FriendsModule,
		EventsModule,
		ThrottlerModule.forRoot({
			ttl: 60,
			limit: 10,
		}),
	],
	controllers: [],
	providers: [
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
	],
})
export class AppModule {}
