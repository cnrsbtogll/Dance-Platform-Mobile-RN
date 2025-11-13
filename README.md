# Dance Platform - Mobile React Native App

Öğrenciler ile eğitmenleri buluşturan dans dersleri platformu.

## Genel Bakış

Dance Platform, React Native ve TypeScript ile geliştirilmiş bir mobil uygulamadır. Eğitmenler ders oluşturup satabilir, öğrenciler dersleri keşfedip satın alabilir.

## Teknik Stack

- **Framework**: React Native + Expo
- **Dil**: TypeScript
- **State Management**: Zustand
- **Navigation**: React Navigation
- **Mock Data**: JSON dosyaları (Firebase entegrasyonu planlanmış)

## Kurulum

### Gereksinimler

- Node.js (v18 veya üzeri)
- npm veya yarn
- Expo CLI
- iOS Simulator (Mac) veya Android Emulator

### Adımlar

1. Bağımlılıkları kurun:
```bash
npm install
```

2. Projeyi başlatın:
```bash
npm start
```

3. Expo Go uygulaması ile QR kodu tarayın veya:
   - iOS için: `npm run ios`
   - Android için: `npm run android`

## Proje Yapısı

```
src/
├── assets/          # Görseller ve fontlar
├── components/      # Yeniden kullanılabilir bileşenler
│   ├── common/     # Ortak bileşenler (Card, Button, Input, vb.)
│   ├── lesson/     # Ders ile ilgili bileşenler
│   └── instructor/ # Eğitmen ile ilgili bileşenler
├── screens/        # Ekranlar
│   ├── student/    # Öğrenci ekranları
│   ├── instructor/ # Eğitmen ekranları
│   └── shared/     # Ortak ekranlar
├── navigation/      # Navigation yapılandırması
├── data/           # Mock data JSON dosyaları
├── services/        # Servis katmanı
│   └── firebase/   # Firebase plan dosyaları
├── store/          # Zustand store'ları
├── types/          # TypeScript type tanımlamaları
└── utils/          # Yardımcı fonksiyonlar
```

## Özellikler

### Öğrenci Modülü
- Ders keşfetme ve arama
- Ders detayları görüntüleme
- Ders satın alma ve rezervasyon
- Derslerim (satın alınan dersler)
- Yorum ve puanlama

### Eğitmen Modülü
- Ders oluşturma ve düzenleme
- Ders yönetimi
- Satış istatistikleri
- Gelir analitiği
- Yaklaşan dersler takibi

### Ortak Özellikler
- Mesajlaşma
- Profil yönetimi
- Bildirimler

## Mock Data

Uygulama şu anda mock data kullanmaktadır. Mock data dosyaları `src/data/` klasöründe bulunur:
- `users.json` - Kullanıcılar
- `lessons.json` - Dersler
- `reviews.json` - Yorumlar
- `bookings.json` - Rezervasyonlar
- `messages.json` - Mesajlar

## Firebase Entegrasyonu

Firebase entegrasyonu planlanmıştır. Plan dosyaları `src/services/firebase/` klasöründe bulunur. Detaylar için `src/services/firebase/README.md` dosyasına bakın.

## Tasarım Sistemi

Tasarımlar `stitch_dance_platform_mobil` klasöründeki HTML dosyalarından referans alınmıştır. Tema renkleri ve stiller `src/utils/theme.ts` dosyasında tanımlanmıştır.

## Geliştirme

### Yeni Bileşen Ekleme

1. İlgili klasöre bileşeni ekleyin (`src/components/`)
2. TypeScript type'larını tanımlayın
3. Tema renklerini kullanın (`src/utils/theme.ts`)

### Yeni Ekran Ekleme

1. İlgili klasöre ekranı ekleyin (`src/screens/`)
2. Navigation'a ekleyin (`src/navigation/`)
3. Store'ları güncelleyin (gerekirse)

## Lisans

Bu proje özel bir projedir.

