// 관리자 전용 API를 보호하기 위한 공유 헬퍼.
// Authorization 헤더의 Supabase 세션 토큰으로 사용자를 조회하고, admin_users에 있는지 확인한다.
// admin_users는 RLS로 "본인 이메일 행만 조회"를 허용하므로 service_role 키 없이 사용자 토큰만으로 확인 가능하다.

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabasePublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export async function isAdminRequest(authorizationHeader: string | undefined): Promise<boolean> {
  if (!supabaseUrl || !supabasePublishableKey || !authorizationHeader) {
    return false;
  }

  try {
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      signal: AbortSignal.timeout(5000),
      headers: {
        apikey: supabasePublishableKey,
        Authorization: authorizationHeader
      }
    });
    if (!userResponse.ok) return false;

    const user = (await userResponse.json()) as { email?: string };
    if (!user.email) return false;

    const adminResponse = await fetch(
      `${supabaseUrl}/rest/v1/admin_users?select=email&email=eq.${encodeURIComponent(user.email)}`,
      {
        signal: AbortSignal.timeout(5000),
        headers: {
          apikey: supabasePublishableKey,
          Authorization: authorizationHeader
        }
      }
    );
    if (!adminResponse.ok) return false;

    const rows = (await adminResponse.json()) as unknown[];
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return false;
  }
}
