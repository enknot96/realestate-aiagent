// Vitest実行時に "server-only" を無効化するための空スタブ。
// server-onlyはNext.jsのビルド条件（react-server）以外でimportされると例外を投げる設計のため、
// Node環境で走るユニットテストではこのスタブに差し替える（本番ビルドの保護はそのまま効く）
export {};
