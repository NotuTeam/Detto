"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tag } from "@/components/ui/Tag";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Checkbox } from "@/components/ui/Checkbox";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { StarRating } from "@/components/ui/StarRating";
import { ProgressBar } from "@/components/display/ProgressBar";
import { ProfileCard } from "@/components/display/ProfileCard";
import { ConversationCard } from "@/components/display/ConversationCard";
import { PremiumCard } from "@/components/display/PremiumCard";
import { useTheme } from "@/providers";
import { Home, Calendar, Plus, User, BarChart3 } from "lucide-react";

function Section({ index, title, desc, children }: { index: string; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="py-8 border-t border-[var(--border-subtle)]">
      <div className="flex items-baseline justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="text-mono text-[var(--text-secondary)] text-[0.8rem]">{index}</div>
          <h2 className="text-display mt-1" style={{ fontSize: "1.5rem" }}>{title}</h2>
        </div>
        {desc && <p className="max-w-[44ch] text-[var(--text-secondary)] text-[0.95rem] leading-relaxed">{desc}</p>}
      </div>
      {children}
    </section>
  );
}

function ColorSwatch({ color, name, token, use }: { color: string; name: string; token: string; use: string }) {
  return (
    <div className="rounded-[var(--radius-md)] overflow-hidden border border-[var(--border-subtle)] bg-[var(--surface)]">
      <div className="h-[88px]" style={{ background: color }} />
      <div className="p-3 px-4">
        <div className="font-semibold text-[0.95rem]">{name}</div>
        <div className="text-mono text-[0.7rem] text-[var(--text-secondary)]">{token}</div>
        <div className="text-[0.7rem] text-[var(--text-secondary)] mt-0.5">{use}</div>
      </div>
    </div>
  );
}

function TypeRow({ tag, sample, mono }: { tag: string; sample: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline gap-5 py-4 border-b border-dashed border-[var(--border-subtle)] last:border-b-0">
      <span className="text-mono text-[0.7rem] text-[var(--text-secondary)] w-[130px] flex-shrink-0">{tag}</span>
      <span className={cn(mono ? "text-mono" : "font-bold")} style={{ fontFamily: mono ? "var(--font-mono)" : "var(--font-display)" }}>{sample}</span>
    </div>
  );
}

export default function DungeonPage() {
  const { theme, toggleTheme } = useTheme();
  const [tags, setTags] = useState<Record<string, boolean>>({
    Gaming: true, Anime: true, Development: false, "Board games": false,
    Piano: false, Cooking: false, Art: false, Music: false,
  });
  const [sliderVal, setSliderVal] = useState(23);
  const [check1, setCheck1] = useState(true);
  const [rating, setRating] = useState(0);

  function toggleTag(label: string) {
    setTags((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-[var(--surface)] border-b border-[var(--border-subtle)] backdrop-blur-sm">
        <div className="flex items-center gap-2 font-[var(--font-display)] font-bold text-[1.1rem] tracking-tight">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
          Nokta — Design System
        </div>
        <div className="flex items-center gap-2 bg-[var(--surface-alt)] border border-[var(--border-subtle)] rounded-full p-1 text-mono text-[0.7rem]">
          <button
            onClick={() => theme !== "light" && toggleTheme()}
            className={cn("px-3.5 py-1.5 rounded-full cursor-pointer transition-all", theme === "light" ? "bg-[var(--surface-inverse)] text-[var(--text-inverse)]" : "text-[var(--text-secondary)]")}
          >
            Light
          </button>
          <button
            onClick={() => theme !== "dark" && toggleTheme()}
            className={cn("px-3.5 py-1.5 rounded-full cursor-pointer transition-all", theme === "dark" ? "bg-[var(--accent)] text-[var(--text-on-accent)]" : "text-[var(--text-secondary)]")}
          >
            Dark
          </button>
        </div>
      </div>

      <div className="max-w-[1160px] mx-auto px-6">
        {/* Hero */}
        <div className="py-14 pb-10">
          <div className="text-mono text-[0.8rem] uppercase tracking-[0.12em] text-[var(--accent-strong)] mb-3">Design Guidelines · v1.0 · React-ready</div>
          <h1 className="font-[var(--font-display)] font-bold tracking-[-0.03em] leading-[1.05] mb-4" style={{ fontSize: "clamp(2.2rem, 5vw, 3.4rem)", maxWidth: "14ch" }}>
            Satu sistem, dua mode, satu bahasa visual.
          </h1>
          <p className="max-w-[56ch] text-[var(--text-secondary)] text-[1.05rem] leading-relaxed">
            Semua komponen menggunakan semantic CSS variables sehingga tinggal ganti <code className="text-mono bg-[var(--surface-alt)] px-1.5 py-0.5 rounded">data-theme</code> untuk beralih light/dark mode.
          </p>
        </div>

        {/* 01 COLOR */}
        <Section index="01" title="Warna" desc="Palet inti: spruce dark, sage, coral accent, amber. Nilai berubah otomatis mengikuti mode.">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            <ColorSwatch color="var(--brand-dark)" name="Spruce (Dark)" token="--brand-dark" use="Surface inverse, tombol gelap" />
            <ColorSwatch color="var(--brand-sage)" name="Sage" token="--brand-sage" use="Aksen sekunder, gradient" />
            <ColorSwatch color="var(--accent)" name="Coral (Accent)" token="--accent" use="CTA utama, elemen interaktif" />
            <ColorSwatch color="var(--warning)" name="Amber" token="--warning" use="Notifikasi, badge statistik" />
            <ColorSwatch color="var(--surface)" name="Surface" token="--surface" use="Latar kartu & komponen" />
            <ColorSwatch color="var(--bg-page)" name="Page" token="--bg-page" use="Latar belakang app" />
          </div>
          <div className="flex gap-2 flex-wrap mt-3">
            {["--text-primary", "--text-secondary", "--border-subtle", "--success", "--warning", "--scrim"].map((t) => (
              <span key={t} className="bg-[var(--surface-alt)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] px-2.5 py-1.5 text-mono text-[0.7rem] text-[var(--text-secondary)]">{t}</span>
            ))}
          </div>
        </Section>

        {/* 02 TYPOGRAPHY */}
        <Section index="02" title="Tipografi" desc="Nunito untuk display, heading, body, dan data. Satu font family untuk keseluruhan sistem.">
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-6">
            <TypeRow tag="Display / H1 · 700" sample="Aa Kembangkan produk" />
            <TypeRow tag="Display / H2 · 700" sample="Judul Halaman" />
            <TypeRow tag="Display / H3 · 600" sample="Judul Kartu / Komponen" />
            <TypeRow tag="Body · 400" sample="Teks paragraf untuk deskripsi, isi konten, dan label formulir standar." />
            <TypeRow tag="Small · 400" sample="Caption, hint, metadata sekunder." />
            <TypeRow tag="Mono / Data" sample="Rp 1.240.000 · 08:30 · #A19203" mono />
          </div>
        </Section>

        {/* 03 BUTTONS */}
        <Section index="03" title="Tombol" desc="Lima varian: primary (accent), dark, outline, ghost, dan disabled. Radius penuh (pill) sebagai signature bentuk.">
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-6">
            <div className="flex flex-wrap gap-4 items-center">
              <Button>Lanjutkan</Button>
              <Button variant="dark">Simpan Perubahan</Button>
              <Button variant="ghost">Batal</Button>
              <Button variant="secondary">Lewati</Button>
              <Button disabled>Tidak Aktif</Button>
              <Button size="sm">Kecil</Button>
              <IconButton variant="accent"><Plus size={18} /></IconButton>
            </div>
          </div>
        </Section>

        {/* 04 FORMS */}
        <Section index="04" title="Input & Formulir" desc="Text field, search bar, kode OTP, dan textarea dengan status default dan focus.">
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-6">
            <div className="flex flex-wrap gap-4">
              <Input label="Nama lengkap" defaultValue="Michael" className="max-w-50" />
              <Select label="Gender" options={[{ value: "male", label: "Laki-laki" }, { value: "female", label: "Perempuan" }, { value: "other", label: "Lainnya" }]} />
              <Input label="Email" placeholder="nama@email.com" hint="Kami tidak akan membagikan email Anda." className="max-w-50" />
            </div>
          </div>
        </Section>

        {/* 05 SELECTION CONTROLS */}
        <Section index="05" title="Kontrol Pilihan" desc="Checkbox, chip filter, slider, dan rating.">
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-6">
            <div className="flex flex-wrap gap-6 items-start">
              <Checkbox checked={check1} onChange={setCheck1} label="Tampilkan info tambahan" />
              <div className="flex gap-2 flex-wrap">
                {Object.entries(tags).map(([label, selected]) => (
                  <Tag key={label} label={label} selected={selected} onClick={() => toggleTag(label)} />
                ))}
              </div>
            </div>
            <div className="mt-6 max-w-70">
              <RangeSlider label="Preferred age" value={sliderVal} min={18} max={40} displayValue={`18–${sliderVal}`} onChange={setSliderVal} />
            </div>
            <div className="mt-6">
              <StarRating value={rating} onChange={setRating} size="lg" />
            </div>
          </div>
        </Section>

        {/* 06 BADGES */}
        <Section index="06" title="Badge & Status" desc="Penanda status kecil untuk label, kategori, dan indikator numerik.">
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-6">
            <div className="flex flex-wrap gap-3 items-center">
              <Badge label="Baru" variant="accent" />
              <span className="inline-flex items-center gap-1 text-[0.7rem] font-semibold px-2.5 py-1 rounded-full" style={{ background: "color-mix(in srgb, var(--success) 18%, transparent)", color: "var(--success)" }}>● Aktif</span>
              <Badge label="Draft" variant="default" />
              <Badge label="Premium" variant="dark" />
            </div>
          </div>
        </Section>

        {/* 07 AVATARS */}
        <Section index="07" title="Avatar" desc="Placeholder avatar dengan inisial, gradient, dan indikator online.">
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-6">
            <div className="flex items-center gap-3">
              <Avatar name="AR" size="xs" online />
              <Avatar name="JM" size="sm" online />
              <Avatar name="LP" size="md" gradient="linear-gradient(135deg, var(--accent), var(--warning))" />
              <Avatar name="AL" size="lg" gradient="linear-gradient(135deg, var(--accent-strong), var(--brand-dark))" />
              <div className="ml-2">
                <div className="text-[0.6rem] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.06em]">Sizes: xs · sm · md · lg</div>
                <div className="text-[0.6rem] text-[var(--text-secondary)]">● = online indicator</div>
              </div>
            </div>
          </div>
        </Section>

        {/* 08 CARDS */}
        <Section index="08" title="Kartu" desc="List card, stat card, profile card, conversation card, dan premium card.">
          <div className="flex flex-wrap gap-4">
            {/* List Card */}
            <div className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-3 w-full max-w-75">
              <div className="w-[52px] h-[52px] rounded-[var(--radius-sm)] flex-shrink-0" style={{ background: "linear-gradient(135deg, var(--brand-sage), var(--brand-dark))" }} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[0.9rem]">Jaket Lapangan</div>
                <div className="text-[0.8rem] text-[var(--text-secondary)]">Ukuran M · Cokelat</div>
              </div>
              <div className="text-mono font-semibold text-[0.85rem]">Rp 685rb</div>
            </div>

            {/* Stat Card */}
            <div className="bg-[var(--surface-inverse)] text-[var(--text-inverse)] rounded-[var(--radius-lg)] p-5 w-full max-w-65">
              <div className="text-[0.8rem] text-[var(--text-secondary)] mb-2">Total Poin Minggu Ini</div>
              <div className="font-[var(--font-display)] text-[2.1rem] font-bold">73.106</div>
              <div className="text-[0.7rem] text-[var(--warning)] mt-1">▲ 12% dari minggu lalu</div>
            </div>

            {/* Avatar Row */}
            <div className="flex items-center gap-3">
              <Avatar name="AR" size="md" gradient="linear-gradient(135deg, var(--accent), var(--warning))" />
              <div>
                <div className="font-semibold text-[0.9rem]">Alya Ramadhani</div>
                <div className="text-[0.8rem] text-[var(--text-secondary)]">Bergabung 2 hari lalu</div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-4">
            <ProfileCard name="Jessica, 25" subtitle="3 km away" avatarEmoji="👩‍🎤" matchPercentage={94} />
            <div className="flex flex-col gap-2">
              <ConversationCard name="Lucy, 22" subtitle="Say hi!" badge={3} />
              <ConversationCard name="Margareth, 21" subtitle="Photo" online />
            </div>
            <PremiumCard />
          </div>
        </Section>

        {/* 09 PROGRESS */}
        <Section index="09" title="Umpan Balik & Progres" desc="Alert kontekstual, progress bar, dan loading indicator.">
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-6 flex flex-col gap-4">
            <div className="flex gap-3 items-start p-3.5 px-4 rounded-[var(--radius-md)] text-[0.8rem] leading-relaxed" style={{ background: "color-mix(in srgb, var(--success) 15%, var(--surface))", border: "1px solid var(--success)" }}>
              ✓ Perubahan berhasil disimpan.
            </div>
            <div className="flex gap-3 items-start p-3.5 px-4 rounded-[var(--radius-md)] text-[0.8rem] leading-relaxed bg-red-500/10 border border-red-500">
              ⚠ Gagal memuat data. Coba lagi.
            </div>
            <div className="flex gap-3 items-start p-3.5 px-4 rounded-[var(--radius-md)] text-[0.8rem] leading-relaxed bg-[var(--surface-alt)] border border-[var(--border-subtle)]">
              ℹ Sinkronisasi terakhir 5 menit lalu.
            </div>
            <div className="flex items-center gap-4">
              <ProgressBar value={64} label="Question 4/6" />
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-2 h-2 rounded-full bg-[var(--accent)]" style={{ animation: "pulse-dot 1.1s infinite ease-in-out", animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* 10 BOTTOM NAV */}
        <Section index="10" title="Bottom Navigation" desc="Tab bar navigasi utama dengan ikon dan indikator aktif.">
          <div className="bg-[var(--surface-inverse)] rounded-[var(--radius-lg)] flex items-center justify-around py-3 px-5 w-[300px] border-t border-white/[0.08]">
            {[
              { icon: Home, label: "Beranda", active: false },
              { icon: BarChart3, label: "Statistik", active: true },
              { icon: Calendar, label: "Jadwal", active: false },
              { icon: User, label: "Profil", active: false },
            ].map(({ icon: Icon, label, active }) => (
              <div key={label} className="flex flex-col items-center gap-1 cursor-pointer">
                <Icon size={20} className={active ? "text-[var(--accent)]" : "text-white/40"} />
                {active && <div className="w-1 h-1 rounded-full bg-[var(--accent)]" />}
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
