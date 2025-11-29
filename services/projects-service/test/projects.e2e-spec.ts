import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TaskPriority, TaskStatus } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Projects API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Create a test user and get auth token
    const user = await prisma.user.create({
      data: {
        email: 'projects-test@example.com',
        handle: 'projectstester',
        passwordHash: 'hashed',
        name: 'Projects Tester',
      },
    });
    userId = user.id;

    // Mock JWT token (in real scenario, you'd call /auth/login)
    authToken = 'mock-jwt-token-for-testing';
  });

  afterAll(async () => {
    // Cleanup
    await prisma.task.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({ where: { email: 'projects-test@example.com' } });
    await app.close();
  });

  describe('/projects (POST)', () => {
    it('should create a new project', () => {
      return request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Project', description: 'A test project' })
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe('Test Project');
          expect(res.body.ownerId).toBe(userId);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/projects')
        .send({ name: 'Test Project' })
        .expect(401);
    });
  });

  describe('/projects (GET)', () => {
    it('should return paginated projects', async () => {
      // Create multiple projects
      await Promise.all([
        prisma.project.create({ data: { name: 'Project 1', ownerId: userId } }),
        prisma.project.create({ data: { name: 'Project 2', ownerId: userId } }),
      ]);

      return request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.items).toBeInstanceOf(Array);
          expect(res.body.items.length).toBeGreaterThanOrEqual(2);
        });
    });

    it('should support pagination with limit', () => {
      return request(app.getHttpServer())
        .get('/projects?limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.items.length).toBeLessThanOrEqual(1);
          expect(res.body).toHaveProperty('nextCursor');
        });
    });
  });

  describe('/projects/:id (GET)', () => {
    it('should return project with tasks', async () => {
      const project = await prisma.project.create({
        data: {
          name: 'Project with tasks',
          ownerId: userId,
        },
      });

      await prisma.task.create({
        data: {
          title: 'Task 1',
          projectId: project.id,
          creatorId: userId,
        },
      });

      return request(app.getHttpServer())
        .get(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(project.id);
          expect(res.body.tasks).toBeInstanceOf(Array);
        });
    });

    it('should return 404 for non-existent project', () => {
      return request(app.getHttpServer())
        .get('/projects/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/projects/:projectId/tasks (POST)', () => {
    it('should create a task in project', async () => {
      const project = await prisma.project.create({
        data: { name: 'Task Test Project', ownerId: userId },
      });

      return request(app.getHttpServer())
        .post(`/projects/${project.id}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'New Task',
          description: 'Task description',
          priority: TaskPriority.HIGH,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.title).toBe('New Task');
          expect(res.body.projectId).toBe(project.id);
          expect(res.body.priority).toBe(TaskPriority.HIGH);
        });
    });

    it('should reject task with non-existent assignee', async () => {
      const project = await prisma.project.create({
        data: { name: 'Validation Test Project', ownerId: userId },
      });

      return request(app.getHttpServer())
        .post(`/projects/${project.id}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Invalid Task',
          assigneeId: 'non-existent-user',
        })
        .expect(400);
    });
  });

  describe('/projects/tasks/:taskId (PATCH)', () => {
    it('should update task status', async () => {
      const project = await prisma.project.create({
        data: { name: 'Update Test Project', ownerId: userId },
      });

      const task = await prisma.task.create({
        data: {
          title: 'Task to Update',
          projectId: project.id,
          creatorId: userId,
          status: TaskStatus.TODO,
        },
      });

      return request(app.getHttpServer())
        .patch(`/projects/tasks/${task.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: TaskStatus.IN_PROGRESS })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(TaskStatus.IN_PROGRESS);
        });
    });

    it('should reject invalid status transition', async () => {
      const project = await prisma.project.create({
        data: { name: 'Transition Test Project', ownerId: userId },
      });

      const task = await prisma.task.create({
        data: {
          title: 'Task with Status',
          projectId: project.id,
          creatorId: userId,
          status: TaskStatus.TODO,
        },
      });

      return request(app.getHttpServer())
        .patch(`/projects/tasks/${task.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: TaskStatus.DONE }) // Invalid: TODO -> DONE directly
        .expect(400);
    });
  });

  describe('/projects/tasks/:taskId (DELETE)', () => {
    it('should delete a task', async () => {
      const project = await prisma.project.create({
        data: { name: 'Delete Test Project', ownerId: userId },
      });

      const task = await prisma.task.create({
        data: {
          title: 'Task to Delete',
          projectId: project.id,
          creatorId: userId,
        },
      });

      return request(app.getHttpServer())
        .delete(`/projects/tasks/${task.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('/projects/:id (DELETE)', () => {
    it('should delete project and cascade delete tasks', async () => {
      const project = await prisma.project.create({
        data: { name: 'Project to Delete', ownerId: userId },
      });

      await prisma.task.create({
        data: {
          title: 'Task in deleted project',
          projectId: project.id,
          creatorId: userId,
        },
      });

      await request(app.getHttpServer())
        .delete(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify tasks were also deleted (cascade)
      const tasks = await prisma.task.findMany({ where: { projectId: project.id } });
      expect(tasks).toHaveLength(0);
    });
  });
});
