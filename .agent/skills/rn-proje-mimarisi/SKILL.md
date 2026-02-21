---
name: rn-proje-mimarisi
description: Dans okulu mobil uygulaması (React Native) için mimari standartları uygulat; feature bazlı klasör yapısı, servis katmanı, state ayrımı, ekran state'leri ve paylaşılabilir tip/model yaklaşımı.
tags: [react-native, architecture, feature, state, services]
---

## Amaç
Mobil tarafta ekran eklemeyi hızlandırmak ve “UI içine dağılmış backend çağrıları” sorununu engellemek.

## Ne zaman kullanılır?
- Yeni ekran/feature eklerken
- Kod karmaşıklaştığında (çok hook, çok side-effect)
- Web ile ortak iş kuralları/tipler paylaşılacaksa

## Mimari kurallar
- Feature bazlı: `src/features/<feature>/{ui,data,models,hooks}`.
- Firebase erişimi: sadece `data/*Service.ts` veya `src/services/firebase/*` katmanında.
- UI state standardı: her ekran `loading | error | empty | success` durumlarını ele alır.
- İş kuralları UI’dan ayrı tutulur (UI sadece event toplar).

## Çıktı formatı
- Oluşturulacak dosya ağacı
- En az 1 servis fonksiyonu + 1 ekran kullanım örneği
