# 🚀 การ Deploy ไป Vercel

## ขั้นตอนการ Deploy

### 1. เตรียม Database (Supabase)

1. ไปที่ [Supabase](https://supabase.com) และสร้างโปรเจ็กต์ใหม่
2. คัดลอก `Database URL` จาก Settings > Database
3. รันคำสั่ง migrate database:
   ```bash
   npx prisma db push
   ```

### 2. เตรียม Google OAuth

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com)
2. สร้าง Project ใหม่หรือเลือก Project ที่มี
3. เปิดใช้งาน Google+ API
4. สร้าง OAuth 2.0 Credentials
5. เพิ่ม Authorized redirect URIs:
   - `https://your-app-name.vercel.app/api/auth/callback/google`
6. คัดลอก `Client ID` และ `Client Secret`

### 3. Deploy ไป Vercel

#### วิธีที่ 1: ผ่าน Vercel CLI (แนะนำ)

1. ติดตั้ง Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login เข้า Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. ตั้งค่า Environment Variables:
   ```bash
   vercel env add DATABASE_URL
   vercel env add NEXTAUTH_URL
   vercel env add NEXTAUTH_SECRET
   vercel env add GOOGLE_CLIENT_ID
   vercel env add GOOGLE_CLIENT_SECRET
   ```

#### วิธีที่ 2: ผ่าน Vercel Dashboard

1. ไปที่ [vercel.com](https://vercel.com)
2. คลิก "New Project"
3. เชื่อมต่อ GitHub repository
4. เลือก repository `WEB-Service`
5. คลิก "Deploy"

### 4. ตั้งค่า Environment Variables

ใน Vercel Dashboard > Project Settings > Environment Variables เพิ่ม:

```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 5. Re-deploy

หลังจากตั้งค่า Environment Variables แล้ว:
1. ไปที่ Deployments tab
2. คลิก "Redeploy" ที่ deployment ล่าสุด

## ⚠️ สิ่งที่ต้องระวัง

### 1. Database Migration
- ต้องรัน `npx prisma db push` หลังจากเปลี่ยน DATABASE_URL
- ตรวจสอบว่า database schema ถูกต้อง

### 2. Google OAuth URLs
- อัปเดต Authorized redirect URIs ใน Google Console
- ตรวจสอบ NEXTAUTH_URL ให้ตรงกับ domain ที่ deploy

### 3. NEXTAUTH_SECRET
- ต้องสร้างใหม่ทุกครั้งสำหรับ production
- ใช้: `openssl rand -base64 32`

## 🔧 การแก้ไขปัญหา

### Build Error
```bash
# ลอง build ใน local ก่อน
npm run build

# ถ้ามี error ให้แก้ไขก่อน deploy
```

### Database Connection Error
- ตรวจสอบ DATABASE_URL
- ตรวจสอบว่า database accessible จาก internet
- รัน `npx prisma db push` อีกครั้ง

### OAuth Error
- ตรวจสอบ Google Console settings
- ตรวจสอบ redirect URIs
- ตรวจสอบ client ID/secret

## 📝 Commands ที่มีประโยชน์

```bash
# ดู deployment logs
vercel logs

# ดู environment variables
vercel env ls

# Pull project settings
vercel pull

# Local development
npm run dev

# Build for production
npm run build

# Database operations
npx prisma db push
npx prisma studio
npx prisma migrate dev
```

## 🌐 URLs สำคัญ

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Google Cloud Console**: https://console.cloud.google.com
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Repository**: https://github.com/anuphongsrinawong/WEB-Service
