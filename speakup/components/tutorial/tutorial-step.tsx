import { Checkbox } from "../ui/checkbox";

interface TutorialStepProps {
  title: string;
  children: React.ReactNode;
}

export function TutorialStep({ title, children }: TutorialStepProps) {
  return (
    <li className="relative">
      <Checkbox id={title} name={title} className="absolute top-[3px] mr-2 peer" />
      <label
        htmlFor={title}
        className="relative text-base text-foreground peer-checked:line-through font-medium"
      >
        <span className="ml-8">{title}</span>
        <div className="ml-8 mt-1 text-sm font-normal text-muted-foreground peer-checked:line-through">
          {children}
        </div>
      </label>
    </li>
  );
}
