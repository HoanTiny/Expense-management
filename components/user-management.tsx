'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, Trash2, UserPlus, Mail, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

interface UserManagementProps {
  householdId: string;
  currentUserId: string;
  isAdmin: boolean;
}

interface User {
  id: string;
  email: string;
  role: 'admin' | 'member';
  created_at: string;
}

export default function UserManagement({
  householdId,
  currentUserId,
  isAdmin,
}: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [userToRemove, setUserToRemove] = useState<User | null>(null);

  const supabase = createClient();
  const { toast } = useToast();

  // Tải danh sách người dùng
  useEffect(() => {
    const fetchUsers = async () => {
      if (!householdId) return;
      setIsLoading(true);

      try {
        // Lấy danh sách thành viên trong hộ gia đình
        const { data: membersData, error: membersError } = await supabase
          .from('household_members')
          .select('user_id, role, created_at')
          .eq('household_id', householdId);

        console.log('membersData', membersData, householdId);

        if (membersError) {
          console.error('Error fetching household members:', membersError);
          toast({
            title: 'Lỗi',
            description:
              'Không thể tải danh sách thành viên. Vui lòng thử lại sau.',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        if (!membersData || membersData.length === 0) {
          setUsers([]);
          setIsLoading(false);
          return;
        }

        // Lấy thông tin chi tiết của từng người dùng
        const userIds = membersData.map((member) => member.user_id);
        // const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({
        //   perPage: 1000,
        // })

        // if (usersError) {
        //   console.error("Error fetching users:", usersError)

        //   // Nếu không có quyền admin, sử dụng cách khác để lấy thông tin email
        //   const usersList: User[] = []
        //   for (const member of membersData) {
        //     let email = "Người dùng " + member.user_id.substring(0, 8)

        //     // Nếu là người dùng hiện tại, lấy email từ session
        //     if (member.user_id === currentUserId) {
        //       const {
        //         data: { user },
        //       } = await supabase.auth.getUser()
        //       if (user) {
        //         email = user.email || email
        //       }
        //     }

        //     usersList.push({
        //       id: member.user_id,
        //       email: email,
        //       role: member.role as "admin" | "member",
        //       created_at: member.created_at,
        //     })
        //   }

        //   setUsers(usersList)
        //   setIsLoading(false)
        //   return
        // }

        // Không sử dụng API admin, chỉ hiển thị ID người dùng và email của người dùng hiện tại
        const usersList: User[] = [];
        for (const member of membersData) {
          let email = 'Người dùng ' + member.user_id.substring(0, 8);

          // Nếu là người dùng hiện tại, lấy email từ session
          if (member.user_id === currentUserId) {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (user) {
              email = user.email || email;
            }
          }

          usersList.push({
            id: member.user_id,
            email: email,
            role: member.role as 'admin' | 'member',
            created_at: member.created_at,
          });
        }

        setUsers(usersList);
        setIsLoading(false);

        // // Kết hợp dữ liệu từ hai nguồn
        // const usersList = membersData.map((member) => {
        //   const userData = usersData?.users?.find((user) => user.id === member.user_id)
        //   return {
        //     id: member.user_id,
        //     email: userData?.email || "Không có email",
        //     role: member.role as "admin" | "member",
        //     created_at: member.created_at,
        //   }
        // })

        // setUsers(usersList)
      } catch (error) {
        console.error('Unexpected error:', error);
        toast({
          title: 'Lỗi',
          description: 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [householdId, supabase, toast, currentUserId]);

  // Thay đổi vai trò người dùng
  const toggleUserRole = async (
    userId: string,
    currentRole: 'admin' | 'member'
  ) => {
    if (!isAdmin) {
      toast({
        title: 'Không có quyền',
        description:
          'Chỉ quản trị viên mới có thể thay đổi vai trò người dùng.',
        variant: 'destructive',
      });
      return;
    }

    // Không cho phép thay đổi vai trò của chính mình
    if (userId === currentUserId) {
      toast({
        title: 'Không được phép',
        description: 'Bạn không thể thay đổi vai trò của chính mình.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newRole = currentRole === 'admin' ? 'member' : 'admin';

      const { error } = await supabase
        .from('household_members')
        .update({ role: newRole })
        .eq('household_id', householdId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        toast({
          title: 'Lỗi',
          description:
            'Không thể cập nhật vai trò người dùng. Vui lòng thử lại sau.',
          variant: 'destructive',
        });
        return;
      }

      // Cập nhật state
      setUsers(
        users.map((user) => {
          if (user.id === userId) {
            return { ...user, role: newRole };
          }

          console.log('user', user);
          return user;
        })
      );

      toast({
        title: 'Thành công',
        description: `Đã thay đổi vai trò người dùng thành ${
          newRole === 'admin' ? 'quản trị viên' : 'thành viên'
        }.`,
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.',
        variant: 'destructive',
      });
    }
  };

  // Xóa người dùng khỏi hộ gia đình
  const removeUser = async (user: User) => {
    if (!isAdmin) {
      toast({
        title: 'Không có quyền',
        description: 'Chỉ quản trị viên mới có thể xóa người dùng.',
        variant: 'destructive',
      });
      return;
    }

    // Không cho phép xóa chính mình
    if (user.id === currentUserId) {
      toast({
        title: 'Không được phép',
        description: 'Bạn không thể xóa chính mình khỏi hộ gia đình.',
        variant: 'destructive',
      });
      return;
    }

    setUserToRemove(user);
    setShowConfirmDialog(true);
  };

  // Xác nhận xóa người dùng
  const confirmRemoveUser = async () => {
    if (!userToRemove) return;

    try {
      const { error } = await supabase
        .from('household_members')
        .delete()
        .eq('household_id', householdId)
        .eq('user_id', userToRemove.id);

      if (error) {
        console.error('Error removing user:', error);
        toast({
          title: 'Lỗi',
          description: 'Không thể xóa người dùng. Vui lòng thử lại sau.',
          variant: 'destructive',
        });
        return;
      }

      // Cập nhật state
      setUsers(users.filter((user) => user.id !== userToRemove.id));

      toast({
        title: 'Thành công',
        description: 'Đã xóa người dùng khỏi hộ gia đình.',
      });

      setShowConfirmDialog(false);
      setUserToRemove(null);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.',
        variant: 'destructive',
      });
    }
  };

  // Mời người dùng tham gia hộ gia đình
  const inviteUser = async () => {
    if (!isAdmin) {
      toast({
        title: 'Không có quyền',
        description: 'Chỉ quản trị viên mới có thể mời người dùng.',
        variant: 'destructive',
      });
      return;
    }

    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập địa chỉ email hợp lệ.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);

    try {
      // Lấy mã mời của hộ gia đình
      const { data: householdData, error: householdError } = await supabase
        .from('households')
        .select('invite_code')
        .eq('id', householdId)
        .single();

      if (householdError || !householdData) {
        console.error('Error fetching household invite code:', householdError);
        toast({
          title: 'Lỗi',
          description: 'Không thể lấy mã mời. Vui lòng thử lại sau.',
          variant: 'destructive',
        });
        setIsSending(false);
        return;
      }

      // Gửi email mời (giả lập - chỉ hiển thị thông báo)
      // Trong thực tế, bạn sẽ cần một API endpoint để gửi email

      // Hiển thị thông báo thành công
      toast({
        title: 'Đã gửi lời mời',
        description: `Mã mời: ${householdData.invite_code} đã được gửi đến ${inviteEmail}`,
      });

      setInviteEmail('');
      setShowInviteDialog(false);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Sao chép mã mời
  const copyInviteCode = async () => {
    try {
      // Lấy mã mời của hộ gia đình
      const { data, error } = await supabase
        .from('households')
        .select('invite_code')
        .eq('id', householdId)
        .single();

      if (error || !data) {
        console.error('Error fetching invite code:', error);
        toast({
          title: 'Lỗi',
          description: 'Không thể lấy mã mời. Vui lòng thử lại sau.',
          variant: 'destructive',
        });
        return;
      }

      // Sao chép vào clipboard
      await navigator.clipboard.writeText(data.invite_code);
      toast({
        title: 'Đã sao chép',
        description: 'Mã mời đã được sao chép vào clipboard',
      });
    } catch (error) {
      console.error('Error copying invite code:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể sao chép mã mời. Vui lòng thử lại sau.',
        variant: 'destructive',
      });
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quản lý người dùng</CardTitle>
          <CardDescription>
            Chỉ quản trị viên mới có thể quản lý người dùng.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4 text-muted-foreground">
            <ShieldAlert className="h-5 w-5 mr-2" />
            <span>Bạn cần quyền quản trị viên để truy cập tính năng này.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Quản lý người dùng</CardTitle>
          <CardDescription>
            Quản lý người dùng trong hộ gia đình của bạn
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={copyInviteCode}>
            <Copy className="h-4 w-4 mr-2" /> Sao chép mã mời
          </Button>
          <Button size="sm" onClick={() => setShowInviteDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" /> Mời người dùng
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            Đang tải...
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Không có người dùng nào trong hộ gia đình.
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-md"
              >
                <div className="flex items-center">
                  <div className="ml-3">
                    <div className="font-medium">{user.email}</div>
                    <div className="text-sm text-muted-foreground">
                      {user.id === currentUserId ? 'Bạn' : 'Thành viên'} • Tham
                      gia:{' '}
                      {new Date(user.created_at).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge
                    variant={user.role === 'admin' ? 'default' : 'outline'}
                  >
                    {user.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
                  </Badge>
                  {user.id !== currentUserId && (
                    <>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center">
                              <Switch
                                checked={user.role === 'admin'}
                                onCheckedChange={() =>
                                  toggleUserRole(user.id, user.role)
                                }
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {user.role === 'admin'
                                ? 'Chuyển thành thành viên thường'
                                : 'Chuyển thành quản trị viên'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeUser(user)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Xóa người dùng khỏi hộ gia đình</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dialog mời người dùng */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mời người dùng</DialogTitle>
              <DialogDescription>
                Nhập địa chỉ email của người bạn muốn mời tham gia hộ gia đình.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <Input
                    id="email"
                    placeholder="example@email.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Hủy</Button>
              </DialogClose>
              <Button onClick={inviteUser} disabled={isSending}>
                {isSending ? 'Đang gửi...' : 'Gửi lời mời'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog xác nhận xóa người dùng */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận xóa người dùng</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn xóa người dùng {userToRemove?.email} khỏi
                hộ gia đình không?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Hủy</Button>
              </DialogClose>
              <Button variant="destructive" onClick={confirmRemoveUser}>
                Xóa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
