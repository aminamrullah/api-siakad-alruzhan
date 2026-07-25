import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DosenPortalService {
  constructor(private prisma: PrismaService) {}

  // Helper: Get dosen record from userId
  private async getDosen(userId: string) {
    const dosen = await this.prisma.dosen.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        homebase: true,
      },
    });
    if (!dosen) throw new ForbiddenException('Akun Anda tidak terhubung dengan data dosen');
    return dosen;
  }

  // ==========================================
  // DASHBOARD
  // ==========================================
  async getDashboard(userId: string, role: string) {
    const dosen = await this.getDosen(userId);

    // Dosen Pengampu stats
    const kelasAktif = await this.prisma.jadwalKuliah.count({
      where: { dosenId: dosen.id },
    });

    const sksDiajar = await this.prisma.jadwalKuliah.findMany({
      where: { dosenId: dosen.id },
      include: { mataKuliah: true },
    }).then(res => res.reduce((sum, j) => sum + (j.mataKuliah?.sks || 0), 0));

    // Dosen Wali stats
    const mahasiswaPerwalian = await this.prisma.mahasiswa.count({
      where: { dosenWaliId: dosen.id },
    });

    const krsMenunggu = await this.prisma.krs.count({
      where: {
        mahasiswa: { dosenWaliId: dosen.id },
        status: 'MENUNGGU',
      },
    });

    // Pimpinan stats (if role allows)
    let pimpinanStats = null;
    if (['SUPERADMIN', 'KAPRODI', 'REKTOR', 'DEKAN'].includes(role)) {
      const totalMhs = await this.prisma.mahasiswa.count({ where: { status: 'AKTIF' } });
      
      const allKrs = await this.prisma.krs.findMany({
        where: { grade: { not: null } },
        include: { jadwal: { include: { mataKuliah: true } } },
      });

      const gradeToBobot: Record<string, number> = {
        'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'D': 1.0, 'E': 0.0,
      };

      let totalBobot = 0;
      let totalSks = 0;
      allKrs.forEach(k => {
        const sks = k.jadwal?.mataKuliah?.sks || 0;
        const bobot = gradeToBobot[k.grade || ''] ?? 0;
        totalBobot += bobot * sks;
        totalSks += sks;
      });
      const avgIpk = totalSks > 0 ? (totalBobot / totalSks) : 0;

      pimpinanStats = {
        totalMahasiswaAktif: totalMhs,
        rataRataIpk: avgIpk.toFixed(2),
      };
    }

    return {
      dosen: { id: dosen.id, nidn: dosen.nidn, nama: dosen.user.name, homebase: dosen.homebase?.nama },
      pengampu: { kelasAktif, sksDiajar },
      perwalian: { total: mahasiswaPerwalian, krsMenunggu },
      pimpinan: pimpinanStats,
    };
  }

  // ==========================================
  // JADWAL & KELAS (Dosen Pengampu)
  // ==========================================
  async getJadwalMengajar(userId: string, semester?: string) {
    const dosen = await this.getDosen(userId);
    const where: any = { dosenId: dosen.id };
    if (semester) {
      where.tahunAkademikId = semester;
    }
    const data = await this.prisma.jadwalKuliah.findMany({
      where,
      include: {
        mataKuliah: true,
        ruanganObj: true,
        _count: { select: { krs: { where: { status: 'DISETUJUI' } } } },
      },
      orderBy: { hari: 'asc' },
    });
    return { data };
  }

  async getDetailKelas(userId: string, jadwalId: string) {
    const dosen = await this.getDosen(userId);
    const jadwal = await this.prisma.jadwalKuliah.findUnique({
      where: { id: jadwalId },
      include: {
        mataKuliah: true,
        ruanganObj: true,
        krs: {
          where: { status: 'DISETUJUI' },
          include: {
            mahasiswa: { include: { user: { select: { name: true } }, prodi: true } },
          },
          orderBy: { mahasiswa: { nim: 'asc' } }
        },
        agenda: {
          orderBy: { pertemuanKe: 'asc' },
          include: { _count: { select: { kehadiran: true } } }
        }
      },
    });

    if (!jadwal) throw new NotFoundException('Kelas tidak ditemukan');
    if (jadwal.dosenId !== dosen.id) throw new ForbiddenException('Anda bukan pengampu kelas ini');

    // Hitung persentase kehadiran untuk tiap mahasiswa
    const totalAgenda = jadwal.agenda.length;
    const pesertaWithKehadiran = await Promise.all(jadwal.krs.map(async (krs) => {
      let persentaseKehadiran = 0;
      if (totalAgenda > 0) {
        const hadirCount = await this.prisma.kehadiranMahasiswa.count({
          where: {
            mahasiswaId: krs.mahasiswaId,
            agendaId: { in: jadwal.agenda.map(a => a.id) },
            status: 'HADIR'
          }
        });
        persentaseKehadiran = (hadirCount / totalAgenda) * 100;
      }
      
      return {
        ...krs,
        persentaseKehadiran,
      };
    }));

    return { data: { ...jadwal, krs: pesertaWithKehadiran } };
  }

  // ==========================================
  // AGENDA & PRESENSI (Dosen Pengampu)
  // ==========================================
  async buatAgenda(userId: string, jadwalId: string, dto: { pertemuanKe: number, tanggal: string, topik: string }) {
    const dosen = await this.getDosen(userId);
    const jadwal = await this.prisma.jadwalKuliah.findUnique({ where: { id: jadwalId } });
    
    if (!jadwal || jadwal.dosenId !== dosen.id) {
      throw new ForbiddenException('Akses ditolak');
    }

    return this.prisma.agendaPerkuliahan.create({
      data: {
        jadwalId,
        pertemuanKe: dto.pertemuanKe,
        tanggal: new Date(dto.tanggal),
        topik: dto.topik,
      }
    });
  }

  async getDetailAgenda(userId: string, agendaId: string) {
    const dosen = await this.getDosen(userId);
    const agenda = await this.prisma.agendaPerkuliahan.findUnique({
      where: { id: agendaId },
      include: {
        jadwal: true,
        kehadiran: { include: { mahasiswa: { include: { user: { select: { name: true } } } } } }
      }
    });

    if (!agenda || agenda.jadwal.dosenId !== dosen.id) throw new ForbiddenException('Akses ditolak');
    
    // Get all students in class
    const krs = await this.prisma.krs.findMany({
      where: { jadwalId: agenda.jadwalId, status: 'DISETUJUI' },
      include: { mahasiswa: { include: { user: { select: { name: true } } } } },
      orderBy: { mahasiswa: { nim: 'asc' } }
    });

    return { agenda, peserta: krs };
  }

  async hapusAgenda(userId: string, agendaId: string) {
    const dosen = await this.getDosen(userId);
    const agenda = await this.prisma.agendaPerkuliahan.findUnique({
      where: { id: agendaId },
      include: { jadwal: true }
    });

    if (!agenda) throw new NotFoundException('Agenda tidak ditemukan');
    if (agenda.jadwal.dosenId !== dosen.id) throw new ForbiddenException('Akses ditolak');

    await this.prisma.agendaPerkuliahan.delete({ where: { id: agendaId } });
    return { message: 'Agenda berhasil dihapus' };
  }

  async simpanPresensi(userId: string, agendaId: string, kehadiranList: { mahasiswaId: string, status: string }[]) {
    const dosen = await this.getDosen(userId);
    const agenda = await this.prisma.agendaPerkuliahan.findUnique({ where: { id: agendaId }, include: { jadwal: true } });
    if (!agenda || agenda.jadwal.dosenId !== dosen.id) throw new ForbiddenException('Akses ditolak');

    const ops = kehadiranList.map(k => 
      this.prisma.kehadiranMahasiswa.upsert({
        where: { agendaId_mahasiswaId: { agendaId, mahasiswaId: k.mahasiswaId } },
        update: { status: k.status },
        create: { agendaId, mahasiswaId: k.mahasiswaId, status: k.status }
      })
    );

    await this.prisma.$transaction(ops);
    return { message: 'Presensi berhasil disimpan' };
  }

  // ==========================================
  // INPUT NILAI (Dosen Pengampu)
  // ==========================================
  async simpanNilaiKolektif(userId: string, jadwalId: string, nilaiList: { krsId: string, absensi: number, tugas: number, uts: number, uas: number }[]) {
    const dosen = await this.getDosen(userId);
    const jadwal = await this.prisma.jadwalKuliah.findUnique({ where: { id: jadwalId } });
    if (!jadwal || jadwal.dosenId !== dosen.id) throw new ForbiddenException('Akses ditolak');

    const ops = nilaiList.map(n => {
      // Nilai Akhir = (Absensi × 10%) + (UTS × 30%) + (UAS × 40%) + (Tugas × 20%)
      const absensi = n.absensi || 0;
      const tugas = n.tugas || 0;
      const uts = n.uts || 0;
      const uas = n.uas || 0;
      
      const akhir = (absensi * 0.10) + (tugas * 0.20) + (uts * 0.30) + (uas * 0.40);
      
      let grade = 'E';
      if (akhir >= 85) grade = 'A';
      else if (akhir >= 80) grade = 'A-';
      else if (akhir >= 75) grade = 'B+';
      else if (akhir >= 70) grade = 'B';
      else if (akhir >= 65) grade = 'B-';
      else if (akhir >= 60) grade = 'C+';
      else if (akhir >= 55) grade = 'C';
      else if (akhir >= 40) grade = 'D';

      return this.prisma.krs.update({
        where: { id: n.krsId },
        data: {
          nilaiAbsensi: absensi,
          nilaiTugas: tugas,
          nilaiUts: uts,
          nilaiUas: uas,
          nilaiAkhir: akhir,
          grade: grade
        }
      });
    });

    await this.prisma.$transaction(ops);
    return { message: 'Nilai berhasil disimpan' };
  }

  // ==========================================
  // PERWALIAN & KRS (Dosen Wali)
  // ==========================================
  async getMahasiswaPerwalian(userId: string) {
    const dosen = await this.getDosen(userId);
    const mhs = await this.prisma.mahasiswa.findMany({
      where: { dosenWaliId: dosen.id },
      include: {
        user: { select: { name: true } },
        prodi: true,
        krs: { where: { status: 'MENUNGGU' } } // To show badge if needs validation
      },
      orderBy: { nim: 'asc' }
    });

    return { data: mhs };
  }

  async getDetailPerwalian(userId: string, mahasiswaId: string) {
    const dosen = await this.getDosen(userId);
    const mhs = await this.prisma.mahasiswa.findUnique({
      where: { id: mahasiswaId },
      include: { user: { select: { name: true } }, prodi: true }
    });

    if (!mhs || mhs.dosenWaliId !== dosen.id) throw new ForbiddenException('Bukan mahasiswa perwalian Anda');

    // Get all KRS
    const allKrs = await this.prisma.krs.findMany({
      where: { mahasiswaId },
      include: { jadwal: { include: { mataKuliah: true } }, tahunAkademik: true },
      orderBy: { tahunAkademik: { kode: 'desc' } }
    });

    const bySemester: Record<string, any[]> = {};
    allKrs.forEach((k: any) => {
      const semName = k.tahunAkademik?.nama || k.tahunAkademikId;
      if (!bySemester[semName]) bySemester[semName] = [];
      bySemester[semName].push(k);
    });

    return { mahasiswa: mhs, krsBySemester: bySemester };
  }

  async validasiKrs(userId: string, krsIds: string[], status: 'DISETUJUI' | 'DITOLAK', catatan?: string) {
    const dosen = await this.getDosen(userId);
    
    // Verify ownership
    const krsList = await this.prisma.krs.findMany({
      where: { id: { in: krsIds } },
      include: { mahasiswa: true }
    });

    for (const k of krsList) {
      // Allow null dosenWaliId (first assignment) or matching dosen id
      if (k.mahasiswa.dosenWaliId && k.mahasiswa.dosenWaliId !== dosen.id) {
        throw new ForbiddenException('Terdapat KRS yang bukan milik mahasiswa perwalian Anda');
      }
    }


    await this.prisma.krs.updateMany({
      where: { id: { in: krsIds } },
      data: { status, catatanWali: catatan },
    });

    // If approved, assign the approving dosen as wali for related mahasiswa
    if (status === 'DISETUJUI') {
      const mahasiswaIds = krsList.map(k => k.mahasiswa.id);
      await this.prisma.mahasiswa.updateMany({
        where: { id: { in: mahasiswaIds } },
        data: { dosenWaliId: dosen.id },
      });
    }

    return { message: `KRS berhasil di${status.toLowerCase()}` };
  }

  // ==========================================
  // PROFIL DOSEN
  // ==========================================
  async getProfil(userId: string) {
    return this.getDosen(userId);
  }

  // ==========================================
  // BIMBINGAN SKRIPSI
  // ==========================================
  async getSkripsi(userId: string) {
    const dosen = await this.getDosen(userId);
    const data = await this.prisma.skripsi.findMany({
      where: {
        OR: [
          { pembimbing1Id: dosen.id },
          { pembimbing2Id: dosen.id }
        ]
      },
      include: {
        mahasiswa: { include: { user: { select: { name: true } }, prodi: true } },
        logbooks: { select: { id: true, status: true } },
        ujian: { select: { id: true, tipe: true, status: true, nilaiAkhir: true } },
      },
      orderBy: { tanggalPengajuan: 'desc' }
    });
    return { data };
  }

  async getSkripsiDetail(userId: string, skripsiId: string) {
    const dosen = await this.getDosen(userId);
    const skripsi = await this.prisma.skripsi.findFirst({
      where: {
        id: skripsiId,
        OR: [
          { pembimbing1Id: dosen.id },
          { pembimbing2Id: dosen.id },
          { ujian: { some: { OR: [{ penguji1Id: dosen.id }, { penguji2Id: dosen.id }] } } },
        ]
      },
      include: {
        mahasiswa: { include: { user: { select: { name: true, email: true } }, prodi: true } },
        pembimbing1: { include: { user: { select: { name: true } } } },
        pembimbing2: { include: { user: { select: { name: true } } } },
        logbooks: {
          include: { mahasiswa: { include: { user: { select: { name: true } } } } },
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
    if (!skripsi) throw new ForbiddenException('Anda tidak memiliki akses ke data skripsi ini');

    const logbookValidCount = await this.prisma.skripsiLogbook.count({
      where: { skripsiId, status: 'DIVALIDASI' },
    });

    return { data: skripsi, logbookValidCount };
  }

  async validasiLogbook(
    userId: string,
    logbookId: string,
    dto: { status: 'DIVALIDASI' | 'REVISI'; catatanDosen?: string },
  ) {
    const dosen = await this.getDosen(userId);
    const logbook = await this.prisma.skripsiLogbook.findUnique({
      where: { id: logbookId },
      include: { skripsi: true },
    });
    if (!logbook) throw new NotFoundException('Logbook tidak ditemukan');

    // Verify dosen is the pembimbing
    const { pembimbing1Id, pembimbing2Id } = logbook.skripsi;
    if (pembimbing1Id !== dosen.id && pembimbing2Id !== dosen.id) {
      throw new ForbiddenException('Anda bukan pembimbing skripsi ini');
    }
    if (logbook.status === 'DIVALIDASI') {
      throw new BadRequestException('Logbook ini sudah divalidasi');
    }

    return this.prisma.skripsiLogbook.update({
      where: { id: logbookId },
      data: {
        status: dto.status,
        catatanDosen: dto.catatanDosen,
        dosenId: dosen.id,
      },
    });
  }

  async inputNilaiSidang(
    userId: string,
    ujianId: string,
    dto: { nilaiPembimbing?: number; nilaiPenguji1?: number; nilaiPenguji2?: number; catatanRevisi?: string },
  ) {
    const dosen = await this.getDosen(userId);
    const ujian = await this.prisma.skripsiUjian.findUnique({
      where: { id: ujianId },
      include: { skripsi: true },
    });
    if (!ujian) throw new NotFoundException('Data ujian tidak ditemukan');

    // Verify dosen role in this ujian
    const isPembimbing = [ujian.skripsi.pembimbing1Id, ujian.skripsi.pembimbing2Id].includes(dosen.id);
    const isPenguji = [ujian.penguji1Id, ujian.penguji2Id].includes(dosen.id);
    if (!isPembimbing && !isPenguji) {
      throw new ForbiddenException('Anda tidak terlibat dalam ujian ini');
    }

    const updateData: any = { catatanRevisi: dto.catatanRevisi };
    if (isPembimbing && dto.nilaiPembimbing !== undefined) updateData.nilaiPembimbing = dto.nilaiPembimbing;
    if (isPenguji && ujian.penguji1Id === dosen.id && dto.nilaiPenguji1 !== undefined) updateData.nilaiPenguji1 = dto.nilaiPenguji1;
    if (isPenguji && ujian.penguji2Id === dosen.id && dto.nilaiPenguji2 !== undefined) updateData.nilaiPenguji2 = dto.nilaiPenguji2;

    // Calculate weighted average if all values present
    const p1 = updateData.nilaiPenguji1 ?? ujian.nilaiPenguji1 ?? null;
    const p2 = updateData.nilaiPenguji2 ?? ujian.nilaiPenguji2 ?? null;
    const pb = updateData.nilaiPembimbing ?? ujian.nilaiPembimbing ?? null;

    let nilaiAkhir: number | null = null;
    let lulus = false;

    if (p1 !== null && pb !== null) {
      if (p2 !== null) {
        nilaiAkhir = p1 * 0.35 + p2 * 0.3 + pb * 0.35;
      } else {
        nilaiAkhir = p1 * 0.5 + pb * 0.5;
      }
      nilaiAkhir = Math.round(nilaiAkhir * 100) / 100;
      lulus = nilaiAkhir >= 55; // minimal C
    }

    if (nilaiAkhir !== null) {
      updateData.nilaiAkhir = nilaiAkhir;
      updateData.status = lulus ? 'LULUS' : 'TIDAK_LULUS';
    }

    const updatedUjian = await this.prisma.skripsiUjian.update({
      where: { id: ujianId },
      data: updateData,
    });

    if (nilaiAkhir !== null) {
      const newStatus = lulus
        ? ujian.tipe === 'SEMINAR_PROPOSAL'
          ? 'SEMINAR_PROPOSAL'
          : 'REVISI'
        : ujian.skripsi.status; // Status tidak berubah jika tidak lulus

      let grade = 'E';
      if (nilaiAkhir >= 85) grade = 'A';
      else if (nilaiAkhir >= 80) grade = 'A-';
      else if (nilaiAkhir >= 75) grade = 'B+';
      else if (nilaiAkhir >= 70) grade = 'B';
      else if (nilaiAkhir >= 65) grade = 'B-';
      else if (nilaiAkhir >= 60) grade = 'C+';
      else if (nilaiAkhir >= 55) grade = 'C';
      else if (nilaiAkhir >= 40) grade = 'D';

      await this.prisma.skripsi.update({
        where: { id: ujian.skripsiId },
        data: {
          ...(lulus && ujian.tipe === 'SIDANG_AKHIR'
            ? {
                nilaiAkhir,
                grade,
                status: 'REVISI',
              }
            : { status: newStatus }),
        },
      });
    }

    return updatedUjian;
  }

  // ==========================================
  // HASIL EDOM
  // ==========================================
  async getEdom(userId: string) {
    const dosen = await this.getDosen(userId);
    
    // Get all edom for this dosen
    const edomList = await this.prisma.kuesionerEdom.findMany({
      where: { dosenId: dosen.id },
      include: { mataKuliah: true }
    });

    // Group by mata kuliah
    const grouped: Record<string, any> = {};
    
    edomList.forEach(e => {
      if (!grouped[e.mataKuliahId]) {
        grouped[e.mataKuliahId] = {
          mataKuliahId: e.mataKuliahId,
          mataKuliahNama: e.mataKuliah.nama,
          kodeMk: e.mataKuliah.kode,
          jumlahResponden: 0,
          totalSkorPelayanan: 0,
          totalSkorMateri: 0,
          saranList: []
        };
      }
      
      grouped[e.mataKuliahId].jumlahResponden += 1;
      grouped[e.mataKuliahId].totalSkorPelayanan += e.skorPelayanan;
      grouped[e.mataKuliahId].totalSkorMateri += e.skorMateri;
      if (e.saran && e.saran.trim() !== '') {
        grouped[e.mataKuliahId].saranList.push(e.saran);
      }
    });

    const data = Object.values(grouped).map((g: any) => ({
      ...g,
      rataPelayanan: g.totalSkorPelayanan / g.jumlahResponden,
      rataMateri: g.totalSkorMateri / g.jumlahResponden
    }));

    return { data };
  }
}
