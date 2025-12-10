interface SettingsSectionProps {
    title: string
    description?: string
    children: React.ReactNode
    id?: string
}

export function SettingsSection({ title, description, children, id }: SettingsSectionProps) {
    return (
        <div id={id} className="space-y-6 py-6 first:pt-0">
            <div>
                <h3 className="text-lg font-medium">{title}</h3>
                {description && <p className="text-sm text-slate-500">{description}</p>}
            </div>
            <div className="grid gap-6">
                {children}
            </div>
        </div>
    )
}
