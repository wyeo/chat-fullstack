import { Message, MessageType } from './message.types.js';

/**
 * WebSocket event interfaces for real-time communication
 * 
 * These interfaces define the contract between frontend and backend
 * for Socket.io events. Each interface corresponds to a specific event.
 */

/**
 * Data for joining a chat room
 * Event: 'joinRoom'
 */
export interface WsJoinRoomData {
  /** ObjectId of the room to join */
  roomId: string;
}

/**
 * Data for leaving a chat room
 * Event: 'leaveRoom'
 */
export interface WsLeaveRoomData {
  /** ObjectId of the room to leave */
  roomId: string;
}

/**
 * Data for sending a new message
 * Event: 'sendMessage'
 */
export interface WsSendMessageData {
  /** Message content (max 2000 characters) */
  content: string;
  
  /** ObjectId of the target room */
  roomId: string;
  
  /** Type of message content */
  messageType: MessageType;
}

/**
 * Notification when a user connects to the system
 * Event: 'userConnected'
 */
export interface WsUserConnectedData {
  /** UUID of the connected user */
  userId: string;
  
  /** Username for display purposes */
  username: string;
}

/**
 * Notification when a user disconnects from the system
 * Event: 'userDisconnected'
 */
export interface WsUserDisconnectedData {
  /** UUID of the disconnected user */
  userId: string;
}

/**
 * Notification when a user joins a specific room
 * Event: 'userJoinedRoom'
 */
export interface WsUserJoinedRoomData {
  /** UUID of the user who joined */
  userId: string;
  
  /** Username for display purposes */
  username: string;
  
  /** ObjectId of the room joined */
  roomId: string;
}

/**
 * Notification when a user leaves a specific room
 * Event: 'userLeftRoom'
 */
export interface WsUserLeftRoomData {
  /** UUID of the user who left */
  userId: string;
  
  /** ObjectId of the room left */
  roomId: string;
}

/**
 * Enhanced message data sent to clients
 * Event: 'newMessage'
 * 
 * Extends the base Message interface with additional
 * sender information for real-time display
 */
export interface WsNewMessageData extends Message {
  /** Additional sender information */
  senderInfo: {
    /** UUID of the sender */
    id: string;
    
    /** Username of the sender */
    username: string;
  };
}