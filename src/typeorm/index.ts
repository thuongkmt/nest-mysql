import { User } from './User';
import { ChatTopic } from './ChatTopic';
import { Message } from './Message';
import { UserChatTopic } from './UserChatTopic';
import { ConnectedUser } from './ConnectedUser';

const entities = [User, ChatTopic, Message, UserChatTopic, ConnectedUser];

export { User };
export { ChatTopic };
export { Message };
export { UserChatTopic };
export { ConnectedUser };

export default entities;
