import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";

export const AuthCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    };

    checkSession();
  }, [navigate]);

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <h2 className="text-xl font-semibold">Signing you in...</h2>
    </div>
  );
};
