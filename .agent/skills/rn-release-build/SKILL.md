---
name: rn-release-build
description: React Native (Android/iOS) build ve release sürecini standardize et; env yönetimi, versiyonlama, debug/production ayrımı, store checklist ve hotfix akışını uygulat.
tags: [react-native, android, ios, release, build, ci]
---

## Amaç
Mobil release öncesi hataları azaltmak ve sürüm çıkışını hızlandırmak.

## Ne zaman kullanılır?
- Store’a gönderim öncesi
- CI pipeline kurulurken
- Sertifika/provisioning sorunlarında

## Çıktı formatı
- Release checklist (Android + iOS)
- Versiyonlama notları
- Riskli noktalar (env karışması, debug flag’ler)
