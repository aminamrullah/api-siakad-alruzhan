import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class MahasiswaPortalService {
  constructor(private prisma: PrismaService) { }

  // Helper: Get mahasiswa record from userId
  private async getMahasiswa(userId: string) {
    const mahasiswa = await this.prisma.mahasiswa.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        prodi: true,
        orangTua: true,
      },
    });
    if (!mahasiswa) throw new ForbiddenException('Akun Anda tidak terhubung dengan data mahasiswa');
    return mahasiswa;
  }

  // Helper: Get semester saat ini
  private async getSemesterSaatIni(angkatan: string | null | undefined): Promise<number> {
    if (!angkatan) return 1;
    const activeTahun = await this.prisma.tahunAkademik.findFirst({ where: { isAktif: true } });
    if (!activeTahun) return 1;

    const currentYear = parseInt(activeTahun.tahun?.split('/')[0] || '0');
    const angkatanYear = parseInt(angkatan);
    if (!isNaN(currentYear) && !isNaN(angkatanYear)) {
      const diffYear = currentYear - angkatanYear;
      let semesterSaatIni = activeTahun.semester === 'GENAP'
        ? (diffYear * 2) + 2
        : (diffYear * 2) + 1;
      return semesterSaatIni < 1 ? 1 : semesterSaatIni;
    }
    return 1;
  }

  // ==========================================
  // PROFIL & KTM
  // ==========================================
  async getProfil(userId: string) {
    const mahasiswa = await this.prisma.mahasiswa.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, email: true, createdAt: true } },
        prodi: true,
        orangTua: true,
      },
    });
    if (!mahasiswa) throw new ForbiddenException('Akun Anda tidak terhubung dengan data mahasiswa');
    const semesterSaatIni = await this.getSemesterSaatIni(mahasiswa.angkatan);
    return { ...mahasiswa, semesterSaatIni };
  }

  async updateProfil(userId: string, dto: any) {
    const mahasiswa = await this.getMahasiswa(userId);
    
    // Update user (email) if provided
    if (dto.email) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { email: dto.email }
      });
    }

    // Prepare mahasiswa update data
    const mhsData: any = {};
    if (dto.tempatLahir !== undefined) mhsData.tempatLahir = dto.tempatLahir;
    if (dto.tanggalLahir !== undefined) mhsData.tanggalLahir = dto.tanggalLahir ? new Date(dto.tanggalLahir) : null;
    if (dto.jenisKelamin !== undefined) mhsData.jenisKelamin = dto.jenisKelamin;
    if (dto.agama !== undefined) mhsData.agama = dto.agama;
    if (dto.alamat !== undefined) mhsData.alamat = dto.alamat;
    if (dto.telepon !== undefined) mhsData.hp = dto.telepon; // dto sends 'telepon' mapped to 'hp'

    // Process Orang Tua update
    if (dto.orangTua) {
      const otData = dto.orangTua;
      if (mahasiswa.orangTuaId) {
        // Update existing
        // Check what fields are actually on OrangTua model based on db pull result.
        // It has namaLengkap, hubungan, pekerjaan, penghasilan, alamat, hp, email.
        // It does NOT have namaAyah, pekerjaanAyah, etc.
        // We will store parents' names in namaLengkap, separated by " & ", or just update what we can.
        await this.prisma.orangTua.update({
          where: { id: mahasiswa.orangTuaId },
          data: {
            namaLengkap: otData.namaAyah || otData.namaIbu || 'Orang Tua / Wali',
            pekerjaan: otData.pekerjaanAyah || otData.pekerjaanIbu || null,
            alamat: otData.alamat,
            hp: otData.telepon
          }
        });
      } else {
        // Create new
        const newOt = await this.prisma.orangTua.create({
          data: {
            namaLengkap: otData.namaAyah || otData.namaIbu || 'Orang Tua / Wali',
            hubungan: 'ORANG_TUA',
            pekerjaan: otData.pekerjaanAyah || otData.pekerjaanIbu || null,
            alamat: otData.alamat,
            hp: otData.telepon
          }
        });
        mhsData.orangTuaId = newOt.id;
      }
    }

    if (Object.keys(mhsData).length > 0) {
      await this.prisma.mahasiswa.update({
        where: { id: mahasiswa.id },
        data: mhsData
      });
    }

    return { message: 'Profil berhasil diperbarui' };
  }

  // ==========================================
  // KTM (Kartu Tanda Mahasiswa)
  // ==========================================
  async getKtm(userId: string) {
    const mahasiswa = await this.getMahasiswa(userId);

    // Format tanggal lahir
    const tanggalLahir = mahasiswa.tanggalLahir
      ? new Date(mahasiswa.tanggalLahir).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      : '-';

    return {
      nim: mahasiswa.nim,
      nama: mahasiswa.user.name,
      prodi: mahasiswa.prodi?.nama || '-',
      fakultas: mahasiswa.prodi?.fakultas || '-',
      jenisKelamin: mahasiswa.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
      tempatTanggalLahir: `${mahasiswa.tempatLahir || '-'}, ${tanggalLahir}`,
      status: mahasiswa.status
    };
  }

  // ==========================================
  // DASHBOARD STATS
  // ==========================================
  async getDashboard(userId: string) {
    const mahasiswa = await this.getMahasiswa(userId);
    const semesterSaatIni = await this.getSemesterSaatIni(mahasiswa.angkatan);

    // Get all KRS with grades to calculate IPK
    const allKrs = await this.prisma.krs.findMany({
      where: { mahasiswaId: mahasiswa.id, grade: { not: null } },
      include: { jadwal: { include: { mataKuliah: true } } },
    });

    // Calculate IPK
    const gradeToBobot: Record<string, number> = {
      'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'D': 1.0, 'E': 0.0,
    };

    let totalBobot = 0;
    let totalSksNilai = 0;
    let totalSksDitempuh = 0;

    allKrs.forEach((k) => {
      const sks = k.jadwal?.mataKuliah?.sks || 0;
      const bobot = gradeToBobot[k.grade || ''] ?? 0;
      totalBobot += bobot * sks;
      totalSksNilai += sks;
    });

    // Total SKS from all KRS (including those without grades)
    const allKrsTotal = await this.prisma.krs.findMany({
      where: { mahasiswaId: mahasiswa.id },
      include: { jadwal: { include: { mataKuliah: true } } },
    });
    allKrsTotal.forEach((k) => {
      totalSksDitempuh += k.jadwal?.mataKuliah?.sks || 0;
    });

    const ipk = totalSksNilai > 0 ? Math.round((totalBobot / totalSksNilai) * 100) / 100 : 0;

    // Hitung IPS tiap semester untuk IPS History
    const krsBySemester: Record<string, { totalSks: number, totalBobot: number }> = {};
    const allKrsWithSem = await this.prisma.krs.findMany({
      where: { mahasiswaId: mahasiswa.id, grade: { not: null } },
      include: {
        jadwal: { include: { mataKuliah: true } },
        tahunAkademik: true
      },
      orderBy: { tahunAkademik: { kode: 'asc' } },
    });
    
    allKrsWithSem.forEach((k) => {
      const semKode = k.tahunAkademik?.kode || '';
      if (!semKode) return;
      if (!krsBySemester[semKode]) {
        krsBySemester[semKode] = { totalSks: 0, totalBobot: 0 };
      }
      const sks = k.jadwal?.mataKuliah?.sks || 0;
      const bobot = gradeToBobot[k.grade || ''] ?? 0;
      krsBySemester[semKode].totalSks += sks;
      krsBySemester[semKode].totalBobot += bobot * sks;
    });

    const ipsHistory = Object.keys(krsBySemester).sort().map(semKode => {
      const semData = krsBySemester[semKode];
      return {
        semester: semKode,
        ips: semData.totalSks > 0 ? Math.round((semData.totalBobot / semData.totalSks) * 100) / 100 : 0
      };
    });
    // Format them sequentially for the chart: "Smt. 1", "Smt. 2", etc.
    const formattedIpsHistory = ipsHistory.map((item, index) => ({
      semester: `Smt. ${index + 1}`,
      ips: item.ips
    }));

    // Tagihan belum lunas
    const tagihanBelumLunas = await this.prisma.tagihan.aggregate({
      where: { mahasiswaId: mahasiswa.id, status: 'BELUM_LUNAS' },
      _sum: { jumlah: true },
      _count: true,
    });

    // Jadwal hari ini based on active KRS
    const hariNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const hariIni = hariNames[new Date().getDay()];

    const jadwalHariIni = await this.prisma.krs.findMany({
      where: {
        mahasiswaId: mahasiswa.id,
        jadwal: { hari: hariIni },
      },
      include: {
        jadwal: {
          include: {
            mataKuliah: true,
            dosen: { include: { user: { select: { name: true } } } },
            ruanganObj: true,
          },
        },
      },
      orderBy: { jadwal: { waktuMulai: 'asc' } },
    });

    // Semester aktif
    const activeTahun = await this.prisma.tahunAkademik.findFirst({
      where: { isAktif: true },
    });

    // Pengumuman terbaru
    const pengumuman = await this.prisma.pengumuman.findMany({
      where: {
        aktif: true,
        OR: [{ targetRole: 'MAHASISWA' }, { targetRole: 'SEMUA' }, { targetRole: null }],
      },
      orderBy: { tanggalDibuat: 'desc' },
      take: 5,
    });

    // IPS Semester ini (terakhir/terbaru)
    const sortedSemesters = Object.keys(krsBySemester).sort();
    const latestSemKode = sortedSemesters[sortedSemesters.length - 1];
    const ipsSekarang = latestSemKode
      ? (krsBySemester[latestSemKode].totalSks > 0
          ? Math.round((krsBySemester[latestSemKode].totalBobot / krsBySemester[latestSemKode].totalSks) * 100) / 100
          : 0)
      : 0;

    return {
      mahasiswa: { 
        id: mahasiswa.id, 
        nim: mahasiswa.nim, 
        nama: mahasiswa.user.name,
        email: mahasiswa.user.email,
        username: mahasiswa.nim,
        status: mahasiswa.status, 
        prodi: mahasiswa.prodi?.nama,
        fakultas: mahasiswa.prodi?.fakultas,
        angkatan: mahasiswa.angkatan,
        alamat: mahasiswa.alamat,
        hp: mahasiswa.hp,
        jenisKelamin: mahasiswa.jenisKelamin,
        semesterSaatIni,
      },
      ipk,
      ipsSekarang,
      ipsHistory: formattedIpsHistory,
      totalSksDitempuh,
      totalSksNilai,
      tagihanBelumLunas: tagihanBelumLunas._sum?.jumlah || 0,
      jumlahTagihan: tagihanBelumLunas._count || 0,
      jadwalHariIni: jadwalHariIni.map((k) => ({
        id: k.jadwal.id,
        mataKuliah: k.jadwal.mataKuliah?.nama,
        kodeMk: k.jadwal.mataKuliah?.kode,
        sks: k.jadwal.mataKuliah?.sks,
        dosen: k.jadwal.dosen?.user?.name,
        ruangan: k.jadwal.ruanganObj?.nama,
        waktuMulai: k.jadwal.waktuMulai,
        waktuSelesai: k.jadwal.waktuSelesai,
      })),
      semesterAktif: activeTahun?.nama || '-',
      pengumuman,
    };
  }

  // ==========================================
  // KRS
  // ==========================================
  async getKrs(userId: string, semester?: string) {
    const mahasiswa = await this.getMahasiswa(userId);
    const where: any = { mahasiswaId: mahasiswa.id };
    if (semester) where.tahunAkademikId = semester;

    const data = await this.prisma.krs.findMany({
      where,
      include: {
        jadwal: {
          include: {
            mataKuliah: true,
            dosen: { include: { user: { select: { name: true } } } },
            ruanganObj: true,
          },
        },
        tahunAkademik: true,
      },
      orderBy: { tahunAkademik: { kode: 'desc' } },
    });

    // Group by semester
    const grouped: Record<string, any[]> = {};
    data.forEach((k: any) => {
      const semName = k.tahunAkademik?.nama || k.tahunAkademikId;
      if (!grouped[semName]) grouped[semName] = [];
      grouped[semName].push(k);
    });

    return { data, grouped, mahasiswaId: mahasiswa.id };
  }

  async ajukanKrs(userId: string, dto: { jadwalId: string; semester: string }) {
    const mahasiswa = await this.getMahasiswa(userId);

    // Check duplicate
    const exists = await this.prisma.krs.findFirst({
      where: { mahasiswaId: mahasiswa.id, jadwalId: dto.jadwalId, tahunAkademikId: dto.semester },
    });
    if (exists) throw new BadRequestException('Mata kuliah ini sudah ada di KRS semester ini');

    return this.prisma.krs.create({
      data: { mahasiswaId: mahasiswa.id, jadwalId: dto.jadwalId, tahunAkademikId: dto.semester },
      include: {
        jadwal: {
          include: {
            mataKuliah: true,
            dosen: { include: { user: { select: { name: true } } } },
          },
        },
      },
    });
  }

  async hapusKrs(userId: string, krsId: string) {
    const mahasiswa = await this.getMahasiswa(userId);
    const krs = await this.prisma.krs.findUnique({ where: { id: krsId } });
    if (!krs) throw new NotFoundException('KRS tidak ditemukan');
    if (krs.mahasiswaId !== mahasiswa.id) throw new ForbiddenException('Anda tidak memiliki akses ke KRS ini');
    if (krs.nilaiAkhir !== null) throw new BadRequestException('KRS yang sudah memiliki nilai tidak dapat dihapus');

    await this.prisma.krs.delete({ where: { id: krsId } });
    return { message: 'KRS berhasil dihapus' };
  }

  // ==========================================
  // KHS (Kartu Hasil Studi)
  // ==========================================
  async getKhs(userId: string, semester?: string) {
    const mahasiswa = await this.getMahasiswa(userId);
    const where: any = { mahasiswaId: mahasiswa.id, grade: { not: null } };
    if (semester) where.tahunAkademikId = semester;

    const data = await this.prisma.krs.findMany({
      where,
      include: {
        jadwal: {
          include: {
            mataKuliah: true,
            dosen: { include: { user: { select: { name: true } } } },
          },
        },
        tahunAkademik: true,
      },
      orderBy: [{ tahunAkademik: { kode: 'desc' } }, { jadwal: { mataKuliah: { nama: 'asc' } } }],
    });

    const gradeToBobot: Record<string, number> = {
      'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'D': 1.0, 'E': 0.0,
    };

    // Group by semester and calculate IPS per semester
    const grouped: Record<string, { items: any[]; ips: number; totalSks: number }> = {};
    data.forEach((k: any) => {
      const semName = k.tahunAkademik?.nama || k.tahunAkademikId;
      if (!grouped[semName]) grouped[semName] = { items: [], ips: 0, totalSks: 0 };
      grouped[semName].items.push({
        ...k,
        bobot: gradeToBobot[k.grade || ''] ?? 0,
      });
    });

    // Calculate IPS per semester
    Object.keys(grouped).forEach((sem) => {
      let totalBobot = 0;
      let totalSks = 0;
      grouped[sem].items.forEach((item: any) => {
        const sks = item.jadwal?.mataKuliah?.sks || 0;
        totalBobot += item.bobot * sks;
        totalSks += sks;
      });
      grouped[sem].ips = totalSks > 0 ? Math.round((totalBobot / totalSks) * 100) / 100 : 0;
      grouped[sem].totalSks = totalSks;
    });

    // Calculate IPK kumulatif (hanya menghitung nilai terbaik untuk tiap mata kuliah)
    const bestGrades = new Map<string, { sks: number; bobot: number }>();
    data.forEach((k) => {
      const mkId = k.jadwal?.mataKuliahId;
      if (!mkId) return;
      const sks = k.jadwal?.mataKuliah?.sks || 0;
      const bobot = gradeToBobot[k.grade || ''] ?? 0;
      const currentBest = bestGrades.get(mkId);
      if (!currentBest || bobot > currentBest.bobot) {
        bestGrades.set(mkId, { sks, bobot });
      }
    });

    let totalBobotAll = 0;
    let totalSksAll = 0;
    for (const stats of bestGrades.values()) {
      totalBobotAll += stats.bobot * stats.sks;
      totalSksAll += stats.sks;
    }
    const ipk = totalSksAll > 0 ? Math.round((totalBobotAll / totalSksAll) * 100) / 100 : 0;

    // Mask grades if EDOM is not submitted
    const submittedEdoms = await this.prisma.kuesionerEdom.findMany({
      where: { mahasiswaId: mahasiswa.id },
      select: { dosenId: true, mataKuliahId: true },
    });
    const submittedSet = new Set(submittedEdoms.map(e => `${e.dosenId}_${e.mataKuliahId}`));

    const maskGrades = (item: any) => {
      const dosenId = item.jadwal?.dosenId;
      const mkId = item.jadwal?.mataKuliahId;
      if (dosenId && mkId && item.nilaiAkhir !== null && !submittedSet.has(`${dosenId}_${mkId}`)) {
        item.isEdomLocked = true;
        item.grade = null;
        item.nilaiAkhir = null;
        item.nilaiAbsensi = null;
        item.nilaiTugas = null;
        item.nilaiUts = null;
        item.nilaiUas = null;
        if (item.bobot !== undefined) item.bobot = 0;
      }
    };

    data.forEach(maskGrades);
    Object.keys(grouped).forEach(sem => {
      grouped[sem].items.forEach(maskGrades);
    });

    return {
      data,
      grouped,
      ipk,
      totalSks: totalSksAll,
      mahasiswa: { nim: mahasiswa.nim, nama: mahasiswa.user.name, prodi: mahasiswa.prodi?.nama },
    };
  }

  // ==========================================
  // TRANSKRIP NILAI
  // ==========================================
  async getTranskrip(userId: string) {
    const mahasiswa = await this.getMahasiswa(userId);
    const data = await this.prisma.krs.findMany({
      where: { mahasiswaId: mahasiswa.id, grade: { not: null } },
      include: {
        jadwal: {
          include: {
            mataKuliah: true,
            dosen: { include: { user: { select: { name: true } } } },
          },
        },
        tahunAkademik: true,
      },
      orderBy: { tahunAkademik: { kode: 'asc' } },
    });

    const gradeToBobot: Record<string, number> = {
      'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'D': 1.0, 'E': 0.0,
    };

    // Filter to best grades only
    const bestKrsMap = new Map<string, any>();
    data.forEach((k: any) => {
      const mkId = k.jadwal?.mataKuliahId;
      if (!mkId) return;
      const bobot = gradeToBobot[k.grade || ''] ?? 0;
      const currentBest = bestKrsMap.get(mkId);
      const currentBestBobot = currentBest ? (gradeToBobot[currentBest.grade || ''] ?? 0) : -1;
      
      if (bobot > currentBestBobot) {
        k.bobot = bobot;
        bestKrsMap.set(mkId, k);
      }
    });

    const bestItems = Array.from(bestKrsMap.values());
    
    // Sort by semester name then MK name
    bestItems.sort((a, b) => {
      const semA = a.tahunAkademik?.nama || '';
      const semB = b.tahunAkademik?.nama || '';
      if (semA !== semB) return semA.localeCompare(semB);
      const mkA = a.jadwal?.mataKuliah?.nama || '';
      const mkB = b.jadwal?.mataKuliah?.nama || '';
      return mkA.localeCompare(mkB);
    });

    let totalBobotAll = 0;
    let totalSksAll = 0;
    bestItems.forEach(item => {
      const sks = item.jadwal?.mataKuliah?.sks || 0;
      totalBobotAll += item.bobot * sks;
      totalSksAll += sks;
    });

    const ipk = totalSksAll > 0 ? Math.round((totalBobotAll / totalSksAll) * 100) / 100 : 0;

    // Mask grades if EDOM is not submitted
    const submittedEdoms = await this.prisma.kuesionerEdom.findMany({
      where: { mahasiswaId: mahasiswa.id },
      select: { dosenId: true, mataKuliahId: true },
    });
    const submittedSet = new Set(submittedEdoms.map(e => `${e.dosenId}_${e.mataKuliahId}`));

    bestItems.forEach((item: any) => {
      const dosenId = item.jadwal?.dosenId;
      const mkId = item.jadwal?.mataKuliahId;
      if (dosenId && mkId && item.nilaiAkhir !== null && !submittedSet.has(`${dosenId}_${mkId}`)) {
        item.isEdomLocked = true;
        item.grade = null;
        item.nilaiAkhir = null;
        item.nilaiAbsensi = null;
        item.nilaiTugas = null;
        item.nilaiUts = null;
        item.nilaiUas = null;
        if (item.bobot !== undefined) item.bobot = 0;
      }
    });

    return {
      data: bestItems,
      ipk,
      totalSks: totalSksAll,
      mahasiswa: { nim: mahasiswa.nim, nama: mahasiswa.user.name, prodi: mahasiswa.prodi?.nama },
    };
  }

  // ==========================================
  // KRS REMIDIAL (Grade D/E)
  // ==========================================
  async getKrsRemidial(userId: string) {
    const mahasiswa = await this.getMahasiswa(userId);
    
    const allKrs = await this.prisma.krs.findMany({
      where: { mahasiswaId: mahasiswa.id },
      include: {
        jadwal: {
          include: {
            mataKuliah: true,
            dosen: { include: { user: { select: { name: true } } } },
          },
        },
        tahunAkademik: true,
      },
      orderBy: { tahunAkademik: { kode: 'desc' } },
    });

    // Group by mataKuliahId
    const byMk = new Map<string, any[]>();
    allKrs.forEach((k) => {
      const mkId = k.jadwal?.mataKuliahId;
      if (!mkId) return;
      if (!byMk.has(mkId)) byMk.set(mkId, []);
      byMk.get(mkId)!.push(k);
    });

    const remidialData: any[] = [];
    
    // Check which MKs need remedial
    for (const [mkId, krsList] of byMk.entries()) {
      // Check if they have ever passed it or are currently taking it
      const hasPassedOrCurrent = krsList.some((k) => 
        (k.grade && !['D', 'E'].includes(k.grade)) || // Passed
        (k.grade === null) // Currently taking
      );

      if (!hasPassedOrCurrent) {
        // Find the latest failed attempt to show
        const latestFailed = krsList.find((k) => ['D', 'E'].includes(k.grade || ''));
        if (latestFailed) {
          remidialData.push(latestFailed);
        }
      }
    }

    return { data: remidialData };
  }

  // ==========================================
  // JADWAL KULIAH
  // ==========================================
  async getJadwal(userId: string, semester?: string) {
    const mahasiswa = await this.getMahasiswa(userId);

    // Get latest semester if not specified
    if (!semester) {
      const activeTahun = await this.prisma.tahunAkademik.findFirst({
        where: { isAktif: true },
      });
      semester = activeTahun?.id;
    }

    if (!semester) return { data: [], semester: '-' };

    const data = await this.prisma.krs.findMany({
      where: { mahasiswaId: mahasiswa.id, tahunAkademikId: semester },
      include: {
        jadwal: {
          include: {
            mataKuliah: true,
            dosen: { include: { user: { select: { name: true } } } },
            ruanganObj: true,
          },
        },
      },
    });

    // Group by day
    const hariOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const byHari: Record<string, any[]> = {};
    hariOrder.forEach((h) => (byHari[h] = []));

    data.forEach((k) => {
      const hari = k.jadwal?.hari;
      if (hari && byHari[hari]) {
        byHari[hari].push({
          id: k.jadwal.id,
          mataKuliah: k.jadwal.mataKuliah?.nama,
          kodeMk: k.jadwal.mataKuliah?.kode,
          sks: k.jadwal.mataKuliah?.sks,
          dosen: k.jadwal.dosen?.user?.name,
          ruangan: k.jadwal.ruanganObj?.nama,
          waktuMulai: k.jadwal.waktuMulai,
          waktuSelesai: k.jadwal.waktuSelesai,
        });
      }
    });

    // Sort by time within each day
    Object.keys(byHari).forEach((h) => {
      byHari[h].sort((a: any, b: any) => a.waktuMulai.localeCompare(b.waktuMulai));
    });

    return { data: byHari, semester };
  }

  // ==========================================
  // TAGIHAN
  // ==========================================
  async getTagihan(userId: string) {
    const mahasiswa = await this.getMahasiswa(userId);
    const data = await this.prisma.tagihan.findMany({
      where: { mahasiswaId: mahasiswa.id },
      include: { pembayaran: true },
      orderBy: { jatuhTempo: 'asc' },
    });

    const totalBelumLunas = data.filter((t) => t.status === 'BELUM_LUNAS').reduce((sum, t) => sum + t.jumlah, 0);
    const totalLunas = data.filter((t) => t.status === 'LUNAS').reduce((sum, t) => sum + t.jumlah, 0);

    return { data, totalBelumLunas, totalLunas };
  }

  // ==========================================
  // PEMBAYARAN
  // ==========================================
  async getPembayaran(userId: string) {
    const mahasiswa = await this.getMahasiswa(userId);
    const data = await this.prisma.pembayaran.findMany({
      where: { tagihan: { mahasiswaId: mahasiswa.id } },
      include: { tagihan: true },
      orderBy: { tanggalBayar: 'desc' },
    });
    return { data };
  }

  // ==========================================
  // CUTI
  // ==========================================
  async getCuti(userId: string) {
    const mahasiswa = await this.getMahasiswa(userId);
    const data = await this.prisma.cuti.findMany({
      where: { mahasiswaId: mahasiswa.id },
      orderBy: { tanggalPengajuan: 'desc' },
    });
    return { data };
  }

  async ajukanCuti(userId: string, dto: { semester: string; alasan: string; dokumenPendukung?: string }) {
    const mahasiswa = await this.getMahasiswa(userId);

    // Check if already have a pending cuti for same semester
    const exists = await this.prisma.cuti.findFirst({
      where: { mahasiswaId: mahasiswa.id, tahunAkademikId: dto.semester, status: 'MENUNGGU' },
    });
    if (exists) throw new BadRequestException('Anda sudah memiliki pengajuan cuti yang menunggu untuk semester ini');

    return this.prisma.cuti.create({
      data: {
        mahasiswaId: mahasiswa.id,
        tahunAkademikId: dto.semester,
        alasan: dto.alasan,
        dokumenPendukung: dto.dokumenPendukung,
      },
    });
  }

  // ==========================================
  // SKRIPSI / TUGAS AKHIR
  // ==========================================
  async cekSyaratSkripsi(userId: string) {
    const mahasiswa = await this.getMahasiswa(userId);

    const gradeToBobot: Record<string, number> = {
      'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'D': 1.0, 'E': 0.0,
    };

    const allKrs = await this.prisma.krs.findMany({
      where: { mahasiswaId: mahasiswa.id, grade: { not: null } },
      include: { jadwal: { include: { mataKuliah: true } } },
    });

    let totalSks = 0;
    let totalBobot = 0;
    let hasNilaiE = false;

    allKrs.forEach((k) => {
      const sks = k.jadwal?.mataKuliah?.sks || 0;
      const bobot = gradeToBobot[k.grade || ''] ?? 0;
      totalSks += sks;
      totalBobot += bobot * sks;
      if (k.grade === 'E') hasNilaiE = true;
    });

    const ipk = totalSks > 0 ? Math.round((totalBobot / totalSks) * 100) / 100 : 0;
    const tagihanBelumLunas = await this.prisma.tagihan.count({
      where: { mahasiswaId: mahasiswa.id, status: 'BELUM_LUNAS' },
    });

    const MIN_SKS = 110;
    const MIN_IPK = 2.0;

    const syarat = [
      { label: 'Minimal 110 SKS lulus', terpenuhi: totalSks >= MIN_SKS, nilai: `${totalSks} SKS` },
      { label: 'IPK minimal 2.00', terpenuhi: ipk >= MIN_IPK, nilai: ipk.toFixed(2) },
      { label: 'Tidak ada nilai E', terpenuhi: !hasNilaiE, nilai: hasNilaiE ? 'Ada nilai E' : 'Tidak ada nilai E' },
      { label: 'Tagihan UKT lunas', terpenuhi: tagihanBelumLunas === 0, nilai: tagihanBelumLunas === 0 ? 'Lunas' : `${tagihanBelumLunas} tagihan belum lunas` },
    ];

    const eligible = syarat.every((s) => s.terpenuhi);
    return { eligible, syarat, totalSks, ipk, hasNilaiE, tagihanBelumLunas };
  }

  async getSkripsi(userId: string) {
    const mahasiswa = await this.getMahasiswa(userId);
    const data = await this.prisma.skripsi.findMany({
      where: { mahasiswaId: mahasiswa.id },
      include: {
        pembimbing1: { include: { user: { select: { name: true } } } },
        pembimbing2: { include: { user: { select: { name: true } } } },
        logbooks: { select: { id: true, status: true, tanggal: true } },
        ujian: { select: { id: true, tipe: true, status: true, tanggal: true, nilaiAkhir: true } },
        dokumenFinal: true,
      },
      orderBy: { tanggalPengajuan: 'desc' },
    });
    return { data };
  }

  async getSkripsiDetail(userId: string) {
    const mahasiswa = await this.getMahasiswa(userId);
    const skripsi = await this.prisma.skripsi.findFirst({
      where: { mahasiswaId: mahasiswa.id, status: { not: 'DITOLAK' } },
      include: {
        pembimbing1: { include: { user: { select: { name: true } } } },
        pembimbing2: { include: { user: { select: { name: true } } } },
        logbooks: {
          include: { dosen: { include: { user: { select: { name: true } } } } },
          orderBy: { tanggal: 'desc' },
        },
        ujian: {
          include: {
            penguji1: { include: { user: { select: { name: true } } } },
            penguji2: { include: { user: { select: { name: true } } } },
          },
          orderBy: { createdAt: 'asc' },
        },
        dokumenFinal: true,
      },
    });

    const logbookValidCount = skripsi
      ? await this.prisma.skripsiLogbook.count({
          where: { skripsiId: skripsi.id, status: 'DIVALIDASI' },
        })
      : 0;

    return { data: skripsi, logbookValidCount };
  }

  async ajukanSkripsi(userId: string, dto: { judul: string; abstrak?: string; proposalFileUrl?: string }) {
    const mahasiswa = await this.getMahasiswa(userId);

    // Check if already have an active skripsi
    const activeSkripsi = await this.prisma.skripsi.findFirst({
      where: { mahasiswaId: mahasiswa.id, status: { notIn: ['SELESAI', 'DITOLAK'] } },
    });
    if (activeSkripsi) throw new BadRequestException('Anda sudah memiliki skripsi yang sedang berjalan');

    // Validate prerequisites
    const syarat = await this.cekSyaratSkripsi(userId);
    if (!syarat.eligible) {
      const gagal = syarat.syarat.filter((s) => !s.terpenuhi).map((s) => s.label);
      throw new BadRequestException(`Syarat belum terpenuhi: ${gagal.join(', ')}`);
    }

    return this.prisma.skripsi.create({
      data: {
        mahasiswaId: mahasiswa.id,
        judul: dto.judul,
        abstrak: dto.abstrak,
        proposalFileUrl: dto.proposalFileUrl,
        status: 'PENGAJUAN',
      },
    });
  }

  async ajukanLogbook(
    userId: string,
    dto: { skripsiId: string; catatanMahasiswa: string; tanggal?: string },
  ) {
    const mahasiswa = await this.getMahasiswa(userId);

    // Verify skripsi ownership
    const skripsi = await this.prisma.skripsi.findFirst({
      where: { id: dto.skripsiId, mahasiswaId: mahasiswa.id },
    });
    if (!skripsi) throw new BadRequestException('Skripsi tidak ditemukan atau bukan milik Anda');
    if (!['BIMBINGAN', 'SEMINAR_PROPOSAL', 'SIDANG_AKHIR', 'REVISI'].includes(skripsi.status)) {
      throw new BadRequestException('Logbook hanya bisa diisi saat proses bimbingan aktif');
    }

    return this.prisma.skripsiLogbook.create({
      data: {
        skripsiId: dto.skripsiId,
        mahasiswaId: mahasiswa.id,
        catatanMahasiswa: dto.catatanMahasiswa,
        tanggal: dto.tanggal ? new Date(dto.tanggal) : new Date(),
        status: 'MENUNGGU',
      },
    });
  }

  async getLogbooks(userId: string, skripsiId: string) {
    const mahasiswa = await this.getMahasiswa(userId);
    const skripsi = await this.prisma.skripsi.findFirst({
      where: { id: skripsiId, mahasiswaId: mahasiswa.id },
    });
    if (!skripsi) throw new BadRequestException('Skripsi tidak ditemukan');

    const data = await this.prisma.skripsiLogbook.findMany({
      where: { skripsiId },
      include: { dosen: { include: { user: { select: { name: true } } } } },
      orderBy: { tanggal: 'desc' },
    });
    const totalValid = data.filter((l) => l.status === 'DIVALIDASI').length;
    return { data, totalValid };
  }

  async daftarUjian(
    userId: string,
    dto: { skripsiId: string; tipe: 'SEMINAR_PROPOSAL' | 'SIDANG_AKHIR'; draftFileUrl?: string },
  ) {
    const mahasiswa = await this.getMahasiswa(userId);
    const skripsi = await this.prisma.skripsi.findFirst({
      where: { id: dto.skripsiId, mahasiswaId: mahasiswa.id },
    });
    if (!skripsi) throw new BadRequestException('Skripsi tidak ditemukan');

    // Validate bimbingan count
    const validBimbingan = await this.prisma.skripsiLogbook.count({
      where: { skripsiId: dto.skripsiId, status: 'DIVALIDASI' },
    });
    if (validBimbingan < 8) {
      throw new BadRequestException(
        `Minimal 8 bimbingan yang divalidasi diperlukan. Saat ini: ${validBimbingan}`,
      );
    }

    // Check status prerequisites
    if (dto.tipe === 'SEMINAR_PROPOSAL' && skripsi.status !== 'BIMBINGAN') {
      throw new BadRequestException('Pendaftaran Seminar Proposal hanya bisa dilakukan saat status BIMBINGAN');
    }
    if (dto.tipe === 'SIDANG_AKHIR' && !['SEMINAR_PROPOSAL', 'BIMBINGAN'].includes(skripsi.status)) {
      throw new BadRequestException('Pendaftaran Sidang Akhir memerlukan Seminar Proposal selesai terlebih dahulu');
    }

    // Create pending ujian registration
    const ujian = await this.prisma.skripsiUjian.create({
      data: {
        skripsiId: dto.skripsiId,
        tipe: dto.tipe,
        draftFileUrl: dto.draftFileUrl,
        status: 'MENUNGGU',
      },
    });

    return { ujian, message: 'Pendaftaran ujian berhasil. Menunggu penjadwalan dari admin.' };
  }

  async uploadFinalSkripsi(userId: string, dto: { skripsiId: string; fileUrl: string }) {
    const mahasiswa = await this.getMahasiswa(userId);
    const skripsi = await this.prisma.skripsi.findFirst({
      where: { id: dto.skripsiId, mahasiswaId: mahasiswa.id },
    });
    if (!skripsi) throw new BadRequestException('Skripsi tidak ditemukan');
    if (skripsi.status !== 'REVISI') {
      throw new BadRequestException('Upload dokumen final hanya bisa dilakukan setelah revisi sidang disetujui');
    }

    // Upsert dokumen final
    const dokumen = await this.prisma.skripsiDokumenFinal.upsert({
      where: { skripsiId: dto.skripsiId },
      update: { fileUrl: dto.fileUrl, statusValidasi: 'MENUNGGU', tanggalUpload: new Date() },
      create: { skripsiId: dto.skripsiId, fileUrl: dto.fileUrl },
    });

    // Update skripsi status ke BEBAS_PUSTAKA
    await this.prisma.skripsi.update({
      where: { id: dto.skripsiId },
      data: { status: 'BEBAS_PUSTAKA' },
    });

    return { dokumen, message: 'Dokumen final berhasil diunggah. Menunggu validasi perpustakaan.' };
  }

  // ==========================================
  // JADWAL TERSEDIA (for KRS submission)
  // ==========================================
  async getJadwalTersedia(userId: string, semester?: string) {
    const mahasiswa = await this.getMahasiswa(userId);
    const semesterSaatIni = await this.getSemesterSaatIni(mahasiswa.angkatan);

    // Get all jadwal for the student's prodi
    const jadwalAll = await this.prisma.jadwalKuliah.findMany({
      where: {
        ...(semester ? { tahunAkademikId: semester } : {}),
        mataKuliah: {
          kurikulum: {
            some: {
              semesterTujuan: semesterSaatIni,
              kurikulum: {
                prodiId: mahasiswa.prodiId,
                statusAktif: true
              }
            }
          }
        }
      },
      include: {
        mataKuliah: true,
        dosen: { include: { user: { select: { name: true } } } },
        ruanganObj: true,
      },
      orderBy: { mataKuliah: { nama: 'asc' } },
    });

    // Get already-taken jadwal for this semester
    let existingIds: string[] = [];
    if (semester) {
      const existing = await this.prisma.krs.findMany({
        where: { mahasiswaId: mahasiswa.id, tahunAkademikId: semester },
        select: { jadwalId: true },
      });
      existingIds = existing.map((e) => e.jadwalId);
    }

    return {
      data: jadwalAll.map((j) => ({
        ...j,
        sudahDiambil: existingIds.includes(j.id),
      })),
    };
  }

  // ==========================================
  // CETAK DATA (for print pages)
  // ==========================================
  async getCetakKrs(userId: string, semester: string) {
    const mahasiswa = await this.getMahasiswa(userId);
    const data = await this.prisma.krs.findMany({
      where: { mahasiswaId: mahasiswa.id, tahunAkademikId: semester },
      include: {
        jadwal: {
          include: {
            mataKuliah: true,
            dosen: { include: { user: { select: { name: true } } } },
            ruanganObj: true,
          },
        },
      },
      orderBy: { jadwal: { mataKuliah: { nama: 'asc' } } },
    });

    return {
      mahasiswa: { nim: mahasiswa.nim, nama: mahasiswa.user.name, prodi: mahasiswa.prodi?.nama, fakultas: mahasiswa.prodi?.fakultas },
      semester,
      data,
      totalSks: data.reduce((sum, k) => sum + (k.jadwal?.mataKuliah?.sks || 0), 0),
    };
  }

  async getCetakKartuUjian(userId: string, semester: string, jenis: 'UTS' | 'UAS') {
    const mahasiswa = await this.getMahasiswa(userId);

    // Check tagihan status - all must be LUNAS for exam card
    const tagihanBelumLunas = await this.prisma.tagihan.count({
      where: { mahasiswaId: mahasiswa.id, status: 'BELUM_LUNAS' },
    });

    const data = await this.prisma.krs.findMany({
      where: { mahasiswaId: mahasiswa.id, tahunAkademikId: semester },
      include: {
        jadwal: {
          include: {
            mataKuliah: true,
            dosen: { include: { user: { select: { name: true } } } },
            ruanganObj: true,
          },
        },
      },
      orderBy: { jadwal: { mataKuliah: { nama: 'asc' } } },
    });

    return {
      mahasiswa: { nim: mahasiswa.nim, nama: mahasiswa.user.name, prodi: mahasiswa.prodi?.nama, fakultas: mahasiswa.prodi?.fakultas },
      semester,
      jenis,
      data,
      tagihanLunas: tagihanBelumLunas === 0,
      totalSks: data.reduce((sum, k) => sum + (k.jadwal?.mataKuliah?.sks || 0), 0),
    };
  }

  async getCetakKeuangan(userId: string) {
    const mahasiswa = await this.getMahasiswa(userId);
    const tagihan = await this.prisma.tagihan.findMany({
      where: { mahasiswaId: mahasiswa.id },
      include: { pembayaran: true },
      orderBy: { jatuhTempo: 'asc' },
    });

    const pembayaran = await this.prisma.pembayaran.findMany({
      where: { tagihan: { mahasiswaId: mahasiswa.id } },
      include: { tagihan: true },
      orderBy: { tanggalBayar: 'desc' },
    });

    return {
      mahasiswa: { nim: mahasiswa.nim, nama: mahasiswa.user.name, prodi: mahasiswa.prodi?.nama, fakultas: mahasiswa.prodi?.fakultas },
      tagihan,
      pembayaran,
      totalTagihan: tagihan.reduce((s, t) => s + t.jumlah, 0),
      totalBayar: pembayaran.reduce((s, p) => s + p.jumlahBayar, 0),
    };
  }

  // ==========================================
  // KUESIONER EDOM
  // ==========================================
  async getEdomTarget(userId: string) {
    const mahasiswa = await this.getMahasiswa(userId);

    // Get active semester
    const activeTahun = await this.prisma.tahunAkademik.findFirst({
      where: { isAktif: true },
    });

    if (!activeTahun) return { data: [], message: 'Tidak ada semester aktif' };

    // Get KRS for active semester
    const krsAktif = await this.prisma.krs.findMany({
      where: {
        mahasiswaId: mahasiswa.id,
        tahunAkademikId: activeTahun.id
      },
      include: {
        jadwal: {
          include: {
            mataKuliah: true,
            dosen: { include: { user: { select: { name: true } } } },
          },
        },
      },
    });

    // Find already submitted EDOM by this student
    const submittedEdoms = await this.prisma.kuesionerEdom.findMany({
      where: { mahasiswaId: mahasiswa.id },
      select: { dosenId: true, mataKuliahId: true },
    });

    const submittedSet = new Set(submittedEdoms.map(e => `${e.dosenId}_${e.mataKuliahId}`));

    // Filter to only those that haven't been evaluated
    const targets = krsAktif.map(k => {
      const dosenId = k.jadwal.dosenId;
      const mkId = k.jadwal.mataKuliahId;
      const isSubmitted = submittedSet.has(`${dosenId}_${mkId}`);

      return {
        id: k.id,
        mataKuliahId: mkId,
        mataKuliahNama: k.jadwal.mataKuliah.nama,
        kodeMk: k.jadwal.mataKuliah.kode,
        dosenId: dosenId,
        dosenNama: k.jadwal.dosen.user.name,
        isSubmitted,
      };
    });

    return {
      data: targets,
      semester: activeTahun.nama
    };
  }

  async ajukanEdom(userId: string, dto: { dosenId: string; mataKuliahId: string; skorPelayanan: number; skorMateri: number; saran?: string }) {
    const mahasiswa = await this.getMahasiswa(userId);

    // Verify if already submitted
    const existing = await this.prisma.kuesionerEdom.findFirst({
      where: {
        mahasiswaId: mahasiswa.id,
        dosenId: dto.dosenId,
        mataKuliahId: dto.mataKuliahId,
      }
    });

    if (existing) throw new BadRequestException('Anda sudah mengisi evaluasi untuk kelas ini');

    return this.prisma.kuesionerEdom.create({
      data: {
        mahasiswaId: mahasiswa.id,
        dosenId: dto.dosenId,
        mataKuliahId: dto.mataKuliahId,
        skorPelayanan: dto.skorPelayanan,
        skorMateri: dto.skorMateri,
        saran: dto.saran,
      }
    });
  }

  // ==========================================
  // KEGIATAN MAHASISWA
  // ==========================================
  async getKegiatan(userId: string) {
    const mahasiswa = await this.getMahasiswa(userId);

    // Get all future activities or ongoing
    const today = new Date();
    const kegiatanList = await this.prisma.kegiatan.findMany({
      where: {
        batasPendaftaran: { gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000) } // showing up to 30 days past deadline
      },
      orderBy: { tanggalPelaksanaan: 'asc' }
    });

    // Get my registrations
    const pendaftaran = await this.prisma.pendaftaranKegiatan.findMany({
      where: { mahasiswaId: mahasiswa.id }
    });

    const terdaftarIds = pendaftaran.map(p => p.kegiatanId);

    const data = kegiatanList.map(k => ({
      ...k,
      isRegistered: terdaftarIds.includes(k.id),
      statusPendaftaran: pendaftaran.find(p => p.kegiatanId === k.id)?.status || null
    }));

    return { data };
  }

  async daftarKegiatan(userId: string, kegiatanId: string) {
    const mahasiswa = await this.getMahasiswa(userId);

    const kegiatan = await this.prisma.kegiatan.findUnique({ where: { id: kegiatanId } });
    if (!kegiatan) throw new NotFoundException('Kegiatan tidak ditemukan');

    if (new Date() > kegiatan.batasPendaftaran) {
      throw new BadRequestException('Batas waktu pendaftaran sudah lewat');
    }

    const existing = await this.prisma.pendaftaranKegiatan.findFirst({
      where: { mahasiswaId: mahasiswa.id, kegiatanId }
    });

    if (existing) throw new BadRequestException('Anda sudah terdaftar di kegiatan ini');

    // Check quota
    if (kegiatan.kuota) {
      const count = await this.prisma.pendaftaranKegiatan.count({ where: { kegiatanId } });
      if (count >= kegiatan.kuota) throw new BadRequestException('Kuota kegiatan sudah penuh');
    }

    return this.prisma.pendaftaranKegiatan.create({
      data: {
        mahasiswaId: mahasiswa.id,
        kegiatanId,
        status: 'TERDAFTAR'
      }
    });
  }

  // ==========================================
  // BEASISWA
  // ==========================================
  async getBeasiswa(userId: string) {
    const mahasiswa = await this.getMahasiswa(userId);
    const data = await this.prisma.beasiswa.findMany({
      where: { mahasiswaId: mahasiswa.id },
      include: { tahunAkademik: true },
      orderBy: { tahunAkademik: { kode: 'desc' } }
    });
    return { data };
  }

  // ==========================================
  // YUDISIUM
  // ==========================================
  async getYudisium(userId: string) {
    const mahasiswa = await this.getMahasiswa(userId);
    const yudisium = await this.prisma.yudisium.findUnique({
      where: { mahasiswaId: mahasiswa.id }
    });

    // Check if eligible for yudisium
    // Need at least 144 SKS and no E grades
    const allKrs = await this.prisma.krs.findMany({
      where: { mahasiswaId: mahasiswa.id, grade: { not: null } },
      include: { jadwal: { include: { mataKuliah: true } } }
    });

    let totalSks = 0;
    let hasE = false;
    let totalBobot = 0;

    const gradeToBobot: Record<string, number> = {
      'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'D': 1.0, 'E': 0.0,
    };

    allKrs.forEach(k => {
      totalSks += k.jadwal.mataKuliah.sks;
      if (k.grade === 'E') hasE = true;
      const bobot = gradeToBobot[k.grade || ''] ?? 0;
      totalBobot += bobot * k.jadwal.mataKuliah.sks;
    });

    const ipkLulus = totalSks > 0 ? Math.round((totalBobot / totalSks) * 100) / 100 : 0;
    const isEligible = totalSks >= 144 && !hasE;

    return {
      data: yudisium,
      isEligible,
      syarat: {
        totalSks,
        minSks: 144,
        hasE,
        ipkSementara: ipkLulus
      }
    };
  }

  async daftarYudisium(userId: string) {
    const mahasiswa = await this.getMahasiswa(userId);

    const status = await this.getYudisium(userId);
    if (!status.isEligible) {
      throw new BadRequestException('Anda belum memenuhi syarat akademik (minimal 144 SKS & tidak ada nilai E)');
    }

    if (status.data) {
      throw new BadRequestException('Anda sudah terdaftar untuk yudisium');
    }

    return this.prisma.yudisium.create({
      data: {
        mahasiswaId: mahasiswa.id,
        tanggalYudisium: new Date(),
        nomorSK: 'MENUNGGU-SK',
        ipkLulus: status.syarat.ipkSementara,
        status: 'MENUNGGU'
      }
    });
  }
}