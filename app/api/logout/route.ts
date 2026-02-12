import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  // Apaga o cookie 'userId' (e 'token' se estiver usando)
  cookies().delete("userId");
  
  return NextResponse.json({ success: true });
}