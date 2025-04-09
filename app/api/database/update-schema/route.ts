import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();

    // Kiểm tra quyền admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Thực thi SQL để thêm cột created_by
    const sql = `
      -- Thêm cột created_by vào bảng expenses nếu chưa tồn tại
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'expenses' 
            AND column_name = 'created_by'
          ) THEN
            -- Add the created_by column
            EXECUTE 'ALTER TABLE public.expenses ADD COLUMN created_by UUID REFERENCES auth.users(id);';
          END IF;
        END $$;
    `;

    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('Error executing SQL:', error);
      return NextResponse.json(
        { error: 'Failed to update database schema' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
