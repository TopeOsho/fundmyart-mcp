const DEFAULT_SUPABASE_URL = "https://jjqeulhbfezcuounbsao.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqcWV1bGhiZmV6Y3VvdW5ic2FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTYzMjgsImV4cCI6MjA3NjAzMjMyOH0.lHjlnq7Rys1Kvq3iMALM1ksLa2HyqOyDp-pqa-FeYYQ";

export const config = {
  supabaseUrl: process.env.FUNDMYART_SUPABASE_URL ?? DEFAULT_SUPABASE_URL,
  supabaseAnonKey: process.env.FUNDMYART_SUPABASE_ANON_KEY ?? DEFAULT_SUPABASE_ANON_KEY,
  siteBaseUrl: (process.env.FUNDMYART_BASE_URL ?? "https://fund-my-art.com").replace(/\/$/, ""),
  utmSource: "mcp_server",
  utmCampaign: "mcp_launch_2026q2",
  cacheRefreshMs: 6 * 60 * 60 * 1000,
} as const;
