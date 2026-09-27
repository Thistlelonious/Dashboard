export type ThemeId = 'light' | 'colorful' | 'dark';

export type Hue = 'rose' | 'madder' | 'marigold' | 'fern' | 'teal' | 'cornflower' | 'plum';

export type IconName =
  | 'needle' | 'spool' | 'scissors' | 'pattern' | 'tape' | 'pin' | 'button' | 'fabric' | 'iron'
  | 'hanger' | 'camera' | 'home' | 'plus' | 'check' | 'close' | 'arrow-right' | 'arrow-left' | 'alert'
  | 'print' | 'send' | 'import' | 'timer' | 'settings' | 'delete' | 'invoice';

export type StageState = 'done' | 'now' | 'todo';

export interface SewAndSo {
  readonly themes: ThemeId[];
  readonly icons: IconName[];
  /** Returns an inline SVG string. With `label` it is announced as an image; without, it is hidden from assistive tech. */
  icon(name: IconName, opts?: { large?: boolean; label?: string }): string;
  getTheme(): ThemeId;
  /** Crossfades to the theme (unless reduced motion) and remembers it unless `remember` is false. */
  setTheme(id: ThemeId, opts?: { remember?: boolean }): void;
  /** Applies the remembered theme, if any. Call once on app start. */
  restoreTheme(): void;
  /** Replaces the per-theme backdrop images with your own URLs. */
  setBackdrops(images: Partial<Record<ThemeId, string>>): void;
  /** Fills every `<svg data-sas-icon>` and prepares radio groups under `scope`. Runs on DOMContentLoaded automatically. */
  hydrate(scope?: ParentNode): void;
}

/** Fired on a Swatches radiogroup when the choice changes. */
export interface SasChangeEvent extends CustomEvent<{ value: string | null }> {}

declare global {
  interface Window { SewAndSo: SewAndSo; }
}
