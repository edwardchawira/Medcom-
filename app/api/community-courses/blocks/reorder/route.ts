import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ReorderItem = { id: string; sortOrder: number };

export async function POST(req: Request) {
  let body: { items?: ReorderItem[] };
  try {
    body = (await req.json()) as { items?: ReorderItem[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "No reorder items supplied." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  for (const item of items) {
    if (!item.id || !Number.isInteger(item.sortOrder) || item.sortOrder < 1) {
      return NextResponse.json({ error: "Invalid reorder item." }, { status: 400 });
    }

    const { data: updatedBlock, error } = await supabase
      .from("community_course_lesson_blocks")
      .update({ sort_order: item.sortOrder, updated_at: new Date().toISOString() })
      .eq("id", item.id)
      .select("id")
      .maybeSingle();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!updatedBlock) {
      return NextResponse.json({ error: "Block not found or forbidden" }, { status: 404 });
    }
  }

  return NextResponse.json({ ok: true });
}
