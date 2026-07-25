const fs = require('fs');
const path = require('path');

const models = [
  { name: 'Pembayaran', plural: 'pembayarans', folder: 'pembayaran' },
  { name: 'Beasiswa', plural: 'beasiswas', folder: 'beasiswa' },
  { name: 'Yudisium', plural: 'yudisiums', folder: 'yudisium' },
  { name: 'SKPI', plural: 'skpis', folder: 'skpi' },
  { name: 'TracerStudy', plural: 'tracerStudies', folder: 'tracer-study' },
  { name: 'Pengumuman', plural: 'pengumumans', folder: 'pengumuman' },
  { name: 'Pesan', plural: 'pesans', folder: 'pesan' },
  { name: 'KuesionerEdom', plural: 'kuesionerEdoms', folder: 'edom' }
];

models.forEach(model => {
  const serviceFile = path.join(__dirname, 'src', model.folder, `${model.folder}.service.ts`);
  const controllerFile = path.join(__dirname, 'src', model.folder, `${model.folder}.controller.ts`);
  const moduleFile = path.join(__dirname, 'src', model.folder, `${model.folder}.module.ts`);
  
  const camelCase = model.name.charAt(0).toLowerCase() + model.name.slice(1);
  const serviceName = `${model.name}Service`;
  const controllerName = `${model.name}Controller`;
  
  const serviceCode = `import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ${serviceName} {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.${camelCase}.create({ data });
  }

  async findAll(search?: string, page: number = 1, limit: number = 15) {
    const skip = (page - 1) * limit;
    
    // Very basic where clause, you can customize per model later
    const where = search ? { id: search } : {};

    const [data, total] = await Promise.all([
      this.prisma.${camelCase}.findMany({
        where,
        skip,
        take: limit,
      }),
      this.prisma.${camelCase}.count({ where })
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async findOne(id: string) {
    const data = await this.prisma.${camelCase}.findUnique({
      where: { id }
    });
    if (!data) throw new NotFoundException('Data tidak ditemukan');
    return data;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.${camelCase}.update({
      where: { id },
      data
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.${camelCase}.delete({ where: { id } });
  }
}
`;

  const controllerCode = `import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { ${serviceName} } from './${model.folder}.service';

@Controller('${model.folder}')
export class ${controllerName} {
  constructor(private readonly service: ${serviceName}) {}

  @Post()
  create(@Body() createDto: any) {
    return this.service.create(createDto);
  }

  @Get()
  findAll(@Query('search') search?: string, @Query('page') page: string = '1', @Query('limit') limit: string = '15') {
    return this.service.findAll(search, +page, +limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
`;

  const moduleCode = `import { Module } from '@nestjs/common';
import { ${serviceName} } from './${model.folder}.service';
import { ${controllerName} } from './${model.folder}.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [${controllerName}],
  providers: [${serviceName}],
})
export class ${model.name}Module {}
`;

  fs.writeFileSync(serviceFile, serviceCode);
  fs.writeFileSync(controllerFile, controllerCode);
  fs.writeFileSync(moduleFile, moduleCode);
});
console.log('CRUD logic generated for all models.');
