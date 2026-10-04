"use client";

import { useEffect, useRef, useState } from "react";
import type { PropertyDraft } from "@/ai/property-import";
import { DraftForm } from "./draft-form";
import { ImageDropzone } from "./image-dropzone";
import { toFormState, type DraftFieldKey, type DraftFormState } from "./form-state";
import { downscaleImage, MAX_SOURCE_BYTES } from "./resize-image";
import { MAX_IMAGE_BYTES, validateImageFile } from "./validation";

// 作者がサンプル画像を用意したら、ここに { label, src } を足すと「サンプルで試す」が出る
// （src は public/ 配下のパス。例: "/samples/property-import-1.png"）
const SAMPLE_IMAGES: { label: string; src: string }[] = [
  // みらい不動産の架空のマイソク（realestate-api の物件 id 66・65 のデータと写真を元に作成。元の HTML は docs/maisoku-samples）
  { label: "売地のマイソク", src: "/samples/maisoku-sample-land.jpg" },
  { label: "中古戸建のマイソク", src: "/samples/maisoku-sample-house.jpg" },
];

type Status = "idle" | "loading" | "done" | "error";

function ResultSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-3" role="status" aria-live="polite">
      <p className="text-sm font-bold text-brand-teal">資料を読み取っています…（10〜20秒ほどかかります）</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-3 w-1/3 rounded bg-gray-200" />
            <div className="h-9 rounded bg-gray-200" />
          </div>
        ))}
      </div>
      <div className="h-3 w-1/4 rounded bg-gray-200" />
      <div className="h-9 rounded bg-gray-200" />
      <div className="h-3 w-1/4 rounded bg-gray-200" />
      <div className="h-32 rounded bg-gray-200" />
    </div>
  );
}

export function PropertyImportDemo() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<DraftFormState | null>(null);
  const [uncertain, setUncertain] = useState<ReadonlySet<DraftFieldKey>>(new Set());
  const abortRef = useRef<AbortController | null>(null);
  const urlRef = useRef<string | null>(null);

  // アンマウント時にプレビュー用URLの解放と処理中リクエストの中断を行う
  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      abortRef.current?.abort();
    },
    [],
  );

  async function selectFile(original: File) {
    // 形式は縮小前に確かめる。容量は縮小後に確かめる（スマホの写真は縮小すれば4MBに収まる）
    const typeError = validateImageFile({ type: original.type, size: 1 });
    if (typeError) {
      setError(typeError);
      return;
    }
    if (original.size > MAX_SOURCE_BYTES) {
      setError("ファイルサイズが大きすぎます。20MB以下の画像を選んでください。");
      return;
    }
    let selected: File;
    try {
      selected = await downscaleImage(original, MAX_IMAGE_BYTES);
    } catch {
      setError("画像を読み込めませんでした。別の画像を選んでください。");
      return;
    }
    const invalid = validateImageFile(selected);
    if (invalid) {
      setError(invalid);
      return;
    }
    abortRef.current?.abort();
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(selected);
    urlRef.current = url;
    setFile(selected);
    setPreviewUrl(url);
    setStatus("idle");
    setError(null);
    setForm(null);
    setUncertain(new Set());
  }

  async function selectSample(src: string) {
    try {
      const blob = await (await fetch(src)).blob();
      await selectFile(new File([blob], src.split("/").pop() ?? "sample", { type: blob.type }));
    } catch {
      setError("サンプル画像を読み込めませんでした。");
    }
  }

  async function extract() {
    if (!file) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("loading");
    setError(null);
    try {
      const body = new FormData();
      body.append("image", file);
      const res = await fetch("/api/property-import", {
        method: "POST",
        body,
        signal: controller.signal,
      });
      const data: { draft?: PropertyDraft; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !data.draft) {
        throw new Error(data.error ?? "読み取りに失敗しました。少し時間をおいて、もう一度お試しください。");
      }
      setForm(toFormState(data.draft));
      // 項目名が下書きフォームの項目と一致するものだけを強調対象にする
      setUncertain(new Set(data.draft.uncertainFields));
      setStatus("done");
    } catch (e) {
      if (controller.signal.aborted) return;
      setError(e instanceof Error ? e.message : "読み取りに失敗しました。");
      setStatus("error");
    }
  }

  function updateField<K extends DraftFieldKey>(key: K, value: DraftFormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    // 担当者が編集した項目は確認済みとして強調を外す
    setUncertain((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  const loading = status === "loading";

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <section className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5 lg:sticky lg:top-[calc(var(--site-header-h)+1rem)]">
        <h2 className="flex items-center gap-2 text-lg font-bold text-brand-navy">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-teal text-xs text-white">
            1
          </span>
          物件資料をアップロード
        </h2>

        {previewUrl ? (
          <div className="flex flex-col gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- ローカルのblob URLのプレビューのため next/image は使えない */}
            <img
              src={previewUrl}
              alt="アップロードした物件資料のプレビュー"
              className="max-h-[28rem] w-full rounded-lg border border-gray-200 bg-gray-50 object-contain"
            />
            <p className="truncate text-xs text-gray-500">{file?.name}</p>
          </div>
        ) : null}

        <ImageDropzone onSelect={selectFile} disabled={loading} />

        {SAMPLE_IMAGES.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-xs text-gray-500">サンプルで試す:</span>
            {SAMPLE_IMAGES.map((sample) => (
              <button
                key={sample.src}
                type="button"
                disabled={loading}
                onClick={() => selectSample(sample.src)}
                className="cursor-pointer rounded-full border border-gray-300 px-3 py-1 text-xs hover:border-brand-teal hover:text-brand-teal disabled:opacity-50"
              >
                {sample.label}
              </button>
            ))}
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={extract}
          disabled={!file || loading}
          className="cursor-pointer rounded-lg bg-brand-teal px-4 py-3 text-sm font-bold text-white hover:bg-brand-navy disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {loading ? "読み取り中…" : status === "done" ? "もう一度読み取る" : "読み取る"}
        </button>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold text-brand-navy">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-teal text-xs text-white">
            2
          </span>
          登録の下書き
        </h2>
        {loading && <ResultSkeleton />}
        {!loading && form && <DraftForm state={form} uncertain={uncertain} onChange={updateField} />}
        {!loading && !form && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-14 text-center text-sm text-gray-500">
            <p>左で資料の画像を選んで「読み取る」を押すと、</p>
            <p>ここに編集できる下書きが表示されます。</p>
          </div>
        )}
      </section>
    </div>
  );
}
