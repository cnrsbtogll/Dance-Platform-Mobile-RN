---
name: rn-navigation-akislari
description: React Native navigasyon akışlarını standartlaştır; auth gating, role bazlı tab/stack yapısı, deep link yaklaşımı ve ekran parametre tiplerini netleştir.
tags: [react-native, navigation, auth, deeplink]
---

## Amaç
Öğrenci/eğitmen/admin akışlarını karışmadan yönetmek.

## Ne zaman kullanılır?
- Yeni ekran eklendiğinde
- “Login olmadan giriliyor” gibi gate bug’larında
- Deep link veya paylaşılabilir link planlanırken

## Kurallar
- Auth durumuna göre root navigator ayrılır (signed-out / signed-in).
- Role bazlı ekranlar hem UI’da saklanır hem backend/rules ile korunur.
- Ekran parametreleri tipli tanımlanır.

## Çıktı formatı
- Navigator ağacı (stack/tab şeması)
- Route listesi + parametreler
- Edge-case: logout sırasında navigation reset, token expire
