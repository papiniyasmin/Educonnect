import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export function getUserId() {
  const cookieStore = cookies();
  const token = cookieStore.get("token");

  if (!token) {
    return null;
  }

  try {
    // A chave tem de ser igual à do login
    const secret = "EDUCONNECT_SECRET_2024"; 
    
    // Descodifica o token para ler o ID
    const decoded: any = jwt.verify(token.value, secret);
    return decoded.id;
  } catch (error) {
    // Se o token estiver expirado ou inválido
    return null;
  }
}