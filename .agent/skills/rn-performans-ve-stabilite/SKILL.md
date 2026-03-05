---
name: rn-performans-ve-stabilite
description: Mobil uygulamada performans ve stabilite iyileştirmeleri yap; render optimizasyonu, liste performansı, network maliyeti, crash/analytics sinyalleri ve memory risklerini ele al.
tags: [react-native, performance, stability, profiling]
---

## Amaç
Akıcı UI ve düşük crash rate.

## Ne zaman kullanılır?
- Liste ekranları takılıyorsa
- Aşırı network/Firestore okuması varsa
- Crash artışı veya ANR benzeri sorunlar görülürse

## Uygulama adımları
1) Ekranı seç, ölçüm hedefi koy (örn. scroll jank, ekran açılış süresi).
2) Render maliyetini düşür: memoization, bölme, gereksiz state’i kaldır.
3) Liste performansı: sanallaştırma ayarları, item rendering, stable keys.
4) Network maliyeti: gereksiz dinleyicileri kapat, sorguları sadeleştir.

## Çıktı formatı
- Teşhis (olası nedenler)
- 3–5 somut iyileştirme adımı
- Risk/geri alma planı
