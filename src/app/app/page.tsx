"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageLoader } from "@/components/ui";
import { homeFor, useMe } from "@/lib/auth";

export default function AppIndex() {
  const me = useMe();
  const router = useRouter();
  useEffect(() => {
    if (me.data) router.replace(homeFor(me.data));
  }, [me.data, router]);
  return <PageLoader />;
}
