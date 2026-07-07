"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera,
  ChevronLeft,
  User,
  Lock,
  CalendarDays,
  Shield,
  Check,
  Loader2,
  LogOut,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/stores/user";
import { useRelationshipStore } from "@/stores/relationship";
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
} from "@/features/profile/actions";
import { logoutUser } from "@/features/auth/actions";
import {
  subscribePushNotifications,
  unsubscribePushNotifications,
  checkNotificationPermission,
} from "@/lib/push-client";
import { useRouter } from "next/navigation";

interface ProfileData {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  birthDate: string;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);
  const clearUser = useUserStore((s) => s.clearUser);
  const clearRelationship = useRelationshipStore((s) => s.clearRelationship);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit form state
  const [displayName, setDisplayName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Avatar
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  // Password
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  // Notifications
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("default");
  const [notifLoading, setNotifLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    const result = await getProfile();
    if (result.success && result.data) {
      setProfile(result.data as ProfileData);
      setDisplayName(result.data.displayName);
      setBirthDate(result.data.birthDate.split("T")[0]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkNotificationPermission().then(setNotifPermission);
  }, []);

  useEffect(() => {
    let ignore = false;
    getProfile().then((result) => {
      if (ignore) return;
      if (result.success && result.data) {
        setProfile(result.data as ProfileData);
        setDisplayName(result.data.displayName);
        setBirthDate(result.data.birthDate.split("T")[0]);
      }
      setLoading(false);
    });
    return () => { ignore = true; };
  }, []);

  const handleSaveProfile = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    setSaveSuccess(false);

    const result = await updateProfile({
      displayName: displayName.trim(),
      birthDate,
    });

    if (result.success) {
      setSaveSuccess(true);
      // Update global store
      setUser({
        id: profile!.id,
        username: profile!.username,
        displayName: displayName.trim(),
        avatarUrl: profile!.avatarUrl,
        birthDate: birthDate,
      });
      // Refresh profile data
      await fetchProfile();
      setTimeout(() => setSaveSuccess(false), 2000);
    }

    setSaving(false);
  };

  const handleAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);

    const result = await uploadAvatar(file);
    if (result.success && result.data) {
      setProfile((prev) => (prev ? { ...prev, avatarUrl: result.data!.url } : prev));
      setUser({
        id: profile!.id,
        username: profile!.username,
        displayName: profile!.displayName,
        avatarUrl: result.data!.url,
        birthDate: profile!.birthDate,
      });
    }

    setUploadingAvatar(false);
    if (avatarRef.current) avatarRef.current.value = "";
  };

  const handleChangePassword = async () => {
    setPwError(null);
    setPwSuccess(false);

    if (!currentPassword.trim() || !newPassword.trim()) {
      setPwError("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setPwError("Password must be at least 8 characters");
      return;
    }

    setChangingPw(true);

    const result = await changePassword({
      currentPassword: currentPassword.trim(),
      newPassword: newPassword.trim(),
    });

    if (result.success) {
      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setPwSuccess(false);
        setShowPassword(false);
      }, 2000);
    } else {
      setPwError(
        result.error?.code === "INVALID_PASSWORD"
          ? "Current password is incorrect"
          : "Failed to change password"
      );
    }

    setChangingPw(false);
  };

  const handleLogout = async () => {
    await logoutUser();
    clearUser();
    clearRelationship();
    router.push("/login");
  };

  const handleToggleNotifications = async () => {
    setNotifLoading(true);
    try {
      if (notifPermission === "granted") {
        // Disable: unsubscribe
        const ok = await unsubscribePushNotifications();
        if (ok) setNotifPermission("default");
      } else if (notifPermission === "denied") {
        // User previously denied -- can't re-request, show guidance
        alert("Notifications are blocked by your browser. Please enable them in your browser settings.");
      } else {
        // Request permission
        const ok = await subscribePushNotifications();
        if (ok) {
          setNotifPermission("granted");
        } else {
          setNotifPermission(typeof Notification !== "undefined" ? Notification.permission : "denied");
        }
      }
    } catch (err) {
      console.error("Notification toggle failed:", err);
    }
    setNotifLoading(false);
  };

  if (loading) return null;

  if (!profile) {
    return (
      <div className="px-4 py-6 text-center" style={{ color: "var(--text-secondary)" }}>
        Failed to load profile
      </div>
    );
  }

  const memberSince = new Date(profile.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="px-4 py-6 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1
          className="text-[1.3rem] font-extrabold"
          style={{ color: "var(--text-primary)" }}
        >
          Profile
        </h1>
        <p className="text-[0.8rem]" style={{ color: "var(--text-secondary)" }}>
          Your details, your space
        </p>
      </div>

      {/* Avatar Section */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <Avatar
            src={profile.avatarUrl}
            name={profile.displayName}
            size="xl"
          />
          <input
            ref={avatarRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarPick}
            className="hidden"
          />
          <button
            onClick={() => avatarRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50"
            style={{
              background: "var(--accent)",
              color: "var(--text-on-accent)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            {uploadingAvatar ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Camera size={16} />
            )}
          </button>
        </div>
        <div className="text-center">
          <p
            className="text-[0.95rem] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {profile.displayName}
          </p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            @{profile.username}
          </p>
        </div>
      </div>

      {/* Profile Info Card */}
      <div
        className="rounded-[var(--radius-lg)] p-4 flex flex-col gap-4"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-center gap-2">
          <User size={16} style={{ color: "var(--accent)" }} />
          <span
            className="text-[0.85rem] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Personal Information
          </span>
        </div>

        {/* Username (read-only) */}
        <div>
          <label
            className="text-[0.6rem] font-semibold tracking-[0.06em] uppercase mb-1.5 block"
            style={{ color: "var(--text-secondary)" }}
          >
            Username
          </label>
          <div
            className="rounded-[var(--radius-md)] py-[13px] px-4 text-[0.9rem] font-medium"
            style={{
              background: "var(--surface-alt)",
              color: "var(--text-secondary)",
            }}
          >
            @{profile.username}
          </div>
          <p className="text-[0.7rem] mt-1" style={{ color: "var(--text-secondary)" }}>
            Username cannot be changed
          </p>
        </div>

        <Input
          label="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
        />

        <Input
          label="Date of Birth"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
        />

        {/* Member since */}
        <div className="flex items-center gap-2 pt-1">
          <CalendarDays size={14} style={{ color: "var(--text-secondary)" }} />
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Member since {memberSince}
          </span>
        </div>

        <Button
          onClick={handleSaveProfile}
          loading={saving}
          disabled={!displayName.trim() || (displayName === profile.displayName && birthDate === profile.birthDate.split("T")[0])}
          fullWidth
        >
          {saveSuccess ? (
            <>
              <Check size={16} /> Saved
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>

      {/* Password Section */}
      <div
        className="rounded-[var(--radius-lg)] overflow-hidden"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <button
          onClick={() => setShowPassword(!showPassword)}
          className="w-full flex items-center justify-between p-4 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2">
            <Lock size={16} style={{ color: "var(--accent)" }} />
            <span
              className="text-[0.85rem] font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Change Password
            </span>
          </div>
          <ChevronLeft
            size={18}
            className={cn(
              "transition-transform duration-200",
              showPassword && "-rotate-90"
            )}
            style={{ color: "var(--text-secondary)" }}
          />
        </button>

        {showPassword && (
          <div className="px-4 pb-4 flex flex-col gap-3 border-t"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <div className="pt-3" />
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              error={confirmPassword && newPassword !== confirmPassword ? "Passwords do not match" : undefined}
            />

            {pwError && (
              <p className="text-xs text-red-500">{pwError}</p>
            )}

            <Button
              onClick={handleChangePassword}
              loading={changingPw}
              disabled={!currentPassword || !newPassword || !confirmPassword}
              fullWidth
            >
              {pwSuccess ? (
                <>
                  <Check size={16} /> Password Changed
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Notifications Section */}
      <div
        className="rounded-[var(--radius-lg)] p-4 flex flex-col gap-3"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-center gap-2">
          <Bell size={16} style={{ color: "var(--accent)" }} />
          <span
            className="text-[0.85rem] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Notifications
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p
              className="text-[0.85rem] font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Push Notifications
            </p>
            <p className="text-[0.7rem]" style={{ color: "var(--text-secondary)" }}>
              {notifPermission === "granted"
                ? "Receiving notes and reminders"
                : notifPermission === "denied"
                  ? "Blocked by browser"
                  : "Get notified about notes and reminders"}
            </p>
          </div>
          <button
            onClick={handleToggleNotifications}
            disabled={notifLoading || notifPermission === "unsupported"}
            className="relative w-12 h-7 rounded-full cursor-pointer transition-colors duration-200 disabled:opacity-50 shrink-0"
            style={{
              background: notifPermission === "granted" ? "var(--accent)" : "var(--surface-alt)",
              border: notifPermission === "granted" ? "none" : "1px solid var(--border-subtle)",
            }}
          >
            <span
              className="absolute top-0.5 w-6 h-6 rounded-full transition-transform duration-200"
              style={{
                background: notifPermission === "granted" ? "var(--text-on-accent)" : "var(--text-secondary)",
                left: "2px",
                transform: notifPermission === "granted" ? "translateX(20px)" : "translateX(0)",
              }}
            />
            {notifLoading && (
              <Loader2 size={14} className="absolute inset-0 m-auto animate-spin" style={{ color: "var(--text-on-accent)" }} />
            )}
          </button>
        </div>
      </div>

      {/* Account / Danger Zone */}
      <div
        className="rounded-[var(--radius-lg)] p-4 flex flex-col gap-3"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-center gap-2">
          <Shield size={16} style={{ color: "var(--text-secondary)" }} />
          <span
            className="text-[0.85rem] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Account
          </span>
        </div>

        <Button
          variant="ghost"
          fullWidth
          onClick={handleLogout}
        >
          <LogOut size={16} />
          Log Out
        </Button>
      </div>
    </div>
  );
}
