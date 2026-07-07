# Cron Job Setup - Nokta

Nokta punya satu endpoint cron di `/api/cron` yang menangani semua tugas terjadwal. Endpoint ini perlu dipanggil secara berkala oleh scheduler eksternal (Vercel Cron, GitHub Actions, Linux crontab, dll).

---

## Endpoint

```
GET https://<YOUR_DOMAIN>/api/cron
```

### Autentikasi

Set header `Authorization` dengan nilai dari environment variable `CRON_SECRET`:

```
Authorization: Bearer <CRON_SECRET>
```

Jika `CRON_SECRET` tidak diset di `.env`, endpoint bisa diakses tanpa autentikasi (tidak direkomendasikan untuk production).

---

## Tugas yang Dijalankan

### 1. Update Status Event Expired (setiap hari)

Mengubah status event `UPCOMING` yang tanggalnya sudah lewat menjadi `PAST`.

```
updateExpiredEventStatuses()
```

### 2. Kirim Reminder Hari-H (setiap hari)

Membuat notifikasi `EVENT_TODAY` untuk semua event yang jatuh hari ini. Notifikasi dikirim ke kedua partner. Hanya dikirim sekali per event (dicek sebelum insert).

```
sendDayOfEventReminders()
```

### 3. Auto-check Wishlist (setiap hari)

Mengecek wishlist item yang linked event-nya sudah lewat, lalu otomatis menandai sebagai "done" (`isChecked = true`).

```
checkWishlistItemsForPassedEvents()
```

### 4. Generate Auto Events Tahunan (1 Januari saja)

Pada tanggal 1 Januari, otomatis membuat event untuk:
- Birthday Partner A
- Birthday Partner B
- Anniversary (dari `marriedAt` atau `startedAt`)

```
generateAutoEventsForAllRelationships()
```

---

## Rekomendasi Jadwal

| Frekuensi | Waktu | Alasan |
|-----------|-------|--------|
| **1x/hari** | `01:00 UTC` | Menangkap reminder hari-h sebelum user bangun, update expired status |

Cukup **satu kali sehari**. Semua 4 tugas dijalankan dalam satu request.

---

## Setup per Platform

### Vercel (Recommended)

Tambahkan di `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 1 * * *"
    }
  ]
}
```

Set environment variable di Vercel Dashboard:
- `CRON_SECRET` = nilai random yang aman

Vercel akan otomatis memanggil endpoint setiap hari jam 01:00 UTC.

### GitHub Actions

Buat file `.github/workflows/cron.yml`:

```yaml
name: Nokta Cron

on:
  schedule:
    - cron: '0 1 * * *'  # Setiap hari jam 01:00 UTC

jobs:
  trigger-cron:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger cron
        run: |
          curl -sf -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            "${{ secrets.APP_URL }}/api/cron"
```

Set secrets di GitHub repository:
- `CRON_SECRET` = nilai yang sama dengan `.env`
- `APP_URL` = `https://your-domain.com`

### Linux Crontab

```bash
crontab -e
```

Tambahkan:

```cron
0 1 * * * curl -sf -X GET -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron >> /var/log/nokta-cron.log 2>&1
```

### Manual / Testing

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron
```

Response sukses:

```json
{
  "success": true,
  "message": "Event reminders sent and expired statuses updated",
  "timestamp": "2026-07-06T07:15:03.104Z"
}
```

---

## Environment Variables

| Variable | Contoh | Keterangan |
|----------|--------|------------|
| `CRON_SECRET` | `your-random-secret` | Token autentikasi untuk cron endpoint |

---

## Troubleshooting

### Cron return 401 Unauthorized

Pastikan header `Authorization` dikirim dengan format: `Bearer <CRON_SECRET>`, dan nilainya cocok dengan yang di `.env`.

### Notifikasi tidak muncul

1. Cek apakah ada event dengan tanggal hari ini di database
2. Cek apakah `sendDayOfEventReminders()` sudah dijalankan (bisa dicek dari response timestamp)
3. Notifikasi hanya dikirim sekali per event - jika sudah pernah dikirim, tidak akan dikirim ulang

### Auto events tidak tergenerate

Auto events hanya dibuat pada **1 Januari**. Untuk generate manual, jalankan cron pada tanggal lain tidak akan trigger `generateAutoEventsForAllRelationships()`.
