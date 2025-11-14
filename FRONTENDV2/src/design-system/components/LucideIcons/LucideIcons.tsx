
import { icons } from "lucide-react";
import { FC } from "react";

export const LucideIcons: FC<{

  name: keyof typeof icons;
  size?: number;
  className?: string;

}> = ({
  name,
  size,
  ...props
}) => {
  const Icon = icons[name];

  return <Icon size={size} {...props}></Icon>;
}