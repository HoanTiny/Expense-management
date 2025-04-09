"use client"

import { Trash2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Roommate, Expense } from "./expense-tracker"
import { formatCurrency } from "@/lib/utils"

interface ExpenseListProps {
  expenses: Expense[]
  roommates: Roommate[]
  onRemoveExpense: (id: string) => void
  currentUserId: string // Thêm ID người dùng hiện tại
  isAdmin: boolean // Thêm prop để kiểm tra quyền admin
}

export default function ExpenseList({
  expenses,
  roommates,
  onRemoveExpense,
  currentUserId,
  isAdmin,
}: ExpenseListProps) {
  // Lấy tên thành viên theo ID
  const getRoommateName = (id: string) => {
    const roommate = roommates.find((r) => r.id === id)
    return roommate ? `${roommate.name} (${roommate.room})` : "Không xác định"
  }

  // Kiểm tra xem người dùng có quyền xóa chi tiêu không
  const canDeleteExpense = (expense: Expense) => {
    // Nếu không có thông tin người tạo, cho phép admin xóa
    if (!expense.created_by) return isAdmin
    // Nếu có thông tin người tạo, cho phép người tạo hoặc admin xóa
    return isAdmin || expense.created_by === currentUserId
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4">Lịch sử chi tiêu</h3>
      {expenses.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">Chưa có chi phí nào.</p>
      ) : (
        <div className="space-y-4">
          {expenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{expense.description}</h4>
                    <p className="text-sm text-muted-foreground">{format(expense.date, "PPP", { locale: vi })}</p>
                    <p className="mt-1">
                      <span className="font-medium">Số tiền:</span> {formatCurrency(expense.amount)}
                    </p>
                    <p>
                      <span className="font-medium">Người chi trả:</span> {getRoommateName(expense.paidBy)}
                    </p>
                    <div className="mt-1">
                      <span className="font-medium">Chia sẻ với:</span>
                      {expense.sharedWith.length === 0 ? (
                        <p className="text-sm text-muted-foreground ml-2">Không có ai được chọn (mặc định cho phòng)</p>
                      ) : (
                        <ul className="list-disc list-inside text-sm pl-2">
                          {expense.sharedWith.map((id) => (
                            <li key={id}>{getRoommateName(id)}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    {!canDeleteExpense(expense) && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="mr-2 text-amber-600">
                              <AlertCircle className="h-4 w-4" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Chỉ người tạo chi tiêu hoặc quản trị viên mới có thể xóa</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveExpense(expense.id)}
                      disabled={!canDeleteExpense(expense)}
                    >
                      <Trash2 className={`h-4 w-4 ${canDeleteExpense(expense) ? "text-destructive" : "text-muted"}`} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
