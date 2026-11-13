"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Field, Input } from "@/components/ui";
import { ApiError, post } from "@/lib/api";
import { homeFor, useMe } from "@/lib/auth";
import type { User } from "@/lib/types";

const schema = z.object({
  login: z.string().min(3, "أدخل البريد الإلكتروني أو اسم المستخدم"),
  password: z.string().min(1, "أدخل كلمة المرور"),
  remember: z.boolean().optional(),
});

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const qc = useQueryClient();
  const me = useMe();
  const [show, setShow] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { remember: true } });

  useEffect(() => {
    if (me.data) router.replace(homeFor(me.data));
  }, [me.data, router]);

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const res = await post<{ user: User }>("/auth/login", values);
      qc.setQueryData(["me"], res.user);
      router.replace(next && next.startsWith("/app") ? next : homeFor(res.user));
    } catch (e) {
      if (e instanceof ApiError) setError({ message: e.message, code: e.code });
      else setError({ message: "تعذّر الاتصال بالخادم." });
    }
  });

  return (
    <>
      <h1 className="text-[28px] font-semibold text-brand-green">تسجيل الدخول</h1>
      <span className="gold-rule mt-3" />
      <p className="mt-4 text-[14px] text-gray-500">مرحباً بك في البوابة الداخلية لموظفي السراج المضيء.</p>

      {error && (
        <div className={`mt-6 rounded-[3px] border px-4 py-3 text-[14px] leading-7 ${error.code?.startsWith("account_pending") ? "border-gold-200 bg-gold-50 text-gold-700" : "border-[#f1d6d3] bg-[#fbefee] text-danger"}`}>
          {error.message}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
        <Field label="البريد الإلكتروني أو اسم المستخدم" error={formState.errors.login?.message}>
          <Input {...register("login")} autoComplete="username" dir="ltr" className="text-right" />
        </Field>
        <Field label="كلمة المرور" error={formState.errors.password?.message}>
          <div className="relative">
            <Input {...register("password")} type={show ? "text" : "password"} autoComplete="current-password" dir="ltr" className="pe-11 text-right" />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute inset-y-0 end-0 flex w-11 items-center justify-center text-gray-400 hover:text-gold-600 cursor-pointer" aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>
              {show ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>
        </Field>
        <div className="flex items-center justify-between text-[13px]">
          <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
            <input type="checkbox" {...register("remember")} className="h-4 w-4 accent-[#B8956F]" /> تذكرني
          </label>
          <Link href="/forgot-password" className="text-gold-600 hover:text-gold-700">نسيت كلمة المرور؟</Link>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={formState.isSubmitting}>
          <LogIn className="h-4 w-4" /> دخول
        </Button>
      </form>

      <p className="mt-8 text-center text-[14px] text-gray-500">
        موظف جديد؟ <Link href="/register" className="font-medium text-gold-600 hover:text-gold-700">اطلب إنشاء حساب</Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
