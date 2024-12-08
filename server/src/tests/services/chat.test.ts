import { ChatService } from '../../services/chat';
import { Server } from 'http';
import { Server as SocketServer, BroadcastOperator } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { db } from '../../config/database';

// Mock database
jest.mock('../../config/database', () => ({
    db: {
        query: jest.fn(),
    },
}));

// Create a properly typed broadcast operator mock
const createBroadcastOperatorMock = () => ({
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    except: jest.fn().mockReturnThis(),
    timeout: jest.fn().mockReturnThis(),
    compress: jest.fn().mockReturnThis(),
    volatile: jest.fn().mockReturnThis(),
    local: jest.fn().mockReturnThis(),
    broadcast: jest.fn().mockReturnThis(),
    emitWithAck: jest.fn(),
    socketsJoin: jest.fn(),
    socketsLeave: jest.fn(),
    disconnectSockets: jest.fn(),
    serverSideEmit: jest.fn(),
    adapter: {},
    rooms: new Set(),
    exceptRooms: new Set(),
    flags: {},
});

type BroadcastOperatorMock = ReturnType<typeof createBroadcastOperatorMock>;

// Create socket.io server mock
const mockBroadcastOperator = createBroadcastOperatorMock();
const mockEmit = jest.fn();

jest.mock('socket.io', () => {
    const mockEmit = jest.fn();
    const mockBroadcastOperator = {
        emit: mockEmit,
        to: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        except: jest.fn().mockReturnThis(),
        compress: jest.fn().mockReturnThis(),
        timeout: jest.fn().mockReturnThis(),
        volatile: jest.fn().mockReturnThis(),
        local: jest.fn().mockReturnThis(),
        disconnectSockets: jest.fn(),
        serverSideEmit: jest.fn(),
        socketsJoin: jest.fn(),
        socketsLeave: jest.fn(),
        adapter: {},
        rooms: new Set(),
        exceptRooms: new Set(),
        flags: {},
    };

    return {
        Server: jest.fn().mockImplementation(() => ({
            to: jest.fn(() => mockBroadcastOperator),
            on: jest.fn(),
            emit: mockEmit,
        })),
    };
});

describe('ChatService', () => {
    let chatService: ChatService;
    let mockServer: Server;
    let mockSocketServer: SocketServer;

    beforeEach(() => {
        mockServer = new Server();
        mockSocketServer = new SocketServer(mockServer);
        chatService = new ChatService(mockServer);
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('saveMessage', () => {
        const mockMessageInput = {
            senderId: 1,
            receiverId: 2,
            content: 'Hello, world!',
        };

        const mockMessageResponse = {
            id: 1,
            sender_id: 1,
            receiver_id: 2,
            content: 'Hello, world!',
            sent_at: new Date(),
            read_at: null,
        };

        it('should successfully save a message and return the message object', async () => {
            (db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockMessageResponse] });

            const result = await (chatService as any).saveMessage(mockMessageInput);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO messages'),
                [mockMessageInput.senderId, mockMessageInput.receiverId, mockMessageInput.content]
            );
            expect(result).toEqual(mockMessageResponse);
        });

        it('should throw an error when database query fails', async () => {
            const dbError = new Error('Database error');
            (db.query as jest.Mock).mockRejectedValueOnce(dbError);

            await expect((chatService as any).saveMessage(mockMessageInput))
                .rejects
                .toThrow('Database error');
        });
    });

    describe('getConversation', () => {
        const mockMessages = [
            { id: 1, sender_id: 1, receiver_id: 2, content: 'Hi!', sent_at: new Date(), read_at: null },
            { id: 2, sender_id: 2, receiver_id: 1, content: 'Hello!', sent_at: new Date(), read_at: null },
        ];

        it('should return conversation messages between two users', async () => {
            (db.query as jest.Mock).mockResolvedValueOnce({ rows: mockMessages });

            const result = await chatService.getConversation(1, 2);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM messages'),
                [1, 2]
            );
            expect(result).toEqual(mockMessages);
        });

        it('should throw an error when conversation retrieval fails', async () => {
            const dbError = new Error('Database error');
            (db.query as jest.Mock).mockRejectedValueOnce(dbError);

            await expect(chatService.getConversation(1, 2))
                .rejects
                .toThrow('Database error');
        });
    });

    describe('canChat', () => {
        it('should return true when users are matched', async () => {
            (db.query as jest.Mock).mockResolvedValueOnce({ rows: [{ exists: true }] });

            const result = await (chatService as any).canChat(1, 2);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT EXISTS'),
                [1, 2]
            );
            expect(result).toBe(true);
        });

        it('should return false when users are not matched', async () => {
            (db.query as jest.Mock).mockResolvedValueOnce({ rows: [{ exists: false }] });

            const result = await (chatService as any).canChat(1, 2);

            expect(result).toBe(false);
        });

        it('should throw an error when permission check fails', async () => {
            const dbError = new Error('Database error');
            (db.query as jest.Mock).mockRejectedValueOnce(dbError);

            await expect((chatService as any).canChat(1, 2))
                .rejects
                .toThrow('Database error');
        });
    });

    describe('markMessageAsRead', () => {
        it('should successfully mark a message as read', async () => {
            await chatService.markMessageAsRead(1);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE messages SET read_at'),
                [1]
            );
        });

        it('should throw an error when marking message as read fails', async () => {
            const dbError = new Error('Database error');
            (db.query as jest.Mock).mockRejectedValueOnce(dbError);

            await expect(chatService.markMessageAsRead(1))
                .rejects
                .toThrow('Database error');
        });
    });

    describe('getUnreadMessagesCount', () => {
        it('should return the correct count of unread messages', async () => {
            (db.query as jest.Mock).mockResolvedValueOnce({ rows: [{ count: '5' }] });

            const result = await chatService.getUnreadMessagesCount(1);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT COUNT(*) FROM messages'),
                [1]
            );
            expect(result).toBe(5);
        });

        it('should throw an error when counting unread messages fails', async () => {
            const dbError = new Error('Database error');
            (db.query as jest.Mock).mockRejectedValueOnce(dbError);

            await expect(chatService.getUnreadMessagesCount(1))
                .rejects
                .toThrow('Database error');
        });
    });

    describe('emitWithDelay', () => {
        const mockData = {
            room: 'user_1',
            message: { id: 1, content: 'Test message' },
        };
    
        it('should emit a message to the specified room', async () => {
            const mockEmit = jest.fn();
            const mockBroadcastOperator = {
                emit: mockEmit,
                to: jest.fn().mockReturnThis(),
            };
    
            jest.spyOn(chatService['io'], 'to').mockImplementation(() => mockBroadcastOperator as any);
    
            await (chatService as any).emitWithDelay('newMessage', mockData);
    
            expect(chatService['io'].to).toHaveBeenCalledWith('user_1');
            expect(mockBroadcastOperator.emit).toHaveBeenCalledWith('newMessage', mockData.message);
        });
    
        it('should handle emission failures gracefully', async () => {
            const emitError = new Error('Emission error');
            const mockBroadcastOperator = {
                emit: jest.fn().mockRejectedValueOnce(emitError),
                to: jest.fn().mockReturnThis(),
            };
    
            jest.spyOn(chatService['io'], 'to').mockImplementation(() => mockBroadcastOperator as any);
    
            await expect((chatService as any).emitWithDelay('newMessage', mockData))
                .rejects
                .toThrow('Emission error');
        });
    });

    describe('ChatService Socket Handlers', () => {
        let chatService: ChatService;
        let mockServer: Server;
        let mockSocket: any;
        let mockIo: any;
    
        beforeEach(() => {
            mockSocket = {
                join: jest.fn(),
                emit: jest.fn(),
                on: jest.fn()
            };
    
            mockIo = {
                on: jest.fn(),
                to: jest.fn().mockReturnValue({
                    emit: jest.fn()
                }),
                emit: jest.fn()
            };
    
            mockServer = new Server();
            (SocketServer as unknown as jest.Mock).mockImplementation(() => mockIo);
            chatService = new ChatService(mockServer);
        });
    
        describe('setupSocketHandlers', () => {
            it('should set up connection handler', () => {
                const connectionCallback = mockIo.on.mock.calls[0][1];
                connectionCallback(mockSocket);
    
                expect(mockIo.on).toHaveBeenCalledWith('connection', expect.any(Function));
                expect(mockSocket.on).toHaveBeenCalledWith('join', expect.any(Function));
                expect(mockSocket.on).toHaveBeenCalledWith('sendMessage', expect.any(Function));
                expect(mockSocket.on).toHaveBeenCalledWith('typing', expect.any(Function));
                expect(mockSocket.on).toHaveBeenCalledWith('markAsRead', expect.any(Function));
            });
    
            describe('join handler', () => {
                it('should handle join event', () => {
                    const connectionCallback = mockIo.on.mock.calls[0][1];
                    connectionCallback(mockSocket);
    
                    const joinCallback: (roomId: string) => void = mockSocket.on.mock.calls
                        .find((call: [string, (...args: any[]) => void]) => call[0] === 'join')[1];
                    joinCallback('123');
    
                    expect(mockSocket.join).toHaveBeenCalledWith('user_123');
                });
            });
    
            describe('typing handler', () => {
                it('should emit typing event to receiver', () => {
                    const connectionCallback = mockIo.on.mock.calls[0][1];
                    connectionCallback(mockSocket);
    
                    const typingCallback: (data: { senderId: number; receiverId: number }) => void = mockSocket.on.mock.calls
                        .find((call: [string, (...args: any[]) => void]) => call[0] === 'typing')[1];
                    
                    const typingData = { senderId: 1, receiverId: 2 };
                    typingCallback(typingData);
    
                    expect(mockIo.to).toHaveBeenCalledWith('user_2');
                    expect(mockIo.to().emit).toHaveBeenCalledWith('userTyping', 1);
                });
            });
    
            describe('handleNewMessage', () => {
                const messageData = {
                    senderId: 1,
                    receiverId: 2,
                    content: 'Hello'
                };
    
                it('should handle successful message sending', async () => {
                    (db.query as jest.Mock).mockResolvedValueOnce({ rows: [{ exists: true }] }); // canChat
                    (db.query as jest.Mock).mockResolvedValueOnce({ 
                        rows: [{ id: 1, ...messageData }] 
                    }); // saveMessage
                    (db.query as jest.Mock).mockResolvedValueOnce({ 
                        rows: [{ count: '0' }] 
                    }); // getUnreadMessagesCount
    
                    const connectionCallback = mockIo.on.mock.calls[0][1];
                    connectionCallback(mockSocket);
    
                    const sendMessageCallback: (data: { senderId: number; receiverId: number; content: string }) => Promise<void> = mockSocket.on.mock.calls
                        .find((call: [string, (...args: any[]) => void]) => call[0] === 'sendMessage')[1];
                    
                    await sendMessageCallback(messageData);
    
                    expect(mockSocket.emit).toHaveBeenCalledWith(
                        'messageSent',
                        expect.any(Object)
                    );
                    expect(mockIo.to().emit).toHaveBeenCalledWith(
                        'unreadMessages',
                        expect.any(Number)
                    );
                });
    
                it('should handle unauthorized chat attempt', async () => {
                    (db.query as jest.Mock).mockResolvedValueOnce({ rows: [{ exists: false }] });
    
                    const connectionCallback = mockIo.on.mock.calls[0][1];
                    connectionCallback(mockSocket);
    
                    const sendMessageCallback: (data: { senderId: number; receiverId: number; content: string }) => Promise<void> = mockSocket.on.mock.calls
                        .find((call: [string, (...args: any[]) => void]) => call[0] === 'sendMessage')[1];
                    
                    await sendMessageCallback(messageData);
    
                    expect(mockSocket.emit).toHaveBeenCalledWith(
                        'messageError',
                        'Users are not matched'
                    );
                });
    
                it('should handle database errors', async () => {
                    (db.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
    
                    const connectionCallback = mockIo.on.mock.calls[0][1];
                    connectionCallback(mockSocket);
    
                    const sendMessageCallback: (data: { senderId: number; receiverId: number; content: string }) => Promise<void> = mockSocket.on.mock.calls
                        .find((call: [string, (...args: any[]) => void]) => call[0] === 'sendMessage')[1];
                    
                    await sendMessageCallback(messageData);
    
                    expect(mockSocket.emit).toHaveBeenCalledWith(
                        'messageError',
                        'Failed to send message'
                    );
                });
            });
    
            describe('handleMarkAsRead', () => {
                const readData = {
                    messageId: 1,
                    userId: 2
                };
    
                it('should handle successful mark as read', async () => {
                    (db.query as jest.Mock).mockResolvedValueOnce(undefined); // markMessageAsRead
                    (db.query as jest.Mock).mockResolvedValueOnce({ 
                        rows: [{ count: '0' }] 
                    }); // getUnreadMessagesCount
    
                    const connectionCallback = mockIo.on.mock.calls[0][1];
                    connectionCallback(mockSocket);
    
                    const markAsReadCallback: (data: { messageId: number; userId: number }) => Promise<void> = mockSocket.on.mock.calls
                        .find((call: [string, (...args: any[]) => void]) => call[0] === 'markAsRead')[1];
                    
                    await markAsReadCallback(readData);
    
                    expect(mockSocket.emit).toHaveBeenCalledWith(
                        'unreadMessages',
                        expect.any(Number)
                    );
                });
    
                it('should handle database errors in mark as read', async () => {
                    (db.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
    
                    const connectionCallback = mockIo.on.mock.calls[0][1];
                    connectionCallback(mockSocket);
    
                    const markAsReadCallback: (data: { messageId: number; userId: number }) => Promise<void> = mockSocket.on.mock.calls
                        .find((call: [string, (...args: any[]) => void]) => call[0] === 'markAsRead')[1];
                    
                    await markAsReadCallback(readData);
    
                    expect(mockSocket.emit).toHaveBeenCalledWith(
                        'messageError',
                        'Failed to mark message as read'
                    );
                });
            });
        });
    });
     
});