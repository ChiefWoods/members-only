import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

type CountdownRedirectNoticeProps = {
  active: boolean;
  message: string;
  to?: string;
  seconds?: number;
  className?: string;
};

function CountdownRedirectNotice({
  active,
  message,
  to = "/",
  seconds = 3,
  className = "text-sm text-green-700",
}: CountdownRedirectNoticeProps) {
  const navigate = useNavigate();
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!active) {
      setSecondsRemaining(null);
      return;
    }

    setSecondsRemaining(seconds);
    const intervalId = window.setInterval(() => {
      setSecondsRemaining((current) => {
        if (current === null) {
          return null;
        }
        if (current <= 1) {
          window.clearInterval(intervalId);
          navigate(to);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [active, navigate, seconds, to]);

  if (!active) {
    return null;
  }

  return (
    <p className={className}>
      {message} Redirecting to home in {secondsRemaining ?? seconds} seconds...
    </p>
  );
}

export { CountdownRedirectNotice };
