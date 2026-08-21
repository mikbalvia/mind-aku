import { useTranslation } from "react-i18next";
import { PageHeader } from "../components/page-chrome";

export function ForbiddenPage() {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeader title={t("403")} description={t("Forbidden")} />
    </div>
  );
}
