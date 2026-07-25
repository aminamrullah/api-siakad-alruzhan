const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'mahasiswa-portal', 'mahasiswa-portal.service.ts');
let code = fs.readFileSync(file, 'utf8');

// 1. getDashboard
code = code.replace(
`    // Semester aktif (latest KRS semester)
    const latestKrs = await this.prisma.krs.findFirst({
      where: { mahasiswaId: mahasiswa.id },
      orderBy: { semester: 'desc' },
    });`,
`    // Semester aktif
    const activeTahun = await this.prisma.tahunAkademik.findFirst({
      where: { isAktif: true },
    });`
);
code = code.replace(`semesterAktif: latestKrs?.semester || '-',`, `semesterAktif: activeTahun?.nama || '-',`);

// 2. where clause replacements: semester -> tahunAkademikId
code = code.replace(/where\.semester = semester/g, 'where.tahunAkademikId = semester');
code = code.replace(/where: { mahasiswaId: mahasiswa\.id, jadwalId: dto\.jadwalId, semester: dto\.semester }/g, 'where: { mahasiswaId: mahasiswa.id, jadwalId: dto.jadwalId, tahunAkademikId: dto.semester }');
code = code.replace(/data: { mahasiswaId: mahasiswa\.id, jadwalId: dto\.jadwalId, semester: dto\.semester }/g, 'data: { mahasiswaId: mahasiswa.id, jadwalId: dto.jadwalId, tahunAkademikId: dto.semester }');
code = code.replace(/where: { mahasiswaId: mahasiswa\.id, semester }/g, 'where: { mahasiswaId: mahasiswa.id, tahunAkademikId: semester }');
code = code.replace(/where: { mahasiswaId: mahasiswa\.id, semester: dto\.semester, status: 'MENUNGGU' }/g, "where: { mahasiswaId: mahasiswa.id, tahunAkademikId: dto.semester, status: 'MENUNGGU' }");
code = code.replace(/semester: dto\.semester,/g, 'tahunAkademikId: dto.semester,');

// 3. orderBy replacements
code = code.replace(/orderBy: { semester: 'desc' }/g, "orderBy: { tahunAkademik: { kode: 'desc' } }");
code = code.replace(/orderBy: \[\{ semester: 'desc' \},/g, "orderBy: [{ tahunAkademik: { kode: 'desc' } },");

// 4. include replacements (to fetch tahunAkademik.nama)
code = code.replace(
`      include: {
        jadwal: {
          include: {
            mataKuliah: true,
            dosen: { include: { user: { select: { name: true } } } },
            ruanganObj: true,
          },
        },
      },
      orderBy: { tahunAkademik: { kode: 'desc' } },`,
`      include: {
        jadwal: {
          include: {
            mataKuliah: true,
            dosen: { include: { user: { select: { name: true } } } },
            ruanganObj: true,
          },
        },
        tahunAkademik: true,
      },
      orderBy: { tahunAkademik: { kode: 'desc' } },`
);

code = code.replace(
`      include: {
        jadwal: {
          include: {
            mataKuliah: true,
            dosen: { include: { user: { select: { name: true } } } },
          },
        },
      },
      orderBy: [{ tahunAkademik: { kode: 'desc' } },`,
`      include: {
        jadwal: {
          include: {
            mataKuliah: true,
            dosen: { include: { user: { select: { name: true } } } },
          },
        },
        tahunAkademik: true,
      },
      orderBy: [{ tahunAkademik: { kode: 'desc' } },`
);

// 5. Group by semester logic
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
`    // Group by semester and calculate IPS per semester
    const grouped: Record<string, { items: any[]; ips: number; totalSks: number }> = {};
    data.forEach((k) => {
      if (!grouped[k.semester]) grouped[k.semester] = { items: [], ips: 0, totalSks: 0 };
      grouped[k.semester].items.push({`,
`    // Group by semester and calculate IPS per semester
    const grouped: Record<string, { items: any[]; ips: number; totalSks: number }> = {};
    data.forEach((k: any) => {
      const semName = k.tahunAkademik?.nama || k.tahunAkademikId;
      if (!grouped[semName]) grouped[semName] = { items: [], ips: 0, totalSks: 0 };
      grouped[semName].items.push({`
);

// 6. getJadwal logic
code = code.replace(
`    // Get latest semester if not specified
    if (!semester) {
      const latestKrs = await this.prisma.krs.findFirst({
        where: { mahasiswaId: mahasiswa.id },
        orderBy: { tahunAkademik: { kode: 'desc' } },
      });
      semester = latestKrs?.semester;
    }`,
`    // Get latest semester if not specified
    if (!semester) {
      const activeTahun = await this.prisma.tahunAkademik.findFirst({
        where: { isAktif: true },
      });
      semester = activeTahun?.id;
    }`
);
// Also for getJadwal where orderBy: { semester: 'desc' } was originally there
code = code.replace(
`    // Get latest semester if not specified
    if (!semester) {
      const latestKrs = await this.prisma.krs.findFirst({
        where: { mahasiswaId: mahasiswa.id },
        orderBy: { semester: 'desc' },
      });
      semester = latestKrs?.semester;
    }`,
`    // Get latest semester if not specified
    if (!semester) {
      const activeTahun = await this.prisma.tahunAkademik.findFirst({
        where: { isAktif: true },
      });
      semester = activeTahun?.id;
    }`
);

fs.writeFileSync(file, code);
console.log('Fixed mahasiswa-portal.service.ts');
