const fs = require('fs');
const path = require('path');

// Fix asdos
let file = path.join(__dirname, 'src', 'asdos', 'asdos.service.ts');
if (fs.existsSync(file)) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/orderBy: \{ semester: 'desc' \}/g, "orderBy: { tahunAkademik: { kode: 'desc' } }");
  code = code.replace(/orderBy: \[\{ semester: 'desc' \}/g, "orderBy: [{ tahunAkademik: { kode: 'desc' } }");
  code = code.replace(/semester:/g, "tahunAkademikId:");
  fs.writeFileSync(file, code);
}

// Fix dosen-portal
file = path.join(__dirname, 'src', 'dosen-portal', 'dosen-portal.service.ts');
if (fs.existsSync(file)) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/orderBy: \{ semester: 'desc' \}/g, "orderBy: { tahunAkademik: { kode: 'desc' } }");
  code = code.replace(/orderBy: \[\{ semester: 'desc' \}/g, "orderBy: [{ tahunAkademik: { kode: 'desc' } }");
  
  // Group by logic
  code = code.replace(
`    // Group by semester
    const grouped: Record<string, any[]> = {};
    data.forEach((k) => {
      if (!grouped[k.semester]) grouped[k.semester] = [];
      grouped[k.semester].push(k);
    });`,
`    // Group by semester
    const grouped: Record<string, any[]> = {};
    data.forEach((k: any) => {
      const semName = k.tahunAkademik?.nama || k.tahunAkademikId;
      if (!grouped[semName]) grouped[semName] = [];
      grouped[semName].push(k);
    });`
  );

  code = code.replace(
`      include: {
        jadwal: {
          include: {
            mataKuliah: true,
          },
        },
      },`,
`      include: {
        jadwal: {
          include: {
            mataKuliah: true,
          },
        },
        tahunAkademik: true,
      },`
  );

  fs.writeFileSync(file, code);
}

// Fix jadwal
file = path.join(__dirname, 'src', 'jadwal', 'jadwal.service.ts');
if (fs.existsSync(file)) {
  let code = fs.readFileSync(file, 'utf8');
  // Need to provide a dummy tahunAkademikId if not passed in dto, but best is to replace it or fetch active.
  code = code.replace(
`    return this.prisma.jadwalKuliah.create({
      data: dto,`,
`    const activeTahun = await this.prisma.tahunAkademik.findFirst({ where: { isAktif: true } });
    return this.prisma.jadwalKuliah.create({
      data: { ...dto, tahunAkademikId: activeTahun?.id || 'MISSING' },`
  );
  fs.writeFileSync(file, code);
}

// Fix krs
file = path.join(__dirname, 'src', 'krs', 'krs.service.ts');
if (fs.existsSync(file)) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/orderBy: \{ semester: 'desc' \}/g, "orderBy: { tahunAkademik: { kode: 'desc' } }");
  code = code.replace(/where: \{ mahasiswaId, jadwalId, semester \}/g, "where: { mahasiswaId, jadwalId, tahunAkademikId: semester }");
  code = code.replace(/data: \{ mahasiswaId, jadwalId, semester \}/g, "data: { mahasiswaId, jadwalId, tahunAkademikId: semester }");
  
  fs.writeFileSync(file, code);
}

console.log('Fixed other files');
