import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface SettingsCardProps {
    title: string
    description?: string
    children: React.ReactNode
    danger?: boolean
}

export function SettingsCard({ title, description, children, danger }: SettingsCardProps) {
    return (
        <Card className={danger ? 'border-red-200 bg-red-50' : ''}>
            <CardHeader>
                <CardTitle className={danger ? 'text-red-600' : ''}>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-4">
                {children}
            </CardContent>
        </Card>
    )
}
