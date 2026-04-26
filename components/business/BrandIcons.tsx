interface TileProps {
  platform: string;
  customName?: string | null;
}

const BOOKING_LABELS: Record<string, string> = {
  tabelog: "Tabelog",
  hot_pepper_gourmet: "HP Gourmet",
  hot_pepper_beauty: "HP Beauty",
  line_reservation: "LINE",
  open_table: "OpenTable",
  minimo: "minimo",
};

const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "X",
  youtube: "YouTube",
  line: "LINE",
  tiktok: "TikTok",
};

function Square({
  bg,
  children,
  ariaLabel,
}: {
  bg: string;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-extrabold text-base shadow-sm ${bg}`}
    >
      {children}
    </div>
  );
}

export function BookingTile({ platform, customName }: TileProps) {
  const label = customName || BOOKING_LABELS[platform] || platform;
  switch (platform) {
    case "hot_pepper_gourmet":
    case "hot_pepper_beauty":
      return (
        <Square bg="bg-[#d7142a]" ariaLabel={label}>
          <div className="flex flex-col items-center leading-none">
            <span className="text-lg">H</span>
            <span className="text-[7px] tracking-wider mt-0.5">PEPPER</span>
          </div>
        </Square>
      );
    case "open_table":
      return (
        <Square bg="bg-[#da3743]" ariaLabel={label}>
          <div className="w-7 h-7 rounded-full border-[3px] border-white flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
        </Square>
      );
    case "tabelog":
      return (
        <Square bg="bg-[#f5a623]" ariaLabel={label}>
          <span className="text-[10px] leading-tight text-center">食べ<br/>ログ</span>
        </Square>
      );
    case "line_reservation":
      return (
        <Square bg="bg-[#06c755]" ariaLabel={label}>
          <span className="text-xs">LINE</span>
        </Square>
      );
    case "minimo":
      return (
        <Square bg="bg-[#ff8a3d]" ariaLabel={label}>
          <span className="text-sm">mi</span>
        </Square>
      );
    default:
      return <Square bg="bg-stone-400" ariaLabel={label}>{platform.slice(0, 2).toUpperCase()}</Square>;
  }
}

export function SocialTile({ platform, customName }: TileProps) {
  const label = customName || SOCIAL_LABELS[platform] || platform;
  switch (platform) {
    case "instagram":
      return (
        <Square bg="bg-gradient-to-tr from-[#feda77] via-[#f58529] to-[#dd2a7b]" ariaLabel={label}>
          <div className="w-7 h-7 rounded-lg border-[2.5px] border-white flex items-center justify-center">
            <div className="w-3 h-3 rounded-full border-[2.5px] border-white" />
          </div>
        </Square>
      );
    case "facebook":
      return <Square bg="bg-[#1877f2]" ariaLabel={label}><span className="text-2xl italic">f</span></Square>;
    case "twitter":
      return <Square bg="bg-black" ariaLabel={label}><span className="text-xl">𝕏</span></Square>;
    case "youtube":
      return <Square bg="bg-[#ff0000]" ariaLabel={label}><span className="text-xs">YT</span></Square>;
    case "line":
      return <Square bg="bg-[#06c755]" ariaLabel={label}><span className="text-xs">LINE</span></Square>;
    case "tiktok":
      return <Square bg="bg-black" ariaLabel={label}><span className="text-base">♪</span></Square>;
    default:
      return <Square bg="bg-stone-400" ariaLabel={label}>{platform.slice(0, 2).toUpperCase()}</Square>;
  }
}
