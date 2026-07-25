import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MahasiswaModule } from './mahasiswa/mahasiswa.module';
import { DosenModule } from './dosen/dosen.module';
import { PrismaModule } from './prisma.module';
import { PddiktiSyncModule } from './pddikti-sync/pddikti-sync.module';
import { PegawaiModule } from './pegawai/pegawai.module';
import { RuanganModule } from './ruangan/ruangan.module';
import { ProdiModule } from './prodi/prodi.module';
import { MataKuliahModule } from './mata-kuliah/mata-kuliah.module';
import { JadwalModule } from './jadwal/jadwal.module';
import { KrsModule } from './krs/krs.module';
import { TagihanModule } from './tagihan/tagihan.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { OrangtuaModule } from './orangtua/orangtua.module';
import { AlumniModule } from './alumni/alumni.module';
import { KurikulumModule } from './kurikulum/kurikulum.module';
import { KalenderAkademikModule } from './kalender-akademik/kalender-akademik.module';
import { JadwalKuliahModule } from './jadwal-kuliah/jadwal-kuliah.module';
import { CutiModule } from './cuti/cuti.module';
import { KegiatanModule } from './kegiatan/kegiatan.module';
import { SkripsiModule } from './skripsi/skripsi.module';
import { PembayaranModule } from './pembayaran/pembayaran.module';
import { BeasiswaModule } from './beasiswa/beasiswa.module';
import { YudisiumModule } from './yudisium/yudisium.module';
import { SkpiModule } from './skpi/skpi.module';
import { TracerStudyModule } from './tracer-study/tracer-study.module';
import { PengumumanModule } from './pengumuman/pengumuman.module';
import { PesanModule } from './pesan/pesan.module';
import { EdomModule } from './edom/edom.module';
import { RolesModule } from './roles/roles.module';
import { MahasiswaPortalModule } from './mahasiswa-portal/mahasiswa-portal.module';
import { DosenPortalModule } from './dosen-portal/dosen-portal.module';
import { AsdosModule } from './asdos/asdos.module';
import { TahunAkademikModule } from './tahun-akademik/tahun-akademik.module';
import { KrsStatusModule } from './krs-status/krs-status.module';
import { KomponenBiayaModule } from './komponen-biaya/komponen-biaya.module';
import { PengajuanDispensasiModule } from './pengajuan-dispensasi/pengajuan-dispensasi.module';
import { PmbModule } from './pmb/pmb.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MahasiswaModule,
    DosenModule,
    PegawaiModule,
    RuanganModule,
    ProdiModule,
    MataKuliahModule,
    JadwalModule,
    KrsModule,
    TagihanModule,
    DashboardModule,
    PddiktiSyncModule,
    OrangtuaModule,
    AlumniModule,
    KurikulumModule,
    KalenderAkademikModule,
    JadwalKuliahModule,
    CutiModule,
    KegiatanModule,
    SkripsiModule,
    PembayaranModule,
    BeasiswaModule,
    YudisiumModule,
    SkpiModule,
    TracerStudyModule,
    PengumumanModule,
    PesanModule,
    EdomModule,
    RolesModule,
    MahasiswaPortalModule,
    DosenPortalModule,
    AsdosModule,
    TahunAkademikModule,
    KrsStatusModule,
    KomponenBiayaModule,
    PengajuanDispensasiModule,
    PmbModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
