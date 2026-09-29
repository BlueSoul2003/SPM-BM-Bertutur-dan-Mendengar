export const courseEnabled = () => process.env.COURSE_SSO_ENABLED === 'true';
export function courseConfig() {
  const portalUrl = process.env.COURSE_PORTAL_URL || 'https://bluesoul2003.github.io/interactive-course/';
  return { enabled: courseEnabled(), portalUrl, returnUrl: `${portalUrl}#/secondary/spm/spm-bm` };
}
export const courseAuthUrl = () => process.env.COURSE_AUTH_URL || 'https://ycsixsyssbdovpmmhefz.supabase.co';
