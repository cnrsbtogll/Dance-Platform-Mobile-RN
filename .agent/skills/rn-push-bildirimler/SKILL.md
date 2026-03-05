---
name: rn-push-bildirimler
description: Mobil uygulamada push bildirim ihtiyaçlarını (ders onayı/iptal, yeni mesaj, yaklaşan ders) tasarla; token yönetimi, kullanıcı tercihleri ve güvenli gönderim akışını öner.
tags: [react-native, push, notifications, fcm]
---

## Amaç
Öğrenci ve eğitmen etkileşimini artırmak, kritik olaylarda kullanıcıyı haberdar etmek.

## Ne zaman kullanılır?
- Mesajlaşma veya rezervasyon akışına bildirim ekleneceğinde
- Token/izin sorunları yaşandığında

## Kurallar
- Token’lar kullanıcı profili altında güvenli şekilde saklanır ve logout’ta temizlenir.
- Bildirim tetikleyicileri server-side olmalı (istemciden istemciye güvenme).
- Kullanıcı tercihleri (sessize alma) desteklenmeli.

## Çıktı formatı
- Bildirim türleri + payload alanları
- Token lifecycle akışı
- Güvenlik ve spam önlemleri
