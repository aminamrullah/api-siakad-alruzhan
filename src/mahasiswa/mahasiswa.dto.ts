import { IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum } from 'class-validator';

export type MahasiswaStatus =
    | 'AKTIF'
    | 'CUTI'
    | 'LULUS'
    | 'DO'
    | 'NONAKTIF';

export class CreateMahasiswaDto {
    @IsString()
    @IsNotEmpty()
    nim: string;

    @IsString()
    @IsNotEmpty()
    prodiId: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    // PDDIKTI Biodata
    @IsString()
    @IsOptional()
    nik?: string;

    @IsString()
    @IsOptional()
    nisn?: string;

    @IsString()
    @IsOptional()
    jenisKelamin?: string;

    @IsString()
    @IsOptional()
    tempatLahir?: string;

    @IsString()
    @IsOptional()
    tanggalLahir?: string;

    @IsString()
    @IsOptional()
    agama?: string;

    @IsString()
    @IsOptional()
    namaIbuKandung?: string;

    @IsString()
    @IsOptional()
    kewarganegaraan?: string;

    @IsString()
    @IsOptional()
    alamat?: string;

    @IsString()
    @IsOptional()
    hp?: string;

    // PMB Integration
    @IsString()
    @IsOptional()
    jalurMasuk?: string;

    @IsString()
    @IsOptional()
    gelombang?: string;

    @IsString()
    @IsOptional()
    tanggalMasuk?: string;

    @IsString()
    @IsOptional()
    angkatan?: string;

    // Status
    @IsString()
    @IsOptional()
    status?: MahasiswaStatus;
}

export class UpdateMahasiswaDto {
    @IsString()
    @IsOptional()
    nim?: string;

    @IsString()
    @IsOptional()
    prodiId?: string;

    @IsString()
    @IsOptional()
    name?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    // PDDIKTI Biodata
    @IsString()
    @IsOptional()
    nik?: string;

    @IsString()
    @IsOptional()
    nisn?: string;

    @IsString()
    @IsOptional()
    jenisKelamin?: string;

    @IsString()
    @IsOptional()
    tempatLahir?: string;

    @IsString()
    @IsOptional()
    tanggalLahir?: string;

    @IsString()
    @IsOptional()
    agama?: string;

    @IsString()
    @IsOptional()
    namaIbuKandung?: string;

    @IsString()
    @IsOptional()
    kewarganegaraan?: string;

    @IsString()
    @IsOptional()
    alamat?: string;

    @IsString()
    @IsOptional()
    hp?: string;

    // PMB Integration
    @IsString()
    @IsOptional()
    jalurMasuk?: string;

    @IsString()
    @IsOptional()
    gelombang?: string;

    @IsString()
    @IsOptional()
    tanggalMasuk?: string;

    @IsString()
    @IsOptional()
    angkatan?: string;

    // Status
    @IsString()
    @IsOptional()
    status?: MahasiswaStatus;
}

export class MahasiswaQueryDto {
    @IsString()
    @IsOptional()
    search?: string;

    @IsString()
    @IsOptional()
    prodiId?: string;

    @IsString()
    @IsOptional()
    status?: MahasiswaStatus;
    
    @IsOptional()
    page?: number;

    @IsOptional()
    limit?: number;
}