import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Atmosphere } from "../components/Atmosphere";
import { CommunityJoinSoftCta } from "../components/CommunityBanner";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { Button } from "@/components/ui/button";

export function PaymentSuccessPage() {
  const { t } = useTranslation();
  return (
    <div className="relative flex min-h-screen items-center justify-center px-6">
      <Atmosphere />
      <div className="absolute right-5 top-5 z-20">
        <LanguageSwitcher />
      </div>
      <div className="relative z-10 max-w-md text-center">
        <p className="brand-reveal font-heading text-4xl font-extrabold text-foreground">
          {t("Credit added")}
        </p>
        <div className="mx-auto mt-5 accent-line" />
        <p className="rise-in rise-in-delay-1 mt-6 text-sm text-muted-foreground">
          {t("If the transfer succeeded, your balance will update shortly.")}
        </p>
        <CommunityJoinSoftCta className="rise-in rise-in-delay-2 mt-6" />
        <Button asChild className="rise-in rise-in-delay-3 mt-8 h-11 px-8">
          <Link to="/payments">{t("Back to top up")}</Link>
        </Button>
      </div>
    </div>
  );
}

export function PaymentCancelPage() {
  const { t } = useTranslation();
  return (
    <div className="relative flex min-h-screen items-center justify-center px-6">
      <Atmosphere />
      <div className="absolute right-5 top-5 z-20">
        <LanguageSwitcher />
      </div>
      <div className="relative z-10 max-w-md text-center">
        <p className="brand-reveal font-heading text-4xl font-extrabold text-foreground">
          {t("Cancelled")}
        </p>
        <div className="mx-auto mt-5 accent-line" />
        <p className="rise-in rise-in-delay-1 mt-6 text-sm text-muted-foreground">
          {t("No charge was made. Return to top up anytime.")}
        </p>
        <Button asChild className="rise-in rise-in-delay-2 mt-8 h-11 px-8">
          <Link to="/payments">{t("Try again")}</Link>
        </Button>
      </div>
    </div>
  );
}
