// In the app: src/routes/home.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatMoney } from '@/lib/format'

// The prices the person gave in the chat, as text so no value loses a cent. A page saves nothing,
// so it has no server: when the person wants to change prices on screen, it becomes a system.
const SECTIONS = [
  {
    title: 'Pães',
    items: [
      { name: 'Pão francês (kg)', price: '18.90' },
      { name: 'Pão de forma integral', price: '12.50' },
    ],
  },
  {
    title: 'Bolos',
    items: [
      { name: 'Bolo de cenoura com chocolate', price: '42.00' },
      { name: 'Bolo de fubá', price: '28.00' },
    ],
  },
] as const

export function Home() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Tabela de preços</h1>
        <p className="text-sm text-muted-foreground">Os preços de hoje, por seção do balcão.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {SECTIONS.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              <CardDescription>{section.items.length} itens</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {section.items.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(item.price)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
