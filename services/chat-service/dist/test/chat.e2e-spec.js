"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const socket_io_client_1 = require("socket.io-client");
const request = require("supertest");
const app_module_1 = require("../src/app.module");
const prisma_service_1 = require("../src/prisma/prisma.service");
describe('Chat E2E Tests', () => {
    let app;
    let prisma;
    let clientSocket;
    let serverUrl;
    let testUser1;
    let testUser2;
    let testConversation;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
        const port = 3003;
        await app.listen(port);
        serverUrl = `http://localhost:${port}`;
        prisma = app.get(prisma_service_1.PrismaService);
        await setupTestData();
    });
    afterAll(async () => {
        await cleanupTestData();
        await app.close();
    });
    afterEach(() => {
        if (clientSocket && clientSocket.connected) {
            clientSocket.disconnect();
        }
    });
    async function setupTestData() {
        testUser1 = await prisma.user.create({
            data: {
                email: 'test1-chat@example.com',
                handle: 'test1chat',
                passwordHash: 'hash',
                name: 'Test User 1',
            },
        });
        testUser2 = await prisma.user.create({
            data: {
                email: 'test2-chat@example.com',
                handle: 'test2chat',
                passwordHash: 'hash',
                name: 'Test User 2',
            },
        });
        testConversation = await prisma.conversation.create({
            data: {
                participants: {
                    create: [
                        { userId: testUser1.id },
                        { userId: testUser2.id },
                    ],
                },
            },
        });
    }
    async function cleanupTestData() {
        await prisma.message.deleteMany({
            where: { conversationId: testConversation.id },
        });
        await prisma.conversationParticipant.deleteMany({
            where: { conversationId: testConversation.id },
        });
        await prisma.conversation.delete({ where: { id: testConversation.id } });
        await prisma.user.deleteMany({
            where: {
                id: { in: [testUser1.id, testUser2.id] },
            },
        });
    }
    describe('WebSocket Connection', () => {
        it('should connect to WebSocket server', (done) => {
            clientSocket = (0, socket_io_client_1.io)(serverUrl);
            clientSocket.on('connect', () => {
                expect(clientSocket.connected).toBe(true);
                done();
            });
        });
        it('should disconnect from WebSocket server', (done) => {
            clientSocket = (0, socket_io_client_1.io)(serverUrl);
            clientSocket.on('connect', () => {
                clientSocket.disconnect();
            });
            clientSocket.on('disconnect', () => {
                expect(clientSocket.connected).toBe(false);
                done();
            });
        });
    });
    describe('Join Room', () => {
        it('should allow participant to join conversation room', (done) => {
            clientSocket = (0, socket_io_client_1.io)(serverUrl);
            clientSocket.on('connect', () => {
                clientSocket.emit('joinRoom', {
                    conversationId: testConversation.id,
                    userId: testUser1.id,
                });
                setTimeout(() => {
                    expect(clientSocket.connected).toBe(true);
                    done();
                }, 100);
            });
        });
    });
    describe('Send Message', () => {
        it('should send and receive messages in real-time', (done) => {
            const client1 = (0, socket_io_client_1.io)(serverUrl);
            const client2 = (0, socket_io_client_1.io)(serverUrl);
            let messagesReceived = 0;
            client1.on('connect', () => {
                client1.emit('joinRoom', {
                    conversationId: testConversation.id,
                    userId: testUser1.id,
                });
            });
            client2.on('connect', () => {
                client2.emit('joinRoom', {
                    conversationId: testConversation.id,
                    userId: testUser2.id,
                });
                setTimeout(() => {
                    client1.emit('sendMessage', {
                        conversationId: testConversation.id,
                        userId: testUser1.id,
                        content: 'Hello from e2e test!',
                    });
                }, 200);
            });
            const messageHandler = (message) => {
                messagesReceived++;
                expect(message.content).toBe('Hello from e2e test!');
                expect(message.senderId).toBe(testUser1.id);
                expect(message.conversationId).toBe(testConversation.id);
                expect(message.sender).toBeDefined();
                expect(message.sender.name).toBe('Test User 1');
                if (messagesReceived === 2) {
                    client1.disconnect();
                    client2.disconnect();
                    done();
                }
            };
            client1.on('newMessage', messageHandler);
            client2.on('newMessage', messageHandler);
        }, 10000);
    });
    describe('Mark Read', () => {
        it('should mark message as read and notify other participants', (done) => {
            const client1 = (0, socket_io_client_1.io)(serverUrl);
            const client2 = (0, socket_io_client_1.io)(serverUrl);
            let messageId;
            client1.on('connect', () => {
                client1.emit('joinRoom', {
                    conversationId: testConversation.id,
                    userId: testUser1.id,
                });
            });
            client2.on('connect', () => {
                client2.emit('joinRoom', {
                    conversationId: testConversation.id,
                    userId: testUser2.id,
                });
                setTimeout(() => {
                    client1.emit('sendMessage', {
                        conversationId: testConversation.id,
                        userId: testUser1.id,
                        content: 'Test message for read receipt',
                    });
                }, 200);
            });
            client1.on('newMessage', (message) => {
                messageId = message.id;
                setTimeout(() => {
                    client2.emit('markRead', {
                        conversationId: testConversation.id,
                        userId: testUser2.id,
                        messageId: messageId,
                    });
                }, 100);
            });
            client1.on('messageRead', (data) => {
                expect(data.userId).toBe(testUser2.id);
                expect(data.messageId).toBe(messageId);
                expect(data.conversationId).toBe(testConversation.id);
                client1.disconnect();
                client2.disconnect();
                done();
            });
        }, 10000);
    });
    describe('REST API Endpoints', () => {
        describe('GET /chat/conversations/:userId', () => {
            it('should return user conversations', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/chat/conversations/${testUser1.id}`)
                    .expect(200);
                expect(Array.isArray(response.body)).toBe(true);
                expect(response.body.length).toBeGreaterThan(0);
                const conversation = response.body[0];
                expect(conversation.id).toBe(testConversation.id);
                expect(conversation.participants).toBeDefined();
                expect(conversation.participants.length).toBe(2);
            });
            it('should return empty array for user with no conversations', async () => {
                const userWithoutConversations = await prisma.user.create({
                    data: {
                        email: 'noconvo@example.com',
                        handle: 'noconvo',
                        passwordHash: 'hash',
                        name: 'No Conversations',
                    },
                });
                const response = await request(app.getHttpServer())
                    .get(`/chat/conversations/${userWithoutConversations.id}`)
                    .expect(200);
                expect(Array.isArray(response.body)).toBe(true);
                expect(response.body.length).toBe(0);
                await prisma.user.delete({ where: { id: userWithoutConversations.id } });
            });
        });
        describe('GET /chat/:conversationId/messages/:userId', () => {
            it('should return messages for authorized user', async () => {
                await prisma.message.create({
                    data: {
                        conversationId: testConversation.id,
                        senderId: testUser1.id,
                        content: 'Test message for API',
                    },
                });
                const response = await request(app.getHttpServer())
                    .get(`/chat/${testConversation.id}/messages/${testUser1.id}`)
                    .expect(200);
                expect(Array.isArray(response.body)).toBe(true);
                expect(response.body.length).toBeGreaterThan(0);
                const message = response.body[0];
                expect(message.conversationId).toBe(testConversation.id);
                expect(message.sender).toBeDefined();
            });
            it('should return 500 for unauthorized user', async () => {
                const unauthorizedUser = await prisma.user.create({
                    data: {
                        email: 'unauthorized@example.com',
                        handle: 'unauthorized',
                        passwordHash: 'hash',
                        name: 'Unauthorized User',
                    },
                });
                await request(app.getHttpServer())
                    .get(`/chat/${testConversation.id}/messages/${unauthorizedUser.id}`)
                    .expect(500);
                await prisma.user.delete({ where: { id: unauthorizedUser.id } });
            });
        });
        describe('POST /chat/upload', () => {
            it('should upload file and return URL', async () => {
                const fileBuffer = Buffer.from('Test file content');
                const response = await request(app.getHttpServer())
                    .post('/chat/upload')
                    .attach('file', fileBuffer, 'test.txt')
                    .expect(201);
                expect(response.body).toHaveProperty('url');
                expect(response.body.url).toMatch(/^\/uploads\/chat\//);
                expect(response.body.url).toContain('.txt');
            });
        });
    });
});
//# sourceMappingURL=chat.e2e-spec.js.map