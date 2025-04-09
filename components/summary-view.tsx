import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Roommate } from "./expense-tracker"
import { formatCurrency } from "@/lib/utils"

interface SummaryViewProps {
  totalExpenses: number
  balances: Record<string, number>
  roommates: Roommate[]
}

// Hàm làm tròn số tiền đến hàng nghìn
const roundToThousand = (amount: number): number => {
  return Math.ceil(amount / 1000) * 1000
}

export default function SummaryView({ totalExpenses, balances, roommates }: SummaryViewProps) {
  // Làm tròn số dư của mỗi người
  const roundedBalances: Record<string, number> = {}
  Object.keys(balances).forEach((key) => {
    roundedBalances[key] = roundToThousand(balances[key])
  })

  // Tính tổng số dư dương và âm
  const totalPositive = roommates
    .filter((r) => roundedBalances[r.id] > 0)
    .reduce((sum, r) => sum + roundedBalances[r.id], 0)

  const totalNegative = roommates
    .filter((r) => roundedBalances[r.id] < 0)
    .reduce((sum, r) => sum + Math.abs(roundedBalances[r.id]), 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tổng kết chi tiêu</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex justify-between items-center p-3 bg-muted rounded-md">
            <span className="font-medium">Tổng chi phí:</span>
            <span className="font-bold">{formatCurrency(roundToThousand(totalExpenses))}</span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Số dư dương (được nợ)</CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <div className="space-y-2">
                  {roommates
                    .filter((r) => roundedBalances[r.id] > 0)
                    .sort((a, b) => roundedBalances[b.id] - roundedBalances[a.id])
                    .map((roommate) => (
                      <div key={roommate.id} className="flex justify-between items-center p-2 border-b">
                        <div>
                          <span className="font-medium">{roommate.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">({roommate.room})</span>
                        </div>
                        <span className="font-medium text-green-600">
                          +{formatCurrency(roundedBalances[roommate.id])}
                        </span>
                      </div>
                    ))}
                  <div className="flex justify-between items-center p-2 border-t border-t-2">
                    <span className="font-bold">Tổng cộng</span>
                    <span className="font-bold text-green-600">+{formatCurrency(totalPositive)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Số dư âm (nợ người khác)</CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <div className="space-y-2">
                  {roommates
                    .filter((r) => roundedBalances[r.id] < 0)
                    .sort((a, b) => roundedBalances[a.id] - roundedBalances[b.id])
                    .map((roommate) => (
                      <div key={roommate.id} className="flex justify-between items-center p-2 border-b">
                        <div>
                          <span className="font-medium">{roommate.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">({roommate.room})</span>
                        </div>
                        <span className="font-medium text-red-600">{formatCurrency(roundedBalances[roommate.id])}</span>
                      </div>
                    ))}
                  <div className="flex justify-between items-center p-2 border-t border-t-2">
                    <span className="font-bold">Tổng cộng</span>
                    <span className="font-bold text-red-600">-{formatCurrency(totalNegative)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="pt-4 text-sm text-muted-foreground">
            <p>
              * Số dư dương nghĩa là người khác nợ bạn tiền.
              <br />* Số dư âm nghĩa là bạn nợ tiền người khác.
              <br />* Tất cả số tiền đã được làm tròn lên đến hàng nghìn.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
