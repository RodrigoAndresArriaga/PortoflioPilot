import type { ReactNode } from "react";

type SettingsSectionProps = {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export function SettingsSection({
  id,
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="rounded-lg border border-border p-4">{children}</div>
    </section>
  );
}
