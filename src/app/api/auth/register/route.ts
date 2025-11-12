import { prisma } from "@/lib/prisma";
import bcryptjs from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, name, password } = await request.json();

    // Validações
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Email, nome e senha são obrigatórios" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 8 caracteres" },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está registrado" },
        { status: 409 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Obter role 'free' (padrão para novos usuários)
    const freeRole = await prisma.role.findUnique({
      where: { name: "free" },
    });

    if (!freeRole) {
      throw new Error("Role 'free' não encontrado");
    }

    // Obter plan 'Free' (padrão para novos usuários)
    const freePlan = await prisma.plan.findUnique({
      where: { name: "Free" },
    });

    if (!freePlan) {
      throw new Error("Plan 'Free' não encontrado");
    }

    // Criar usuário com subscription
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password_hash: hashedPassword,
        email_verified: true, // Considerar como verificado ao criar via API
        is_active: true,
        role_id: freeRole.id,
        subscription: {
          create: {
            plan_id: freePlan.id,
            status: "active",
            current_period_start: new Date(),
            current_period_end: new Date(
              new Date().setDate(new Date().getDate() + 30)
            ),
          },
        },
      },
      include: { role: true, subscription: true },
    });

    // Log de auditoria
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0] || 
                     request.headers.get("x-real-ip") || 
                     "unknown";
    
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: "USER_REGISTERED",
        resource_type: "user",
        resource_id: user.id,
        ip_address: clientIp,
        user_agent: request.headers.get("user-agent") || "unknown",
      },
    });

    // Não retornar senha
    const { password_hash, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        message: "Usuário criado com sucesso",
        user: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar usuário:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "JSON inválido" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 }
    );
  }
}
