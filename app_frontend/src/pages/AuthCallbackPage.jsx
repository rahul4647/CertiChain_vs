import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";

export const AuthCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/dashboard", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <h2 className="text-xl font-semibold">Signing you in...</h2>
    </div>
  );
};
