import { useState } from "react";
import { Star } from "lucide-react";

interface Props {
  onSelect: (stars: number) => void;
  size?: "sm" | "md";
}

export function RatingStars({ onSelect, size = "md" }: Props) {
  const [hover, setHover] = useState(0);
  const [selected, setSelected] = useState(0);

  const handleClick = (index: number) => {
    setSelected(index);
    onSelect(index);
  };

  const base =
    size === "sm" ? "w-4 h-4" : "w-6 h-6";

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const index = i + 1;
        const active = index <= (hover || selected);
        return (
          <Star
            key={index}
            onMouseEnter={() => setHover(index)}
            onMouseLeave={() => setHover(0)}
            onClick={() => handleClick(index)}
            className={`${base} cursor-pointer transition
              ${
                active
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
          />
        );
      })}
    </div>
  );
}
