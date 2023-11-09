import { Injectable, NotFoundException } from '@nestjs/common';
// import { TasksRepository } from './tasks.repository';
// import { Injectable, NotFoundException } from '@nestjs/common';
// import { v4 as uuid } from 'uuid';
// import { CreateTaskDto } from './dto/create-task.dto';
// import { Task, TaskStatus } from './tasks.model';
// import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { TasksRepository } from './tasks.repository';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskStatus } from './tasks-status.enum';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';

// @Injectable()
// export class TasksService {
//   private tasks: Task[] = [];

//   getAllTasks(): Task[] {
//     return this.tasks;
//   }

//   getTasksWithFilters(filterDto: GetTasksFilterDto): Task[] {
//     const { status, search } = filterDto;

//     let tasks = this.getAllTasks();

//     // do something with status
//     if (status) {
//       tasks = tasks.filter((task) => task.status === status);
//     }

//     if (search) {
//       tasks = tasks.filter((task) => {
//         if (task.title.includes(search) || task.description.includes(search)) {
//           return true;
//         }

//         return false;
//       });
//     }

//     return tasks;
//   }

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private tasksRepository: TasksRepository,
  ) {}

  async getTasks(filterDto: GetTasksFilterDto): Promise<Task[]> {
    const { status, search } = filterDto;
    const query = this.tasksRepository.createQueryBuilder('task');
    if (status) {
      query.andWhere('task.status = :status', { status });
    }
    if (search) {
      query.andWhere(
        'LOWER(task.title) LIKE LOWER(:search) OR LOWER(task.description) LIKE LOWER(:search)',

        { search: `%${search}%` },
      );
    }
    const tasks = await query.getMany();
    return tasks;
  }

  async getTaskById(id: string): Promise<Task> {
    const found = await this.tasksRepository.findOneBy({ id });
    if (!found) {
      throw new NotFoundException(`task with ${id} is not found`);
    }
    return found;
  }

  async createTask(createTaskDto: CreateTaskDto): Promise<Task> {
    const { title, description } = createTaskDto;
    const task = this.tasksRepository.create({
      title,
      description,
      status: TaskStatus.OPEN,
    });
    await this.tasksRepository.save(task);
    return task;
  }

  async deleteTask(id: string): Promise<void> {
    const result = await this.tasksRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
  }

  async updateTaskStatus(id: string, status: TaskStatus) {
    const task = await this.getTaskById(id);
    task.status = status;
    await this.tasksRepository.save(task);
    return task;
  }
}
