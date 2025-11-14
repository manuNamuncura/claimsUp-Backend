import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  HttpCode,
  HttpStatus 
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectType } from '@prisma/client';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Get('types')
  getProjectTypes() {
    return this.projectsService.getProjectTypes();
  }

  @Get('client/:clientId')
  findByClient(@Param('clientId') clientId: string) {  
    return this.projectsService.findByClient(clientId);
  }

  @Get('type/:type')
  findByType(@Param('type') type: ProjectType) {
    return this.projectsService.findByType(type);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {  
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,  
    @Body() updateProjectDto: UpdateProjectDto
  ) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {  
    return this.projectsService.remove(id);
  }
}