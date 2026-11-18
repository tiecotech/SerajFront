import type { Metadata } from "next";
import { NotFoundView } from "@/components/site/NotFoundView";

export const metadata: Metadata = { title: "الصفحة غير موجودة | السراج المضيء" };

// Any URL that matches no route at all (e.g. /a/b/c).
export default function NotFound() {
  return <NotFoundView />;
}
