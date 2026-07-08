"use client";

import Image from "next/image";
import { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Camera,
  Share2,
  Copy,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/features/auth/components/ProgressBar";
import { PasswordInput } from "@/features/auth/components/PasswordInput";
import { registerUser } from "@/features/auth/actions";
import {
  createRelationship,
  joinRelationship,
} from "@/features/relationship/actions";
import { uploadAvatarAction } from "@/features/media/actions";
import { compressImage } from "@/lib/compress-image";
import { UploadOverlay, type UploadStep } from "@/components/ui/UploadOverlay";
import { toast } from "sonner";
import { PageBlobs } from "@/components/ui/DecorativeBlobs";

import Success from "@/assets/illustration/success.svg";
import Couple from "@/assets/illustration/couple.svg";

const TOTAL_STEPS = 8;

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen"
          style={{ background: "var(--bg-page)" }}
        />
      }
    >
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("invite");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadStep, setUploadStep] = useState<UploadStep>(null);
  const [relationSub, setRelationSub] = useState<"choice" | "join" | "code">(
    "choice",
  );
  const [startedDate, setStartedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const photoInputRef = useRef<HTMLInputElement>(null);

  function isOldEnough(dateStr: string): boolean {
    const birth = new Date(dateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age >= 14;
  }

  function canNext(): boolean {
    switch (step) {
      case 1:
        return displayName.trim().length > 0;
      case 2:
        return username.trim().length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
      case 3:
        return birthDate.length > 0 && isOldEnough(birthDate);
      case 4:
        return password.length >= 8 && password === confirmPassword;
      default:
        return true;
    }
  }

  async function handleNext() {
    setError("");
    if (step === 4) {
      if (password !== confirmPassword) {
        setError("Passwords don't match");
        return;
      }
      setLoading(true);
      const result = await registerUser({
        displayName,
        username,
        password,
        birthDate,
      });
      setLoading(false);
      if (!result.success) {
        const msg = result.error?.message || "Registration failed";
        setError(msg);
        if (msg.toLowerCase().includes("username")) {
          setStep(2);
        }
        return;
      }
      // Always go to success step (5), regardless of invite code
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function handleBack() {
    setError("");
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleCreateRelation() {
    setLoading(true);
    setError("");
    const result = await createRelationship({
      startedAt: new Date(startedDate).toISOString(),
    });
    setLoading(false);
    if (result.success && result.data) {
      setShortCode(result.data.shortCode);
      setRelationSub("code");
    } else {
      setError(result.error?.message || "Failed to create relationship");
    }
  }

  async function handleJoinRelation() {
    if (inputCode.trim().length !== 5) {
      setError("Enter a 5-character invitation code");
      return;
    }
    setLoading(true);
    setError("");
    const result = await joinRelationship({ shortCode: inputCode.trim() });
    setLoading(false);
    if (result.success) {
      toast.success("Successfully joined!");
      router.push("/home");
    } else {
      setError(result.error?.message || "Failed to join");
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(shortCode);
    toast.success("Invitation code copied!");
  }

  function handleShare() {
    const inviteLink = `${window.location.origin}/invite/${shortCode}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invitation link copied!");
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      setUploadStep("compressing");
      const compressed = await compressImage(file).catch(() => file);
      setUploadStep("uploading");
      const result = await uploadAvatarAction(compressed);
      if (result.success && result.data) {
        setAvatarUrl(result.data.url);
        toast.success("Profile photo uploaded successfully");
      } else {
        toast.error(result.error?.message || "Failed to upload photo");
      }
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
      setUploadStep(null);
    }
  }

  return (
    <div
      className="h-screen flex flex-col px-6 py-8 relative overflow-hidden"
      style={{ background: "var(--bg-page)" }}
    >
      <UploadOverlay step={uploadStep} />
      {/* Progress bar */}
      <ProgressBar
        current={step}
        total={TOTAL_STEPS}
        className="fixed top-0 left-0 right-0 z-50"
      />
      <PageBlobs seed={2} />

      {/* Back button */}
      {((step > 1 && step < 5) || step >= 7) && (
        <button
          onClick={handleBack}
          className="absolute top-6 left-6 transition-colors cursor-pointer"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={20} />
        </button>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-95 mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="w-full"
          >
            {/* Step 1: Display Name */}
            {step === 1 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      color: "var(--text-primary)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    What&apos;s your name?
                  </h2>
                  <p
                    style={{
                      fontSize: "0.95rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    This is what your partner will see
                  </p>
                </div>
                <Input
                  label="Full Name"
                  name="displayName"
                  placeholder="Enter your nickname"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoFocus
                />
              </div>
            )}

            {/* Step 2: Username */}
            {step === 2 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      color: "var(--text-primary)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Create a username
                  </h2>
                  <p
                    style={{
                      fontSize: "0.95rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    One name, only yours
                  </p>
                </div>
                <Input
                  label="Username"
                  name="username"
                  placeholder="@username"
                  value={username}
                  onChange={(e) =>
                    setUsername(
                      e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                    )
                  }
                  hint="3-20 characters, letters/numbers/underscores"
                />
              </div>
            )}

            {/* Step 3: Birth Date */}
            {step === 3 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      color: "var(--text-primary)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    When were you born?
                  </h2>
                  <p
                    style={{
                      fontSize: "0.95rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    So your partner never forgets this date
                  </p>
                </div>
                <Input
                  label="Date of Birth"
                  name="birthDate"
                  type="date"
                  value={birthDate}
                  max={
                    new Date(
                      new Date().setFullYear(new Date().getFullYear() - 14),
                    )
                      .toISOString()
                      .split("T")[0]
                  }
                  onChange={(e) => setBirthDate(e.target.value)}
                />
                {birthDate && !isOldEnough(birthDate) && (
                  <p
                    className="text-[0.8rem]"
                    style={{ color: "var(--accent)" }}
                  >
                    You must be at least 14 years old to register
                  </p>
                )}
              </div>
            )}

            {/* Step 4: Password */}
            {step === 4 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      color: "var(--text-primary)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Create a password
                  </h2>
                  <p
                    style={{
                      fontSize: "0.95rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    At least 8 characters — make it a strong one
                  </p>
                </div>
                <PasswordInput
                  label="Password"
                  name="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <PasswordInput
                  label="Confirm Password"
                  name="confirmPassword"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {password.length > 0 &&
                  confirmPassword.length > 0 &&
                  password !== confirmPassword && (
                    <p
                      className="text-[0.8rem]"
                      style={{ color: "var(--accent)" }}
                    >
                      Passwords don&apos;t match
                    </p>
                  )}
              </div>
            )}

            {/* Step 5: Success */}
            {step === 5 && (
              <div className="flex flex-col items-center gap-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.1,
                  }}
                >
                  <Image
                    src={Success}
                    alt="Success"
                    width={280}
                    height={280}
                    className="mb-8 w-auto h-auto"
                    priority
                  />
                </motion.div>
                <div className="text-center">
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Your account is ready
                  </h2>
                  <p
                    style={{
                      fontSize: "0.95rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {inviteCode
                      ? "You've been invited to join. Let's set up your profile first."
                      : "One more step before your story begins."}
                  </p>
                </div>
                <Button fullWidth onClick={() => setStep(6)}>
                  Continue <ArrowRight size={16} />
                </Button>
              </div>
            )}

            {/* Step 6: Photo Upload */}
            {step === 6 && (
              <div className="flex flex-col items-center gap-6">
                <div className="text-center">
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Profile Photo
                  </h2>
                  <p
                    style={{
                      fontSize: "0.95rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Upload your best photo (optional)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center border-2 border-dashed transition-colors cursor-pointer disabled:opacity-50"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : uploadingPhoto ? (
                    <Loader2
                      size={32}
                      className="animate-spin"
                      style={{ color: "var(--text-secondary)" }}
                    />
                  ) : (
                    <Camera
                      size={32}
                      style={{ color: "var(--text-secondary)" }}
                    />
                  )}
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <div className="flex flex-col gap-3 w-full">
                  <Button
                    fullWidth
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploadingPhoto}
                  >
                    <Camera size={16} />{" "}
                    {uploadingPhoto
                      ? "Uploading..."
                      : avatarUrl
                        ? "Change Photo"
                        : "Upload Photo"}
                  </Button>
                  <Button
                    variant="plain"
                    fullWidth
                    onClick={async () => {
                      if (inviteCode) {
                        setLoading(true);
                        const joinResult = await joinRelationship({
                          shortCode: inviteCode,
                        });
                        setLoading(false);
                        if (joinResult.success) {
                          toast.success("Successfully joined!");
                          router.push("/home");
                          return;
                        }
                        // If join fails, still go to home (user registered but didn't join)
                        toast.error(
                          "Could not join relationship automatically",
                        );
                        router.push("/home");
                      } else {
                        setStep(7);
                      }
                    }}
                  >
                    {avatarUrl ? "Continue" : "Skip For Now"}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 7: Start a Relationship */}
            {step === 7 && (
              <div className="flex flex-col items-center gap-6">
                <div className="text-left w-full">
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Begin a Relationship
                  </h2>
                  <p
                    style={{
                      fontSize: "0.95rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    When did your story start?
                  </p>
                </div>
                <div className="flex flex-col gap-3 w-full">
                  <Input
                    label="When did you start dating?"
                    type="date"
                    value={startedDate}
                    onChange={(e) => setStartedDate(e.target.value)}
                    hint="This date will become your anniversary"
                  />
                  <Button fullWidth onClick={() => setStep(8)}>
                    Continue <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 8: Relation - Choice */}
            {step === 8 && relationSub === "choice" && (
              <div className="flex flex-col items-center gap-6">
                <div className="text-center">
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Connect with Your Partner
                  </h2>
                  <p
                    style={{
                      fontSize: "0.95rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Start a new space, or join theirs
                  </p>
                </div>
                <div className="flex flex-col gap-3 w-full">
                  <Button
                    fullWidth
                    onClick={handleCreateRelation}
                    loading={loading}
                  >
                    Create New
                  </Button>
                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={() => {
                      setRelationSub("join");
                      setError("");
                    }}
                  >
                    Use Invitation Code
                  </Button>
                </div>
                {error && (
                  <p className="text-[0.8rem] text-red-500 text-center">
                    {error}
                  </p>
                )}
              </div>
            )}

            {/* Step 8: Relation - Join with code */}
            {step === 8 && relationSub === "join" && (
              <div className="flex flex-col items-center gap-6">
                <div className="text-center">
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Join a Relationship
                  </h2>
                  <p
                    style={{
                      fontSize: "0.95rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Enter the invitation code your partner sent you
                  </p>
                </div>
                <div className="flex flex-col gap-5 w-full">
                  <Input
                    label="Invitation Code"
                    name="inviteCode"
                    placeholder="Enter 5-character code"
                    value={inputCode}
                    onChange={(e) =>
                      setInputCode(e.target.value.toUpperCase().slice(0, 5))
                    }
                    maxLength={5}
                    autoComplete="off"
                  />
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleJoinRelation}
                    loading={loading}
                    disabled={inputCode.length !== 5}
                  >
                    Join
                  </Button>
                  <Button
                    variant="plain"
                    fullWidth
                    onClick={() => {
                      setRelationSub("choice");
                      setError("");
                      setInputCode("");
                    }}
                  >
                    Back
                  </Button>
                </div>
                {error && (
                  <p className="text-[0.8rem] text-red-500 text-center">
                    {error}
                  </p>
                )}
              </div>
            )}

            {/* Step 8: Relation - Show invitation code */}
            {step === 8 && relationSub === "code" && shortCode && (
              <div className="flex flex-col items-center gap-6 ">
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: 0.1,
                    }}
                    className="flex items-center justify-center"
                  >
                    <Image
                      src={Couple}
                      alt="Couple"
                      width={200}
                      height={100}
                      className="mb-8 w-auto h-60"
                      priority
                    />
                  </motion.div>
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Invite Your Partner
                  </h2>
                  <p
                    style={{
                      fontSize: "0.95rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Send this code, and your story officially begins
                  </p>
                </div>

                {/* Invitation code */}
                <div className="w-full">
                  <p
                    className="text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-center mb-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Invitation Code
                  </p>
                  <div className="flex justify-center gap-3 mb-8">
                    {shortCode.split("").map((char, i) => (
                      <div
                        key={i}
                        className="w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center font-bold"
                        style={{
                          background: "var(--input-bg)",
                          color: "var(--accent)",
                          fontSize: "1.5rem",
                        }}
                      >
                        {char}
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" fullWidth onClick={handleCopy}>
                    <Copy size={16} /> Copy Code
                  </Button>
                </div>

                <div className="w-full space-y-1 flex flex-col gap-2">
                  <Button fullWidth onClick={handleShare}>
                    <Share2 size={16} /> Copy Invitation Link
                  </Button>
                  <Button
                    variant="plain"
                    fullWidth
                    onClick={() => router.push("/home")}
                  >
                    Skip For Now
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom action (steps 1-4) */}
      {step >= 1 && step <= 4 && (
        <div className="w-full max-w-95 mx-auto pb-safe">
          {error && (
            <p className="text-[0.8rem] text-red-500 text-center mb-3">
              {error}
            </p>
          )}
          <Button
            fullWidth
            onClick={handleNext}
            disabled={!canNext()}
            loading={loading}
          >
            {step === 4 ? "Register" : "Continue"} <ArrowRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
