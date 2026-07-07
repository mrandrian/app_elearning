# E-Learning Platform

Platform E-Learning modern yang dibangun menggunakan teknologi terkini: **Next.js**, **React**, **Tailwind CSS**, dan **Prisma ORM**. Proyek ini juga dilengkapi dengan fitur autentikasi yang aman menggunakan **NextAuth.js**.

## 🚀 Teknologi Utama
- **Framework Utama:** Next.js & React
- **Styling:** Tailwind CSS v4 & Framer Motion
- **Database & ORM:** PostgreSQL & Prisma
- **Autentikasi:** NextAuth.js (terintegrasi dengan `bcryptjs`)
- **Fitur Tambahan:** HTML2Canvas, jsPDF, Recharts, React Quill (Rich Text Editor), dll.

---

## 🛠️ Persyaratan Sistem (Prerequisites)
Sebelum memulai instalasi, pastikan sistem Anda telah memiliki perangkat lunak berikut:
- **Node.js** (Disarankan versi 20.x atau lebih baru)
- **NPM** (Node Package Manager)
- **PostgreSQL** (Pastikan database server berjalan dan Anda memiliki akses kredensial, seperti *username* dan *password*)
- **Git**

---

## 📦 Panduan Instalasi (Installation Guide)

Ikuti langkah-langkah di bawah ini untuk menginstal dan menjalankan proyek ini di lingkungan pengembangan (local environment) Anda.

### 1. Clone Repositori
Clone proyek ini dari GitHub ke dalam komputer lokal Anda:
```bash
git clone <URL_REPOSITORY_GITHUB_ANDA>
cd elearning
```
*(Catatan: Ganti `<URL_REPOSITORY_GITHUB_ANDA>` dengan link repository GitHub Anda).*

### 2. Instal Dependensi
Jalankan perintah berikut pada terminal untuk mengunduh dan menginstal semua paket dan *library* yang dibutuhkan:
```bash
npm install
```

### 3. Konfigurasi Environment Variables (Variabel Lingkungan)
Proyek ini membutuhkan variabel lingkungan untuk konfigurasi database, autentikasi NextAuth, dan API tambahan.
1. Salin (copy) file `env.example` dan jadikan file baru bernama `.env`.
   - Untuk pengguna Windows (Command Prompt/PowerShell), Anda bisa menggunakan *copy-paste* langsung di File Explorer.
2. Buka file `.env` dan sesuaikan nilainya:
   ```env
   # Konfigurasi koneksi PostgreSQL (Ubah postgres:1234 dengan username:password PostgreSQL milik Anda)
   DATABASE_URL="postgresql://postgres:1234@localhost:5432/elearning_db?schema=public"
   
   # Konfigurasi NextAuth (Bisa dibiarkan default untuk lokal)
   NEXTAUTH_SECRET="super-secret-lms-key-1234"
   NEXTAUTH_URL="http://localhost:3000"
   
   # API Eksternal
   EXTERNAL_API_KEY="generate-external-api-key"
   ```
*(Catatan: Anda harus terlebih dahulu membuat database kosong bernama `elearning_db` (atau sesuai nama yang Anda atur di url atas) melalui PgAdmin / CLI PostgreSQL Anda).*

### 4. Inisialisasi Database (Prisma)
Setelah konfigurasi koneksi database di file `.env` selesai dan database sudah terbuat, jalankan perintah ini agar Prisma membuatkan struktur tabel (schema) di database Anda:
```bash
npx prisma db push
```

*(Opsional)* Anda juga dapat mengisi contoh data awal (seeding) ke dalam database menggunakan file `seed.mjs` yang sudah disediakan:
```bash
node seed.mjs
```

**Kredensial Default (Setelah Seeding):**
- **Akun Siswa (Student):**
  - NIP / Username: `198001012000011001`
  - Password: `123456`
- **Akun Guru (Teacher):**
  - NIP / Username: `198001012000011002`
  - Password: `123456`

### 5. Jalankan Aplikasi
Jalankan server untuk mode pengembangan (development mode):
```bash
npm run dev
```

Aplikasi E-Learning Anda sekarang berhasil dijalankan. Silakan buka browser dan akses URL berikut: 
**[http://localhost:3000](http://localhost:3000)**

---

## 📝 Panduan Penggunaan Script Dasar

Di dalam proyek ini, terdapat beberapa *script command* yang telah diatur (lihat `package.json`):

- **`npm run dev`**: Menjalankan aplikasi untuk pengembangan lokal (hot-reload aktif, kode berubah web langsung terupdate).
- **`npm run build`**: Membangun aplikasi agar siap dijalankan untuk lingkungan produksi (production-ready).
- **`npm run start`**: Menjalankan aplikasi dari hasil *build* produksi. Anda harus menjalankan `npm run build` terlebih dahulu sebelum ini.
- **`npm run lint`**: Mengecek dan menemukan masalah format atau kualitas pada kode menggunakan ESLint.
