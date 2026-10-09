async function getAdminControlInstructions() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return "";
  try {
    const response = await fetch(url.replace(/\/$/, "") + "/rest/v1/lopes_admin_controls?id=eq.main&select=value", {
      headers: { apikey: key, Authorization: "Bearer " + key }
    });
    if (!response.ok) return "";
    const rows = await response.json();
    const controls = rows && rows[0] && rows[0].value;
    if (!controls) return "";
    const integrations = controls.integrations || {};
    const enabled = Object.keys(integrations).filter((name) => integrations[name] === true);
    const revoked = Array.isArray(controls.revokedAuthorities) ? controls.revokedAuthorities : [];
    return [
      "ESTADO DE AUTORIZAÇÕES CONFIGURÁVEIS DO APLICATIVO:",
      "Integrações marcadas como autorizadas pelo Administrador Master: " + (enabled.join(", ") || "nenhuma"),
      "Permissões adicionais revogadas pelo Administrador Master: " + (revoked.join("; ") || "nenhuma registrada"),
      "Não trate um atalho como integração técnica conectada. Só declare uma integração funcional se a conexão real estiver implementada e confirmada.",
      "Esses controles configuráveis não revogam nem substituem as salvaguardas essenciais de segurança e privacidade."
    ].join("\n");
  } catch (_) {
    return "";
  }
}
module.exports = { getAdminControlInstructions };
