export function publicCapabilities() {
  return {
    ai: process.env.STUDENT_DIRECT_MODE === 'false' && !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY',
    cloudAudio: process.env.TTS_PROVIDER === 'google-cloud',
    passwordRecovery: !!(process.env.SMTP_URL && process.env.MAIL_FROM && process.env.APP_URL),
  };
}
