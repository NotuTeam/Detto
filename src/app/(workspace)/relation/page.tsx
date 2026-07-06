"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Heart,
  Copy,
  Check,
  Sparkles,
  User,
  ExternalLink,
  Camera,
  Loader2,
  X,
  Gem,
  Edit3,
  Cake,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useUserStore } from "@/stores/user";
import { useRelationshipStore } from "@/stores/relationship";
import {
  getCurrentRelationship,
  getPendingInvitation,
  updateRelationship,
  uploadBanner,
  removeBanner,
  createRelationship,
} from "@/features/relationship/actions";

export default function RelationPage() {
  const user = useUserStore((s) => s.user);
  const relationship = useRelationshipStore((s) => s.relationship);
  const setRelationship = useRelationshipStore((s) => s.setRelationship);

  const [invitation, setInvitation] = useState<{
    shortCode: string;
    expiredAt: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Banner
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const bannerRef = useRef<HTMLInputElement>(null);

  // Nickname edit bottom sheet
  const [nicknameEditOpen, setNicknameEditOpen] = useState(false);
  const [editPartnerNickname, setEditPartnerNickname] = useState("");
  const [nicknameSaving, setNicknameSaving] = useState(false);

  // Date edit bottom sheet
  const [dateEditOpen, setDateEditOpen] = useState(false);
  const [dateEditField, setDateEditField] = useState<
    "startedAt" | "engagementDate" | "marriedAt"
  >("startedAt");
  const [dateEditValue, setDateEditValue] = useState("");
  const [dateSaving, setDateSaving] = useState(false);

  // Create relationship state
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createStartedAt, setCreateStartedAt] = useState("");
  const [creating, setCreating] = useState(false);

  const isWaiting = relationship?.status === "WAITING_PARTNER";
  const isActive = relationship?.status === "ACTIVE";
  const isPartnerA = user?.id === relationship?.partnerA?.id;

  const myNickname = isPartnerA
    ? relationship?.partnerANickname
    : relationship?.partnerBNickname;
  const partnerNickname = isPartnerA
    ? relationship?.partnerBNickname
    : relationship?.partnerANickname;

  const loadRelationship = useCallback(
    (relResult: {
      id: string;
      name: string | null;
      status: string;
      partnerA: {
        id: string;
        displayName: string;
        username: string;
        avatarUrl: string | null;
        birthDate: Date | null;
      };
      partnerB: {
        id: string;
        displayName: string;
        username: string;
        avatarUrl: string | null;
        birthDate: Date | null;
      } | null;
      partnerANickname: string | null;
      partnerBNickname: string | null;
      bannerUrl: string | null;
      startedAt: Date;
      engagementDate: Date | null;
      marriedAt: Date | null;
      timezone: string | null;
    }) => {
      const serializePartner = (
        p: {
          id: string;
          displayName: string;
          username: string;
          avatarUrl: string | null;
          birthDate: Date | null;
        } | null,
      ) =>
        p
          ? {
              id: p.id,
              displayName: p.displayName,
              username: p.username,
              avatarUrl: p.avatarUrl || null,
              birthDate: p.birthDate
                ? p.birthDate instanceof Date
                  ? p.birthDate.toISOString()
                  : String(p.birthDate)
                : null,
            }
          : null;

      setRelationship({
        id: relResult.id,
        name: relResult.name,
        status: relResult.status,
        partnerA: serializePartner(relResult.partnerA)!,
        partnerB: serializePartner(relResult.partnerB),
        partnerANickname: relResult.partnerANickname || null,
        partnerBNickname: relResult.partnerBNickname || null,
        bannerUrl: relResult.bannerUrl || null,
        startedAt:
          relResult.startedAt instanceof Date
            ? relResult.startedAt.toISOString()
            : String(relResult.startedAt),
        engagementDate: relResult.engagementDate
          ? relResult.engagementDate instanceof Date
            ? relResult.engagementDate.toISOString()
            : String(relResult.engagementDate)
          : null,
        marriedAt: relResult.marriedAt
          ? relResult.marriedAt instanceof Date
            ? relResult.marriedAt.toISOString()
            : String(relResult.marriedAt)
          : null,
        timezone: relResult.timezone || null,
      });

      const isPA = relResult.partnerA.id === user?.id;
      const partnerNick = isPA
        ? relResult.partnerBNickname
        : relResult.partnerANickname;
      setEditPartnerNickname(partnerNick || "");
    },
    [setRelationship, user?.id],
  );

  const loadData = useCallback(async () => {
    const [relResult, invResult] = await Promise.all([
      getCurrentRelationship(),
      getPendingInvitation(),
    ]);
    if (relResult) loadRelationship(relResult);
    if (invResult.success && invResult.data) {
      setInvitation(invResult.data);
    }
  }, [loadRelationship]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      const [relResult, invResult] = await Promise.all([
        getCurrentRelationship(),
        getPendingInvitation(),
      ]);
      if (ignore || !relResult) return;
      loadRelationship(relResult);
      if (invResult.success && invResult.data) {
        setInvitation(invResult.data);
      }
    })();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Banner
  const handleBannerPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    const result = await uploadBanner(file);
    if (result.success) await loadData();
    setUploadingBanner(false);
    if (bannerRef.current) bannerRef.current.value = "";
  };

  const handleRemoveBanner = async () => {
    const result = await removeBanner();
    if (result.success) await loadData();
  };

  // Copy invitation code
  const handleCopy = async () => {
    if (!invitation) return;
    try {
      await navigator.clipboard.writeText(invitation.shortCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  // Nickname save
  const openNicknameEdit = () => {
    setNicknameEditOpen(true);
  };

  const handleNicknameSave = async () => {
    setNicknameSaving(true);
    const isPA = user?.id === relationship?.partnerA?.id;
    const payload: Record<string, string> = {
      startedAt: relationship!.startedAt.split("T")[0],
    };
    // Only update the nickname for the partner (what we see as their name)
    if (isPA) {
      payload.partnerBNickname = editPartnerNickname.trim();
    } else {
      payload.partnerANickname = editPartnerNickname.trim();
    }
    const result = await updateRelationship(
      payload as {
        name?: string;
        partnerANickname?: string;
        partnerBNickname?: string;
        startedAt?: string;
        engagementDate?: string;
        marriedAt?: string;
      },
    );
    if (result.success) {
      await loadData();
      setNicknameEditOpen(false);
    }
    setNicknameSaving(false);
  };

  // Date edit
  const dateLabels: Record<string, string> = {
    startedAt: "Dating",
    engagementDate: "Engagement",
    marriedAt: "Wedding",
  };

  const openDateEdit = (
    field: "startedAt" | "engagementDate" | "marriedAt",
  ) => {
    setDateEditField(field);
    const current = relationship?.[field];
    setDateEditValue(current ? current.split("T")[0] : "");
    setDateEditOpen(true);
  };

  const handleDateSave = async () => {
    setDateSaving(true);
    const payload: Record<string, string> = {
      startedAt: relationship!.startedAt.split("T")[0],
    };
    payload[dateEditField] = dateEditValue;
    const result = await updateRelationship(
      payload as {
        name?: string;
        partnerANickname?: string;
        partnerBNickname?: string;
        startedAt?: string;
        engagementDate?: string;
        marriedAt?: string;
      },
    );
    if (result.success) {
      await loadData();
      setDateEditOpen(false);
    }
    setDateSaving(false);
  };

  // Create relationship
  const handleCreate = async () => {
    if (!createStartedAt) return;
    setCreating(true);
    const result = await createRelationship({
      name: createName.trim() || undefined,
      startedAt: createStartedAt,
    });
    if (result.success) {
      await loadData();
      setCreateOpen(false);
      setCreateName("");
      setCreateStartedAt("");
    }
    setCreating(false);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const getDurationText = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const days = Math.floor(
      (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    const years = Math.floor(days / 365);
    const remainingDays = days % 365;
    const months = Math.floor(remainingDays / 30);
    const finalDays = remainingDays % 30;
    const parts = [];
    if (years > 0) parts.push(`${years} year${years !== 1 ? "s" : ""}`);
    if (months > 0) parts.push(`${months} month${months !== 1 ? "s" : ""}`);
    if (finalDays > 0 || parts.length === 0)
      parts.push(`${finalDays} day${finalDays !== 1 ? "s" : ""}`);
    return parts.join(", ");
  };

  const getBirthdayCountdown = (birthDate: string): string => {
    const birthday = new Date(birthDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get this year's birthday
    let nextBirthday = new Date(
      now.getFullYear(),
      birthday.getMonth(),
      birthday.getDate(),
    );

    // If this year's birthday has passed, use next year
    if (nextBirthday < today) {
      nextBirthday = new Date(
        now.getFullYear() + 1,
        birthday.getMonth(),
        birthday.getDate(),
      );
    }

    const daysUntil = Math.ceil(
      (nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntil === 0) return "Today!";
    if (daysUntil === 1) return "Tomorrow!";
    return `in ${daysUntil} days`;
  };

  // No relationship state
  if (!relationship) {
    return (
      <div className="px-4 py-6 flex flex-col gap-6">
        <div>
          <h1
            className="text-[1.3rem] font-extrabold"
            style={{ color: "var(--text-primary)" }}
          >
            Relationship
          </h1>
          <p
            className="text-[0.8rem]"
            style={{ color: "var(--text-secondary)" }}
          >
            Start or join a relationship
          </p>
        </div>

        <div
          className="rounded-[var(--radius-lg)] p-8 flex flex-col items-center gap-4"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "var(--accent)", opacity: 0.15 }}
          >
            <Heart size={28} style={{ color: "var(--accent)" }} />
          </div>
          <div className="text-center">
            <p
              className="text-[0.95rem] font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              No relationship yet
            </p>
            <p
              className="text-[0.8rem] mt-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Create a new relationship or join with an invitation code from
              your partner
            </p>
          </div>
          <Button fullWidth onClick={() => setCreateOpen(true)}>
            Create Relationship
          </Button>
        </div>

        <BottomSheet
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
          title="New Relationship"
        >
          <div className="flex flex-col gap-4">
            <Input
              label="When did you start dating?"
              type="date"
              value={createStartedAt}
              onChange={(e) => setCreateStartedAt(e.target.value)}
            />
            <Button
              fullWidth
              loading={creating}
              disabled={!createStartedAt}
              onClick={handleCreate}
            >
              Create & Generate Invite Code
            </Button>
          </div>
        </BottomSheet>
      </div>
    );
  }

  const partner = isPartnerA ? relationship.partnerB : relationship.partnerA;
  const partnerDisplayName =
    partnerNickname || partner?.displayName || "Partner";
  const me = isPartnerA ? relationship.partnerA : relationship.partnerB;
  const myDisplayName = myNickname || user?.displayName || "You";

  return (
    <div className="px-4 py-6 flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1
          className="text-[1.3rem] font-extrabold"
          style={{ color: "var(--text-primary)" }}
        >
          Relationship
        </h1>
        <p className="text-[0.8rem]" style={{ color: "var(--text-secondary)" }}>
          {isActive ? "Your love journey" : "Waiting for your partner to join"}
        </p>
      </div>

      {/* Couple Card */}
      <div
        className="rounded-[var(--radius-lg)] overflow-hidden"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {/* Banner */}
        <div
          className="h-24 relative group"
          style={{
            background: relationship.bannerUrl
              ? undefined
              : "linear-gradient(135deg, var(--brand-dark), var(--brand-sage, var(--brand-sage-300)))",
          }}
        >
          {relationship.bannerUrl && (
            <img
              src={relationship.bannerUrl}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          )}

          <input
            ref={bannerRef}
            type="file"
            accept="image/*"
            onChange={handleBannerPick}
            className="hidden"
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            {relationship.bannerUrl && (
              <button
                onClick={handleRemoveBanner}
                className="w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center cursor-pointer hover:bg-black/70"
              >
                <X size={14} />
              </button>
            )}
            <button
              onClick={() => bannerRef.current?.click()}
              disabled={uploadingBanner}
              className="w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center cursor-pointer hover:bg-black/70 disabled:opacity-50"
            >
              {uploadingBanner ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Camera size={14} />
              )}
            </button>
          </div>

          {relationship.name && (
            <span
              className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[0.75rem] font-semibold px-3 py-0.5 rounded-full"
              style={{ background: "rgba(0,0,0,0.45)", color: "white" }}
            >
              {relationship.name}
            </span>
          )}
        </div>

        {/* Avatars */}
        <div className="flex items-center justify-center gap-10 -mt-6 relative z-10 px-4 pb-4">
          <div className="flex flex-col items-center gap-1.5">
            <Avatar
              src={user?.avatarUrl || me?.avatarUrl}
              name={myDisplayName}
              size="lg"
            />
            <span
              className="text-[0.75rem] font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {myDisplayName}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            {partner ? (
              <>
                <Avatar
                  src={partner.avatarUrl}
                  name={partner.displayName || "?"}
                  size="lg"
                />
                <span
                  className="text-[0.75rem] font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {partnerDisplayName}
                </span>
              </>
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: "var(--surface-alt)",
                  border: "2px dashed var(--border-subtle)",
                }}
              >
                <User size={24} style={{ color: "var(--text-secondary)" }} />
              </div>
            )}
          </div>
        </div>

        {/* Duration */}
        {isActive && (
          <div className="text-center pb-4 px-4">
            <p
              className="text-[0.85rem] font-semibold"
              style={{ color: "var(--accent)" }}
            >
              {getDurationText(relationship.startedAt)}
            </p>
            <p
              className="text-[0.7rem] mt-0.5"
              style={{ color: "var(--text-secondary)" }}
            >
              since {formatDate(relationship.startedAt)}
            </p>
          </div>
        )}
      </div>

      {/* Invitation code (waiting state) */}
      {isWaiting && invitation && (
        <div
          className="rounded-[var(--radius-lg)] p-4 flex flex-col gap-3"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: "var(--accent)" }} />
            <span
              className="text-[0.85rem] font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Invitation Code
            </span>
          </div>
          <p
            className="text-[0.78rem]"
            style={{ color: "var(--text-secondary)" }}
          >
            Share this code with your partner to join your relationship
          </p>
          <div className="flex items-center gap-2">
            <div
              className="flex-1 rounded-[var(--radius-md)] py-3 px-4 text-center"
              style={{ background: "var(--surface-alt)" }}
            >
              <span
                className="text-[1.5rem] font-extrabold tracking-[0.2em]"
                style={{ color: "var(--text-primary)" }}
              >
                {invitation.shortCode}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="w-11 h-11 rounded-[var(--radius-md)] flex items-center justify-center cursor-pointer transition-colors flex-shrink-0"
              style={{
                background: copied ? "var(--success)" : "var(--accent)",
                color: "var(--text-on-accent)",
              }}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
          <p
            className="text-[0.65rem] text-center"
            style={{ color: "var(--text-secondary)" }}
          >
            Expires {formatDate(invitation.expiredAt)}
          </p>
        </div>
      )}

      {/* Important Dates */}
      <div className="flex gap-2">
        <DateCard
          icon={Heart}
          label="Dating"
          date={relationship.startedAt}
          onEdit={() => openDateEdit("startedAt")}
        />
        <DateCard
          icon={Sparkles}
          label="Engagement"
          date={relationship.engagementDate}
          onEdit={() => openDateEdit("engagementDate")}
        />
        <DateCard
          icon={Gem}
          label="Wedding"
          date={relationship.marriedAt}
          onEdit={() => openDateEdit("marriedAt")}
        />
      </div>

      {/* Partner Info */}
      {partner && (
        <div
          className="rounded-[var(--radius-lg)] p-4 flex flex-col gap-3"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="text-[0.85rem] font-bold uppercase"
                style={{ color: "var(--accent)" }}
              >
                Partner Info
              </span>
            </div>
            <button
              onClick={openNicknameEdit}
              className="p-1.5 rounded-full cursor-pointer transition-colors hover:opacity-70"
              style={{
                background: "var(--surface-alt)",
                color: "var(--text-secondary)",
              }}
            >
              <Edit3 size={14} />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex gap-4 items-center">
              <Avatar
                src={partner.avatarUrl}
                name={partner.displayName || "?"}
                size="sm"
              />
              <div className="flex flex-col justify-center flex-1">
                <h1>
                  {partner.displayName}{" "}
                  {partnerNickname && (
                    <span className="text-[0.7rem] opacity-50">
                      ({partnerNickname})
                    </span>
                  )}
                </h1>
                <span className="text-[0.7rem]">{`@${partner.username}`}</span>
              </div>
            </div>
            <div
              className="rounded-[var(--radius-lg)] p-4 relative overflow-hidden text-left w-full cursor-pointer transition-all hover:brightness-95 active:scale-[0.98]"
              style={{
                background: "var(--surface-alt)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <Cake
                className="absolute -right-1 top-1/3 -translate-y-1/3 opacity-[0.06]"
                style={{ color: "var(--text-primary)" }}
                size={120}
                strokeWidth={1}
              />

              <div className="relative flex flex-col items-start h-full">
                <p
                  className="text-[0.72rem] font-semibold uppercase tracking-[0.06em]"
                  style={{ color: "var(--accent)" }}
                >
                  Birthday
                </p>
                {partner.birthDate ? (
                  <>
                    <p
                      className="text-[0.8rem] font-bold leading-tight mt-0.5"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {new Date(partner.birthDate).toLocaleDateString("en-US", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p
                      className="text-[0.7rem] font-semibold mt-1"
                      style={{ color: "var(--accent)" }}
                    >
                      {getBirthdayCountdown(partner.birthDate)}
                    </p>
                  </>
                ) : (
                  <p
                    className="text-[0.8rem] italic mt-0.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Not set yet
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join link (waiting state) */}
      {isWaiting && invitation && (
        <a
          href={`/invite/${invitation.shortCode}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-3 rounded-[var(--radius-md)] transition-opacity hover:opacity-80"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
          }}
        >
          <ExternalLink size={16} style={{ color: "var(--accent)" }} />
          <span className="text-[0.8rem] font-medium">Open invite link</span>
        </a>
      )}

      {/* Nickname Edit BottomSheet */}
      <BottomSheet
        isOpen={nicknameEditOpen}
        onClose={() => setNicknameEditOpen(false)}
        title="Edit Nickname"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Partner's Nickname"
            value={editPartnerNickname}
            onChange={(e) => setEditPartnerNickname(e.target.value)}
            placeholder="e.g. Baby"
          />
          <Button
            fullWidth
            loading={nicknameSaving}
            onClick={handleNicknameSave}
          >
            Save
          </Button>
        </div>
      </BottomSheet>

      {/* Date Edit BottomSheet */}
      <BottomSheet
        isOpen={dateEditOpen}
        onClose={() => setDateEditOpen(false)}
        title={dateLabels[dateEditField]}
      >
        <div className="flex flex-col gap-4">
          <Input
            label={dateLabels[dateEditField]}
            type="date"
            value={dateEditValue}
            onChange={(e) => setDateEditValue(e.target.value)}
          />
          <Button fullWidth loading={dateSaving} onClick={handleDateSave}>
            Save
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}

function DateCard({
  icon: Icon,
  label,
  date,
  onEdit,
}: {
  icon: typeof Heart;
  label: string;
  date: string | null;
  onEdit: () => void;
}) {
  return (
    <button
      onClick={onEdit}
      className="rounded-[var(--radius-lg)] p-4 relative overflow-hidden text-left w-full cursor-pointer transition-all hover:brightness-95 active:scale-[0.98]"
      style={{
        background: "var(--surface-alt)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <Icon
        className="absolute -left-1/3 top-1/3 -translate-y-1/3 opacity-[0.06]"
        style={{ color: "var(--text-primary)" }}
        size={120}
        strokeWidth={1}
      />

      <div className="relative flex flex-col items-start h-full">
        <p
          className="text-[0.72rem] font-semibold uppercase tracking-[0.06em]"
          style={{ color: "var(--accent)" }}
        >
          {label}
        </p>
        {date ? (
          <p
            className="text-[0.8rem] font-bold leading-tight mt-0.5"
            style={{ color: "var(--text-primary)" }}
          >
            {new Date(date).toLocaleDateString("en-US", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        ) : (
          <p
            className="text-[0.8rem] italic mt-0.5"
            style={{ color: "var(--text-secondary)" }}
          >
            Not set yet
          </p>
        )}
      </div>
    </button>
  );
}
