import type { SVGProps } from "react";

const ICONS: Record<string, string> = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
  pin: '<path d="M12 21s-7-6.1-7-11.2A7 7 0 0 1 19 9.8C19 14.9 12 21 12 21Z"/><circle cx="12" cy="9.7" r="2.6"/>',
  layers:
    '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/><path d="m3 17.5 9 4.5 9-4.5" opacity=".55"/>',
  share:
    '<circle cx="6" cy="12" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="m8.1 10.9 7.8-3.8M8.1 13.1l7.8 3.8"/>',
  bell: '<path d="M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16Z"/><path d="M10.2 19a2 2 0 0 0 3.6 0"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/>',
  auto: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17A8.5 8.5 0 0 0 12 3.5Z" fill="currentColor" stroke="none"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  warning:
    '<path d="M12 4 2.8 20h18.4L12 4Z"/><path d="M12 10v4.2M12 17.2v.1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  arrow: '<path d="M4.5 12h15M13.5 6l6 6-6 6"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  "chevron-down": '<path d="m6 9 6 6 6-6"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.7v.1"/>',
  user: '<circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20a7.2 7.2 0 0 1 14.4 0"/>',
  home: '<path d="M4 10.5 12 4l8 6.5V20h-5.5v-5.5h-5V20H4v-9.5Z"/>',
  shield:
    '<path d="M12 3.5 19 6v5.5c0 4.3-3 7.4-7 9-4-1.6-7-4.7-7-9V6l7-2.5Z"/><path d="m9 12 2.2 2.2L15 10.4"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="5" cy="6" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="5" cy="18" r="1"/>',
  more: '<circle cx="6" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="18" cy="12" r="1.2"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  play: '<path d="M8 5.5 18.5 12 8 18.5v-13Z"/>',
  lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  droplet:
    '<path d="M12 3.5c3.2 3.6 6 6.8 6 10.2a6 6 0 0 1-12 0c0-3.4 2.8-6.6 6-10.2Z"/>',
  water:
    '<path d="M3 8.5c2.2-2 4.3-2 6.5 0s4.3 2 6.5 0 4.3-2 5 0M3 13c2.2-2 4.3-2 6.5 0s4.3 2 6.5 0 4.3-2 5 0M3 17.5c2.2-2 4.3-2 6.5 0s4.3 2 6.5 0 4.3-2 5 0"/>',
  rain: '<path d="M7 14.5a4 4 0 0 1 .6-8 5.2 5.2 0 0 1 9.9 1.4A3.4 3.4 0 0 1 17 14.5H7Z"/><path d="M8 17.5 7 20M12 17.5 11 20M16 17.5 15 20"/>',
  chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16V11M12.5 16V7M17 16v-3"/>',
  activity: '<path d="M3 12.5h4l2.5-7 4.5 13 2.5-6H21"/>',
  layersRadar:
    '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12 17 7"/>',
  table:
    '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M3.5 14.5h17M9.5 9.5v10"/>',
  download: '<path d="M12 4v10M7.5 10 12 14.5 16.5 10M5 19h14"/>',
  refresh: '<path d="M20 5.5v5h-5"/><path d="M19.3 10.5A7.8 7.8 0 1 0 20 14"/>',
  target:
    '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2.5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/>',
  reset: '<path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 4v4.5h4.5"/>',
  flag: '<path d="M6 21V4M6 4.5h9l-1.5 4 1.5 4H6"/>',
  send: '<path d="M4 12 20 4l-6 16-3-6-7-2Z"/>',
  sparkle:
    '<path d="M12 3.5 13.8 9l5.5 1.8-5.5 1.8L12 18l-1.8-5.4L4.7 10.8 10.2 9 12 3.5Z"/><path d="M18.5 16.5 19.2 18.6 21.3 19.3 19.2 20 18.5 22.1 17.8 20 15.7 19.3 17.8 18.6 18.5 16.5Z" opacity=".6"/>',
  globe:
    '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.6 3.8 5.4 3.8 8.5S14.6 18.3 12 20.5c-2.6-2.2-3.8-5.4-3.8-8.5S9.4 6.1 12 3.5Z"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  external:
    '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  trend:
    '<path d="m3 16.5 5.5-5.5 3.5 3.5L21 5.5"/><path d="M15.5 5.5H21v5.5"/>',
  waves:
    '<path d="M2.5 8c1.8-1.6 3.6-1.6 5.4 0s3.6 1.6 5.4 0 3.6-1.6 5.4 0 3.6 1.6 3.6 0"/>',
  signup:
    '<path d="M14 6.5V5a1.5 1.5 0 0 0-1.5-1.5h-7A1.5 1.5 0 0 0 4 5v14a1.5 1.5 0 0 0 1.5 1.5h7A1.5 1.5 0 0 0 14 19v-1.5"/><path d="M9 12h11M16.5 8.5 20 12l-3.5 3.5"/>',
};

export function IconSprite() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: "absolute" }}
      aria-hidden="true"
      focusable="false"
    >
      {Object.entries(ICONS).map(([id, body]) => (
        <symbol
          key={id}
          id={`icon-${id}`}
          viewBox="0 0 24 24"
          dangerouslySetInnerHTML={{ __html: body }}
        />
      ))}
    </svg>
  );
}

type IconProps = SVGProps<SVGSVGElement> & {
  name: keyof typeof ICONS | string;
  /** size shorthand — renders 14/16/18/20/24px */
  size?: number;
  /** mark decorative icons (the default) */
  label?: string;
};

export function Icon({
  name,
  size,
  label,
  className = "",
  ...rest
}: IconProps) {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <svg
      className={`icon ${className}`}
      style={style}
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
      focusable="false"
      {...rest}
    >
      {label ? <title>{label}</title> : null}
      <use href={`#icon-${name}`} />
    </svg>
  );
}
