import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../lib/database/prisma.service.js';
import { CreateHackathonDto } from './dto/create-hackathon.dto.js';
import { UpdateHackathonDto } from './dto/update-hackathon.dto.js';
import { ListHackathonsQueryDto } from './dto/list-hackathons-query.dto.js';

@Injectable()
export class HackathonService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateHackathonDto, authorId: string) {
    return this.prisma.hackathon.create({
      data: {
        name: dto.name,
        description: dto.description,
        startDate: dto.startsAt,
        endDate: dto.endsAt,
        isActive: dto.isActive ?? true,
        authorId,
      },
    });
  }

  async findAll(query: ListHackathonsQueryDto) {
    const { take = 10, cursor } = query;

    const hackathons = await this.prisma.hackathon.findMany({
      take: take + 1, // Fetch one extra to determine if there's a next page
      orderBy: { createdAt: 'desc' },
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor item itself
      }),
    });

    const hasNextPage = hackathons.length > take;
    const data = hasNextPage ? hackathons.slice(0, take) : hackathons;
    const nextCursor = hasNextPage ? data[data.length - 1].id : null;

    return {
      data,
      meta: {
        hasNextPage,
        nextCursor,
      },
    };
  }

  async findOne(id: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id },
    });

    if (!hackathon) {
      throw new NotFoundException(`Hackathon with id "${id}" not found`);
    }

    return hackathon;
  }

  async findParticipants(hackathonId: string) {
    await this.findOne(hackathonId); // 404 if hackathon doesn't exist

    const result = await this.prisma.hackathonParticipant.findMany({
      where: { hackathonId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
          },
        },
      },
    });

    return result.map((entry) => ({
      ...entry.user,
      joinedAt: entry.createdAt,
    }));
  }

  async update(id: string, dto: UpdateHackathonDto) {
    await this.findOne(id);

    return this.prisma.hackathon.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.startsAt !== undefined && { startDate: dto.startsAt }),
        ...(dto.endsAt !== undefined && { endDate: dto.endsAt }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.hackathon.delete({
      where: { id },
    });
  }

  async join(hackathonId: string, userId: string) {
    const hackathon = await this.findOne(hackathonId);

    if (!hackathon.isActive) {
      throw new BadRequestException('This hackathon is no longer active');
    }

    if (new Date() > hackathon.endDate) {
      throw new BadRequestException('This hackathon has already ended');
    }

    const existing = await this.prisma.hackathonParticipant.findUnique({
      where: { hackathonId_userId: { hackathonId, userId } },
    });

    if (existing) {
      throw new BadRequestException('You have already joined this hackathon');
    }

    return this.prisma.hackathonParticipant.create({
      data: { hackathonId, userId },
    });
  }
}
