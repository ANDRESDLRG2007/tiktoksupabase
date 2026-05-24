import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zxxgjcuglmwdpgvdjucs.supabase.co";

const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4eGdqY3VnbG13ZHBndmRqdWNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1Njc0ODMsImV4cCI6MjA5NTE0MzQ4M30.8doJLVseniazExP0eF2U0YyeNpvRCpp4WBy0E9ucnU8";

export const supabase = createClient(supabaseUrl, supabaseKey);