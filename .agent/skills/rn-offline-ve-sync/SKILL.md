---
name: rn-offline-ve-sync
description: Mobil uygulamada offline-first davranışı tasarla; Firestore cache, queued writes, senkronizasyon, kullanıcıya durum gösterimi ve conflict risklerini ele al.
tags: [react-native, offline, sync, firestore, ux]
---

## Amaç
İnternet zayıfken bile uygulamanın kullanılabilir kalması (özellikle ders/rezervasyon akışında).

## Ne zaman kullanılır?
- Rezervasyon oluşturma/iptal gibi kritik write akışlarında
- Kullanıcı “veriler gelmiyor/boş görünüyor” dediğinde
- Offline göstergesi/uyarı ekleneceğinde

## Uygulama adımları
1) Offline kapsamını seç:
   - Okuma: hangi ekranlar cache’den gösterilebilir?
   - Yazma: hangi işlemler offline kuyruğa alınabilir?
2) UI davranışı:
   - Offline banner
   - “Senkronize ediliyor” state’i
   - Başarısız sync için retry UX
3) Conflict/çakışma:
   - Rezervasyon slot çakışmaları için riskleri işaretle
   - Gerekirse server-side doğrulama (Functions) öner

## Çıktı formatı
- Offline davranış matrisi (ekran x offline durumu)
- Kritik edge-case listesi (çakışma, timezone, duplicate submit)
- Kodda hangi katmanda uygulanacağı (service/ui)
