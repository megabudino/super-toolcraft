# Neon Iceberg Experiments

Снимок рабочей ветки `codex/iceberg-experiments` с сохранёнными пользовательскими defaults.

В этой папке выполните:

```sh
pnpm install --frozen-lockfile
pnpm dev --host 127.0.0.1 --port 3003 --strictPort
```

Откройте http://127.0.0.1:3003/. На первом запуске: канвас 1200×1600, высота 1.55, seed 97, зазор пластин 0.11, паттерн 90 / 84 / 24°. Если в браузере уже была другая версия на этом адресе, кнопка Reset controls рядом с названием Iceberg восстанавливает defaults из этого приложения.
