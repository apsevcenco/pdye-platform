import { useRef, useState, useEffect, useCallback } from "react";
import {
  Bold, Italic, Underline, Strikethrough, Type, ALargeSmall,
  Paintbrush, AlignLeft, AlignCenter, AlignRight,
  ChevronDown,
} from "lucide-react";

const FONT_FAMILIES = [
  { label: "Gilroy", value: "'Gilroy', sans-serif" },
  { label: "DM Sans", value: "'DM Sans', sans-serif" },
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Roboto", value: "'Roboto', sans-serif" },
  { label: "Open Sans", value: "'Open Sans', sans-serif" },
  { label: "Lato", value: "'Lato', sans-serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Poppins", value: "'Poppins', sans-serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Merriweather", value: "'Merriweather', serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
];

const FONT_SIZES = [
  "8", "9", "10", "11", "12", "13", "14", "16", "18", "20", "22", "24", "28", "32", "36", "42", "48", "56", "64", "72",
];

const COLORS = [
  { label: "Default", value: "" },
  { label: "White", value: "#ffffff" },
  { label: "Gold", value: "#c8a96a" },
  { label: "Light Gray", value: "#b0b0b0" },
  { label: "Dark Gray", value: "#666666" },
  { label: "Red", value: "#ef4444" },
  { label: "Green", value: "#22c55e" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Cyan", value: "#06b6d4" },
  { label: "Orange", value: "#f97316" },
  { label: "Purple", value: "#a855f7" },
  { label: "Pink", value: "#ec4899" },
];

export type ToolbarStyles = {
  fontFamily: string;
  fontSize: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  color: string;
  align: "left" | "center" | "right";
};

export const DEFAULT_TOOLBAR_STYLES: ToolbarStyles = {
  fontFamily: "",
  fontSize: "14",
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  color: "",
  align: "left",
};

function ToolbarDropdown({
  value,
  options,
  onChange,
  width = "w-32",
  icon,
}: {
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
  width?: string;
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className={`relative ${width}`}>
      <button
        type="button"
        onMouseDown={e => { e.preventDefault(); setOpen(!open); }}
        className="flex items-center justify-between w-full gap-1 px-2 py-1 bg-[#06101e] border border-white/10 hover:border-primary/40 text-white/70 text-[11px] font-sans transition-colors h-7"
      >
        <span className="flex items-center gap-1.5 truncate">
          {icon}
          {selected?.label || "—"}
        </span>
        <ChevronDown size={10} className={`text-white/30 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-0.5 w-full max-h-48 overflow-y-auto bg-[#0f1d33] border border-white/15 shadow-xl">
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              onMouseDown={e => { e.preventDefault(); onChange(o.value); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-[11px] font-sans hover:bg-primary/15 transition-colors ${
                o.value === value ? "text-primary bg-primary/5" : "text-white/60"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className={`flex items-center justify-center w-7 h-7 border transition-colors ${
        active
          ? "bg-primary/20 border-primary/40 text-primary"
          : "bg-[#06101e] border-white/10 text-white/50 hover:text-white hover:border-primary/30"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-white/8 mx-0.5" />;
}

interface WordToolbarProps {
  mode: "richtext" | "style";
  onFormat?: (tag: string) => void;
  styles?: ToolbarStyles;
  onStyleChange?: (styles: ToolbarStyles) => void;
  compact?: boolean;
}

export function WordToolbar({ mode, onFormat, styles, onStyleChange, compact }: WordToolbarProps) {
  const s = styles || DEFAULT_TOOLBAR_STYLES;

  const updateStyle = useCallback((key: keyof ToolbarStyles, value: any) => {
    if (onStyleChange) {
      onStyleChange({ ...s, [key]: value });
    }
  }, [s, onStyleChange]);

  if (mode === "richtext") {
    return (
      <div className="flex items-center gap-0.5 flex-wrap mb-1.5">
        <ToolbarDropdown
          value={s.fontFamily}
          options={[{ label: "Default Font", value: "" }, ...FONT_FAMILIES]}
          onChange={v => {
            updateStyle("fontFamily", v);
            if (onFormat) onFormat(`span style="font-family:${v}"`);
          }}
          width="w-28"
          icon={<Type size={10} />}
        />
        <ToolbarDropdown
          value={s.fontSize}
          options={FONT_SIZES.map(sz => ({ label: `${sz}px`, value: sz }))}
          onChange={v => {
            updateStyle("fontSize", v);
            if (onFormat) onFormat(`span style="font-size:${v}px"`);
          }}
          width="w-16"
          icon={<ALargeSmall size={10} />}
        />
        <Divider />
        <ToolbarButton title="Bold" onClick={() => onFormat?.("b")} active={false}>
          <Bold size={12} strokeWidth={2.5} />
        </ToolbarButton>
        <ToolbarButton title="Italic" onClick={() => onFormat?.("i")} active={false}>
          <Italic size={12} />
        </ToolbarButton>
        <ToolbarButton title="Underline" onClick={() => onFormat?.("u")} active={false}>
          <Underline size={12} />
        </ToolbarButton>
        <ToolbarButton title="Strikethrough" onClick={() => onFormat?.("s")} active={false}>
          <Strikethrough size={12} />
        </ToolbarButton>
        <Divider />
        <ToolbarDropdown
          value={s.color}
          options={COLORS}
          onChange={v => {
            updateStyle("color", v);
            if (v && onFormat) onFormat(`span style="color:${v}"`);
          }}
          width="w-24"
          icon={<Paintbrush size={10} className={s.color ? "" : "text-white/40"} style={s.color ? { color: s.color } : undefined} />}
        />
        {!compact && (
          <>
            <Divider />
            <ToolbarButton title="Align Left" active={s.align === "left"} onClick={() => {
              updateStyle("align", "left");
              if (onFormat) onFormat('div style="text-align:left"');
            }}>
              <AlignLeft size={12} />
            </ToolbarButton>
            <ToolbarButton title="Align Center" active={s.align === "center"} onClick={() => {
              updateStyle("align", "center");
              if (onFormat) onFormat('div style="text-align:center"');
            }}>
              <AlignCenter size={12} />
            </ToolbarButton>
            <ToolbarButton title="Align Right" active={s.align === "right"} onClick={() => {
              updateStyle("align", "right");
              if (onFormat) onFormat('div style="text-align:right"');
            }}>
              <AlignRight size={12} />
            </ToolbarButton>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      <ToolbarDropdown
        value={s.fontFamily}
        options={[{ label: "Default Font", value: "" }, ...FONT_FAMILIES]}
        onChange={v => updateStyle("fontFamily", v)}
        width="w-28"
        icon={<Type size={10} />}
      />
      <ToolbarDropdown
        value={s.fontSize}
        options={FONT_SIZES.map(sz => ({ label: `${sz}px`, value: sz }))}
        onChange={v => updateStyle("fontSize", v)}
        width="w-16"
        icon={<ALargeSmall size={10} />}
      />
      <Divider />
      <ToolbarButton title="Bold" active={s.bold} onClick={() => updateStyle("bold", !s.bold)}>
        <Bold size={12} strokeWidth={2.5} />
      </ToolbarButton>
      <ToolbarButton title="Italic" active={s.italic} onClick={() => updateStyle("italic", !s.italic)}>
        <Italic size={12} />
      </ToolbarButton>
      <ToolbarButton title="Underline" active={s.underline} onClick={() => updateStyle("underline", !s.underline)}>
        <Underline size={12} />
      </ToolbarButton>
      <ToolbarButton title="Strikethrough" active={s.strikethrough} onClick={() => updateStyle("strikethrough", !s.strikethrough)}>
        <Strikethrough size={12} />
      </ToolbarButton>
      <Divider />
      <ToolbarDropdown
        value={s.color}
        options={COLORS}
        onChange={v => updateStyle("color", v)}
        width="w-24"
        icon={<Paintbrush size={10} className={s.color ? "" : "text-white/40"} style={s.color ? { color: s.color } : undefined} />}
      />
      {!compact && (
        <>
          <Divider />
          <ToolbarButton title="Align Left" active={s.align === "left"} onClick={() => updateStyle("align", "left")}>
            <AlignLeft size={12} />
          </ToolbarButton>
          <ToolbarButton title="Align Center" active={s.align === "center"} onClick={() => updateStyle("align", "center")}>
            <AlignCenter size={12} />
          </ToolbarButton>
          <ToolbarButton title="Align Right" active={s.align === "right"} onClick={() => updateStyle("align", "right")}>
            <AlignRight size={12} />
          </ToolbarButton>
        </>
      )}
    </div>
  );
}

export function stylesToCSS(s: ToolbarStyles): React.CSSProperties {
  const css: React.CSSProperties = {};
  if (s.fontFamily) css.fontFamily = s.fontFamily;
  if (s.fontSize) css.fontSize = `${s.fontSize}px`;
  if (s.bold) css.fontWeight = "bold";
  if (s.italic) css.fontStyle = "italic";
  if (s.underline) css.textDecoration = s.strikethrough ? "underline line-through" : "underline";
  else if (s.strikethrough) css.textDecoration = "line-through";
  if (s.color) css.color = s.color;
  if (s.align) css.textAlign = s.align;
  return css;
}

const SPEC_STYLES_KEY = "pdye_spec_styles";

export function loadSpecStyles(): ToolbarStyles {
  try {
    const raw = localStorage.getItem(SPEC_STYLES_KEY);
    if (raw) return { ...DEFAULT_TOOLBAR_STYLES, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_TOOLBAR_STYLES };
}

export function saveSpecStyles(styles: ToolbarStyles): void {
  localStorage.setItem(SPEC_STYLES_KEY, JSON.stringify(styles));
}
